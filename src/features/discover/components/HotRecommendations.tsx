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
import requests from '../../../services/requests';
import instance from '../../../services/axios';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import { useNavigation } from '@react-navigation/native';

const HotRecommendations = () => {
  const [newBooks, setNewBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        const response = await instance.get(requests.fetchHotRecommendations);
        if (response.data.items && response.data.items.length > 0) {
          setNewBooks(response.data.items);
        }
      } catch (error) {
        console.error('Error fetching new releases:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchNewReleases();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        navigation.push('Details', {
          id: item.id,
          type: 'ExternalBook',
        });
      }}
      key={item.id}
      style={styles.bookContainer}
    >
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
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.titleText}>{item.name}</Text>
      <Text numberOfLines={1} style={styles.authorText}>{item.author}</Text>
      <Text style={styles.dateText}>Released: {formatDate(item.publishedDate)}</Text>
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

  if (newBooks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>New Releases</Text>
      </View>
      <FlatList
        data={newBooks}
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
    width: 160,
    marginRight: SPACING.space_15,
  },
  bookImageContainer: {
    height: 220,
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
  newBadge: {
    position: 'absolute',
    top: SPACING.space_10,
    left: SPACING.space_10,
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingHorizontal: SPACING.space_10,
    paddingVertical: SPACING.space_4,
  },
  newBadgeText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
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
  },
  dateText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.secondaryLightGreyHex,
    marginTop: SPACING.space_4,
    marginBottom: SPACING.space_8,
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

export default HotRecommendations;