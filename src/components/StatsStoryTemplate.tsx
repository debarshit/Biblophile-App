import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FONTFAMILY } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';

// 9:16 story aspect ratio at a resolution view-shot can capture cleanly on device
const STORY_WIDTH  = 390;   // matches typical phone screen width
const STORY_HEIGHT = 693;   // 390 * (16/9)

interface StatsStoryTemplateProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

const StatsStoryTemplate = forwardRef<View, StatsStoryTemplateProps>(
  ({ title = 'My Reading Stats', subtitle, children }, ref) => {
    const { COLORS } = useTheme();

    return (
      <View
        ref={ref}
        collapsable={false}
        renderToHardwareTextureAndroid
        needsOffscreenAlphaCompositing
        style={[styles.container, { backgroundColor: '#0F1117' }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.brand, { color: '#FF7E5F' }]}>biblophile</Text>
          {subtitle ? (
            <View style={[styles.badge, { backgroundColor: '#1E1E30' }]}>
              <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>{subtitle}</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.title, { color: '#FFFFFF' }]}>{title}</Text>

        {/* Stat content — whatever component is passed in */}
        <View style={styles.content}>
          {children}
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: '#444455' }]}>biblophile.com</Text>
      </View>
    );
  },
);

export default StatsStoryTemplate;

const styles = StyleSheet.create({
  container: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: 12,
  },
  title: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: 26,
    marginTop: 8,
    marginBottom: 4,
  },
  content: {
    flex: 1,
    marginVertical: 12,
    justifyContent: 'center',
  },
  footer: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 1,
  },
});