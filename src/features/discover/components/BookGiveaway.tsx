import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';

const BookGiveaway = () => {
  const [giveawayBook, setGiveawayBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGiveawayBook = async () => {
      try {
        const response = await instance.get('/apis/dev/actions.php?action=fetchGiveawayBooks');
  
        if (response.data) {
          setGiveawayBook(response.data);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching giveaway book:', error);
        setLoading(false);
      }
    };
  
    fetchGiveawayBook();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (!giveawayBook) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Weekly Giveaway</Text>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
        style={styles.giveawayContainer}
      >
        <View style={styles.imageContainer}>
          {giveawayBook.imagelink_square ? (
            <Image
              source={{ uri: giveawayBook.imagelink_square }}
              style={styles.bookImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Feather name="book" size={50} color={COLORS.primaryLightGreyHex} />
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.titleText}>{giveawayBook.name}</Text>
          <Text style={styles.authorText}>{giveawayBook.author}</Text>
          <Text style={styles.categoryText}>{giveawayBook.category}</Text>
          <View style={styles.entrySection}>
            <Text style={styles.freeText}>FREE ENTRY</Text>
            <TouchableOpacity style={styles.enterButton}>
              <Text style={styles.enterButtonText}>Enter Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      <Text style={styles.termsText}>Contest ends in 6 days. See terms & conditions.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.space_20,
    paddingHorizontal: SPACING.space_30,
  },
  headerTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  giveawayContainer: {
    borderRadius: BORDERRADIUS.radius_20,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: SPACING.space_15,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: 120,
    height: 180,
    borderRadius: BORDERRADIUS.radius_10,
    overflow: 'hidden',
    marginRight: SPACING.space_15,
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryDarkGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  authorText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  categoryText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_10,
  },
  entrySection: {
    marginTop: SPACING.space_10,
  },
  freeText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_10,
  },
  enterButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
  },
  enterButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  termsText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginTop: SPACING.space_10,
  },
});

export default BookGiveaway;