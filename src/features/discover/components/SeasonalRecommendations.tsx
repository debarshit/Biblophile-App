import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
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
import { useNavigation } from '@react-navigation/native';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';

interface SeasonalRecommendationsProps {
  latitude?: number | null;
  longitude?: number | null;
}

const SeasonalRecommendations: React.FC<SeasonalRecommendationsProps> = ({
  latitude,
  longitude,
}) => {
  const [seasonalBooks, setSeasonalBooks] = useState([]);
  const [currentSeason, setCurrentSeason] = useState('');
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchSeasonalBooks = async () => {
      try {
        const url = latitude && longitude
        ? `${requests.fetchSeasonalRecommendations}&lat=${latitude}&lng=${longitude}`
        : requests.fetchSeasonalRecommendations;

        const response = await instance.get(url);

        if (response.data.items && response.data.items.length > 0) {
            setSeasonalBooks(response.data.items);
            const capitalizedSeason =
            response.data.season.charAt(0).toUpperCase() + response.data.season.slice(1);
            setCurrentSeason(capitalizedSeason);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching seasonal books:', error);
        setLoading(false);
      }
    };

    fetchSeasonalBooks();
  }, []);

  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        navigation.push('Details', {
          id: item.id,
          type: 'ExternalBook',
        });
      }}
      key={item.id}
      style={styles.bookContainer}>
      <View style={styles.bookImageContainer}>
        {item.imagelink_square ? (
          <Image
            source={{ uri: convertHttpToHttps(item.imagelink_square) }}
            style={styles.bookImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Feather name="book" size={40} color={COLORS.primaryLightGreyHex} />
          </View>
        )}
        <View style={styles.ratingContainer}>
          <Feather name="star" size={10} color={COLORS.primaryOrangeHex} />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.titleText}>{item.name}</Text>
      <Text numberOfLines={1} style={styles.authorText}>{item.author}</Text>
      {/* <View style={styles.priceContainer}>
        <Text style={styles.priceText}>${parseFloat(item.price).toFixed(2)}</Text>
      </View> */}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (seasonalBooks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{currentSeason} Recommendations</Text>
      </View>
      <FlatList
        data={seasonalBooks}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={renderBookItem}
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
    paddingLeft: SPACING.space_30,
    paddingRight: SPACING.space_15,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookContainer: {
    width: 150,
    marginRight: SPACING.space_15,
  },
  bookImageContainer: {
    height: 200,
    width: '100%',
    borderRadius: BORDERRADIUS.radius_15,
    marginBottom: SPACING.space_10,
    overflow: 'hidden',
    position: 'relative',
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
  ratingContainer: {
    position: 'absolute',
    top: SPACING.space_10,
    right: SPACING.space_10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BORDERRADIUS.radius_10,
    paddingHorizontal: SPACING.space_10,
    paddingVertical: SPACING.space_4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_4,
  },
  titleText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  authorText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.space_4,
  },
  priceText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
  },
});

export default SeasonalRecommendations;