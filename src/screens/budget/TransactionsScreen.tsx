// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { mindfulTheme as mt } from '../../theme';
import { getTransactions, deleteTransaction, loadBudgetMeta, Transaction, BudgetMeta } from '../../utils/budgetSystem';
import { BottomNav } from '../../components/BottomNav';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const TransactionsScreen = ({ navigation }: any) => {
  const [meta, setMeta] = useState<BudgetMeta | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const load = async () => {
    const m = await loadBudgetMeta();
    setMeta(m);
    const txns = await getTransactions(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1);
    setTransactions(txns);
  };

  useEffect(() => { const u = navigation.addListener('focus', load); return u; }, [navigation, selectedMonth]);

  const changeMonth = (dir: -1 | 1) => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + dir);
    setSelectedMonth(d);
  };

  const filtered = transactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  const catMap: Record<string, any> = {};
  meta?.categories.forEach(c => { catMap[c.id] = c; });

  const handleDelete = async (t: Transaction) => {
    await deleteTransaction(t.id, t.date);
    load();
  };

  const renderItem = ({ item: t }: { item: Transaction }) => {
    const cat = catMap[t.categoryId];
    return (
      <View style={s.txnRow}>
        <View style={[s.txnIcon, { backgroundColor: (cat?.color || '#999') + '22' }]}>
          <Text style={{ fontSize: 22 }}>{cat?.icon || '💳'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.txnTitle}>{t.title}</Text>
          <Text style={s.txnMeta}>{cat?.name} • {t.date}</Text>
          {t.note ? <Text style={s.txnNote}>{t.note}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={[s.txnAmt, { color: t.type === 'income' ? '#27AE60' : mt.colors.textCoral }]}>
            {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
          </Text>
          <TouchableOpacity onPress={() => handleDelete(t)}>
            <Text style={{ color: '#C0BBB0', fontSize: 12 }}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const monthLabel = selectedMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹ Back</Text></TouchableOpacity>
        <Text style={s.headerTitle}>Transactions</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Month nav */}
      <View style={s.monthRow}>
        <TouchableOpacity style={s.mBtn} onPress={() => changeMonth(-1)}><Text style={s.mBtnTxt}>‹</Text></TouchableOpacity>
        <Text style={s.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity style={s.mBtn} onPress={() => changeMonth(1)}><Text style={s.mBtnTxt}>›</Text></TouchableOpacity>
      </View>

      {/* Summary strip */}
      <View style={s.strip}>
        <Text style={[s.stripVal, { color: '#27AE60' }]}>+{fmt(totalIncome)}</Text>
        <Text style={s.stripSep}>|</Text>
        <Text style={[s.stripVal, { color: mt.colors.textCoral }]}>-{fmt(totalExpense)}</Text>
        <Text style={s.stripSep}>|</Text>
        <Text style={[s.stripVal, { color: totalIncome - totalExpense >= 0 ? '#27AE60' : mt.colors.textCoral }]}>
          {fmt(totalIncome - totalExpense)}
        </Text>
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        <TextInput style={s.search} placeholder="Search..." placeholderTextColor="#C0BBB0" value={search} onChangeText={setSearch} />
        {(['all', 'expense', 'income'] as const).map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filterType === f && s.filterBtnActive]} onPress={() => setFilterType(f)}>
            <Text style={[s.filterBtnTxt, filterType === f && { color: '#FFF' }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>No transactions found.</Text>}
      />
      <BottomNav current="budget" />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: mt.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) + 8 : 8, paddingBottom: 12, backgroundColor: mt.colors.surface, borderBottomWidth: 1.5, borderBottomColor: mt.colors.border },
  back: { fontSize: 16, color: mt.colors.accentGreen, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: mt.colors.textPrimary },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 20, backgroundColor: mt.colors.surface },
  mBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: mt.colors.border, alignItems: 'center', justifyContent: 'center' },
  mBtnTxt: { fontSize: 20, fontWeight: '700', color: mt.colors.textPrimary },
  monthLabel: { fontSize: 15, fontWeight: '700', color: mt.colors.textPrimary },
  strip: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, backgroundColor: '#EDE8D8', gap: 12 },
  stripVal: { fontSize: 14, fontWeight: '700' },
  stripSep: { color: mt.colors.border, fontSize: 14 },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: mt.colors.surface, borderBottomWidth: 1, borderBottomColor: mt.colors.border },
  search: { flex: 1, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: mt.colors.border, paddingHorizontal: 12, fontSize: 13, color: mt.colors.textPrimary },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1.5, borderColor: mt.colors.border, backgroundColor: mt.colors.surface },
  filterBtnActive: { backgroundColor: mt.colors.accentGreen },
  filterBtnTxt: { fontSize: 12, fontWeight: '700', color: mt.colors.textSecondary, textTransform: 'capitalize' },
  list: { padding: 16, paddingBottom: 100 },
  txnRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: mt.colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: mt.colors.border, padding: 12, marginBottom: 10, gap: 12 },
  txnIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  txnTitle: { fontSize: 14, fontWeight: '700', color: mt.colors.textPrimary },
  txnMeta: { fontSize: 11, color: mt.colors.textSecondary, marginTop: 2 },
  txnNote: { fontSize: 11, color: mt.colors.textSecondary, fontStyle: 'italic', marginTop: 2 },
  txnAmt: { fontSize: 15, fontWeight: '800' },
  empty: { textAlign: 'center', color: mt.colors.textSecondary, marginTop: 40, fontStyle: 'italic' },
});
