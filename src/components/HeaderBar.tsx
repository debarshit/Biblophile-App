import {StyleSheet, Text, View, Image} from 'react-native';
import React from 'react';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import GradientBGIcon from './GradientBGIcon';
import ProfilePic from './ProfilePic';

interface HeaderBarProps {
  title?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({title}) => {
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
  Image: {
    height: SPACING.space_36,
    width: SPACING.space_36,
  },
});

export default HeaderBar;
