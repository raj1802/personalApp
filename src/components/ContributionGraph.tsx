import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { theme } from '../theme';

interface ContributionGraphProps {
  entries: Record<string, number>; // date "YYYY-MM-DD" -> count
  days: number; // how many days to show
}

export const ContributionGraph: React.FC<ContributionGraphProps> = ({ entries, days = 90 }) => {
  // Generate the last N days
  const today = new Date();
  const dates = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }

  // Group by weeks
  // A column is a week. We need an array of weeks, where each week is an array of 7 days.
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  // Pad the first week to align to Sunday
  const firstDayOfWeek = dates[0].getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(new Date(0)); // placeholder invalid date
  }

  dates.forEach(date => {
    currentWeek.push(date);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  if (currentWeek.length > 0) {
    // Pad the last week
    while (currentWeek.length < 7) {
      currentWeek.push(new Date(0));
    }
    weeks.push(currentWeek);
  }

  const getColor = (count: number) => {
    if (count === 0) return theme.colors.border;
    // SaaS aesthetic green
    if (count === 1) return '#9BE9A8';
    if (count === 2) return '#40C463';
    if (count === 3) return '#30A14E';
    return '#216E39'; // max
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
      <View style={styles.grid}>
        {weeks.map((week, wIndex) => (
          <View key={`week-${wIndex}`} style={styles.column}>
            {week.map((date, dIndex) => {
              if (date.getTime() === 0) {
                return <View key={`empty-${wIndex}-${dIndex}`} style={[styles.cell, styles.emptyCell]} />;
              }
              const dateStr = date.toISOString().split('T')[0];
              const count = entries[dateStr] || 0;
              return (
                <View 
                  key={dateStr} 
                  style={[styles.cell, { backgroundColor: getColor(count) }]} 
                />
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: theme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
    marginRight: 4,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginBottom: 4,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  }
});
