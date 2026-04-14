import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';

export type StatTab =
  | 'page-stats'
  | 'time-stats'
  | 'emotion-stats'
  | 'progress-stats'
  | 'books-read'
  | 'genres'
  | 'ratings'
  | 'authors'
  | 'format'
  | 'publication'
  | 'book-attributes';

interface StatsTabsProps {
  activeStat: StatTab;
  setActiveStat: (tab: StatTab) => void;
}

const TABS: { key: StatTab; label: string; icon: string }[] = [
  { key: 'page-stats',      label: 'Pages',      icon: 'book-outline' },
  // { key: 'time-stats',      label: 'Time',       icon: 'time-outline' },
  { key: 'emotion-stats',   label: 'Emotions',   icon: 'heart-outline' },
  { key: 'progress-stats',  label: 'Progress',   icon: 'stats-chart-outline' },
  { key: 'books-read',      label: 'Books Read', icon: 'checkmark-circle-outline' },
  { key: 'genres',          label: 'Genres',     icon: 'library-outline' },
  { key: 'ratings',         label: 'Ratings',    icon: 'star-outline' },
  { key: 'authors',         label: 'Authors',    icon: 'person-outline' },
  { key: 'format',          label: 'Format',     icon: 'phone-portrait-outline' },
  { key: 'publication',     label: 'Era',        icon: 'calendar-outline' },
  { key: 'book-attributes', label: 'Type',       icon: 'layers-outline' },
];

const StatsTabs: React.FC<StatsTabsProps> = ({ activeStat, setActiveStat }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabContainer}
    >
      {TABS.map(tab => {
        const isActive = activeStat === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, isActive && styles.activeTab]}
            onPress={() => setActiveStat(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={isActive ? COLORS.primaryOrangeHex : COLORS.primaryWhiteHex}
            />
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default StatsTabs;

const createStyles = (COLORS: any) => StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    marginVertical: SPACING.space_16,
    padding: SPACING.space_4,
    gap: SPACING.space_4,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_10,
    paddingHorizontal: SPACING.space_12,
    flexDirection: 'column',
    borderRadius: BORDERRADIUS.radius_8,
  },
  activeTab: {
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_8,
  },
  tabText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    marginTop: SPACING.space_4,
  },
  activeTabText: {
    color: COLORS.primaryOrangeHex,
  },
});