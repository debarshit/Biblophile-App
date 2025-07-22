import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';

interface CouponDetails {
  type: string;
  description: string;
}

interface CouponSystemProps {
  appliedCoupon: string | null;
  onCouponApplied: (couponCode: string) => void;
  onCouponRemoved: () => void;
  validCoupons: Record<string, CouponDetails>;
}

const CouponSystem: React.FC<CouponSystemProps> = ({
  appliedCoupon,
  onCouponApplied,
  onCouponRemoved,
  validCoupons,
}) => {
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponError, setCouponError] = useState<string>("");
  const [showCouponSection, setShowCouponSection] = useState(false);

  const handleApplyCoupon = () => {
    setCouponError("");
    
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    const upperCouponCode = couponCode.toUpperCase();
    
    if (validCoupons[upperCouponCode]) {
      onCouponApplied(upperCouponCode);
      setCouponCode("");
      setCouponError("");
      Alert.alert("Success", "Coupon applied successfully!");
    } else {
      setCouponError("Invalid coupon code");
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setCouponCode("");
    setCouponError("");
  };

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity 
        style={styles.couponToggle}
        onPress={() => setShowCouponSection(!showCouponSection)}
      >
        <Text style={styles.sectionTitle}>
          Coupon Code {showCouponSection ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {showCouponSection && (
        <>
          {!appliedCoupon ? (
            <View style={styles.couponContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                value={couponCode}
                onChangeText={setCouponCode}
              />
              <TouchableOpacity
                style={styles.couponApplyButton}
                onPress={handleApplyCoupon}
              >
                <Text style={styles.couponApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.appliedCouponContainer}>
              <View style={styles.couponInfoContainer}>
                <Text style={styles.appliedCouponText}>✓ {appliedCoupon}</Text>
                <Text style={styles.couponDescText}>
                  {validCoupons[appliedCoupon]?.description}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleRemoveCoupon}
                style={styles.removeCouponButton}
              >
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {couponError !== "" && (
            <Text style={styles.couponErrorText}>{couponError}</Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondaryDarkGreyHex,
  },
  sectionTitle: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  couponToggle: {
    marginBottom: SPACING.space_10,
  },
  couponContainer: {
    flexDirection: 'row',
    gap: SPACING.space_10,
  },
  couponInput: {
    flex: 1,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_15,
    borderWidth: 1,
    borderColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    backgroundColor: COLORS.secondaryBlackRGBA,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  couponApplyButton: {
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_20,
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponApplyText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  appliedCouponContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_15,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: BORDERRADIUS.radius_8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  couponInfoContainer: {
    flex: 1,
  },
  appliedCouponText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: '#22c55e',
  },
  couponDescText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: '#22c55e',
  },
  removeCouponButton: {
    paddingHorizontal: SPACING.space_10,
  },
  removeCouponText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: '#ef4444',
  },
  couponErrorText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: '#ef4444',
    marginTop: SPACING.space_8,
  },
});

export default CouponSystem;