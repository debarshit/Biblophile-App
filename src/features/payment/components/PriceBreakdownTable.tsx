import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';

interface PriceBreakdownProps {
  subtotal: string;
  deliveryFee: string;
  totalPrice: string;
}

const PriceBreakdownTable: React.FC<PriceBreakdownProps> = ({
  subtotal,
  deliveryFee,
  totalPrice,
}) => {
  const isDeliveryFree = parseFloat(deliveryFee) === 0;
  const freeDeliveryThreshold = 120;
  const amountForFreeDelivery = (freeDeliveryThreshold - parseFloat(subtotal)).toFixed(2);
  const showFreeDeliveryHint = !isDeliveryFree && parseFloat(subtotal) < freeDeliveryThreshold;
  
  return (
    <View style={styles.breakdownContainer}>
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>Subtotal</Text>
        <Text style={styles.breakdownValue}>₹ {subtotal}</Text>
      </View>
      
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>
          Delivery {isDeliveryFree ? "(Free)" : "Fee"}
        </Text>
        <Text style={[
          styles.breakdownValue, 
          isDeliveryFree ? styles.freeDelivery : null
        ]}>
          {isDeliveryFree ? "₹ 0.00" : `₹ ${deliveryFee}`}
        </Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.breakdownRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>₹ {totalPrice}</Text>
      </View>
      
      {showFreeDeliveryHint && (
        <Text style={styles.freeDeliveryHint}>
          Add ₹{amountForFreeDelivery} more to get free delivery
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  breakdownContainer: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: SPACING.space_10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.space_8,
  },
  breakdownLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
  },
  breakdownValue: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  freeDelivery: {
    color: COLORS.primaryOrangeHex,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    marginVertical: SPACING.space_10,
  },
  totalLabel: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  totalValue: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  freeDeliveryHint: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    textAlign: 'right',
    marginTop: SPACING.space_4,
  }
});

export default PriceBreakdownTable;