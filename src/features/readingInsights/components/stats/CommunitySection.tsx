import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';

const CommunitySection = ({ currentStreak = 0 }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const handleDiscussionPress = () => {
    Alert.alert("Coming Soon", "This feature is coming soon!");
  };

  const handleSharePress = async () => {
    try {
      const result = await Share.share({
        message: `I've been on a reading streak for ${currentStreak} days! 📚✨ Join me and let's read together on Biblophile! https://onelink.to/dxjdkb`,
      });
      if (result.action === Share.sharedAction && result.activityType) {
        // Shared with activity type
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share the streak.');
    }
  };

  return (
    <View style={styles.community}>
      <TouchableOpacity onPress={handleDiscussionPress} style={styles.communityButton}>
        <AntDesign name="team" size={20} color={COLORS.secondaryLightGreyHex} />
        <Text style={styles.communityText}>Join the Discussion</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleSharePress} style={styles.communityButton}>
        <Entypo name="share" size={20} color={COLORS.secondaryLightGreyHex} />
        <Text style={styles.communityText}>Share Your Progress</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  community: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: SPACING.space_15,
  },
  communityButton: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: 15,
    padding: SPACING.space_15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '45%',
  },
  communityText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_10,
  },
});

export default CommunitySection;