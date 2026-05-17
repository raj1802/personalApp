// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, Platform, Alert, ScrollView,
} from 'react-native';
import {
  Habit, loadHabits, createHabit, toggleHabit,
  deleteHabit, archiveHabit, getHabitStats,
  requestNotificationPermission,
} from '../utils/habitSystem';
import { updateHabit } from '../utils/habitSystem';
import { ContributionGraph } from '../components/ContributionGraph';
import { AddHabitModal } from '../components/AddHabitModal';
import { mindfulTheme as mt } from '../theme';
import { Plus, Check, ChevronRight } from 'lucide-react-native';
import { BottomNav } from '../components/BottomNav';
import * as SecureStore from 'expo-secure-store';

const NOTIF_PERM_KEY = 'notif_perm_requested';

// ─── Filter options ──────────────────────────────────────────
const FILTERS = ['All', 'Today', 'Health', 'Fitness', 'Learning', 'Mindfulness', 'Personal', 'Work'];

// ─── Habit Card ──────────────────────────────────────────────

function HabitCard({
  habit,
  onToggle,
  onPress,
  onLongPress,
}: {
  habit: Habit;
  onToggle: () => void;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const isDoneToday = (habit.entries[today] || 0) > 0;
  const stats = getHabitStats(habit);

  // Last 28 days for mini heatmap
  const last28: Record<string, number> = {};
  for (let i = 0; i < 28; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (habit.entries[ds]) last28[ds] = habit.entries[ds];
  }

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: habit.color, borderLeftWidth: 5 }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={[styles.emojiWrap, { backgroundColor: habit.color + '22' }]}>
            <Text style={styles.cardEmoji}>{habit.emoji}</Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle}>{habit.name}</Text>
            <View style={styles.cardTagRow}>
              <View style={[styles.catTag, { backgroundColor: habit.color + '22' }]}>
                <Text style={[styles.catTagText, { color: habit.color }]}>{habit.category}</Text>
              </View>
              {stats.currentStreak > 0 && (
                <Text style={styles.streakBadge}>🔥 {stats.currentStreak}</Text>
              )}
              {habit.reminderEnabled && (
                <Text style={styles.notifBadge}>🔔 {habit.reminderTime}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              isDoneToday && { backgroundColor: habit.color, borderColor: habit.color },
            ]}
            onPress={(e) => { e.stopPropagation?.(); onToggle(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Check size={16} color={isDoneToday ? '#fff' : mt.colors.borderLight} />
          </TouchableOpacity>
          <ChevronRight size={14} color={mt.colors.borderLight} style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* Mini heatmap (28 days) */}
      <View style={styles.heatmapWrap}>
        <ContributionGraph
          entries={last28}
          days={28}
          accentColor={habit.color}
          compact
        />
      </View>

      {/* Stats row */}
      <View style={styles.statsBar}>
        <Text style={styles.statText}>
          <Text style={[styles.statAccent, { color: habit.color }]}>{stats.completionRate}%</Text>
          {' '}this month
        </Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.statText}>
          Best: <Text style={styles.statAccent}>{stats.bestStreak} days</Text>
        </Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.statText}>
          Total: <Text style={styles.statAccent}>{stats.totalDays}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ─────────────────────────────────────────────────

export const HabitsScreen = ({ navigation }: any) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [filter, setFilter] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);

  const refreshHabits = useCallback(async () => {
    const data = await loadHabits();
    setHabits(data.filter(h => !h.archived));
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', refreshHabits);
    return unsub;
  }, [navigation, refreshHabits]);

  useEffect(() => {
    // Request notification permission once
    (async () => {
      const asked = await SecureStore.getItemAsync(NOTIF_PERM_KEY);
      if (!asked) {
        const granted = await requestNotificationPermission();
        await SecureStore.setItemAsync(NOTIF_PERM_KEY, 'true');
        if (!granted) {
          Alert.alert(
            'Reminders Disabled',
            'You can enable notifications in your device settings to get daily habit reminders.',
            [{ text: 'OK' }]
          );
        }
      }
    })();
  }, []);

  const handleAddSave = async (data: any) => {
    await createHabit(data);
    setModalVisible(false);
    refreshHabits();
  };

  const handleEditSave = async (data: any) => {
    if (!editHabit) return;
    await updateHabit(editHabit.id, data);
    setEditHabit(null);
    setModalVisible(false);
    refreshHabits();
  };

  const handleToggleToday = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    await toggleHabit(habitId, today);
    refreshHabits();
  };

  const handleLongPress = (habit: Habit) => {
    Alert.alert(
      `${habit.emoji} ${habit.name}`,
      'What would you like to do?',
      [
        {
          text: '✏️ Edit',
          onPress: () => {
            setEditHabit(habit);
            setModalVisible(true);
          },
        },
        {
          text: '📦 Archive',
          onPress: async () => {
            await archiveHabit(habit.id);
            refreshHabits();
          },
        },
        {
          text: '🗑️ Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Habit',
              `Permanently delete "${habit.name}"? All history will be lost.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteHabit(habit.id);
                    refreshHabits();
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ── Filtering ─────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const filtered = habits.filter(h => {
    if (filter === 'All') return true;
    if (filter === 'Today') return (h.entries[today] || 0) === 0; // undone today
    return h.category === filter;
  });

  const doneToday = habits.filter(h => (h.entries[today] || 0) > 0).length;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Habits</Text>
          <Text style={styles.headerSub}>
            {doneToday}/{habits.length} done today
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <View style={[styles.progressRing, { borderColor: mt.colors.accentGreen }]}>
            <Text style={styles.progressText}>
              {habits.length > 0 ? Math.round((doneToday / habits.length) * 100) : 0}%
            </Text>
          </View>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            onToggle={() => handleToggleToday(item.id)}
            onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySub}>
              Tap the + button to start building{'\n'}your first mindful habit.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditHabit(null);
          setModalVisible(true);
        }}
      >
        <Plus color="#fff" size={26} />
      </TouchableOpacity>

      <BottomNav current="habits" />

      {/* Add / Edit Modal */}
      <AddHabitModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditHabit(null); }}
        onSave={editHabit ? handleEditSave : handleAddSave}
        editHabit={editHabit}
      />
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: mt.colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) + 8 : mt.spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: mt.colors.border,
    backgroundColor: mt.colors.surface,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: mt.colors.textGreen },
  headerSub: { fontSize: 12, color: mt.colors.textSecondary, marginTop: 2, fontWeight: '500' },
  headerBadge: { alignItems: 'center', justifyContent: 'center' },
  progressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mt.colors.background,
  },
  progressText: { fontSize: 12, fontWeight: '800', color: mt.colors.accentGreen },

  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: mt.colors.border,
    backgroundColor: mt.colors.surface,
  },
  filterChipActive: {
    backgroundColor: mt.colors.accentGreen,
    borderColor: mt.colors.border,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: mt.colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },

  card: {
    backgroundColor: mt.colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: mt.colors.border,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    paddingBottom: 8,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  emojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 20 },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: mt.colors.textPrimary, marginBottom: 4 },
  cardTagRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  catTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  catTagText: { fontSize: 11, fontWeight: '700' },
  streakBadge: { fontSize: 11, fontWeight: '700', color: mt.colors.textPrimary },
  notifBadge: { fontSize: 11, color: mt.colors.textSecondary },
  cardRight: { alignItems: 'center' },
  toggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: mt.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mt.colors.background,
  },

  heatmapWrap: {
    paddingHorizontal: 14,
    paddingBottom: 6,
  },

  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 6,
  },
  statText: { fontSize: 11, color: mt.colors.textSecondary },
  statAccent: { fontWeight: '700', color: mt.colors.textPrimary },
  statDot: { color: mt.colors.borderLight, fontSize: 12 },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: mt.colors.textPrimary, marginBottom: 8 },
  emptySub: {
    fontSize: 14,
    color: mt.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    backgroundColor: mt.colors.accentGreen,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: mt.colors.border,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 6,
  },
});
