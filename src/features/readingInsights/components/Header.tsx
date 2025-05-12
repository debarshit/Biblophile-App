import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

const Header = ({ onBackPress, onGraphPress }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBackPress} accessibilityLabel="Back" accessibilityHint="Go back to the previous screen">
        <View style={styles.backIconContainer}>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
            style={styles.LinearGradientBG}>
            <AntDesign name="left" color={COLORS.primaryLightGreyHex} size={FONTSIZE.size_16} />
          </LinearGradient>
        </View>
      </TouchableOpacity>
      <Text style={styles.headerText}>Reading Streak</Text>
      <TouchableOpacity onPress={onGraphPress} accessibilityLabel="stats" accessibilityHint="Go to the stats screen">
        <View style={styles.graphIconContainer}>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
            style={styles.LinearGradientBG}>
            <Entypo name="bar-graph" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_16} />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_15,
  },
  backIconContainer: {
    height: FONTSIZE.size_30,
    width: FONTSIZE.size_30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDERRADIUS.radius_8,
    overflow: 'hidden',
  },
  graphIconContainer: {
    height: FONTSIZE.size_30,
    width: FONTSIZE.size_30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDERRADIUS.radius_8,
    overflow: 'hidden',
  },
  LinearGradientBG: {
    height: FONTSIZE.size_30,
    width: FONTSIZE.size_30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
});

export default Header;