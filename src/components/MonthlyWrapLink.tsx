import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import {
  COLORS,
  SPACING,
  FONTFAMILY,
  FONTSIZE,
  BORDERRADIUS,
} from '../theme/theme';

/* -------------------------------------------------------------------------- */
/*                                COMPONENTS                                  */
/* -------------------------------------------------------------------------- */

const MonthlyWrapLink = ({ onPress, currentMonth = 'November' }) => {
  return (
    <TouchableOpacity
      style={styles.wrapContainer}
      onPress={onPress}
      activeOpacity={0.85}>
      <LinearGradient
        colors={[COLORS.primaryDarkGreyHex, COLORS.primaryLightGreyHex]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}>
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        <View style={styles.contentContainer}>
          <View style={styles.iconWrapper}>
            <Ionicons name="sparkles" size={26} color={COLORS.primaryWhiteHex} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.mainTitle}>
              Your {currentMonth} Reading Wrap
            </Text>
            <Text style={styles.subtitle}>
              See your reading journey this month
            </Text>
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={COLORS.primaryWhiteHex}
            />
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>NEW</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const MonthlyWrapMinimal = ({ onPress, currentMonth = 'November' }) => {
  return (
    <TouchableOpacity
      style={styles.minimalContainer}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={styles.minimalContent}>
        <LinearGradient
          colors={[COLORS.primaryRedHex, COLORS.primaryOrangeHex]}
          style={styles.minimalIconGradient}>
          <Ionicons name="stats-chart" size={22} color={COLORS.primaryWhiteHex} />
        </LinearGradient>

        <View style={styles.minimalTextContainer}>
          <Text style={styles.minimalTitle}>Monthly Reading Wrap</Text>
          <Text style={styles.minimalSubtitle}>
            {currentMonth} • Ready to view
          </Text>
        </View>

        <Ionicons
          name="arrow-forward"
          size={18}
          color={COLORS.secondaryLightGreyHex}
        />
      </View>
    </TouchableOpacity>
  );
};

const MonthlyWrapBanner = ({
  onPress,
  currentMonth = 'November',
  booksRead = 12,
}) => {
  return (
    <TouchableOpacity
      style={styles.bannerContainer}
      onPress={onPress}
      activeOpacity={0.85}>
      <LinearGradient
        colors={[
          COLORS.primaryDarkGreyHex,
          COLORS.primaryLightGreyHex,
        ]}
        style={styles.bannerGradient}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <View style={styles.bannerIconCircle}>
              <Ionicons name="book" size={30} color={COLORS.primaryWhiteHex} />
            </View>

            <View>
              <Text style={styles.bannerStatsNumber}>{booksRead}</Text>
              <Text style={styles.bannerStatsLabel}>Books</Text>
            </View>
          </View>

          <View style={styles.bannerRight}>
            <Text style={styles.bannerTitle}>{currentMonth}</Text>
            <Text style={styles.bannerTitle}>Reading Wrap</Text>

            <View style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>View Details</Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={COLORS.primaryWhiteHex}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  wrapContainer: {
    marginBottom: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryDarkGreyHex,
    marginHorizontal: SPACING.space_8
  },
  gradientContainer: {
    padding: SPACING.space_20,
    minHeight: 100,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primaryOrangeHex,
    top: -30,
    right: -20,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryOrangeHex,
    bottom: -10,
    left: 20,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: BORDERRADIUS.radius_25,
    backgroundColor: COLORS.primaryBlackRGBA,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_12,
  },
  textContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  subtitle: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
  },
  arrowContainer: {
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryBlackRGBA,
  },
  badge: {
    position: 'absolute',
    top: SPACING.space_12,
    right: SPACING.space_12,
    backgroundColor: COLORS.primaryWhiteHex,
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_10,
  },
  badgeText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryRedHex,
  },

  /* Minimal */
  minimalContainer: {
    borderRadius: BORDERRADIUS.radius_15,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_16,
    marginHorizontal: SPACING.space_8
  },
  minimalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimalIconGradient: {
    width: 44,
    height: 44,
    borderRadius: BORDERRADIUS.radius_10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_12,
  },
  minimalTextContainer: {
    flex: 1,
  },
  minimalTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  minimalSubtitle: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
  },

  /* Banner */
  bannerContainer: {
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
    marginBottom: SPACING.space_16,
    marginHorizontal: SPACING.space_8
  },
  bannerGradient: {
    padding: SPACING.space_20,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryBlackRGBA,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_12,
  },
  bannerStatsNumber: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  bannerStatsLabel: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
  },
  bannerRight: {
    alignItems: 'flex-end',
  },
  bannerTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackRGBA,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_15,
    marginTop: SPACING.space_8,
  },
  bannerButtonText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginRight: SPACING.space_4,
  },
});

export { MonthlyWrapLink, MonthlyWrapMinimal, MonthlyWrapBanner };