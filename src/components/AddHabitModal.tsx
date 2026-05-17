// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Modal, ScrollView, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { mindfulTheme as mt } from '../theme';
import { Habit } from '../utils/habitSystem';
import { X, Check } from 'lucide-react-native';

// ─── Preset options ─────────────────────────────────────────

const EMOJIS = [
  '🏃', '💪', '🧘', '📚', '✍️', '💧', '😴', '🥗',
  '🎯', '🧹', '💊', '🚴', '🎨', '🎵', '💻', '🌿',
  '☀️', '🙏', '❤️', '⭐',
];

const COLORS = [
  '#4DD9AC', // teal
  '#2A6B4F', // green
  '#F5C842', // yellow
  '#E8634A', // coral
  '#A78BFA', // violet
  '#60A5FA', // blue
];

const CATEGORIES = ['Health', 'Fitness', 'Learning', 'Mindfulness', 'Personal', 'Work'];

// ─── Default state ──────────────────────────────────────────

const DEFAULT_FORM = {
  name: '',
  emoji: '🏃',
  color: '#4DD9AC',
  category: 'Health',
  frequency: 'daily' as 'daily' | 'weekly',
  targetDaysPerWeek: 7,
  reminderEnabled: false,
  reminderTime: '08:00',
};

// ─── Props ──────────────────────────────────────────────────

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: typeof DEFAULT_FORM) => void;
  editHabit?: Habit | null;  // when editing an existing habit
}

// ─── Component ──────────────────────────────────────────────

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  visible, onClose, onSave, editHabit,
}) => {
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (editHabit) {
      setForm({
        name: editHabit.name,
        emoji: editHabit.emoji,
        color: editHabit.color,
        category: editHabit.category,
        frequency: editHabit.frequency,
        targetDaysPerWeek: editHabit.targetDaysPerWeek,
        reminderEnabled: editHabit.reminderEnabled,
        reminderTime: editHabit.reminderTime,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [editHabit, visible]);

  const set = (key: keyof typeof DEFAULT_FORM, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please give your habit a name.');
      return;
    }
    onSave(form);
  };

  // ── Time picker helpers ─────────────────────────────────
  const [hour, minute] = form.reminderTime.split(':').map(Number);

  const adjustTime = (type: 'hour' | 'minute', delta: number) => {
    if (type === 'hour') {
      const newHour = ((hour + delta + 24) % 24).toString().padStart(2, '0');
      set('reminderTime', `${newHour}:${form.reminderTime.split(':')[1]}`);
    } else {
      const newMin = ((minute + delta + 60) % 60).toString().padStart(2, '0');
      set('reminderTime', `${form.reminderTime.split(':')[0]}:${newMin}`);
    }
  };

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display} ${period}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrapper}
        >
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editHabit ? '✏️ Edit Habit' : '✨ New Habit'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={mt.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

              {/* Name */}
              <Text style={styles.label}>Name</Text>
              <View style={styles.nameRow}>
                <TouchableOpacity
                  style={[styles.emojiDisplay, { borderColor: form.color }]}
                  onPress={() => {/* emoji picker opens below */}}
                >
                  <Text style={styles.emojiText}>{form.emoji}</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.nameInput}
                  placeholder="e.g. Morning Run"
                  placeholderTextColor={mt.colors.textSecondary}
                  value={form.name}
                  onChangeText={v => set('name', v)}
                  maxLength={40}
                />
              </View>

              {/* Emoji Picker */}
              <Text style={styles.label}>Icon</Text>
              <View style={styles.emojiGrid}>
                {EMOJIS.map(e => (
                  <TouchableOpacity
                    key={e}
                    style={[
                      styles.emojiOption,
                      form.emoji === e && { backgroundColor: form.color + '44', borderColor: form.color },
                    ]}
                    onPress={() => set('emoji', e)}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color Picker */}
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorRow}>
                {COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      form.color === c && styles.colorSwatchSelected,
                    ]}
                    onPress={() => set('color', c)}
                  >
                    {form.color === c && <Check size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category */}
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      form.category === cat && { backgroundColor: form.color, borderColor: form.color },
                    ]}
                    onPress={() => set('category', cat)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        form.category === cat && { color: '#fff', fontWeight: '700' },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Frequency */}
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.freqRow}>
                {(['daily', 'weekly'] as const).map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.freqBtn,
                      form.frequency === f && { backgroundColor: form.color, borderColor: form.color },
                    ]}
                    onPress={() => set('frequency', f)}
                  >
                    <Text
                      style={[
                        styles.freqBtnText,
                        form.frequency === f && { color: '#fff' },
                      ]}
                    >
                      {f === 'daily' ? '📅 Daily' : '📆 Weekly'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.frequency === 'weekly' && (
                <View style={styles.targetRow}>
                  <Text style={styles.targetLabel}>Target days per week</Text>
                  <View style={styles.targetStepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => set('targetDaysPerWeek', Math.max(1, form.targetDaysPerWeek - 1))}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepValue}>{form.targetDaysPerWeek}×</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => set('targetDaysPerWeek', Math.min(7, form.targetDaysPerWeek + 1))}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Reminder */}
              <View style={styles.reminderRow}>
                <View>
                  <Text style={styles.label}>Daily Reminder</Text>
                  <Text style={styles.reminderSub}>Get a notification to keep your streak</Text>
                </View>
                <Switch
                  value={form.reminderEnabled}
                  onValueChange={v => set('reminderEnabled', v)}
                  trackColor={{ false: mt.colors.heatmap0, true: form.color }}
                  thumbColor="#fff"
                />
              </View>

              {form.reminderEnabled && (
                <View style={styles.timePicker}>
                  {/* Hour */}
                  <View style={styles.timeColumn}>
                    <TouchableOpacity style={styles.timeArrow} onPress={() => adjustTime('hour', 1)}>
                      <Text style={styles.timeArrowText}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{formatHour(hour)}</Text>
                    <TouchableOpacity style={styles.timeArrow} onPress={() => adjustTime('hour', -1)}>
                      <Text style={styles.timeArrowText}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.timeSep}>:</Text>

                  {/* Minute */}
                  <View style={styles.timeColumn}>
                    <TouchableOpacity style={styles.timeArrow} onPress={() => adjustTime('minute', 5)}>
                      <Text style={styles.timeArrowText}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{minute.toString().padStart(2, '0')}</Text>
                    <TouchableOpacity style={styles.timeArrow} onPress={() => adjustTime('minute', -5)}>
                      <Text style={styles.timeArrowText}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </ScrollView>

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: form.color }]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>
                {editHabit ? '💾 Save Changes' : '✨ Create Habit'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: mt.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 2,
    borderColor: mt.colors.border,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'android' ? 24 : 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: mt.colors.borderLight,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: mt.colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: mt.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emojiDisplay: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mt.colors.surface,
  },
  emojiText: {
    fontSize: 22,
  },
  nameInput: {
    flex: 1,
    height: 46,
    borderWidth: 2,
    borderColor: mt.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
    color: mt.colors.textPrimary,
    backgroundColor: mt.colors.surface,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiOption: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: mt.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mt.colors.surface,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: mt.colors.border,
    transform: [{ scale: 1.15 }],
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: mt.colors.border,
    marginRight: 8,
    backgroundColor: mt.colors.surface,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: mt.colors.textPrimary,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 10,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: mt.colors.border,
    alignItems: 'center',
    backgroundColor: mt.colors.surface,
  },
  freqBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: mt.colors.textPrimary,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: mt.colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: mt.colors.borderLight,
    padding: 12,
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: mt.colors.textPrimary,
  },
  targetStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: mt.colors.border,
    backgroundColor: mt.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: mt.colors.textPrimary,
  },
  stepValue: {
    fontSize: 16,
    fontWeight: '800',
    color: mt.colors.textPrimary,
    minWidth: 28,
    textAlign: 'center',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    backgroundColor: mt.colors.surfaceYellow,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: mt.colors.borderLight,
    padding: 14,
  },
  reminderSub: {
    fontSize: 12,
    color: mt.colors.textSecondary,
    marginTop: 2,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    backgroundColor: mt.colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: mt.colors.borderLight,
    padding: 16,
    gap: 8,
  },
  timeColumn: {
    alignItems: 'center',
    gap: 8,
  },
  timeArrow: {
    padding: 8,
  },
  timeArrowText: {
    fontSize: 16,
    color: mt.colors.textSecondary,
    fontWeight: '700',
  },
  timeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: mt.colors.textPrimary,
    minWidth: 70,
    textAlign: 'center',
  },
  timeSep: {
    fontSize: 26,
    fontWeight: '800',
    color: mt.colors.textSecondary,
    marginBottom: 4,
  },
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: mt.colors.border,
    alignItems: 'center',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
