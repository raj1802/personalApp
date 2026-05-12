// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { mindfulTheme as mt } from '../../theme';
import { getRecurring, createRecurring, loadBudgetMeta, RecurringTransaction, BudgetMeta } from '../../utils/budgetSystem';
import { BottomNav } from '../../components/BottomNav';
import { Plus } from 'lucide-react-native';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const RecurringScreen = ({ navigation }: any) => {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [meta, setMeta] = useState<BudgetMeta | null>(null);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'daily'|'weekly'|'monthly'|'yearly'>('monthly');
  const [type, setType] = useState<'expense'|'income'>('expense');
  const [catId, setCatId] = useState('');
  const [walletId, setWalletId] = useState('');

  const load = async () => {
    const [r, m] = await Promise.all([getRecurring(), loadBudgetMeta()]);
    setRecurring(r);
    setMeta(m);
    if (!catId && m.categories.length > 0) setCatId(m.categories[0].id);
    if (!walletId && m.wallets.length > 0) setWalletId(m.defaultWalletId);
  };

  useEffect(() => { const u = navigation.addListener('focus', load); return u; }, [navigation]);

  const handleAdd = async () => {
    if (!title || !amount || !catId || !walletId) return;
    const today = new Date().toISOString().split('T')[0];
    await createRecurring({ title, amount: parseFloat(amount), type, categoryId: catId, walletId, frequency, startDate: today, nextDueDate: today, isActive: true });
    setModal(false); setTitle(''); setAmount(''); load();
  };

  const catMap: Record<string, any> = {};
  meta?.categories.forEach(c => { catMap[c.id] = c; });

  const active = recurring.filter(r => r.isActive);
  const inactive = recurring.filter(r => !r.isActive);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹ Back</Text></TouchableOpacity>
        <Text style={s.headerTitle}>🔄 Recurring</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={[...active, ...inactive]}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>No recurring transactions. Tap + to add one.</Text>}
        renderItem={({ item: r }) => {
          const cat = catMap[r.categoryId];
          return (
            <View style={[s.card, !r.isActive && { opacity: 0.5 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[s.iconCircle, { backgroundColor: (cat?.color || '#999') + '22' }]}>
                  <Text style={{ fontSize: 22 }}>{cat?.icon || '🔄'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.recTitle}>{r.title}</Text>
                  <Text style={s.recMeta}>{r.frequency} • Next: {r.nextDueDate}</Text>
                </View>
                <Text style={[s.recAmt, { color: r.type === 'income' ? '#27AE60' : mt.colors.textCoral }]}>
                  {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity style={s.fab} onPress={() => setModal(true)}><Plus color="#FFF" size={24} /></TouchableOpacity>
      <BottomNav current="budget" />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: mt.colors.background, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: '800' }}>New Recurring</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={{ color: mt.colors.textCoral, fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {(['expense','income'] as const).map(t => (
              <TouchableOpacity key={t} style={[s.typeBtn, type === t && { backgroundColor: t === 'income' ? '#27AE60' : mt.colors.textCoral }]} onPress={() => setType(t)}>
                <Text style={[{ fontSize: 13, fontWeight: '700', color: mt.colors.textSecondary }, type === t && { color: '#FFF' }]}>{t === 'income' ? '💰 Income' : '💸 Expense'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.fieldLabel}>Title</Text>
          <TextInput style={s.input} placeholder="Netflix, Rent, Salary..." value={title} onChangeText={setTitle} placeholderTextColor="#C0BBB0" />
          <Text style={s.fieldLabel}>Amount (₹)</Text>
          <TextInput style={s.input} placeholder="0" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholderTextColor="#C0BBB0" />
          <Text style={s.fieldLabel}>Frequency</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {(['daily','weekly','monthly','yearly'] as const).map(f => (
              <TouchableOpacity key={f} style={[s.freqBtn, frequency === f && { backgroundColor: mt.colors.accentGreen }]} onPress={() => setFrequency(f)}>
                <Text style={[{ fontSize: 13, fontWeight: '700', color: mt.colors.textSecondary }, frequency === f && { color: '#FFF' }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.fieldLabel}>Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {meta?.categories.filter(c => type === 'income' ? c.type !== 'expense' : c.type !== 'income').slice(0, 8).map(c => (
              <TouchableOpacity key={c.id} style={[s.catChip, catId === c.id && { borderColor: c.color, borderWidth: 2 }]} onPress={() => setCatId(c.id)}>
                <Text style={{ fontSize: 13 }}>{c.icon} {c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.saveBtn} onPress={handleAdd}><Text style={s.saveBtnTxt}>Add Recurring</Text></TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: mt.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) + 8 : 8, paddingBottom: 12, backgroundColor: mt.colors.surface, borderBottomWidth: 1.5, borderBottomColor: mt.colors.border },
  back: { fontSize: 16, color: mt.colors.accentGreen, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: mt.colors.textPrimary },
  list: { padding: 16, paddingBottom: 100 },
  empty: { textAlign: 'center', color: mt.colors.textSecondary, marginTop: 40, fontStyle: 'italic' },
  card: { backgroundColor: mt.colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: mt.colors.border, padding: 14, marginBottom: 10 },
  iconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  recTitle: { fontSize: 15, fontWeight: '700', color: mt.colors.textPrimary },
  recMeta: { fontSize: 11, color: mt.colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  recAmt: { fontSize: 16, fontWeight: '800' },
  fab: { position: 'absolute', bottom: 90, right: 24, backgroundColor: mt.colors.accentGreen, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: mt.colors.border, elevation: 5 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 20, borderWidth: 1.5, borderColor: mt.colors.border, backgroundColor: mt.colors.surface, alignItems: 'center' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: mt.colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: mt.colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: mt.colors.border, padding: 14, fontSize: 15, color: mt.colors.textPrimary, marginBottom: 16 },
  freqBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: mt.colors.border, backgroundColor: mt.colors.surface },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5, borderColor: mt.colors.border, backgroundColor: mt.colors.surface },
  saveBtn: { backgroundColor: mt.colors.accentGreen, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: mt.colors.border },
  saveBtnTxt: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
