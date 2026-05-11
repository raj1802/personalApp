// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mindfulTheme as mt } from '../theme';

type TabName = 'dashboard' | 'habits' | 'notes' | 'reoccurance';

interface BottomNavProps {
  current: TabName;
}

const TABS = [
  { name: 'dashboard' as TabName, label: 'Dashboard', icon: '⊞' },
  { name: 'habits'    as TabName, label: 'Habits',    icon: '✓' },
  { name: 'notes'     as TabName, label: 'Notes',     icon: '📄' },
  { name: 'reoccurance' as TabName, label: 'Recur',   icon: '🔄' },
];

const SCREEN_MAP: Record<TabName, string> = {
  dashboard: 'Dashboard',
  habits: 'Habits',
  notes: 'Dashboard',          // Notes tab navigates to Dashboard for now
  reoccurance: 'Reoccurance',
};

export const BottomNav = ({ current }: BottomNavProps) => {
  const navigation = useNavigation<any>();

  return (
    <View style={s.bar}>
      {TABS.map(tab => {
        const isActive = tab.name === current;
        return (
          <TouchableOpacity
            key={tab.name}
            style={[s.tab, isActive && s.activeTab]}
            onPress={() => !isActive && navigation.navigate(SCREEN_MAP[tab.name])}
            activeOpacity={0.7}
          >
            <Text style={[s.icon, isActive && s.activeIcon]}>{tab.icon}</Text>
            <Text style={[s.label, isActive && s.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: mt.colors.surface,
    borderTopWidth: 2,
    borderTopColor: mt.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: mt.borderRadius.full,
    minWidth: 64,
  },
  activeTab: {
    backgroundColor: mt.colors.accentTeal,
    borderWidth: 1.5,
    borderColor: mt.colors.border,
  },
  icon: {
    fontSize: 18,
    color: mt.colors.textSecondary,
    marginBottom: 2,
  },
  activeIcon: {
    color: mt.colors.textPrimary,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: mt.colors.textSecondary,
  },
  activeLabel: {
    color: mt.colors.textPrimary,
    fontWeight: '700',
  },
});
