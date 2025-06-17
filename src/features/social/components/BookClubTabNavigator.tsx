import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

const BookClubTabNavigator = ({ activeTab, setActiveTab }) => {
  return (
    <View style={styles.TabBar}>
        <TouchableOpacity 
            onPress={() => setActiveTab('meetings')} 
            style={[styles.TabButton, activeTab === 'meetings' && styles.TabButtonActive]}
        >
            <Text style={[styles.TabLabel, activeTab === 'meetings' && styles.TabLabelActive]}>
            Meetings
            </Text>
        </TouchableOpacity>
      
        {/* <TouchableOpacity 
        onPress={() => setActiveTab('forum')} 
        style={[styles.TabButton, activeTab === 'forum' && styles.TabButtonActive]}
        >
        <Text style={[styles.TabLabel, activeTab === 'forum' && styles.TabLabelActive]}>
            Forum
        </Text>
        </TouchableOpacity> */}
          
        <TouchableOpacity 
        onPress={() => setActiveTab('about')} 
        style={[styles.TabButton, activeTab === 'about' && styles.TabButtonActive]}
        >
        <Text style={[styles.TabLabel, activeTab === 'about' && styles.TabLabelActive]}>
            About
        </Text>
        </TouchableOpacity>
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

export default BookClubTabNavigator;