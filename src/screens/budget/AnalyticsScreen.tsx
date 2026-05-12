// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  Platform, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { mindfulTheme as mt } from '../../theme';
import { getSpendByCategory, getMonthlyTotals, loadBudgetMeta, BudgetMeta } from '../../utils/budgetSystem';
import { BottomNav } from '../../components/BottomNav';

const SCREEN_W = Dimensions.get('window').width;
const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export const AnalyticsScreen = ({ navigation }: any) => {
  const [meta, setMeta] = useState<BudgetMeta | null>(null);
  const [spendByCat, setSpendByCat] = useState<Record<string, number>>({});
  const [monthlyTotals, setMonthlyTotals] = useState<{ month: string; income: number; expense: number }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const load = async () => {
    const m = await loadBudgetMeta();
    setMeta(m);
    const sbc = await getSpendByCategory(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1);
    setSpendByCat(sbc);
    const mt6 = await getMonthlyTotals(6);
    setMonthlyTotals(mt6);
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, selectedMonth]);

  const monthLabel = selectedMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const changeMonth = (dir: -1 | 1) => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + dir);
    setSelectedMonth(d);
  };

  // Pie chart data
  const pieData = meta
    ? Object.entries(spendByCat)
        .map(([catId, amount]) => {
          const cat = meta.categories.find(c => c.id === catId);
          return { value: amount, color: cat?.color || '#999', label: cat?.name || catId, icon: cat?.icon || '💳' };
        })
        .filter(d => d.value > 0)
        .sort((a, b) => b.value - a.value)
    : [];

  const totalSpend = pieData.reduce((s, d) => s + d.value, 0);

  // Bar chart data (grouped income/expense)
  const barData = monthlyTotals.flatMap(m => [
    { value: Math.round(m.income), label: m.month.slice(5), frontColor: '#27AE60', spacing: 2, barWidth: 16 },
    { value: Math.round(m.expense), frontColor: mt.colors.textCoral, barWidth: 16, spacing: 14 },
  ]);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📊 Analytics</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Month Selector */}
        <View style={s.monthRow}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={s.monthBtn}><Text style={s.monthBtnText}>‹</Text></TouchableOpacity>
          <Text style={s.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={s.monthBtn}><Text style={s.monthBtnText}>›</Text></TouchableOpacity>
        </View>

        {/* Spending Pie Chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Spending by Category</Text>
          {pieData.length === 0 ? (
            <Text style={s.emptyText}>No expense data for this month.</Text>
          ) : (
            <>
              <View style={{ alignItems: 'center', marginVertical: 12 }}>
                <PieChart
                  data={pieData}
                  donut
                  radius={110}
                  innerRadius={70}
                  centerLabelComponent={() => (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: mt.colors.textSecondary }}>Total</Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: mt.colors.textPrimary }}>{fmt(totalSpend)}</Text>
                    </View>
                  )}
                  showText={false}
                  strokeWidth={2}
                  strokeColor={mt.colors.background}
                />
              </View>
              {/* Legend */}
              <View style={s.legend}>
                {pieData.map((d, i) => (
                  <View key={i} style={s.legendItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={[s.legendDot, { backgroundColor: d.color }]} />
                      <Text style={{ fontSize: 13 }}>{d.icon}</Text>
                      <Text style={s.legendLabel}>{d.label}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.legendAmt}>{fmt(d.value)}</Text>
                      <Text style={s.legendPct}>{totalSpend > 0 ? Math.round((d.value / totalSpend) * 100) : 0}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Income vs Expense Bar Chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Income vs Expense (6 months)</Text>
          <View style={s.barLegend}>
            <View style={[s.barLegendDot, { backgroundColor: '#27AE60' }]} /><Text style={s.barLegendText}>Income  </Text>
            <View style={[s.barLegendDot, { backgroundColor: mt.colors.textCoral }]} /><Text style={s.barLegendText}>Expense</Text>
          </View>
          {barData.length > 0 ? (
            <BarChart
              data={barData}
              barWidth={16}
              spacing={14}
              hideRules
              xAxisThickness={1.5}
              xAxisColor={mt.colors.border}
              yAxisThickness={0}
              yAxisTextStyle={{ fontSize: 10, color: mt.colors.textSecondary }}
              noOfSections={4}
              isAnimated
              maxValue={Math.max(...monthlyTotals.map(m => Math.max(m.income, m.expense)), 1000) * 1.2}
              roundedTop
              roundedBottom={false}
              width={SCREEN_W - 100}
            />
          ) : (
            <Text style={s.emptyText}>Not enough data yet.</Text>
          )}
        </View>

        {/* Monthly Summary Table */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Monthly Summary</Text>
          {monthlyTotals.map((m, i) => (
            <View key={i} style={s.summaryRow}>
              <Text style={s.summaryMonth}>{m.month}</Text>
              <Text style={[s.summaryVal, { color: '#27AE60' }]}>{fmt(m.income)}</Text>
              <Text style={[s.summaryVal, { color: mt.colors.textCoral }]}>{fmt(m.expense)}</Text>
              <Text style={[s.summaryVal, { color: m.income - m.expense >= 0 ? '#27AE60' : mt.colors.textCoral, fontWeight: '700' }]}>
                {fmt(m.income - m.expense)}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <BottomNav current="budget" />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: mt.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) + 8 : 8, paddingBottom: 12, borderBottomWidth: 1.5, borderBottomColor: mt.colors.border, backgroundColor: mt.colors.surface },
  backBtn: {}, backBtnText: { fontSize: 16, color: mt.colors.accentGreen, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: mt.colors.textPrimary },
  scroll: { padding: 18, paddingBottom: 100 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18, gap: 20 },
  monthBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: mt.colors.surface, borderWidth: 1.5, borderColor: mt.colors.border, alignItems: 'center', justifyContent: 'center' },
  monthBtnText: { fontSize: 22, color: mt.colors.textPrimary, fontWeight: '700' },
  monthLabel: { fontSize: 16, fontWeight: '800', color: mt.colors.textPrimary },
  card: { backgroundColor: mt.colors.surface, borderRadius: mt.borderRadius.xl, borderWidth: 2, borderColor: mt.colors.border, padding: 16, marginBottom: 16, shadowColor: '#1A1A1A', shadowOffset: { width: 3, height: 4 }, shadowOpacity: 0.1, shadowRadius: 0, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: mt.colors.textPrimary, marginBottom: 4 },
  emptyText: { color: mt.colors.textSecondary, fontStyle: 'italic', fontSize: 13, textAlign: 'center', marginVertical: 16 },
  legend: { marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EDE8D8' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendLabel: { fontSize: 13, color: mt.colors.textPrimary, flex: 1, marginLeft: 4 },
  legendAmt: { fontSize: 13, fontWeight: '700', color: mt.colors.textPrimary },
  legendPct: { fontSize: 11, color: mt.colors.textSecondary },
  barLegend: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barLegendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  barLegendText: { fontSize: 12, color: mt.colors.textSecondary, marginRight: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EDE8D8' },
  summaryMonth: { fontSize: 12, color: mt.colors.textSecondary, flex: 1 },
  summaryVal: { fontSize: 12, fontWeight: '600', minWidth: 70, textAlign: 'right' },
});
