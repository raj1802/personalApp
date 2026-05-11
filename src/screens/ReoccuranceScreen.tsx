import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { getNotesList, NoteMetadata } from '../utils/fileSystem';
import { Habit, loadHabits, toggleHabit } from '../utils/habitSystem';
import { theme } from '../theme';
import { RefreshCw, FileText, Check } from 'lucide-react-native';
import { BottomNav } from '../components/BottomNav';

export const ReoccuranceScreen = ({ navigation }: any) => {
  const [notes, setNotes] = useState<NoteMetadata[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    const loadData = navigation.addListener('focus', async () => {
      const loadedNotes = await getNotesList();
      setNotes(loadedNotes.slice(0, 10)); // Just top 10 recent
      
      const loadedHabits = await loadHabits();
      setHabits(loadedHabits);
    });

    return loadData;
  }, [navigation]);

  const handleToggleToday = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    await toggleHabit(habitId, today);
    const loadedHabits = await loadHabits();
    setHabits(loadedHabits);
  };

  const renderNoteItem = ({ item }: { item: NoteMetadata }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('NoteEditor', { uri: item.uri, filename: item.filename })}
    >
      <View style={styles.cardHeader}>
        <FileText size={20} color={theme.colors.primary} />
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      <Text style={styles.cardDate}>
        {new Date(item.updatedAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderHabitItem = ({ item }: { item: Habit }) => {
    const today = new Date().toISOString().split('T')[0];
    const isDoneToday = (item.entries[today] || 0) > 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.toggleBtn, isDoneToday && styles.toggleBtnActive]}
          onPress={() => handleToggleToday(item.id)}
        >
          <Check size={16} color={isDoneToday ? '#FFFFFF' : theme.colors.border} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <RefreshCw size={24} color={theme.colors.textPrimary} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>Reoccurance</Text>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Recent Habits</Text>
        {habits.length === 0 ? (
          <Text style={styles.emptyStateText}>No habits found.</Text>
        ) : (
          habits.map(habit => (
            <React.Fragment key={habit.id}>
              {renderHabitItem({ item: habit })}
            </React.Fragment>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.xl }]}>Recently Updated Notes</Text>
        {notes.length === 0 ? (
          <Text style={styles.emptyStateText}>No notes found.</Text>
        ) : (
          notes.map(note => (
            <React.Fragment key={note.uri}>
              {renderNoteItem({ item: note })}
            </React.Fragment>
          ))
        )}
      </ScrollView>

      <BottomNav current="reoccurance" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  cardDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  emptyStateText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
    marginLeft: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
});
