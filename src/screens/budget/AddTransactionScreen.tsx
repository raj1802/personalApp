// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, ScrollView, KeyboardAvoidingView, Platform, StatusBar,
  Modal, FlatList,
} from 'react-native';
import { mindfulTheme as mt } from '../../theme';
import { addTransaction, loadBudgetMeta, BudgetMeta, Category, Wallet } from '../../utils/budgetSystem';

type TxnType = 'expense' | 'income' | 'transfer';

export const AddTransactionScreen = ({ navigation }: any) => {
  const [meta, setMeta] = useState<BudgetMeta | null>(null);
  const [txnType, setTxnType] = useState<TxnType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [catModal, setCatModal] = useState(false);
  const [walletModal, setWalletModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBudgetMeta().then(m => {
      setMeta(m);
      setSelectedWalletId(m.defaultWalletId);
      const firstExpCat = m.categories.find(c => c.type === 'expense' || c.type === 'both');
      if (firstExpCat) setSelectedCatId(firstExpCat.id);
    });
  }, []);

  const filteredCategories = meta?.categories.filter(c =>
    txnType === 'expense' ? c.type !== 'income' :
    txnType === 'income' ? c.type !== 'expense' : true
  ) || [];

  const selectedCat = meta?.categories.find(c => c.id === selectedCatId);
  const selectedWallet = meta?.wallets.find(w => w.id === selectedWalletId);
  const toWallet = meta?.wallets.find(w => w.id === toWalletId);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0 || !selectedCatId || !selectedWalletId) return;
    setSaving(true);
    try {
      await addTransaction({
        amount: parseFloat(amount),
        type: txnType,
        categoryId: selectedCatId,
        walletId: selectedWalletId,
        toWalletId: txnType === 'transfer' ? toWalletId : undefined,
        title: title || selectedCat?.name || 'Transaction',
        note: note || undefined,
        date,
        isRecurring: false,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const typeColors: Record<TxnType, string> = {
    expense: mt.colors.textCoral,
    income: '#27AE60',
    transfer: '#4A7FBD',
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Add Transaction</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.saveBtn, { opacity: saving ? 0.5 : 1 }]}>
            <Text style={s.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll}>

          {/* ── Type Selector ── */}
          <View style={s.typeRow}>
            {(['expense', 'income', 'transfer'] as TxnType[]).map(type => (
              <TouchableOpacity
                key={type}
                style={[s.typeBtn, txnType === type && { backgroundColor: typeColors[type], borderColor: mt.colors.border }]}
                onPress={() => {
                  setTxnType(type);
                  const first = meta?.categories.find(c => type === 'expense' ? c.type !== 'income' : type === 'income' ? c.type !== 'expense' : true);
                  if (first) setSelectedCatId(first.id);
                }}
              >
                <Text style={[s.typeBtnText, txnType === type && { color: '#FFF' }]}>
                  {type === 'expense' ? '💸 Expense' : type === 'income' ? '💰 Income' : '↔️ Transfer'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Amount ── */}
          <View style={[s.amountCard, { borderColor: typeColors[txnType] }]}>
            <Text style={[s.currencySymbol, { color: typeColors[txnType] }]}>
              {meta?.defaultCurrency === 'INR' ? '₹' : '$'}
            </Text>
            <TextInput
              style={[s.amountInput, { color: typeColors[txnType] }]}
              placeholder="0"
              placeholderTextColor="#C0BBB0"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          {/* ── Category ── */}
          <Text style={s.fieldLabel}>Category</Text>
          <TouchableOpacity style={s.fieldRow} onPress={() => setCatModal(true)}>
            <Text style={{ fontSize: 22 }}>{selectedCat?.icon || '🏷️'}</Text>
            <Text style={s.fieldValue}>{selectedCat?.name || 'Select category'}</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>

          {/* ── Wallet ── */}
          <Text style={s.fieldLabel}>Wallet</Text>
          <TouchableOpacity style={s.fieldRow} onPress={() => setWalletModal(true)}>
            <Text style={{ fontSize: 22 }}>{selectedWallet?.icon || '💳'}</Text>
            <Text style={s.fieldValue}>{selectedWallet?.name || 'Select wallet'}</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>

          {/* ── To Wallet (transfer only) ── */}
          {txnType === 'transfer' && (
            <>
              <Text style={s.fieldLabel}>To Wallet</Text>
              <TouchableOpacity style={s.fieldRow} onPress={() => {
                // Re-use walletModal but set a flag — simple approach: pick from wallets excluding selectedWalletId
                setWalletModal(true);
              }}>
                <Text style={{ fontSize: 22 }}>{toWallet?.icon || '💳'}</Text>
                <Text style={s.fieldValue}>{toWallet?.name || 'Select destination'}</Text>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Title ── */}
          <Text style={s.fieldLabel}>Title (optional)</Text>
          <View style={s.inputBox}>
            <TextInput
              style={s.textInput}
              placeholder={selectedCat?.name || 'e.g. Dinner at Barbeque Nation'}
              placeholderTextColor="#C0BBB0"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* ── Date ── */}
          <Text style={s.fieldLabel}>Date</Text>
          <View style={s.inputBox}>
            <TextInput
              style={s.textInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#C0BBB0"
            />
          </View>

          {/* ── Note ── */}
          <Text style={s.fieldLabel}>Note (optional)</Text>
          <View style={[s.inputBox, { height: 80 }]}>
            <TextInput
              style={[s.textInput, { textAlignVertical: 'top' }]}
              placeholder="Add a note..."
              placeholderTextColor="#C0BBB0"
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Category Picker Modal ── */}
      <Modal visible={catModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setCatModal(false)}><Text style={s.modalClose}>Done</Text></TouchableOpacity>
          </View>
          <FlatList
            data={filteredCategories}
            keyExtractor={i => i.id}
            numColumns={3}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item: cat }) => (
              <TouchableOpacity
                style={[s.catItem, selectedCatId === cat.id && { borderColor: cat.color, borderWidth: 2.5 }]}
                onPress={() => { setSelectedCatId(cat.id); setCatModal(false); }}
              >
                <View style={[s.catIcon, { backgroundColor: cat.color + '22' }]}>
                  <Text style={{ fontSize: 26 }}>{cat.icon}</Text>
                </View>
                <Text style={s.catName} numberOfLines={2}>{cat.name}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* ── Wallet Picker Modal ── */}
      <Modal visible={walletModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Wallet</Text>
            <TouchableOpacity onPress={() => setWalletModal(false)}><Text style={s.modalClose}>Done</Text></TouchableOpacity>
          </View>
          <FlatList
            data={meta?.wallets || []}
            keyExtractor={i => i.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item: w }) => (
              <TouchableOpacity
                style={[s.walletItem, selectedWalletId === w.id && { borderColor: w.color, borderWidth: 2.5 }]}
                onPress={() => { setSelectedWalletId(w.id); setWalletModal(false); }}
              >
                <View style={[s.walletItemIcon, { backgroundColor: w.color }]}>
                  <Text style={{ fontSize: 22 }}>{w.icon}</Text>
                </View>
                <Text style={s.walletItemName}>{w.name}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: mt.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) + 8 : 8, paddingBottom: 12, borderBottomWidth: 1.5, borderBottomColor: mt.colors.border, backgroundColor: mt.colors.surface },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE8D8', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 16, color: mt.colors.textPrimary, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: mt.colors.textPrimary },
  saveBtn: { backgroundColor: mt.colors.accentGreen, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, borderWidth: 1.5, borderColor: mt.colors.border },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  scroll: { padding: 20, paddingBottom: 60 },
  // Type
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: mt.colors.border, backgroundColor: mt.colors.surface, alignItems: 'center' },
  typeBtnText: { fontSize: 13, fontWeight: '700', color: mt.colors.textSecondary },
  // Amount
  amountCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: mt.colors.surface, borderRadius: 20, borderWidth: 2.5, padding: 16, marginBottom: 24 },
  currencySymbol: { fontSize: 36, fontWeight: '800', marginRight: 8 },
  amountInput: { fontSize: 48, fontWeight: '900', flex: 1 },
  // Fields
  fieldLabel: { fontSize: 12, fontWeight: '700', color: mt.colors.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: mt.colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: mt.colors.border, padding: 14, marginBottom: 16, gap: 10 },
  fieldValue: { flex: 1, fontSize: 15, fontWeight: '600', color: mt.colors.textPrimary },
  chevron: { fontSize: 20, color: mt.colors.textSecondary },
  inputBox: { backgroundColor: mt.colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: mt.colors.border, padding: 14, marginBottom: 16 },
  textInput: { fontSize: 15, color: mt.colors.textPrimary },
  // Modal
  modal: { flex: 1, backgroundColor: mt.colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1.5, borderBottomColor: mt.colors.border },
  modalTitle: { fontSize: 18, fontWeight: '800', color: mt.colors.textPrimary },
  modalClose: { fontSize: 15, fontWeight: '700', color: mt.colors.accentGreen },
  catItem: { flex: 1, alignItems: 'center', margin: 6, backgroundColor: mt.colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: mt.colors.border, padding: 12 },
  catIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  catName: { fontSize: 11, fontWeight: '600', color: mt.colors.textPrimary, textAlign: 'center' },
  walletItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: mt.colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: mt.colors.border, padding: 14, marginBottom: 10, gap: 12 },
  walletItemIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  walletItemName: { fontSize: 16, fontWeight: '700', color: mt.colors.textPrimary },
});
