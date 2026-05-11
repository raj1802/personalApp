// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { getNotesList, NoteMetadata } from '../utils/fileSystem';
import { Habit, loadHabits } from '../utils/habitSystem';
import { mindfulTheme as mt } from '../theme';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { saveNote } from '../utils/fileSystem';
import { BottomNav } from '../components/BottomNav';

// ── Helpers ────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];

function getStreakCount(habits: Habit[]): number {
  if (!habits.length) return 0;
  let streak = 0;
  const d = new Date();
  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    const anyDone = habits.some(h => (h.entries[dateStr] || 0) > 0);
    if (!anyDone) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function getHeatmapData(habits: Habit[]): Record<string, number> {
  const merged: Record<string, number> = {};
  habits.forEach(h => {
    Object.entries(h.entries).forEach(([date, count]) => {
      merged[date] = (merged[date] || 0) + count;
    });
  });
  return merged;
}

// ── Mini Heatmap (last 70 days, 10 cols × 7 rows) ─────────
const HEATMAP_DAYS = 70;
const heatColors = [mt.colors.heatmap0, mt.colors.heatmap1, mt.colors.heatmap2, mt.colors.heatmap3, mt.colors.heatmap4];

function MiniHeatmap({ data }: { data: Record<string, number> }) {
  const dates: string[] = [];
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  // build columns of 7
  const cols: string[][] = [];
  for (let c = 0; c < Math.ceil(dates.length / 7); c++) {
    cols.push(dates.slice(c * 7, c * 7 + 7));
  }
  const getColor = (v: number) => {
    if (v <= 0) return heatColors[0];
    if (v === 1) return heatColors[1];
    if (v === 2) return heatColors[2];
    if (v === 3) return heatColors[3];
    return heatColors[4];
  };
  return (
    <View style={heatStyles.grid}>
      {cols.map((col, ci) => (
        <View key={ci} style={heatStyles.col}>
          {col.map((date, di) => (
            <View key={di} style={[heatStyles.cell, { backgroundColor: getColor(data[date] || 0) }]} />
          ))}
        </View>
      ))}
    </View>
  );
}
const heatStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'nowrap' },
  col: { flexDirection: 'column', marginRight: 3 },
  cell: { width: 13, height: 13, borderRadius: 3, marginBottom: 3 },
});

// ── Progress Bar ───────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <View style={progStyles.track}>
      <View style={[progStyles.fill, { width: `${Math.min(value, 100)}%` }]} />
    </View>
  );
}
const progStyles = StyleSheet.create({
  track: { height: 14, borderRadius: 7, backgroundColor: '#EDE8D8', borderWidth: 1.5, borderColor: mt.colors.border, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: mt.colors.accentYellow, borderRadius: 7 },
});

// ── Card Wrapper (hand-drawn feel) ─────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[cardStyle.shadow, style]}>
      <View style={cardStyle.card}>{children}</View>
    </View>
  );
}
const cardStyle = StyleSheet.create({
  shadow: {
    marginBottom: 16,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 4,
  },
  card: {
    backgroundColor: mt.colors.surface,
    borderRadius: mt.borderRadius.xl,
    borderWidth: 2,
    borderColor: mt.colors.border,
    padding: 16,
    overflow: 'hidden',
  },
});

// ─────────────────────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────────────────────
export const DashboardScreen = ({ navigation }: any) => {
  const [notes, setNotes] = useState<NoteMetadata[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  const loadData = async () => {
    const [n, h] = await Promise.all([getNotesList(), loadHabits()]);
    setNotes(n);
    setHabits(h);
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation]);

  const streak = getStreakCount(habits);
  const heatmapData = getHeatmapData(habits);
  const recentNote = notes[0];
  const budgetPercent = 71; // placeholder — wire to real data later

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['text/plain', 'text/markdown'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.length) {
        const { uri, name } = result.assets[0];
        let filename = name.endsWith('.txt') ? name.replace('.txt', '.md') : name.endsWith('.md') ? name : name + '.md';
        const content = await FileSystem.readAsStringAsync(uri, { encoding: 'utf8' });
        await saveNote(filename.replace('.md', ''), content);
        loadData();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.hamburger}>☰</Text>
        <Text style={s.appTitle}>Mindful Moments</Text>
        <View style={s.avatar}>
          <Text style={{ fontSize: 18 }}>🙂</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Streak Badge ── */}
        {streak > 0 && (
          <View style={s.streakBadgeWrap}>
            <View style={s.streakBadge}>
              <Text style={s.streakText}>{streak} DAY STREAK! 🔥</Text>
            </View>
          </View>
        )}

        {/* ── Greeting Card ── */}
        <View style={[cardStyle.shadow, { marginBottom: 16 }]}>
          <View style={[cardStyle.card, s.greetCard]}>
            <Text style={s.greetTitle}>Hello, Creator!</Text>
            <Text style={s.greetSub}>Ready to track your mindful{'\n'}journey today?</Text>
          </View>
        </View>

        {/* ── Habit Heatmap Card ── */}
        <Card>
          <View style={s.cardHeaderRow}>
            <View style={s.cardTitleRow}>
              <Text style={[s.cardIcon, { color: mt.colors.accentGreen }]}>✓</Text>
              <Text style={s.cardTitle}>Habit{'\n'}Heatmap</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Habits')}>
              <Text style={s.linkText}>Continue{'\n'}Streak</Text>
            </TouchableOpacity>
          </View>
          <MiniHeatmap data={heatmapData} />
          <View style={s.heatLegend}>
            <Text style={s.legendLabel}>Less</Text>
            {heatColors.map((c, i) => (
              <View key={i} style={[s.legendCell, { backgroundColor: c }]} />
            ))}
            <Text style={s.legendLabel}>More</Text>
          </View>
        </Card>

        {/* ── Recent Notes Card ── */}
        <Card>
          <View style={s.cardHeaderRow}>
            <View style={s.cardTitleRow}>
              <Text style={[s.cardIcon, { color: mt.colors.textCoral }]}>📄</Text>
              <Text style={[s.cardTitle, { color: mt.colors.textCoral }]}>Recent Notes</Text>
            </View>
            <TouchableOpacity onPress={() => recentNote && navigation.navigate('NoteEditor', { uri: recentNote.uri, filename: recentNote.filename })}>
              <Text style={{ fontSize: 18 }}>✏️</Text>
            </TouchableOpacity>
          </View>
          {recentNote ? (
            <TouchableOpacity onPress={() => navigation.navigate('NoteEditor', { uri: recentNote.uri, filename: recentNote.filename })}>
              <View style={s.noteDateRow}>
                <Text style={s.noteIcon}>≡</Text>
                <Text style={s.noteDate}>{new Date(recentNote.updatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}</Text>
              </View>
              <Text style={s.notePreview} numberOfLines={3}>
                "{recentNote.title}"
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.emptyText}>No notes yet. Tap ✏️ to create one.</Text>
          )}
        </Card>

        {/* ── Budget Summary Card ── */}
        <Card>
          <View style={s.cardHeaderRow}>
            <View style={s.cardTitleRow}>
              <Text style={[s.cardIcon, { color: mt.colors.accentYellow }]}>💰</Text>
              <Text style={[s.cardTitle, { color: mt.colors.textGold }]}>Budget{'\n'}Summary</Text>
            </View>
            <Text style={s.budgetAmount}>$142.50</Text>
          </View>
          <View style={s.budgetMeta}>
            <Text style={s.budgetLabel}>Spent this week</Text>
            <Text style={s.budgetGoal}>{budgetPercent}% of Goal</Text>
          </View>
          <ProgressBar value={budgetPercent} />
        </Card>

        {/* ── Log New Entry CTA ── */}
        <TouchableOpacity style={s.ctaButton} onPress={() => navigation.navigate('NoteEditor')} activeOpacity={0.85}>
          <Text style={s.ctaIcon}>⊕</Text>
          <Text style={s.ctaText}>Log New Entry</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Floating Import Star Button ── */}
      <TouchableOpacity style={s.starBtn} onPress={handleImport}>
        <Text style={{ fontSize: 20 }}>⭐</Text>
      </TouchableOpacity>

      <BottomNav current="dashboard" />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: mt.colors.background },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 16 : 8, paddingBottom: 12 },
  hamburger: { fontSize: 22, color: mt.colors.textPrimary },
  appTitle: { fontSize: 22, fontWeight: '800', color: mt.colors.accentGreen, letterSpacing: -0.5 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: mt.colors.accentTeal, borderWidth: 2, borderColor: mt.colors.border, alignItems: 'center', justifyContent: 'center' },

  // Streak badge
  streakBadgeWrap: { alignItems: 'flex-end', marginRight: 20, marginBottom: 8 },
  streakBadge: { backgroundColor: '#FFB3C6', borderRadius: 20, borderWidth: 1.5, borderColor: mt.colors.border, paddingHorizontal: 14, paddingVertical: 5 },
  streakText: { fontSize: 12, fontWeight: '700', color: '#8B003A', letterSpacing: 0.5 },

  // Greeting card
  greetCard: { backgroundColor: mt.colors.surfaceYellow },
  greetTitle: { fontSize: 22, fontWeight: '800', color: mt.colors.accentGreen, marginBottom: 6 },
  greetSub: { fontSize: 15, color: mt.colors.textPrimary, lineHeight: 22 },

  // Card header rows
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  cardIcon: { fontSize: 18, marginRight: 6, marginTop: 2 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: mt.colors.textPrimary, lineHeight: 24 },
  linkText: { fontSize: 12, fontWeight: '600', color: mt.colors.textSecondary, textAlign: 'right', lineHeight: 18 },

  // Heatmap legend
  heatLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8 },
  legendLabel: { fontSize: 11, color: mt.colors.textSecondary, marginHorizontal: 4 },
  legendCell: { width: 11, height: 11, borderRadius: 2, marginHorizontal: 2 },

  // Notes
  noteDateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  noteIcon: { fontSize: 14, color: mt.colors.textSecondary, marginRight: 6 },
  noteDate: { fontSize: 11, fontWeight: '600', color: mt.colors.textSecondary, letterSpacing: 0.5 },
  notePreview: { fontSize: 14, color: mt.colors.textPrimary, fontStyle: 'italic', lineHeight: 21 },

  // Budget
  budgetAmount: { fontSize: 22, fontWeight: '800', color: mt.colors.textPrimary },
  budgetMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetLabel: { fontSize: 12, color: mt.colors.textSecondary },
  budgetGoal: { fontSize: 12, fontWeight: '700', color: '#C47D00' },

  // Empty
  emptyText: { fontSize: 13, color: mt.colors.textSecondary, fontStyle: 'italic' },

  // Scroll
  scroll: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 100 },

  // CTA button
  ctaButton: {
    backgroundColor: mt.colors.accentTeal,
    borderRadius: mt.borderRadius.xl,
    borderWidth: 2,
    borderColor: mt.colors.border,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  ctaIcon: { fontSize: 30, color: mt.colors.textPrimary, marginBottom: 4 },
  ctaText: { fontSize: 20, fontWeight: '800', color: mt.colors.textPrimary, letterSpacing: 0.5 },

  // Floating star
  starBtn: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: mt.colors.accentYellow,
    borderWidth: 2,
    borderColor: mt.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 5,
  },
});
