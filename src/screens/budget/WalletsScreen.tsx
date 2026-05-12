// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { mindfulTheme as mt } from '../../theme';
import { getWallets, getWalletBalance, createWallet, deleteWallet, Wallet } from '../../utils/budgetSystem';
import { BottomNav } from '../../components/BottomNav';
import { Plus } from 'lucide-react-native';

const fmt = (n: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const COLORS = ['#4DD9AC','#4A7FBD','#F5C842','#E8634A','#9B59B6','#27AE60','#E91E63','#FF9800'];
const ICONS = ['💵','🏦','📱','💳','🏧','💰','🪙','💎'];

export const WalletsScreen = ({ navigation }: any) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [currency, setCurrency] = useState('INR');

  const load = async () => {
    const w = await getWallets();
    setWallets(w);
    const b: Record<string, number> = {};
    for (const wallet of w) b[wallet.id] = await getWalletBalance(wallet.id);
    setBalances(b);
  };

  useEffect(() => { const u = navigation.addListener('focus', load); return u; }, [navigation]);

  const handleAdd = async () => {
    if (!name) return;
    await createWallet({ name, icon, color, currency, initialBalance: parseFloat(initialBalance) || 0, excludeFromTotal: false });
    setModal(false); setName(''); setInitialBalance('0'); load();
  };

  const totalNetWorth = wallets.filter(w => !w.excludeFromTotal).reduce((s, w) => s + (balances[w.id] || 0), 0);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹ Back</Text></TouchableOpacity>
        <Text style={s.headerTitle}>💳 Wallets</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Net Worth Banner */}
      <View style={s.netBanner}>
        <Text style={s.netLabel}>Total Net Worth</Text>
        <Text style={s.netAmt}>{fmt(totalNetWorth)}</Text>
      </View>

      <FlatList
        data={wallets}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>No wallets. Tap + to add one.</Text>}
        renderItem={({ item: w }) => {
          const bal = balances[w.id] || 0;
          return (
            <View style={[s.card, { borderLeftWidth: 5, borderLeftColor: w.color }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[s.iconCircle, { backgroundColor: w.color }]}>
                  <Text style={{ fontSize: 24 }}>{w.icon}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.walletName}>{w.name}</Text>
                  <Text style={s.walletCurrency}>{w.currency}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.balance, { color: bal >= 0 ? mt.colors.textPrimary : mt.colors.textCoral }]}>
                    {fmt(bal, w.currency)}
                  </Text>
                  <TouchableOpacity onPress={async () => { await deleteWallet(w.id); load(); }}>
                    <Text style={{ fontSize: 12, color: '#C0BBB0', marginTop: 4 }}>🗑 Remove</Text>
                  </TouchableOpacity>
                </View>
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
            <Text style={{ fontSize: 20, fontWeight: '800', color: mt.colors.textPrimary }}>New Wallet</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={{ color: mt.colors.textCoral, fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>
          <Text style={s.fieldLabel}>Wallet Name</Text>
          <TextInput style={s.input} placeholder="e.g. HDFC Bank" value={name} onChangeText={setName} placeholderTextColor="#C0BBB0" />
          <Text style={s.fieldLabel}>Initial Balance (₹)</Text>
          <TextInput style={s.input} placeholder="0" keyboardType="decimal-pad" value={initialBalance} onChangeText={setInitialBalance} placeholderTextColor="#C0BBB0" />
          <Text style={s.fieldLabel}>Icon</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {ICONS.map(i => (
              <TouchableOpacity key={i} style={[s.iconPick, icon === i && { borderColor: mt.colors.accentGreen, borderWidth: 2.5 }]} onPress={() => setIcon(i)}>
                <Text style={{ fontSize: 22 }}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.fieldLabel}>Color</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {COLORS.map(c => <TouchableOpacity key={c} style={[s.colorSwatch, { backgroundColor: c }, color === c && { borderWidth: 3 }]} onPress={() => setColor(c)} />)}
          </View>
          <TouchableOpacity style={s.saveBtn} onPress={handleAdd}><Text style={s.saveBtnTxt}>Add Wallet</Text></TouchableOpacity>
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
  netBanner: { backgroundColor: mt.colors.accentGreen, padding: 20, alignItems: 'center' },
  netLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  netAmt: { fontSize: 28, fontWeight: '900', color: '#FFF', marginTop: 4 },
  list: { padding: 16, paddingBottom: 100 },
  empty: { textAlign: 'center', color: mt.colors.textSecondary, marginTop: 40, fontStyle: 'italic' },
  card: { backgroundColor: mt.colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: mt.colors.border, padding: 14, marginBottom: 12, shadowColor: '#1A1A1A', shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.08, shadowRadius: 0, elevation: 2 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  walletName: { fontSize: 16, fontWeight: '800', color: mt.colors.textPrimary },
  walletCurrency: { fontSize: 12, color: mt.colors.textSecondary },
  balance: { fontSize: 18, fontWeight: '800' },
  fab: { position: 'absolute', bottom: 90, right: 24, backgroundColor: mt.colors.accentGreen, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: mt.colors.border, elevation: 5 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: mt.colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: mt.colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: mt.colors.border, padding: 14, fontSize: 15, color: mt.colors.textPrimary, marginBottom: 16 },
  iconPick: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: mt.colors.border, backgroundColor: mt.colors.surface, alignItems: 'center', justifyContent: 'center' },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: mt.colors.border },
  saveBtn: { backgroundColor: mt.colors.accentGreen, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: mt.colors.border },
  saveBtnTxt: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
