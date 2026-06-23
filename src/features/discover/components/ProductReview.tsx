import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { BORDERRADIUS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import StarRating from 'react-native-star-rating-widget';
import { WysiwygRender } from '../../../components/wysiwyg/WysiwygRender';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';

interface ProductReviewProps {
  id: string;
  isGoogleBook: boolean;
  product: any;
}

interface ReviewTag {
  tagName: string;
  category: 'characters' | 'plot' | 'setting' | 'writingStyle' | 'contentWarnings';
}

interface Review {
  ratingId: string;
  userName: string;
  ratingDate: string;
  rating: number;
  review: string;
  productId: string;
  editionFormat: string;
  emotions?: string[];
  tags?: ReviewTag[];
}

interface RatingSummary {
  average: number;
  total: number;
  distribution: { [key: number]: number };
}

type FilterType = 'all' | 'text' | '5star' | 'critical';

const EMOTION_STYLES = {
  joy:          { bg: '#FFF4CC', text: '#8A5A00', symbol: '☀' },
  fear:         { bg: '#E8E8F8', text: '#3A3A6A', symbol: '⚠' },
  surprise:     { bg: '#FFE6D6', text: '#A34100', symbol: '✧' },
  nostalgia:    { bg: '#F4E7D3', text: '#6A4A1E', symbol: '◎' },
  empathy:      { bg: '#FBEAF0', text: '#72243E', symbol: '♡' },
  anger:        { bg: '#FFD9D9', text: '#9C1C1C', symbol: '▲' },
  anticipation: { bg: '#E8E3FF', text: '#4A3B99', symbol: '➜' },
  sadness:      { bg: '#DDEEFF', text: '#1F4D7A', symbol: '☾' },
} as const;

const TAG_CATEGORY_LABELS: Record<string, string> = {
  characters:      'Characters',
  plot:            'Plot',
  setting:         'Setting',
  writingStyle:    'Writing',
  contentWarnings: '⚠︎',
};

const TAG_CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  characters:      { bg: '#EEEDFE', text: '#3C3489' },
  plot:            { bg: '#E1F5EE', text: '#085041' },
  setting:         { bg: '#E6F1FB', text: '#0C447C' },
  writingStyle:    { bg: '#FAEEDA', text: '#633806' },
  contentWarnings: { bg: '#FCEBEB', text: '#791F1F' },
};

const AVATAR_COLORS = [
  { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#EEEDFE', text: '#3C3489' },
  { bg: '#E1F5EE', text: '#085041' },
  { bg: '#FBEAF0', text: '#72243E' },
  { bg: '#EAF3DE', text: '#27500A' },
  { bg: '#FAEEDA', text: '#633806' },
];

//down the line will move this to reusable username component
const getInitials = (name: string) => {
  const parts = name?.trim().split(' ') ?? [];
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name?.slice(0, 2) ?? 'U').toUpperCase();
};
const getAvatarColor = (name: string) => {
  const idx = (name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'text',     label: 'With text' },
  { key: '5star',    label: '5 star' },
  { key: 'critical', label: 'Critical' },
];

const RatingSummaryCard = ({ summary, COLORS, styles }: { summary: RatingSummary; COLORS: any; styles: any }) => {
  const maxCount = Math.max(...Object.values(summary.distribution), 1);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryLeft}>
        <Text style={styles.bigRating}>{summary.average.toFixed(1)}</Text>
        <StarRating rating={summary.average} starSize={13} color={COLORS.primaryOrangeHex} onChange={()=>null} />
        <Text style={styles.totalCount}>{summary.total} ratings</Text>
      </View>
      <View style={styles.summaryBars}>
        {[5, 4, 3, 2, 1].map(star => {
          const count = summary.distribution[star] ?? 0;
          const pct = maxCount > 0 ? count / maxCount : 0;
          return (
            <View key={star} style={styles.barRow}>
              <Text style={styles.barLabel}>{star}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
              </View>
              <Text style={styles.barPct}>
                {summary.total > 0 ? Math.round((count / summary.total) * 100) : 0}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const ProductReview: React.FC<ProductReviewProps> = ({ id, isGoogleBook, product }) => {
  const navigation = useNavigation<any>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [hasMoreReviews, setHasMoreReviews] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const reviewsLimit = 10;

  const userDetails = useStore((state: any) => state.userDetails);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  async function fetchReviews(newOffset: number = offset) {
    if (isLoading) return;
    setIsLoading(true);
    try {
      let bookIdToFetch = id;

      if (isGoogleBook) {
        const isbn =
          product.volumeInfo?.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13')
            ?.identifier ?? '';
        if (isbn) {
          const res = await instance.get(requests.fetchBookId(isbn));
          const bookIdResponse = res.data;
          if (bookIdResponse.data.bookId) {
            bookIdToFetch = bookIdResponse.data.bookId;
          } else {
            setIsLoading(false);
            return;
          }
        }
      }

      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await instance(
        `${requests.fetchProductReviews(bookIdToFetch)}?offset=${newOffset}&limit=${reviewsLimit}&timezone=${userTimezone}`
      );
      const fetchedReviews: Review[] = response.data.data;

      if (fetchedReviews.length < reviewsLimit) setHasMoreReviews(false);

      setReviews(prev => {
        const ids = new Set(prev.map(r => r.ratingId));
        return [...prev, ...fetchedReviews.filter(r => !ids.has(r.ratingId))];
      });
      setOffset(newOffset + fetchedReviews.length);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setReviews([]);
    setOffset(0);
    setHasMoreReviews(true);
    setSummary(null);
    fetchReviews(0);
    fetchSummary();
  }, [product]);

  async function fetchSummary() {
    try {
      let bookIdToFetch = id;
      if (isGoogleBook) {
        const isbn =
          product.volumeInfo?.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13')
            ?.identifier ?? '';
        if (!isbn) return;
        const res = await instance.get(requests.fetchBookId(isbn));
        if (res.data?.data?.bookId) bookIdToFetch = res.data.data.bookId;
        else return;
      }
      const res = await instance.get(requests.fetchRatingSummary(bookIdToFetch));
      setSummary(res.data.data);
    } catch (e) {
      console.error('Error fetching rating summary:', e);
    }
  }

  const filteredReviews = useMemo(() => {
    switch (activeFilter) {
      case 'text':     return reviews.filter(r => r.review && r.review.trim().length > 0);
      case '5star':    return reviews.filter(r => Math.round(r.rating) === 5);
      case 'critical': return reviews.filter(r => Math.round(r.rating) <= 2);
      default:         return reviews;
    }
  }, [reviews, activeFilter]);

  const handleEditionPress = (productId: string) => {
    navigation.navigate('Details', { id: productId, type: 'Book' });
  };

  const renderFilterBar = () => (
    <View style={styles.filterBar}>
      {FILTER_OPTIONS.map(opt => (
        <Pressable
          key={opt.key}
          style={[styles.chip, activeFilter === opt.key && styles.chipActive]}
          onPress={() => setActiveFilter(opt.key)}
        >
          <Text style={[styles.chipText, activeFilter === opt.key && styles.chipTextActive]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderReview = ({ item }: { item: Review }) => {
    const isDifferentEdition = item.productId != id;
    const initials = getInitials(item.userName);
    const avatarColor = getAvatarColor(item.userName);

    return (
      <View style={[styles.reviewCard]}>
        {/* Header row */}
        <View style={styles.reviewHeader}>
          <View style={styles.authorRow}>
            <View style={[styles.avatar, { backgroundColor: avatarColor.bg }]}>
              <Text style={[styles.avatarText, { color: avatarColor.text }]}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.username}>{item.userName}</Text>
              <Text style={styles.dateText}>
                {item.ratingDate}
                {item.editionFormat && !isDifferentEdition ? ` · ${item.editionFormat}` : ''}
              </Text>
            </View>
          </View>
          {isDifferentEdition && (
            <TouchableOpacity
              onPress={() => handleEditionPress(item.productId)}
              style={styles.editionBadge}
            >
              <Text style={styles.editionBadgeText}>
                Different edition{item.editionFormat ? ` · ${item.editionFormat}` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stars */}
        <View style={styles.starsRow}>
          <StarRating 
            maxStars={5}
            starSize={16}
            color={COLORS.primaryOrangeHex}
            rating={item.rating}
            onChange={() => null}
          />
        </View>

        {/* Review text */}
        {item.review ? (
          <View style={styles.reviewContent}>
            <WysiwygRender html={item.review} maxWidth={300} />
          </View>
        ) : null}

        {/* Emotions */}
        {item.emotions && item.emotions.length > 0 && (
          <View style={styles.emotionsRow}>
            {item.emotions.map(emotion => {
              const style = EMOTION_STYLES[emotion.toLowerCase() as keyof typeof EMOTION_STYLES];
              return (
                <View
                  key={emotion}
                  style={[styles.emotionChip, { backgroundColor: style.bg }]}
                >
                  <Text style={[styles.emotionChipText, { color: style.text }]}>
                    {style.symbol} {emotion}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.map(tag => {
              const colors = TAG_CATEGORY_COLORS[tag.category] ?? { bg: COLORS.primaryGreyHex, text: COLORS.secondaryLightGreyHex };
              return (
                <View key={`${tag.category}-${tag.tagName}`} style={[styles.tag, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.tagText, { color: colors.text }]}>
                    {TAG_CATEGORY_LABELS[tag.category] ? `${TAG_CATEGORY_LABELS[tag.category]} · ` : ''}{tag.tagName}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const ListHeader = () => (
    <>
      {/* Write review prompt */}
      {userDetails?.[0]?.userId ? (
        <TouchableOpacity
          style={styles.writePrompt}
          onPress={() => navigation.navigate('SubmitReview', { id, isGoogleBook, product })}
          activeOpacity={0.7}
        >
          <Text style={styles.writePromptText}>Share your thoughts on this book…</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.writePrompt}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.writePromptText}>Log in to write a review</Text>
        </TouchableOpacity>
      )}

      {/* Rating summary */}
      {summary && <RatingSummaryCard summary={summary} COLORS={COLORS} styles={styles} />}

      {/* Filters */}
      {renderFilterBar()}
    </>
  );

  return (
    <FlatList
      data={filteredReviews}
      keyExtractor={item => item.ratingId}
      renderItem={renderReview}
      onEndReached={() => {
        if (!isLoading && hasMoreReviews) fetchReviews(offset);
      }}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={<ListHeader />}
      ListFooterComponent={() => {
        if (isLoading) return <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} style={styles.loader} />;
        if (!hasMoreReviews && reviews.length > 0) return <Text style={styles.noMoreText}>No more reviews.</Text>;
        return null;
      }}
      ListEmptyComponent={() =>
        !isLoading ? <Text style={styles.noReviewsText}>No reviews yet. Be the first!</Text> : null
      }
      scrollEnabled={false}
    />
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    // Write prompt
    writePrompt: {
      borderWidth: 0.5,
      borderColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_8,
      paddingHorizontal: SPACING.space_16,
      paddingVertical: SPACING.space_12,
      backgroundColor: COLORS.primaryDarkGreyHex,
      marginBottom: SPACING.space_12,
    },
    writePromptText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_14,
      color: COLORS.secondaryLightGreyHex,
    },

    // Rating summary
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_10,
      padding: SPACING.space_16,
      marginBottom: SPACING.space_12,
      gap: SPACING.space_16,
      alignItems: 'center',
    },
    summaryLeft: {
      alignItems: 'center',
      gap: SPACING.space_4,
    },
    bigRating: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: 36,
      color: COLORS.primaryWhiteHex,
      lineHeight: 40,
    },
    totalCount: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
      marginTop: 2,
    },
    summaryBars: {
      flex: 1,
      gap: 4,
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_8,
    },
    barLabel: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
      width: 10,
    },
    barTrack: {
      flex: 1,
      height: 4,
      backgroundColor: COLORS.primaryGreyHex,
      borderRadius: 2,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      backgroundColor: COLORS.primaryOrangeHex,
      borderRadius: 2,
    },
    barPct: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: 11,
      color: COLORS.secondaryLightGreyHex,
      width: 28,
      textAlign: 'right',
    },

    // Filter chips
    filterBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.space_8,
      marginBottom: SPACING.space_12,
    },
    chip: {
      paddingHorizontal: SPACING.space_12,
      paddingVertical: SPACING.space_4,
      borderRadius: 20,
      borderWidth: 0.5,
      borderColor: COLORS.secondaryDarkGreyHex,
      backgroundColor: 'transparent',
    },
    chipActive: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderColor: COLORS.secondaryLightGreyHex,
    },
    chipText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
    chipTextActive: {
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryWhiteHex,
    },

    // Review card
    reviewCard: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_10,
      padding: SPACING.space_16,
      marginBottom: SPACING.space_10,
      borderWidth: 0.5,
      borderColor: COLORS.primaryGreyHex,
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.space_8,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_10,
      flex: 1,
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_12,
    },
    username: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryWhiteHex,
    },
    dateText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
    editionBadge: {
      backgroundColor: COLORS.primaryGreyHex,
      paddingHorizontal: SPACING.space_8,
      paddingVertical: 3,
      borderRadius: BORDERRADIUS.radius_10,
      marginLeft: SPACING.space_8,
      flexShrink: 0,
    },
    editionBadgeText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: 11,
      color: COLORS.primaryOrangeHex,
    },
    starsRow: {
      marginBottom: SPACING.space_8,
    },
    reviewContent: {
      marginBottom: SPACING.space_10,
    },

    // Emotions
    emotionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.space_8,
      marginBottom: SPACING.space_8,
    },
    emotionChip: {
      paddingHorizontal: SPACING.space_10,
      paddingVertical: 3,
      borderRadius: 20,
    },
    emotionChipText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
    },

    // Tags
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.space_8,
    },
    tag: {
      backgroundColor: COLORS.primaryBlackRGBA,
      paddingHorizontal: SPACING.space_8,
      paddingVertical: 2,
      borderRadius: BORDERRADIUS.radius_4,
      borderWidth: 0.5,
      borderColor: COLORS.primaryGreyHex,
    },
    tagText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: 11,
      color: COLORS.secondaryLightGreyHex,
    },

    // Footer states
    loader: {
      marginVertical: SPACING.space_20,
    },
    noMoreText: {
      textAlign: 'center',
      color: COLORS.secondaryLightGreyHex,
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_14,
      marginVertical: SPACING.space_20,
    },
    noReviewsText: {
      textAlign: 'center',
      color: COLORS.secondaryLightGreyHex,
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_16,
      marginVertical: SPACING.space_30,
    },
  });

export default ProductReview;