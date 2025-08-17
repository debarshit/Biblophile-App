import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

interface Tab {
  key: string;
  label: string;
}

interface TabSelectorProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs?: Tab[];
  containerStyle?: ViewStyle;
  tabButtonStyle?: ViewStyle;
  activeTabStyle?: ViewStyle;
  tabTextStyle?: TextStyle;
}

const TabSelector: React.FC<TabSelectorProps> = ({ 
  activeTab, 
  setActiveTab, 
  tabs = [
    { key: 'streaks', label: 'Streaks' },
    { key: 'pages', label: 'Pages' }
  ],
  containerStyle,
  tabButtonStyle,
  activeTabStyle,
  tabTextStyle
}) => {
  return (
    <View style={[styles.tabs, containerStyle]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            tabButtonStyle,
            activeTab === tab.key && styles.activeTab,
            activeTab === tab.key && activeTabStyle
          ]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Text style={[styles.tabText, tabTextStyle]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: SPACING.space_15,
    zIndex: -1,
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