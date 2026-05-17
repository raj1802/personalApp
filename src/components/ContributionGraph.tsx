// @ts-nocheck
import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { mindfulTheme as mt } from '../theme';

interface ContributionGraphProps {
  entries: Record<string, number>;
  days?: number;
  accentColor?: string;    // per-habit color — defaults to green
  showLabels?: boolean;    // show month + day-of-week axis labels
  compact?: boolean;       // use smaller cells (list view)
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  entries,
  days = 90,
  accentColor,
  showLabels = false,
  compact = false,
}) => {
  const cellSize = compact ? 11 : 14;
  const cellGap = compact ? 3 : 4;

  const today = new Date();
  const dates: Date[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }

  // Group into week columns, padded to start on Sunday
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  const firstDayOfWeek = dates[0].getDay();
  for (let i = 0; i < firstDayOfWeek; i++) currentWeek.push(null);

  dates.forEach(date => {
    currentWeek.push(date);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  // Build month labels — one label per column where month changes
  const monthLabels: { colIndex: number; label: string }[] = [];
  if (showLabels) {
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstRealDay = week.find(d => d !== null);
      if (firstRealDay) {
        const m = firstRealDay.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ colIndex: wi, label: MONTH_NAMES[m] });
          lastMonth = m;
        }
      }
    });
  }

  const getColor = (count: number): string => {
    if (count <= 0) return mt.colors.heatmap0;
    const base = accentColor || mt.colors.accentTeal;
    // Build opacity levels from the accent color
    if (count === 1) return `${base}55`;
    if (count === 2) return `${base}88`;
    if (count === 3) return `${base}BB`;
    return base;
  };

  return (
    <View style={styles.wrapper}>
      {showLabels && (
        <View style={[styles.monthRow, { marginLeft: showLabels ? cellSize + cellGap : 0 }]}>
          {weeks.map((_, wi) => {
            const label = monthLabels.find(m => m.colIndex === wi);
            return (
              <View key={`ml-${wi}`} style={{ width: cellSize + cellGap }}>
                {label ? (
                  <Text style={styles.monthLabel}>{label.label}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.graphRow}>
        {showLabels && (
          <View style={[styles.dayLabelCol, { gap: cellGap }]}>
            {DAYS_OF_WEEK.map((d, i) => (
              <View key={i} style={{ height: cellSize, justifyContent: 'center' }}>
                {i % 2 === 1 ? (
                  <Text style={styles.dayLabel}>{d}</Text>
                ) : (
                  <Text style={[styles.dayLabel, { opacity: 0 }]}>{d}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.grid}>
            {weeks.map((week, wIndex) => (
              <View key={`week-${wIndex}`} style={[styles.column, { gap: cellGap, marginRight: cellGap }]}>
                {week.map((date, dIndex) => {
                  if (!date) {
                    return (
                      <View
                        key={`empty-${wIndex}-${dIndex}`}
                        style={[styles.cell, { width: cellSize, height: cellSize }]}
                      />
                    );
                  }
                  const dateStr = date.toISOString().split('T')[0];
                  const count = entries[dateStr] || 0;
                  const isToday = dateStr === today.toISOString().split('T')[0];
                  return (
                    <View
                      key={dateStr}
                      style={[
                        styles.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: getColor(count),
                          borderWidth: isToday ? 1.5 : 0,
                          borderColor: isToday ? mt.colors.border : 'transparent',
                          borderRadius: compact ? 2 : 3,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  monthRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  monthLabel: {
    fontSize: 9,
    color: mt.colors.textSecondary,
    fontWeight: '600',
  },
  graphRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dayLabelCol: {
    flexDirection: 'column',
    marginRight: 4,
    paddingTop: 0,
  },
  dayLabel: {
    fontSize: 9,
    color: mt.colors.textSecondary,
    fontWeight: '600',
    lineHeight: 11,
  },
  scrollContainer: {
    paddingVertical: 2,
  },
  grid: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  cell: {
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
});
