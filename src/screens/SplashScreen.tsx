// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, StatusBar, Platform,
} from 'react-native';
import { mindfulTheme as mt } from '../theme';

interface Props {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: Props) => {
  const progress = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade-in everything
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Card bounce in
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();

    // Progress bar fills over 2.4s then call onFinish
    Animated.timing(progress, {
      toValue: 1,
      duration: 2400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      onFinish();
    });
  }, []);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />

      {/* ── Top-left decorative icons ── */}
      <Animated.View style={[s.topDecor, { opacity: fadeIn }]}>
        <Text style={s.decorLines}>≡</Text>
        <Text style={s.decorPencil}>✏</Text>
      </Animated.View>

      {/* ── Center card ── */}
      <View style={s.centerArea}>
        <Animated.View style={[s.cardShadow, { transform: [{ scale: cardScale }] }]}>
          <View style={s.card}>
            <Text style={s.arrowUp}>↑</Text>
            <Text style={s.arrowDown}>↓</Text>
          </View>
        </Animated.View>

        {/* ── Title & loading ── */}
        <Animated.View style={{ opacity: fadeIn, alignItems: 'center', marginTop: 32 }}>
          <Text style={s.title}>Mindful Moments</Text>
          <Text style={s.subtitle}>Loading your journey...</Text>

          {/* Progress bar */}
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width: barWidth }]} />
          </View>
        </Animated.View>
      </View>

      {/* ── Bottom-right book icon ── */}
      <Animated.View style={[s.bottomDecor, { opacity: fadeIn }]}>
        <Text style={s.decorBook}>📖</Text>
      </Animated.View>

      {/* ── Footer text ── */}
      <Animated.View style={[s.footer, { opacity: fadeIn }]}>
        <Text style={s.footerText}>EST. 2024 • THE ART OF PRESENCE</Text>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: mt.colors.background,
    justifyContent: 'space-between',
  },

  // Top-left decorative
  topDecor: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) + 16 : 56,
    left: 24,
  },
  decorLines: { fontSize: 28, color: '#BFBAB0', lineHeight: 28 },
  decorPencil: { fontSize: 20, color: '#BFBAB0', marginTop: 4 },

  // Center
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  // Card
  cardShadow: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 0,
    elevation: 6,
  },
  card: {
    width: 180,
    height: 160,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#1A1A1A',
    backgroundColor: mt.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  arrowUp: { fontSize: 48, color: '#4A7FBD' },
  arrowDown: { fontSize: 48, color: '#8A8A8A' },

  // Text
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: mt.colors.textPrimary,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: mt.colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Progress bar
  progressTrack: {
    width: 180,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DEDBD0',
    borderWidth: 1.5,
    borderColor: '#C0BBB0',
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A7FBD',
    borderRadius: 5,
  },

  // Bottom-right book
  bottomDecor: {
    position: 'absolute',
    bottom: 60,
    right: 24,
  },
  decorBook: { fontSize: 48, opacity: 0.35 },

  // Footer
  footer: {
    paddingBottom: Platform.OS === 'android' ? 20 : 32,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#D8D3C8',
    paddingTop: 12,
    marginHorizontal: 24,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#AAAAAA',
    letterSpacing: 1.5,
  },
});
