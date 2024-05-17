import React from 'react';
import {StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import GradientBGIcon from './GradientBGIcon';
import ProfilePic from './ProfilePic';

interface HeaderBarProps {
  title?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({navigation, route}: any, {title}) => {
  
  navigation = useNavigation();

  return (
    <View style={styles.HeaderContainer}>
      {/* <GradientBGIcon
        name="menufold"
        color={COLORS.primaryLightGreyHex}
        size={FONTSIZE.size_16}
      /> */}
      <Image
          source={{uri: "https://i.postimg.cc/MTkWjTSx/Biblophile-logo-white.png"}}
          style={styles.Image}
        />
      <Text style={styles.HeaderText}>{title}</Text>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('Streaks');
        }}
      >
        <Text style={styles.StreakText}>Active Streak: 2 days</Text>
      </TouchableOpacity>
      <ProfilePic />
    </View>
  );
};

const styles = StyleSheet.create({
  HeaderContainer: {
    padding: SPACING.space_30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  HeaderText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
  StreakText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
  },
  Image: {
    height: SPACING.space_36,
    width: SPACING.space_36,
  },
});

export default HeaderBar;
