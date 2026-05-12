// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { mindfulTheme as mt } from '../../theme';
import { getCategories, createCategory, deleteCategory, Category } from '../../utils/budgetSystem';
import { BottomNav } from '../../components/BottomNav';
import { Plus } from 'lucide-react-native';

const COLORS = ['#E8634A','#4A7FBD','#F5C842','#4DD9AC','#9B59B6','#27AE60','#E74C3C','#1ABC9C','#FF9800','#E91E63'];
const ICONS = ['🍔','🚌','🛍️','🎬','🏥','🏠','📚','💼','💸','🎁','☕','🎮','✈️','👗','💊','🐾','🏋️','🎵'];

export const CategoriesScreen = ({ navigation }: any) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [type, setType] = useState<'expense'|'income'|'both'>('expense');

  const load = async () => setCategories(await getCategories());
  useEffect(() => { const u = navigation.addListener('focus', load); return u; }, [navigation]);

  const handleAdd = async () => {
    if (!name) return;
    await createCategory({ name, icon, color, type, order: categories.length });
    setModal(false); setName(''); load();
  };

  const expense = categories.filter(c => c.type !== 'income');
  const income = categories.filter(c => c.type !== 'expense');

  const CatCard = ({ item: c }: { item: Category }) => (
    <View style={s.card}>
      <View style={[s.iconCircle, { backgroundColor: c.color + '22' }]}>
        <Text style={{ fontSize: 22 }}>{c.icon}</Text>
      </View>
      <Text style={s.catName}>{c.name}</Text>
      <View style={[s.typeBadge, { backgroundColor: c.type === 'income' ? '#E8F8F0' : c.type === 'both' ? '#FFF8D6' : '#FEE8E8' }]}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: c.type === 'income' ? '#27AE60' : c.type === 'both' ? '#B8860B' : mt.colors.textCoral }}>{c.type}</Text>
      </View>
      <TouchableOpacity onPress={async () => { await deleteCategory(c.id); load(); }} style={{ marginLeft: 'auto' }}>
        <Text style={{ color: '#C0BBB0', fontSize: 16 }}>🗑</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹ Back</Text></TouchableOpacity>
        <Text style={s.headerTitle}>🏷️ Categories</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={[...expense, ...income]}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => <CatCard item={item} />}
        ListEmptyComponent={<Text style={s.empty}>No categories yet.</Text>}
      />

      <TouchableOpacity style={s.fab} onPress={() => setModal(true)}><Plus color="#FFF" size={24} /></TouchableOpacity>
      <BottomNav current="budget" />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: mt.colors.background, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: '800' }}>New Category</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={{ color: mt.colors.textCoral, fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>
          <Text style={s.fieldLabel}>Name</Text>
          <TextInput style={s.input} placeholder="e.g. Coffee" value={name} onChangeText={setName} placeholderTextColor="#C0BBB0" />
          <Text style={s.fieldLabel}>Type</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {(['expense','income','both'] as const).map(t => (
              <TouchableOpacity key={t} style={[s.typeBtn, type === t && { backgroundColor: mt.colors.accentGreen }]} onPress={() => setType(t)}>
                <Text style={[{ fontSize: 12, fontWeight: '700', color: mt.colors.textSecondary }, type === t && { color: '#FFF' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.fieldLabel}>Icon</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {ICONS.map(i => (
              <TouchableOpacity key={i} style={[s.iconPick, icon === i && { borderColor: mt.colors.accentGreen, borderWidth: 2.5 }]} onPress={() => setIcon(i)}>
                <Text style={{ fontSize: 22 }}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.fieldLabel}>Color</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {COLORS.map(c => <TouchableOpacity key={c} style={[s.colorSwatch, { backgroundColor: c }, color === c && { borderWidth: 3 }]} onPress={() => setColor(c)} />)}
          </View>
          <TouchableOpacity style={s.saveBtn} onPress={handleAdd}><Text style={s.saveBtnTxt}>Add Category</Text></TouchableOpacity>
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: mt.colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: mt.colors.border, padding: 14, marginBottom: 10, gap: 10 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 15, fontWeight: '700', color: mt.colors.textPrimary, flex: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  fab: { position: 'absolute', bottom: 90, right: 24, backgroundColor: mt.colors.accentGreen, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: mt.colors.border, elevation: 5 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 16, borderWidth: 1.5, borderColor: mt.colors.border, backgroundColor: mt.colors.surface, alignItems: 'center' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: mt.colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: mt.colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: mt.colors.border, padding: 14, fontSize: 15, color: mt.colors.textPrimary, marginBottom: 16 },
  iconPick: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: mt.colors.border, backgroundColor: mt.colors.surface, alignItems: 'center', justifyContent: 'center' },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: mt.colors.border },
  saveBtn: { backgroundColor: mt.colors.accentGreen, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: mt.colors.border },
  saveBtnTxt: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
