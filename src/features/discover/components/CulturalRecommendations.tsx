import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.8;

const CulturalRecommendations = () => {
  const [indianBooks, setIndianBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndianBooks = async () => {
      try {
        const response = await instance.get(requests.fetchCulturalRecommendations);
  
        if (response.data && response.data.length > 0) {
          setIndianBooks(response.data);
        }
  
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Indian books:', error);
        setLoading(false);
      }
    };
  
    fetchIndianBooks();
  }, []);

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const renderBookItem = ({ item, index }) => (
    <TouchableOpacity style={[styles.bookContainer, index === 0 && { marginLeft: SPACING.space_30 }]}>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.bookImageContainer}>
            {item.imagelink_square ? (
              <Image
                source={{ uri: item.imagelink_square }}
                style={styles.bookImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Feather name="book" size={40} color={COLORS.primaryLightGreyHex} />
              </View>
            )}
          </View>
          <View style={styles.bookInfoContainer}>
            <Text numberOfLines={2} style={styles.titleText}>{item.name}</Text>
            <Text style={styles.authorText}>{item.author}</Text>
            <Text numberOfLines={3} style={styles.descriptionText}>
              {truncateText(item.description, 100)}
            </Text>
            <View style={styles.bottomContainer}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>${parseFloat(item.price).toFixed(2)}</Text>
                <View style={styles.ratingContainer}>
                  <Feather name="star" size={12} color={COLORS.primaryOrangeHex} />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (indianBooks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Indian Voices</Text>
      </View>
      <FlatList
        data={indianBooks}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={renderBookItem}
        snapToInterval={ITEM_WIDTH + SPACING.space_15}
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.space_20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_30,
    marginBottom: SPACING.space_15,
  },
  headerTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
  flatListContainer: {
    paddingRight: SPACING.space_30,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookContainer: {
    width: ITEM_WIDTH,
    marginRight: SPACING.space_15,
  },
  cardGradient: {
    height: 200,
    borderRadius: BORDERRADIUS.radius_15,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: SPACING.space_15,
    height: '100%',
  },
  bookImageContainer: {
    width: 120,
    height: '100%',
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
  bookInfoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  authorText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_8,
  },
  descriptionText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_10,
  },
  bottomContainer: {
    marginTop: 'auto',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_10,
  },
  priceText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_4,
  },
});

export default CulturalRecommendations;