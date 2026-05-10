import * as FileSystem from 'expo-file-system/legacy';

const HABITS_FILE = `${FileSystem.documentDirectory}habits_data.json`;

export interface HabitEntry {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface Habit {
  id: string;
  name: string;
  entries: Record<string, number>; // date -> count
}

export const loadHabits = async (): Promise<Habit[]> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(HABITS_FILE);
    if (!fileInfo.exists) {
      // Default empty habits
      return [];
    }
    const content = await FileSystem.readAsStringAsync(HABITS_FILE);
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to load habits", error);
    return [];
  }
};

export const saveHabits = async (habits: Habit[]) => {
  await FileSystem.writeAsStringAsync(HABITS_FILE, JSON.stringify(habits), {
    encoding: 'utf8'
  });
};

export const createHabit = async (name: string) => {
  const habits = await loadHabits();
  const newHabit: Habit = {
    id: Date.now().toString(),
    name,
    entries: {}
  };
  habits.push(newHabit);
  await saveHabits(habits);
  return newHabit;
};

export const toggleHabit = async (habitId: string, date: string) => {
  const habits = await loadHabits();
  const habitIndex = habits.findIndex(h => h.id === habitId);
  
  if (habitIndex > -1) {
    const currentCount = habits[habitIndex].entries[date] || 0;
    // Toggle between 0 and 1 (or we can increment for more github-like)
    habits[habitIndex].entries[date] = currentCount > 0 ? 0 : 1;
    await saveHabits(habits);
  }
};
