import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';

interface StatsTabsProps {
  activeStat: string;
  setActiveStat: (stat: string) => void;
}

const StatsTabs: React.FC<StatsTabsProps> = ({ activeStat, setActiveStat }) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tabButton, activeStat === 'page-stats' ? styles.activeTab : null]}
        onPress={() => setActiveStat('page-stats')}>
        <Ionicons name="book-outline" size={24} color={activeStat === 'page-stats' ? COLORS.primaryOrangeHex : COLORS.primaryWhiteHex} />
        <Text style={[styles.tabText, activeStat === 'page-stats' ? styles.activeTabText : null]}>Page Stats</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeStat === 'time-stats' ? styles.activeTab : null]}
        onPress={() => setActiveStat('time-stats')}>
        <Ionicons name="time-outline" size={24} color={activeStat === 'time-stats' ? COLORS.primaryOrangeHex : COLORS.primaryWhiteHex} />
        <Text style={[styles.tabText, activeStat === 'time-stats' ? styles.activeTabText : null]}>Time Stats</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeStat === 'emotion-stats' ? styles.activeTab : null]}
        onPress={() => setActiveStat('emotion-stats')}>
        <Ionicons name="heart-outline" size={24} color={activeStat === 'emotion-stats' ? COLORS.primaryOrangeHex : COLORS.primaryWhiteHex} />
        <Text style={[styles.tabText, activeStat === 'emotion-stats' ? styles.activeTabText : null]}>Emotions</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeStat === 'progress-stats' ? styles.activeTab : null]}
        onPress={() => setActiveStat('progress-stats')}>
        <Ionicons name="stats-chart-outline" size={24} color={activeStat === 'progress-stats' ? COLORS.primaryOrangeHex : COLORS.primaryWhiteHex} />
        <Text style={[styles.tabText, activeStat === 'progress-stats' ? styles.activeTabText : null]}>Progress</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StatsTabs;

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    marginVertical: SPACING.space_16,
    padding: SPACING.space_4,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_10,
    flexDirection: 'column',
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