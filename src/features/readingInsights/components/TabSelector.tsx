import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

const TabSelector = ({ activeTab, setActiveTab }) => {
  return (
    <View style={styles.tabs}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'streaks' && styles.activeTab
        ]}
        onPress={() => setActiveTab('streaks')}
      >
        <Text style={styles.tabText}>Streaks</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === 'pages' && styles.activeTab
        ]}
        onPress={() => setActiveTab('pages')}
      >
        <Text style={styles.tabText}>Pages</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: SPACING.space_15,
  },
  tabButton: {
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_10,
    borderRadius: 20,
    marginHorizontal: SPACING.space_10,
  },
  tabText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  activeTab: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
});

export default TabSelector;