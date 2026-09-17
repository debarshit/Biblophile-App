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
import { useAnalytics } from '../../../utils/analytics';

interface SimilarItem {
  workId: string;
  bookId: string;
  title: string;
  description: string;
  photo: string;
  matchScore: number;
}

const VIBES = [
  { id: 'atmospheric', label: 'Atmospheric', emoji: '🌙', emotionId: 7, tagQuery: 'atmospheric' },
  { id: 'fast-paced', label: 'Fast-paced', emoji: '⚡', emotionId: 6, tagQuery: 'fast-paced' },
  { id: 'cozy', label: 'Cozy', emoji: '☕', emotionId: 1, tagQuery: 'cozy' },
  { id: 'complex', label: 'Complex', emoji: '🧠', emotionId: 5, tagQuery: 'complex' },
  { id: 'bittersweet', label: 'Bittersweet', emoji: '💔', emotionId: 2, tagQuery: 'bittersweet' },
  { id: 'worldbuilding', label: 'Worldbuilding', emoji: '🪄', emotionId: 6, tagQuery: 'worldbuilding' },
];

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
  const [isColdStart, setIsColdStart] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [vibeLoading, setVibeLoading] = useState(false);

  const navigation = useNavigation<any>();
  const analytics = useAnalytics();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const fetchVibeBooks = async (vibe: (typeof VIBES)[0]) => {
    setSelectedVibe(vibe.id);
    setVibeLoading(true);
    analytics.track('cold_start_vibes_selected', {
      vibes: vibe.label,
      vibe_id: vibe.id,
    });

    try {
      // Try to fetch books matching emotion/mood
      const res = await instance.get(requests.getFilteredRecommendations, {
        params: {
          moods: String(vibe.emotionId),
          match: 'any',
        },
      });

      let loaded: any[] = res.data?.data?.items || [];

      // If empty, fall back to hot recommendations so user gets immediate gratification
      if (loaded.length === 0) {
        const fallbackRes = await instance.get(requests.fetchHotRecommendations);
        loaded = fallbackRes.data?.data?.items || [];
      }

      const formatted: SimilarItem[] = loaded.slice(0, 10).map((b: any) => ({
        workId: String(b.workId || b.id || Math.random()),
        bookId: String(b.bookId || b.id),
        title: b.title || b.name || 'Recommended Book',
        description: b.description || '',
        photo: b.photo || b.imagelink_square || '',
        matchScore: 4.8,
      }));

      setItems(formatted);
    } catch (err) {
      console.error('Error fetching vibe books:', err);
    } finally {
      setVibeLoading(false);
    }
  };

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const response = await instance.get(requests.fetchSimilarToYourReads);
        const data = response.data?.data?.items;
        if (data && data.length > 0) {
          setItems(data);
          setIsColdStart(false);
        } else {
          setIsColdStart(true);
        }
      } catch (error) {
        // In case of error (e.g. 0 ratings), treat as cold start
        setIsColdStart(true);
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
        <Text style={styles.headerTitle}>
          {isColdStart ? 'Discover by Reading Vibe' : 'Similar to Your Reads'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isColdStart
            ? 'Pick a vibe to jumpstart personalized recommendations'
            : 'Based on your genres, moods & reading style'}
        </Text>
      </View>

      {/* Cold start vibe selector pills */}
      {isColdStart && (
        <View style={styles.vibesScrollContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={VIBES}
            keyExtractor={(v) => v.id}
            contentContainerStyle={styles.vibesContentContainer}
            renderItem={({ item: v }) => {
              const isSelected = selectedVibe === v.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.vibePill,
                    isSelected && styles.vibePillSelected,
                  ]}
                  onPress={() => fetchVibeBooks(v)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.vibeEmoji}>{v.emoji}</Text>
                  <Text
                    style={[
                      styles.vibeLabel,
                      isSelected && styles.vibeLabelSelected,
                    ]}
                  >
                    {v.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Content */}
      {vibeLoading ? (
        <View style={styles.vibeLoadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
          <Text style={styles.vibeLoadingText}>Finding matching books...</Text>
        </View>
      ) : items.length === 0 && isColdStart ? (
        <View style={styles.emptyContainer}>
          <Feather name="compass" size={22} color={COLORS.primaryOrangeHex} />
          <Text style={styles.emptyText}>
            Tap any vibe above to discover books tailored to that feeling!
          </Text>
        </View>
      ) : items.length === 0 ? (
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
          keyExtractor={(item, idx) => `${item.workId || item.bookId}-${idx}`}
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
    vibesScrollContainer: {
      marginBottom: SPACING.space_16,
    },
    vibesContentContainer: {
      paddingHorizontal: SPACING.space_30,
      gap: SPACING.space_10,
    },
    vibePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primaryDarkGreyHex,
      paddingVertical: SPACING.space_8,
      paddingHorizontal: SPACING.space_15,
      borderRadius: BORDERRADIUS.radius_20,
      borderWidth: 1,
      borderColor: COLORS.primaryGreyHex,
      gap: 6,
    },
    vibePillSelected: {
      borderColor: COLORS.primaryOrangeHex,
      backgroundColor: COLORS.primaryOrangeHex + '20',
    },
    vibeEmoji: {
      fontSize: 14,
    },
    vibeLabel: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
    vibeLabelSelected: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_semibold,
    },
    vibeLoadingContainer: {
      paddingVertical: SPACING.space_24,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.space_8,
    },
    vibeLoadingText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryLightGreyHex,
    },
  });

export default SimilarToYourReads;