// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Platform, Alert,
} from 'react-native';
import {
  Habit, loadHabits, getHabitStats, logHabitEntry,
  deleteHabit, archiveHabit,
} from '../utils/habitSystem';
import { ContributionGraph } from '../components/ContributionGraph';
import { AddHabitModal } from '../components/AddHabitModal';
import { updateHabit } from '../utils/habitSystem';
import { mindfulTheme as mt } from '../theme';
import { ChevronLeft, Edit2, Trash2, Archive } from 'lucide-react-native';

// ─── Past-date window (7 days back) ─────────────────────────

const getPast7Days = () => {
  const days: { dateStr: string; label: string; dayName: string }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const label = i === 0 ? 'Today' : i === 1 ? 'Yest.' : dayName;
    days.push({ dateStr, label, dayName });
  }
  return days;
};

// ─── Stat Tile ───────────────────────────────────────────────

function StatTile({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <View style={[statStyles.tile, { borderTopColor: color }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}
const statStyles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: mt.colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: mt.colors.border,
    borderTopWidth: 4,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
    elevation: 3,
  },
  value: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  label: { fontSize: 11, fontWeight: '600', color: mt.colors.textSecondary, textAlign: 'center' },
});

// ─── Screen ─────────────────────────────────────────────────

export const HabitDetailScreen = ({ route, navigation }: any) => {
  const { habitId } = route.params;
  const [habit, setHabit] = useState<Habit | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const past7 = getPast7Days();

  const loadHabit = useCallback(async () => {
    const all = await loadHabits();
    const found = all.find(h => h.id === habitId);
    setHabit(found || null);
  }, [habitId]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadHabit);
    return unsub;
  }, [navigation, loadHabit]);

  if (!habit) return null;

  const stats = getHabitStats(habit);

  const handleToggleDay = async (dateStr: string) => {
    const current = habit.entries[dateStr] || 0;
    await logHabitEntry(habit.id, dateStr, current > 0 ? 0 : 1);
    loadHabit();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to permanently delete "${habit.name}"? All history will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteHabit(habit.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Habit',
      `Archive "${habit.name}"? It will be hidden from your main list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            await archiveHabit(habit.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEditSave = async (data: any) => {
    await updateHabit(habit.id, data);
    setEditVisible(false);
    loadHabit();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={mt.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{habit.emoji}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{habit.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setEditVisible(true)} style={styles.actionBtn}>
            <Edit2 size={18} color={mt.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleArchive} style={styles.actionBtn}>
            <Archive size={18} color={mt.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <Trash2 size={18} color={mt.colors.textCoral} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Category + reminder badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.categoryBadge, { backgroundColor: habit.color + '33', borderColor: habit.color }]}>
            <Text style={[styles.categoryText, { color: habit.color }]}>{habit.category}</Text>
          </View>
          {habit.reminderEnabled && (
            <View style={styles.reminderBadge}>
              <Text style={styles.reminderBadgeText}>🔔 {habit.reminderTime}</Text>
            </View>
          )}
          <View style={[styles.freqBadge, { backgroundColor: mt.colors.surfaceYellow }]}>
            <Text style={styles.freqText}>
              {habit.frequency === 'daily' ? '📅 Daily' : `📆 ${habit.targetDaysPerWeek}×/week`}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatTile value={`${stats.currentStreak}🔥`} label="Current Streak" color={habit.color} />
          <StatTile value={stats.bestStreak} label="Best Streak" color={mt.colors.accentGreen} />
        </View>
        <View style={[styles.statsRow, { marginTop: 0 }]}>
          <StatTile value={`${stats.completionRate}%`} label="Completion" color={mt.colors.textCoral} />
          <StatTile value={stats.totalDays} label="Total Days" color={mt.colors.textGold} />
          <StatTile value={`${stats.weeklyAvg}×`} label="Weekly Avg" color={mt.colors.accentTeal} />
        </View>

        {/* Past 7 days — tap to toggle */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <Text style={styles.sectionSub}>Tap any day to toggle</Text>
          <View style={styles.week7Row}>
            {past7.map(({ dateStr, label }) => {
              const done = (habit.entries[dateStr] || 0) > 0;
              const isToday = dateStr === today;
              return (
                <TouchableOpacity
                  key={dateStr}
                  onPress={() => handleToggleDay(dateStr)}
                  style={[
                    styles.dayTile,
                    done && { backgroundColor: habit.color, borderColor: habit.color },
                    isToday && !done && { borderColor: habit.color, borderWidth: 2 },
                  ]}
                >
                  <Text style={[styles.dayTileLabel, done && { color: '#fff' }]}>{label}</Text>
                  <Text style={[styles.dayTileCheck, done && { color: '#fff' }]}>
                    {done ? '✓' : '·'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 90-day heatmap */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>90-Day Activity</Text>
          <ContributionGraph
            entries={habit.entries}
            days={90}
            accentColor={habit.color}
            showLabels
            compact={false}
          />
          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendText}>Less</Text>
            {['00', '55', '88', 'BB', 'FF'].map((opacity, i) => (
              <View
                key={i}
                style={[
                  styles.legendCell,
                  {
                    backgroundColor: i === 0
                      ? mt.colors.heatmap0
                      : `${habit.color}${opacity}`,
                  },
                ]}
              />
            ))}
            <Text style={styles.legendText}>More</Text>
          </View>
        </View>

        {/* Recent activity */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {Object.keys(habit.entries)
            .filter(d => (habit.entries[d] || 0) > 0)
            .sort((a, b) => b.localeCompare(a))
            .slice(0, 10)
            .map(dateStr => {
              const date = new Date(dateStr);
              return (
                <View key={dateStr} style={styles.activityRow}>
                  <View style={[styles.activityDot, { backgroundColor: habit.color }]} />
                  <Text style={styles.activityDate}>
                    {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.activityCheck}>✓</Text>
                </View>
              );
            })}
          {Object.keys(habit.entries).filter(d => (habit.entries[d] || 0) > 0).length === 0 && (
            <Text style={styles.emptyActivity}>No entries yet — tap a day above to start!</Text>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Modal */}
      <AddHabitModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        onSave={handleEditSave}
        editHabit={habit}
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) + 8 : 8,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: mt.colors.border,
    backgroundColor: mt.colors.surface,
  },
  backBtn: { padding: 4, marginRight: 4 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: mt.colors.textPrimary, flex: 1 },
  headerActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8 },

  scroll: { padding: 16 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  categoryText: { fontSize: 12, fontWeight: '700' },
  reminderBadge: {
    backgroundColor: mt.colors.accentPink + '44',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: mt.colors.accentPink,
  },
  reminderBadgeText: { fontSize: 12, fontWeight: '700', color: mt.colors.textPink },
  freqBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: mt.colors.borderLight,
  },
  freqText: { fontSize: 12, fontWeight: '600', color: mt.colors.textSecondary },

  statsRow: {
    flexDirection: 'row',
    marginBottom: 10,
    marginHorizontal: -4,
  },

  sectionCard: {
    backgroundColor: mt.colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: mt.colors.border,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
    elevation: 3,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: mt.colors.textPrimary, marginBottom: 2 },
  sectionSub: { fontSize: 12, color: mt.colors.textSecondary, marginBottom: 12 },

  week7Row: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: mt.colors.borderLight,
    backgroundColor: mt.colors.background,
  },
  dayTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: mt.colors.textSecondary,
    marginBottom: 4,
  },
  dayTileCheck: {
    fontSize: 16,
    fontWeight: '800',
    color: mt.colors.textSecondary,
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 4,
  },
  legendText: { fontSize: 10, color: mt.colors.textSecondary },
  legendCell: { width: 12, height: 12, borderRadius: 3 },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: mt.colors.borderLight,
    gap: 10,
  },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityDate: { flex: 1, fontSize: 13, color: mt.colors.textPrimary, fontWeight: '500' },
  activityCheck: { fontSize: 14, color: mt.colors.accentGreen, fontWeight: '800' },
  emptyActivity: { fontSize: 13, color: mt.colors.textSecondary, fontStyle: 'italic', marginTop: 8 },
});
