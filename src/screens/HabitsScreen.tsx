// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { Habit, loadHabits, createHabit, toggleHabit } from '../utils/habitSystem';
import { ContributionGraph } from '../components/ContributionGraph';
import { theme, mindfulTheme as mt } from '../theme';
import { Plus, Check } from 'lucide-react-native';
import { BottomNav } from '../components/BottomNav';

export const HabitsScreen = ({ navigation }: any) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    refreshHabits();
  }, []);

  const refreshHabits = async () => {
    const data = await loadHabits();
    setHabits(data);
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return;
    await createHabit(newHabitName);
    setNewHabitName('');
    setIsAdding(false);
    refreshHabits();
  };

  const handleToggleToday = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    await toggleHabit(habitId, today);
    refreshHabits();
  };

  const renderHabit = ({ item }: { item: Habit }) => {
    const today = new Date().toISOString().split('T')[0];
    const isDoneToday = (item.entries[today] || 0) > 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.habitTitle}>{item.name}</Text>
          <TouchableOpacity 
            style={[styles.toggleBtn, isDoneToday && styles.toggleBtnActive]}
            onPress={() => handleToggleToday(item.id)}
          >
            <Check size={16} color={isDoneToday ? '#FFFFFF' : theme.colors.border} />
          </TouchableOpacity>
        </View>
        <ContributionGraph entries={item.entries} days={90} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Habits</Text>
      </View>

      {isAdding && (
        <View style={styles.addSection}>
          <TextInput 
            style={styles.input}
            placeholder="New habit name (e.g., Workout)"
            placeholderTextColor={theme.colors.textSecondary}
            value={newHabitName}
            onChangeText={setNewHabitName}
            onSubmitEditing={handleAddHabit}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleAddHabit}>
            <Text style={styles.saveBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        renderItem={renderHabit}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No habits tracked yet.</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setIsAdding(!isAdding)}
      >
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>

      <BottomNav current="habits" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: mt.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: mt.spacing.lg, paddingVertical: mt.spacing.md,
    borderBottomWidth: 2, borderBottomColor: mt.colors.border,
    backgroundColor: mt.colors.surface
  },
  backBtn: { padding: mt.spacing.xs },
  headerTitle: { fontSize: 22, fontWeight: '800', color: mt.colors.textGreen },
  addSection: {
    flexDirection: 'row', padding: theme.spacing.md, backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border
  },
  input: {
    flex: 1, height: 40, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary
  },
  saveBtn: {
    justifyContent: 'center', backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.lg,
    marginLeft: theme.spacing.sm
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600' },
  listContent: { padding: mt.spacing.md, paddingBottom: 100 },
  card: {
    backgroundColor: mt.colors.surface, padding: mt.spacing.md,
    borderRadius: mt.borderRadius.lg, marginBottom: mt.spacing.md,
    borderWidth: 2, borderColor: mt.colors.border,
    shadowColor: '#1A1A1A', shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.1, shadowRadius: 0, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: mt.spacing.md },
  habitTitle: { fontSize: 15, fontWeight: '700', color: mt.colors.textPrimary },
  toggleBtn: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: mt.colors.border,
    alignItems: 'center', justifyContent: 'center'
  },
  toggleBtnActive: { backgroundColor: mt.colors.accentTeal, borderColor: mt.colors.border },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyStateText: { color: mt.colors.textSecondary, fontSize: 15 },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    backgroundColor: mt.colors.accentGreen,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: mt.colors.border,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 5,
  }
});
