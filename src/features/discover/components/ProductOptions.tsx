import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';

const ProductOptions = ({ prices, selectedPrice, onSelectPrice, type }) => {
  return (
    <View style={styles.SizeOuterContainer}>
      {prices.map((data, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onSelectPrice(data)}
            style={[
              styles.SizeBox,
              { 
                borderColor: data.size === selectedPrice.size 
                  ? COLORS.primaryOrangeHex 
                  : COLORS.primaryDarkGreyHex 
              },
            ]}
          >
            <Text 
              style={[
                styles.SizeText, 
                { 
                  fontSize: type === 'Book' ? FONTSIZE.size_14 : FONTSIZE.size_16, 
                  color: data.size === selectedPrice.size 
                    ? COLORS.primaryOrangeHex 
                    : COLORS.secondaryLightGreyHex 
                }
              ]}
            >
              {data.size}
            </Text>
          </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  SizeOuterContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.space_20,
  },
  SizeBox: {
    flex: 1,
    backgroundColor: COLORS.primaryDarkGreyHex,
    alignItems: 'center',
    justifyContent: 'center',
    height: SPACING.space_24 * 2,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 2,
  },
  SizeText: {
    fontFamily: FONTFAMILY.poppins_medium,
  },
});

export default ProductOptions;