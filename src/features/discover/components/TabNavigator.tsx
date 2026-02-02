import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

const TabNavigator = ({ activeTab, setActiveTab, type }) => {
  return (
    <View style={styles.TabBar}>
      <TouchableOpacity 
        onPress={() => setActiveTab('description')} 
        style={[styles.TabButton, activeTab === 'description' && styles.TabButtonActive]}
      >
        <Text style={[styles.TabLabel, activeTab === 'description' && styles.TabLabelActive]}>
          Description
        </Text>
      </TouchableOpacity>
      
      {type !== 'Bookmark' && (
        <>
          <TouchableOpacity 
            onPress={() => setActiveTab('reviews')} 
            style={[styles.TabButton, activeTab === 'reviews' && styles.TabButtonActive]}
          >
            <Text style={[styles.TabLabel, activeTab === 'reviews' && styles.TabLabelActive]}>
              Reviews
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setActiveTab('read-together')} 
            style={[styles.TabButton, activeTab === 'read-together' && styles.TabButtonActive]}
          >
            <Text style={[styles.TabLabel, activeTab === 'read-together' && styles.TabLabelActive]}>
              Read Together
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  TabBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: SPACING.space_8,
  },
  TabButton: {
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
  },
  TabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primaryOrangeHex,
  },
  TabLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  TabLabelActive: {
    color: COLORS.primaryOrangeHex,
  },
});

export default TabNavigator;