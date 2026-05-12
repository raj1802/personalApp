// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { mindfulTheme as mt } from '../../theme';
import { getBudgets, getBudgetSpend, createBudget, deleteBudget, getCategories, Budget, Category } from '../../utils/budgetSystem';
import { BottomNav } from '../../components/BottomNav';
import { Plus } from 'lucide-react-native';

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const COLORS = ['#4DD9AC','#E8634A','#4A7FBD','#F5C842','#9B59B6','#27AE60','#E74C3C','#1ABC9C'];

export const BudgetsScreen = ({ navigation }: any) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spends, setSpends] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'weekly'|'monthly'|'yearly'>('monthly');
  const [selCats, setSelCats] = useState<string[]>([]);
  const [color, setColor] = useState(COLORS[0]);

  const load = async () => {
    const [b, c] = await Promise.all([getBudgets(), getCategories()]);
    setBudgets(b);
    setCategories(c);
    const s: Record<string,number> = {};
    for (const bud of b) s[bud.id] = await getBudgetSpend(bud);
    setSpends(s);
  };

  useEffect(() => { const u = navigation.addListener('focus', load); return u; }, [navigation]);

  const handleAdd = async () => {
    if (!name || !amount) return;
    await createBudget({ name, amount: parseFloat(amount), categoryIds: selCats, walletIds: [], period, color });
    setModal(false); setName(''); setAmount(''); setSelCats([]); load();
  };

  const handleDelete = async (id: string) => { await deleteBudget(id); load(); };

  const catMap: Record<string, Category> = {};
  categories.forEach(c => { catMap[c.id] = c; });

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹ Back</Text></TouchableOpacity>
        <Text style={s.headerTitle}>📊 Budgets</Text>
        <View style={{ width: 60 }} />
      </View>
      <FlatList
        data={budgets}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>No budgets yet. Tap + to create one.</Text>}
        renderItem={({ item: b }) => {
          const spent = spends[b.id] || 0;
          const pct = Math.min((spent / b.amount) * 100, 100);
          const isOver = spent > b.amount;
          const cats = b.categoryIds.map(id => catMap[id]).filter(Boolean);
          return (
            <View style={s.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View style={[s.colorDot, { backgroundColor: b.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.budgetName}>{b.name}</Text>
                  <Text style={s.budgetPeriod}>{b.period}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(b.id)}><Text style={{ color: '#C0BBB0' }}>🗑</Text></TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={s.spentText}>{fmt(spent)} spent</Text>
                <Text style={[s.limitText, isOver && { color: mt.colors.textCoral }]}>of {fmt(b.amount)}</Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: isOver ? mt.colors.textCoral : b.color }]} />
              </View>
              <Text style={[s.remainText, isOver && { color: mt.colors.textCoral }]}>
                {isOver ? `⚠️ Over by ${fmt(spent - b.amount)}` : `${fmt(b.amount - spent)} remaining`}
              </Text>
              {cats.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 4 }}>
                  {cats.map(c => (
                    <View key={c.id} style={[s.catChip, { backgroundColor: c.color + '22' }]}>
                      <Text style={{ fontSize: 12 }}>{c.icon} {c.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
      <TouchableOpacity style={s.fab} onPress={() => setModal(true)}><Plus color="#FFF" size={24} /></TouchableOpacity>
      <BottomNav current="budget" />
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: mt.colors.background, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: mt.colors.textPrimary }}>New Budget</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={{ color: mt.colors.textCoral, fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>
          <Text style={s.fieldLabel}>Budget Name</Text>
          <TextInput style={s.input} placeholder="e.g. Monthly Food" value={name} onChangeText={setName} placeholderTextColor="#C0BBB0" />
          <Text style={s.fieldLabel}>Limit Amount (₹)</Text>
          <TextInput style={s.input} placeholder="5000" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholderTextColor="#C0BBB0" />
          <Text style={s.fieldLabel}>Period</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {(['weekly','monthly','yearly'] as const).map(p => (
              <TouchableOpacity key={p} style={[s.periodBtn, period === p && { backgroundColor: mt.colors.accentGreen, borderColor: mt.colors.border }]} onPress={() => setPeriod(p)}>
                <Text style={[{ fontSize: 13, fontWeight: '700', color: mt.colors.textSecondary }, period === p && { color: '#FFF' }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.fieldLabel}>Color</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {COLORS.map(c => <TouchableOpacity key={c} style={[s.colorSwatch, { backgroundColor: c }, color === c && { borderWidth: 3 }]} onPress={() => setColor(c)} />)}
          </View>
          <Text style={s.fieldLabel}>Categories (optional)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {categories.filter(c => c.type !== 'income').map(c => (
              <TouchableOpacity key={c.id} style={[s.catChip, selCats.includes(c.id) && { borderColor: c.color, borderWidth: 2 }]}
                onPress={() => setSelCats(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}>
                <Text style={{ fontSize: 13 }}>{c.icon} {c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.saveBtn} onPress={handleAdd}><Text style={s.saveBtnTxt}>Create Budget</Text></TouchableOpacity>
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
  card: { backgroundColor: mt.colors.surface, borderRadius: 16, borderWidth: 2, borderColor: mt.colors.border, padding: 16, marginBottom: 14, shadowColor: '#1A1A1A', shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.1, shadowRadius: 0, elevation: 3 },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
  budgetName: { fontSize: 15, fontWeight: '800', color: mt.colors.textPrimary },
  budgetPeriod: { fontSize: 11, color: mt.colors.textSecondary, textTransform: 'capitalize' },
  spentText: { fontSize: 13, fontWeight: '600', color: mt.colors.textPrimary },
  limitText: { fontSize: 13, fontWeight: '600', color: mt.colors.textSecondary },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: '#EDE8D8', borderWidth: 1, borderColor: mt.colors.border, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 5 },
  remainText: { fontSize: 12, color: mt.colors.textSecondary },
  catChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1.5, borderColor: mt.colors.border, backgroundColor: mt.colors.surface },
  fab: { position: 'absolute', bottom: 90, right: 24, backgroundColor: mt.colors.accentGreen, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: mt.colors.border, elevation: 5 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: mt.colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: mt.colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: mt.colors.border, padding: 14, fontSize: 15, color: mt.colors.textPrimary, marginBottom: 16 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: mt.colors.border, backgroundColor: mt.colors.surface },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: mt.colors.border },
  saveBtn: { backgroundColor: mt.colors.accentGreen, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: mt.colors.border },
  saveBtnTxt: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
