// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Platform, FlatList,
} from 'react-native';
import { mindfulTheme as mt } from '../../theme';
import {
  initBudgetIfNeeded, getTransactions, getBudgets, getBudgetSpend,
  getWalletBalance, BudgetMeta, Transaction, Budget, Wallet, Category,
} from '../../utils/budgetSystem';
import { BottomNav } from '../../components/BottomNav';
import { Plus } from 'lucide-react-native';

const fmt = (n: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

// ── Small card shell ──────────────────────────────────────
const Card = ({ children, style }: any) => (
  <View style={[cs.shadow, style]}>
    <View style={cs.card}>{children}</View>
  </View>
);
const cs = StyleSheet.create({
  shadow: { marginBottom: 14, shadowColor: '#1A1A1A', shadowOffset: { width: 3, height: 4 }, shadowOpacity: 0.12, shadowRadius: 0, elevation: 4 },
  card: { backgroundColor: mt.colors.surface, borderRadius: mt.borderRadius.xl, borderWidth: 2, borderColor: mt.colors.border, padding: 16, overflow: 'hidden' },
});

export const BudgetHomeScreen = ({ navigation }: any) => {
  const [meta, setMeta] = useState<BudgetMeta | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetSpends, setBudgetSpends] = useState<Record<string, number>>({});
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});
  const now = new Date();

  const load = useCallback(async () => {
    const m = await initBudgetIfNeeded();
    setMeta(m);
    const txns = await getTransactions(now.getFullYear(), now.getMonth() + 1);
    setTransactions(txns);
    // wallet balances
    const wb: Record<string, number> = {};
    for (const w of m.wallets) wb[w.id] = await getWalletBalance(w.id);
    setWalletBalances(wb);
    // budget spends
    const bs: Record<string, number> = {};
    for (const b of m.budgets) bs[b.id] = await getBudgetSpend(b);
    setBudgetSpends(bs);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  if (!meta) return (
    <SafeAreaView style={s.root}>
      <Text style={{ color: mt.colors.textSecondary, textAlign: 'center', marginTop: 40 }}>Loading...</Text>
    </SafeAreaView>
  );

  const thisMonthExpense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const thisMonthIncome = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const netWorth = Object.entries(walletBalances)
    .filter(([id]) => !meta.wallets.find(w => w.id === id)?.excludeFromTotal)
    .reduce((a, [, v]) => a + v, 0);
  const recent5 = transactions.slice(0, 5);
  const catMap: Record<string, Category> = {};
  meta.categories.forEach(c => { catMap[c.id] = c; });

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>💰 Budget</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AnalyticsScreen')} style={s.headerBtn}>
          <Text style={s.headerBtnText}>📊 Analytics</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Net Worth Card ── */}
        <Card style={{ marginBottom: 14 }}>
          <Text style={s.netLabel}>Net Worth</Text>
          <Text style={s.netAmount}>{fmt(netWorth, meta.defaultCurrency)}</Text>
          <View style={s.inExRow}>
            <View style={s.inExItem}>
              <Text style={s.inExIcon}>🟢</Text>
              <View>
                <Text style={s.inExLabel}>This month income</Text>
                <Text style={[s.inExAmount, { color: '#27AE60' }]}>{fmt(thisMonthIncome, meta.defaultCurrency)}</Text>
              </View>
            </View>
            <View style={s.inExItem}>
              <Text style={s.inExIcon}>🔴</Text>
              <View>
                <Text style={s.inExLabel}>This month expense</Text>
                <Text style={[s.inExAmount, { color: mt.colors.textCoral }]}>{fmt(thisMonthExpense, meta.defaultCurrency)}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* ── Wallet Cards ── */}
        <Text style={s.sectionTitle}>Wallets</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {meta.wallets.map(w => (
            <TouchableOpacity key={w.id} style={[s.walletChip, { backgroundColor: w.color, borderColor: mt.colors.border }]}
              onPress={() => navigation.navigate('WalletsScreen')}>
              <Text style={s.walletIcon}>{w.icon}</Text>
              <Text style={s.walletName}>{w.name}</Text>
              <Text style={s.walletBalance}>{fmt(walletBalances[w.id] || 0, w.currency)}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.addWalletChip} onPress={() => navigation.navigate('WalletsScreen')}>
            <Text style={{ fontSize: 24 }}>+</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Budgets ── */}
        {meta.budgets.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Budgets</Text>
            {meta.budgets.map(b => {
              const spent = budgetSpends[b.id] || 0;
              const pct = Math.min((spent / b.amount) * 100, 100);
              const isOver = spent > b.amount;
              return (
                <Card key={b.id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={s.budgetName}>{b.name}</Text>
                    <Text style={[s.budgetAmt, isOver && { color: mt.colors.textCoral }]}>
                      {fmt(spent)} / {fmt(b.amount)}
                    </Text>
                  </View>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: isOver ? mt.colors.textCoral : b.color || mt.colors.accentGreen }]} />
                  </View>
                  <Text style={[s.budgetRemain, isOver && { color: mt.colors.textCoral }]}>
                    {isOver ? `Over by ${fmt(spent - b.amount)}` : `${fmt(b.amount - spent)} left`}
                  </Text>
                </Card>
              );
            })}
          </>
        )}

        {/* ── Recent Transactions ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={s.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionsScreen')}>
            <Text style={s.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        {recent5.length === 0 ? (
          <Card><Text style={s.emptyText}>No transactions yet. Tap + to add one!</Text></Card>
        ) : (
          recent5.map(t => {
            const cat = catMap[t.categoryId];
            return (
              <View key={t.id} style={s.txnRow}>
                <View style={[s.txnIcon, { backgroundColor: cat?.color + '22' }]}>
                  <Text style={{ fontSize: 20 }}>{cat?.icon || '💳'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txnTitle}>{t.title}</Text>
                  <Text style={s.txnDate}>{cat?.name} • {t.date}</Text>
                </View>
                <Text style={[s.txnAmount, { color: t.type === 'income' ? '#27AE60' : mt.colors.textCoral }]}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount, meta.defaultCurrency)}
                </Text>
              </View>
            );
          })
        )}

        {/* ── Quick actions ── */}
        <View style={s.quickActions}>
          <TouchableOpacity style={s.qaBtn} onPress={() => navigation.navigate('BudgetsScreen')}>
            <Text style={{ fontSize: 22 }}>📊</Text>
            <Text style={s.qaLabel}>Budgets</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.qaBtn} onPress={() => navigation.navigate('RecurringScreen')}>
            <Text style={{ fontSize: 22 }}>🔄</Text>
            <Text style={s.qaLabel}>Recurring</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.qaBtn} onPress={() => navigation.navigate('DebtScreen')}>
            <Text style={{ fontSize: 22 }}>🤝</Text>
            <Text style={s.qaLabel}>Debts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.qaBtn} onPress={() => navigation.navigate('CategoriesScreen')}>
            <Text style={{ fontSize: 22 }}>🏷️</Text>
            <Text style={s.qaLabel}>Categories</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('AddTransactionScreen')}>
        <Plus color="#FFF" size={28} />
      </TouchableOpacity>

      <BottomNav current="budget" />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: mt.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) + 8 : 8, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: mt.colors.accentGreen },
  headerBtn: { backgroundColor: mt.colors.surface, borderWidth: 1.5, borderColor: mt.colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  headerBtnText: { fontSize: 13, fontWeight: '600', color: mt.colors.textPrimary },
  scroll: { paddingHorizontal: 18, paddingBottom: 100 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: mt.colors.textSecondary, marginBottom: 10, letterSpacing: 0.3 },
  seeAll: { fontSize: 13, color: mt.colors.accentGreen, fontWeight: '600' },
  // Net worth
  netLabel: { fontSize: 13, color: mt.colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  netAmount: { fontSize: 32, fontWeight: '900', color: mt.colors.textPrimary, marginBottom: 14 },
  inExRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inExItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inExIcon: { fontSize: 16 },
  inExLabel: { fontSize: 11, color: mt.colors.textSecondary },
  inExAmount: { fontSize: 15, fontWeight: '700' },
  // Wallets
  walletChip: { borderRadius: 16, borderWidth: 2, padding: 14, marginRight: 10, minWidth: 130, shadowColor: '#1A1A1A', shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.1, shadowRadius: 0, elevation: 3 },
  walletIcon: { fontSize: 24, marginBottom: 4 },
  walletName: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  walletBalance: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  addWalletChip: { borderRadius: 16, borderWidth: 2, borderColor: mt.colors.border, borderStyle: 'dashed', padding: 14, marginRight: 10, minWidth: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: mt.colors.surface },
  // Budget
  budgetName: { fontSize: 14, fontWeight: '700', color: mt.colors.textPrimary },
  budgetAmt: { fontSize: 13, fontWeight: '600', color: mt.colors.textSecondary },
  budgetRemain: { fontSize: 12, color: mt.colors.textSecondary, marginTop: 6 },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: '#EDE8D8', borderWidth: 1.5, borderColor: mt.colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  // Transactions
  txnRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: mt.colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: mt.colors.border, padding: 12, marginBottom: 8, gap: 12 },
  txnIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  txnTitle: { fontSize: 14, fontWeight: '700', color: mt.colors.textPrimary },
  txnDate: { fontSize: 11, color: mt.colors.textSecondary, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '800' },
  emptyText: { color: mt.colors.textSecondary, textAlign: 'center', fontStyle: 'italic', fontSize: 13 },
  // Quick actions
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  qaBtn: { backgroundColor: mt.colors.surface, borderWidth: 1.5, borderColor: mt.colors.border, borderRadius: 14, padding: 14, alignItems: 'center', flex: 1, marginHorizontal: 4, shadowColor: '#1A1A1A', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.08, shadowRadius: 0, elevation: 2 },
  qaLabel: { fontSize: 11, fontWeight: '600', color: mt.colors.textPrimary, marginTop: 4 },
  // FAB
  fab: { position: 'absolute', bottom: 90, right: 24, backgroundColor: mt.colors.accentGreen, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: mt.colors.border, shadowColor: '#1A1A1A', shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.2, shadowRadius: 0, elevation: 5 },
});
