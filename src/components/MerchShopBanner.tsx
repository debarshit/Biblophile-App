import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
} from 'react-native';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';

const MerchShopBanner = ({
  title = "Check Out Our Smart bookmarks!",
  description = "Browse our latest bookmarks, only for book lovers like you.",
  buttonText = "Visit Our Shop",
  shopUrl = "https://shop.biblophile.com/shop/1/Bookmarks",
  bannerImageUrl = "https://ik.imagekit.io/umjnzfgqh/shop/common_assets/banners/banner-large.png",
  onPress=null,
  style = {},
}) => {

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Linking.openURL(shopUrl).catch((err) =>
        console.error('An error occurred while opening the URL', err)
      );
    }
  };

  return (
    <View style={[styles.merchShopSection, style]}>
      <TouchableOpacity onPress={handlePress} style={styles.bannerContainer}>
        <Image
          source={{ uri: bannerImageUrl }}
          style={styles.bannerImage}
        />
        <Text style={styles.merchShopTitle}>{title}</Text>
        <Text style={styles.merchShopDescription}>{description}</Text>
        <View style={styles.buttonContainer}>
          <Text style={styles.shopButton}>{buttonText}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  merchShopSection: {
    marginVertical: SPACING.space_24,
    marginHorizontal: SPACING.space_4,
    padding: SPACING.space_4,
  },
  bannerContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_15,
    shadowColor: COLORS.primaryBlackHex,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  bannerImage: {
    width: '100%',
    aspectRatio: 4.5,
    borderRadius: BORDERRADIUS.radius_15,
    marginBottom: SPACING.space_4,
  },
  merchShopTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_2,
  },
  merchShopDescription: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  shopButton: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    color: COLORS.primaryWhiteHex,
    paddingVertical: SPACING.space_2,
    paddingHorizontal: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    textAlign: 'center',
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
  },
});

export default MerchShopBanner;