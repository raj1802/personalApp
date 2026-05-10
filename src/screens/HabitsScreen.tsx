import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { Habit, loadHabits, createHabit, toggleHabit } from '../utils/habitSystem';
import { ContributionGraph } from '../components/ContributionGraph';
import { theme } from '../theme';
import { Plus, Check, ArrowLeft } from 'lucide-react-native';

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface
  },
  backBtn: { padding: theme.spacing.xs },
  headerTitle: { fontSize: theme.typography.sizes.xl, fontWeight: theme.typography.weights.bold, color: theme.colors.textPrimary },
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
  saveBtnText: { color: '#FFFFFF', fontWeight: theme.typography.weights.semibold },
  listContent: { padding: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.surface, padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.md,
    borderWidth: 1, borderColor: theme.colors.border
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  habitTitle: { fontSize: theme.typography.sizes.md, fontWeight: theme.typography.weights.semibold, color: theme.colors.textPrimary },
  toggleBtn: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center'
  },
  toggleBtnActive: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyStateText: { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: theme.colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  }
});
