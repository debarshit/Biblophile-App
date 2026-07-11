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

interface SimilarItem {
  workId: string;
  bookId: string;
  title: string;
  description: string;
  photo: string;
  matchScore: number;
}

const getMatchLabel = (score: number): string => {
  if (score >= 4) return 'Strong match';
  if (score >= 2) return 'Good match';
  return 'Similar';
};

const getMatchColor = (score: number, orangeHex: string, greyHex: string): string => {
  if (score >= 4) return orangeHex;
  if (score >= 2) return '#7DAB63';
  return greyHex;
};

const MatchDots = ({
  score,
  orangeHex,
  greyHex,
}: {
  score: number;
  orangeHex: string;
  greyHex: string;
}) => {
  const filled = Math.round(score);
  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginBottom: 2 }}>
      {[1, 2, 3, 4, 5].map((dot) => (
        <View
          key={dot}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: dot <= filled ? getMatchColor(score, orangeHex, greyHex) : greyHex,
            opacity: dot <= filled ? 1 : 0.3,
          }}
        />
      ))}
    </View>
  );
};

const SimilarToYourReads = () => {
  const [items, setItems] = useState<SimilarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<any>();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const response = await instance.get(requests.fetchSimilarToYourReads);
        const data = response.data?.data?.items;
        if (data && data.length > 0) {
          setItems(data);
        }
      } catch (error) {
        console.error('Error fetching similar-to-yours recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, []);

  const renderBookItem = ({ item }: { item: SimilarItem }) => (
    <TouchableOpacity
      onPress={() => navigation.push('Details', { id: item.bookId, type: 'Work' })}
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
      </View>

      <Text numberOfLines={1} style={styles.titleText}>
        {item.title}
      </Text>

      {/* Match score dots */}
      <MatchDots
        score={item.matchScore}
        orangeHex={COLORS.primaryOrangeHex}
        greyHex={COLORS.primaryGreyHex}
      />
      <Text
        style={[
          styles.matchLabel,
          {
            color: getMatchColor(
              item.matchScore,
              COLORS.primaryOrangeHex,
              COLORS.primaryLightGreyHex,
            ),
          },
        ]}
      >
        {getMatchLabel(item.matchScore)}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Similar to Your Reads</Text>
          <Text style={styles.headerSubtitle}>
            Based on your genres, moods & reading style
          </Text>
        </View>
      </View>

      {/* Content */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="book-open" size={22} color={COLORS.primaryLightGreyHex} />
          <Text style={styles.emptyText}>
            Rate more books to unlock taste-based picks
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
    titleText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_4,
    },
    matchLabel: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_10,
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

export default SimilarToYourReads;