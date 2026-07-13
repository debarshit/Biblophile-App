import React, { useEffect, useMemo, useState } from 'react';
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
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import requests from '../../../services/requests';
import instance from '../../../services/axios';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';

interface PersonalisedItem {
  workId: string;
  bookId: string;
  title: string;
  description: string;
  photo: string;
  connectionCount: number;
  avgRating: number;
  friendBoost: boolean;
}

const PersonalisedRecommendations = () => {
  const [items, setItems] = useState<PersonalisedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<any>();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const response = await instance.get(requests.fetchPersonalisedRecs);
        const data = response.data?.data?.items;
        if (data && data.length > 0) {
          setItems(data);
        }
      } catch (error) {
        console.error('Error fetching personalised recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, []);

  const renderBookItem = ({ item }: { item: PersonalisedItem }) => (
    <TouchableOpacity
      onPress={() => navigation.push('Details', { id: item.bookId, type: 'Book' })}
      style={styles.bookContainer}
      activeOpacity={0.8}
    >
      <View style={styles.bookImageContainer}>
        {item.photo ? (
          <Image
            source={{ uri: convertHttpToHttps(item.photo) }}
            style={styles.bookImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Feather name="book" size={40} color={COLORS.primaryLightGreyHex} />
          </View>
        )}
        {/* Avg rating badge — bottom right overlay */}
        {item.avgRating > 0 && item.avgRating !== undefined && item.avgRating !== null && (
          <View style={styles.ratingBadge}>
            <Feather name="star" size={9} color={COLORS.primaryOrangeHex} />
            <Text style={styles.ratingBadgeText}>
              {parseFloat(item.avgRating.toString()).toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      <Text numberOfLines={1} style={styles.titleText}>
        {item.title}
      </Text>

      {/* Friend boost pill or connection count pill */}
      {item.friendBoost ? (
        <View style={styles.friendPill}>
          <Text style={styles.friendPillText}>👥 Friend pick</Text>
        </View>
      ) : (
        <View style={styles.connectionPill}>
          <Text style={styles.connectionPillText}>
            ⭐ {item.connectionCount} readers
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (items.length === 0) {return null};
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Loved by Your Circle</Text>
          <Text style={styles.headerSubtitle}>
            Books your friends and followings gave 4+ stars
          </Text>
        </View>
      </View>

      {/* Content */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="users" size={22} color={COLORS.primaryLightGreyHex} />
          <Text style={styles.emptyText}>
            Follow more readers to unlock personalised picks
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.workId?.toString()}
          renderItem={renderBookItem}
          contentContainerStyle={styles.flatListContainer}
        />
      )}
    </View>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      marginVertical: SPACING.space_20,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: SPACING.space_30,
      marginBottom: SPACING.space_15,
    },
    headerTitle: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_20,
      color: COLORS.primaryWhiteHex,
    },
    headerSubtitle: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryLightGreyHex,
      marginTop: SPACING.space_2,
    },
    flatListContainer: {
      paddingLeft: SPACING.space_30,
      paddingRight: SPACING.space_15,
    },
    loadingContainer: {
      height: 250,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bookContainer: {
      width: 150,
      marginRight: SPACING.space_15,
    },
    bookImageContainer: {
      height: 210,
      width: '100%',
      borderRadius: BORDERRADIUS.radius_15,
      marginBottom: SPACING.space_8,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: COLORS.primaryDarkGreyHex,
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
    ratingBadge: {
      position: 'absolute',
      bottom: SPACING.space_8,
      right: SPACING.space_8,
      backgroundColor: 'rgba(0,0,0,0.72)',
      borderRadius: BORDERRADIUS.radius_8,
      paddingHorizontal: SPACING.space_8,
      paddingVertical: SPACING.space_4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    ratingBadgeText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_10,
      color: COLORS.primaryWhiteHex,
      marginLeft: 3,
    },
    titleText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_4,
    },
    friendPill: {
      alignSelf: 'flex-start',
      backgroundColor: COLORS.primaryOrangeHex,
      borderRadius: BORDERRADIUS.radius_10,
      paddingHorizontal: SPACING.space_8,
      paddingVertical: SPACING.space_4,
    },
    friendPillText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_10,
      color: COLORS.primaryWhiteHex,
    },
    connectionPill: {
      alignSelf: 'flex-start',
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_10,
      paddingHorizontal: SPACING.space_8,
      paddingVertical: SPACING.space_4,
    },
    connectionPillText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_10,
      color: COLORS.secondaryLightGreyHex,
    },
    emptyContainer: {
      marginHorizontal: SPACING.space_30,
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_15,
      paddingVertical: SPACING.space_24,
      paddingHorizontal: SPACING.space_20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_12,
    },
    emptyText: {
      flex: 1,
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryLightGreyHex,
      lineHeight: 18,
    },
  });

export default PersonalisedRecommendations;