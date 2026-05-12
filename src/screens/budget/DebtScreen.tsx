// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { mindfulTheme as mt } from '../../theme';
import { getDebts, createDebt, markDebtPaid, deleteDebt, Debt } from '../../utils/budgetSystem';
import { BottomNav } from '../../components/BottomNav';
import { Plus } from 'lucide-react-native';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const DebtScreen = ({ navigation }: any) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [modal, setModal] = useState(false);
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'owed_to_me' | 'i_owe'>('owed_to_me');
  const [description, setDescription] = useState('');

  const load = async () => { setDebts(await getDebts()); };
  useEffect(() => { const u = navigation.addListener('focus', load); return u; }, [navigation]);

  const handleAdd = async () => {
    if (!personName || !amount) return;
    await createDebt({ personName, amount: parseFloat(amount), type, description: description || undefined, isPaid: false });
    setModal(false); setPersonName(''); setAmount(''); setDescription(''); load();
  };

  const owedToMe = debts.filter(d => d.type === 'owed_to_me' && !d.isPaid);
  const iOwe = debts.filter(d => d.type === 'i_owe' && !d.isPaid);
  const paid = debts.filter(d => d.isPaid);
  const totalOwedToMe = owedToMe.reduce((s, d) => s + d.amount, 0);
  const totalIOwe = iOwe.reduce((s, d) => s + d.amount, 0);

  const DebtCard = ({ item: d }: { item: Debt }) => (
    <View style={[s.card, { borderLeftColor: d.type === 'owed_to_me' ? '#27AE60' : mt.colors.textCoral }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[s.avatar, { backgroundColor: d.type === 'owed_to_me' ? '#E8F8F0' : '#FEE8E8' }]}>
          <Text style={{ fontSize: 20 }}>👤</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.personName}>{d.personName}</Text>
          {d.description ? <Text style={s.desc}>{d.description}</Text> : null}
          <Text style={s.dateText}>{new Date(d.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={[s.debtAmt, { color: d.type === 'owed_to_me' ? '#27AE60' : mt.colors.textCoral }]}>{fmt(d.amount)}</Text>
          {!d.isPaid && (
            <TouchableOpacity style={s.paidBtn} onPress={async () => { await markDebtPaid(d.id); load(); }}>
              <Text style={s.paidBtnTxt}>✓ Paid</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={async () => { await deleteDebt(d.id); load(); }}>
            <Text style={{ fontSize: 11, color: '#C0BBB0' }}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹ Back</Text></TouchableOpacity>
        <Text style={s.headerTitle}>🤝 Debts</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Summary */}
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>They owe me</Text>
          <Text style={[s.summaryAmt, { color: '#27AE60' }]}>{fmt(totalOwedToMe)}</Text>
        </View>
        <View style={[s.summaryCard, { borderColor: mt.colors.textCoral }]}>
          <Text style={s.summaryLabel}>I owe them</Text>
          <Text style={[s.summaryAmt, { color: mt.colors.textCoral }]}>{fmt(totalIOwe)}</Text>
        </View>
      </View>

      <FlatList
        data={[...owedToMe, ...iOwe, ...paid]}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        ListHeaderComponent={owedToMe.length + iOwe.length === 0 && paid.length === 0 ? null : undefined}
        ListEmptyComponent={<Text style={s.empty}>No debts tracked. Tap + to add one.</Text>}
        renderItem={({ item }) => <DebtCard item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
      />

      <TouchableOpacity style={s.fab} onPress={() => setModal(true)}><Plus color="#FFF" size={24} /></TouchableOpacity>
      <BottomNav current="budget" />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: mt.colors.background, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: '800' }}>Add Debt</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={{ color: mt.colors.textCoral, fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>
          <View style={s.typeRow}>
            {(['owed_to_me', 'i_owe'] as const).map(t => (
              <TouchableOpacity key={t} style={[s.typeBtn, type === t && { backgroundColor: t === 'owed_to_me' ? '#27AE60' : mt.colors.textCoral }]} onPress={() => setType(t)}>
                <Text style={[{ fontSize: 13, fontWeight: '700', color: mt.colors.textSecondary }, type === t && { color: '#FFF' }]}>
                  {t === 'owed_to_me' ? '💚 Owed to me' : '❤️ I owe'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.fieldLabel}>Person's Name</Text>
          <TextInput style={s.input} placeholder="Rahul" value={personName} onChangeText={setPersonName} placeholderTextColor="#C0BBB0" />
          <Text style={s.fieldLabel}>Amount (₹)</Text>
          <TextInput style={s.input} placeholder="500" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholderTextColor="#C0BBB0" />
          <Text style={s.fieldLabel}>Description (optional)</Text>
          <TextInput style={s.input} placeholder="Lunch split" value={description} onChangeText={setDescription} placeholderTextColor="#C0BBB0" />
          <TouchableOpacity style={s.saveBtn} onPress={handleAdd}><Text style={s.saveBtnTxt}>Add Debt</Text></TouchableOpacity>
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
  summaryRow: { flexDirection: 'row', padding: 16, gap: 12 },
  summaryCard: { flex: 1, backgroundColor: mt.colors.surface, borderRadius: 14, borderWidth: 2, borderColor: mt.colors.border, padding: 14, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: mt.colors.textSecondary, marginBottom: 4 },
  summaryAmt: { fontSize: 20, fontWeight: '900' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { backgroundColor: mt.colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: mt.colors.border, borderLeftWidth: 5, padding: 14, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  personName: { fontSize: 15, fontWeight: '800', color: mt.colors.textPrimary },
  desc: { fontSize: 12, color: mt.colors.textSecondary, marginTop: 2 },
  dateText: { fontSize: 11, color: mt.colors.textSecondary, marginTop: 2 },
  debtAmt: { fontSize: 16, fontWeight: '800' },
  paidBtn: { backgroundColor: '#27AE60', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  paidBtnTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: mt.colors.textSecondary, marginTop: 40, fontStyle: 'italic' },
  fab: { position: 'absolute', bottom: 90, right: 24, backgroundColor: mt.colors.accentGreen, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: mt.colors.border, elevation: 5 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 20, borderWidth: 1.5, borderColor: mt.colors.border, backgroundColor: mt.colors.surface, alignItems: 'center' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: mt.colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: mt.colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: mt.colors.border, padding: 14, fontSize: 15, color: mt.colors.textPrimary, marginBottom: 16 },
  saveBtn: { backgroundColor: mt.colors.accentGreen, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: mt.colors.border, marginTop: 8 },
  saveBtnTxt: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
