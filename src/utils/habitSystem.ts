// @ts-nocheck
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import { getHabitsDirUri } from './vaultSystem';
import { Platform } from 'react-native';

const HABITS_FILENAME = 'habits_data.json';

// ─── Interfaces ────────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  emoji: string;               // e.g. "🏃"
  color: string;               // accent hex e.g. "#4DD9AC"
  category: string;            // "Health" | "Learning" | "Fitness" | "Mindfulness" | "Personal" | "Work"
  frequency: 'daily' | 'weekly';
  targetDaysPerWeek: number;   // 1–7
  entries: Record<string, number>; // date "YYYY-MM-DD" → count (0 or 1+)
  createdAt: string;           // ISO string
  archived: boolean;
  reminderEnabled: boolean;
  reminderTime: string;        // "HH:MM" 24h
  notificationId?: string;     // stored to cancel/reschedule
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  completionRate: number;      // 0–100
  weeklyAvg: number;           // avg days per week over last 4 weeks
}

// ─── File I/O ──────────────────────────────────────────────

const getHabitsFileUri = async () => {
  const habitsDirUri = await getHabitsDirUri();

  if (Platform.OS === 'android') {
    const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(habitsDirUri);
    const existing = files.find(
      u => decodeURIComponent(u).endsWith(HABITS_FILENAME) || decodeURIComponent(u).endsWith(`:${HABITS_FILENAME}`)
    );
    if (existing) return existing;
    return await FileSystem.StorageAccessFramework.createFileAsync(habitsDirUri, HABITS_FILENAME, 'application/json');
  } else {
    return `${habitsDirUri}${HABITS_FILENAME}`;
  }
};

export const loadHabits = async (): Promise<Habit[]> => {
  try {
    const uri = await getHabitsFileUri();
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) return [];
    const content = await FileSystem.readAsStringAsync(uri, { encoding: 'utf8' });
    return content ? JSON.parse(content) : [];
  } catch (error) {
    console.error('Failed to load habits', error);
    return [];
  }
};

export const saveHabits = async (habits: Habit[]) => {
  const uri = await getHabitsFileUri();
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(habits), { encoding: 'utf8' });
};

// ─── CRUD ──────────────────────────────────────────────────

export const createHabit = async (params: {
  name: string;
  emoji: string;
  color: string;
  category: string;
  frequency: 'daily' | 'weekly';
  targetDaysPerWeek: number;
  reminderEnabled: boolean;
  reminderTime: string;
}): Promise<Habit> => {
  const habits = await loadHabits();
  const newHabit: Habit = {
    id: Date.now().toString(),
    name: params.name,
    emoji: params.emoji,
    color: params.color,
    category: params.category,
    frequency: params.frequency,
    targetDaysPerWeek: params.targetDaysPerWeek,
    entries: {},
    createdAt: new Date().toISOString(),
    archived: false,
    reminderEnabled: params.reminderEnabled,
    reminderTime: params.reminderTime,
  };

  if (newHabit.reminderEnabled) {
    const notifId = await scheduleHabitReminder(newHabit);
    if (notifId) newHabit.notificationId = notifId;
  }

  habits.push(newHabit);
  await saveHabits(habits);
  return newHabit;
};

export const updateHabit = async (
  id: string,
  updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'entries'>>
): Promise<void> => {
  const habits = await loadHabits();
  const idx = habits.findIndex(h => h.id === id);
  if (idx === -1) return;

  const old = habits[idx];

  // Handle notification changes
  if (old.notificationId) {
    await cancelHabitReminder(old.notificationId);
  }

  const updated: Habit = { ...old, ...updates };

  if (updated.reminderEnabled) {
    const notifId = await scheduleHabitReminder(updated);
    if (notifId) updated.notificationId = notifId;
    else updated.notificationId = undefined;
  } else {
    updated.notificationId = undefined;
  }

  habits[idx] = updated;
  await saveHabits(habits);
};

export const deleteHabit = async (id: string): Promise<void> => {
  const habits = await loadHabits();
  const habit = habits.find(h => h.id === id);
  if (habit?.notificationId) {
    await cancelHabitReminder(habit.notificationId);
  }
  await saveHabits(habits.filter(h => h.id !== id));
};

export const archiveHabit = async (id: string): Promise<void> => {
  await updateHabit(id, { archived: true, reminderEnabled: false });
};

// ─── Log Entries ───────────────────────────────────────────

/** Toggle a single date for a habit (0 ↔ 1). Used from list screen for today. */
export const toggleHabit = async (habitId: string, date: string): Promise<void> => {
  const habits = await loadHabits();
  const idx = habits.findIndex(h => h.id === habitId);
  if (idx === -1) return;
  const current = habits[idx].entries[date] || 0;
  habits[idx].entries[date] = current > 0 ? 0 : 1;
  await saveHabits(habits);
};

/** Set the count for any date (used from detail screen for past-date editing). */
export const logHabitEntry = async (habitId: string, date: string, count: number): Promise<void> => {
  const habits = await loadHabits();
  const idx = habits.findIndex(h => h.id === habitId);
  if (idx === -1) return;
  if (count <= 0) {
    delete habits[idx].entries[date];
  } else {
    habits[idx].entries[date] = count;
  }
  await saveHabits(habits);
};

// ─── Stats ─────────────────────────────────────────────────

export const getHabitStats = (habit: Habit): HabitStats => {
  const today = new Date();

  // Current streak — count backward from today
  let currentStreak = 0;
  const d = new Date(today);
  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    const done = (habit.entries[dateStr] || 0) > 0;
    if (!done) {
      // Allow today to be incomplete without breaking streak
      if (dateStr === today.toISOString().split('T')[0] && currentStreak === 0) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
    currentStreak++;
    d.setDate(d.getDate() - 1);
  }

  // Best streak — scan all logged dates
  const allDates = Object.keys(habit.entries)
    .filter(date => (habit.entries[date] || 0) > 0)
    .sort();

  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: string | null = null;

  for (const dateStr of allDates) {
    if (prevDate) {
      const prev = new Date(prevDate);
      const curr = new Date(dateStr);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    prevDate = dateStr;
  }
  bestStreak = Math.max(bestStreak, tempStreak);

  // Total days completed
  const totalDays = allDates.length;

  // Completion rate — (days done / days since creation, capped at today)
  const created = new Date(habit.createdAt);
  const daysSinceCreation = Math.max(
    1,
    Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const completionRate = Math.round((totalDays / daysSinceCreation) * 100);

  // Weekly avg over last 4 weeks (28 days)
  let last28Count = 0;
  for (let i = 0; i < 28; i++) {
    const dd = new Date(today);
    dd.setDate(dd.getDate() - i);
    const dateStr = dd.toISOString().split('T')[0];
    if ((habit.entries[dateStr] || 0) > 0) last28Count++;
  }
  const weeklyAvg = parseFloat((last28Count / 4).toFixed(1));

  return { currentStreak, bestStreak, totalDays, completionRate, weeklyAvg };
};

/** Merged heatmap data for dashboard (all habits combined) */
export const getHeatmapData = (habits: Habit[]): Record<string, number> => {
  const merged: Record<string, number> = {};
  habits.forEach(h => {
    Object.entries(h.entries).forEach(([date, count]) => {
      merged[date] = (merged[date] || 0) + count;
    });
  });
  return merged;
};

/** Global streak: consecutive days where at least one habit was done */
export const getGlobalStreak = (habits: Habit[]): number => {
  if (!habits.length) return 0;
  const today = new Date();
  let streak = 0;
  const d = new Date(today);
  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    const anyDone = habits.some(h => (h.entries[dateStr] || 0) > 0);
    if (!anyDone) {
      if (dateStr === today.toISOString().split('T')[0] && streak === 0) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
};

// ─── Notifications ─────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleHabitReminder = async (habit: Habit): Promise<string | null> => {
  try {
    const [hourStr, minuteStr] = habit.reminderTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (isNaN(hour) || isNaN(minute)) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${habit.emoji} Time for ${habit.name}!`,
        body: "Don't break your streak — tap to log your habit.",
        data: { habitId: habit.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return id;
  } catch (e) {
    console.error('Failed to schedule notification', e);
    return null;
  }
};

export const cancelHabitReminder = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.error('Failed to cancel notification', e);
  }
};
