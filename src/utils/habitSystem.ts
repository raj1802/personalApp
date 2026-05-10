// @ts-nocheck
import * as FileSystem from 'expo-file-system/legacy';
import { getHabitsDirUri } from './vaultSystem';
import { Platform } from 'react-native';

const HABITS_FILENAME = 'habits_data.json';

export interface HabitEntry {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface Habit {
  id: string;
  name: string;
  entries: Record<string, number>; // date -> count
}

const getHabitsFileUri = async () => {
  const habitsDirUri = await getHabitsDirUri();
  
  if (Platform.OS === 'android') {
    const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(habitsDirUri);
    const existing = files.find(u => decodeURIComponent(u).endsWith(HABITS_FILENAME) || decodeURIComponent(u).endsWith(`:${HABITS_FILENAME}`));
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
    if (!fileInfo.exists) {
      return [];
    }
    const content = await FileSystem.readAsStringAsync(uri, { encoding: 'utf8' });
    return content ? JSON.parse(content) : [];
  } catch (error) {
    console.error("Failed to load habits", error);
    return [];
  }
};

export const saveHabits = async (habits: Habit[]) => {
  const uri = await getHabitsFileUri();
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(habits), {
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
    // Toggle between 0 and 1
    habits[habitIndex].entries[date] = currentCount > 0 ? 0 : 1;
    await saveHabits(habits);
  }
};
