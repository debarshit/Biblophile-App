import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Image,
  View,
  StyleSheet,
  Text,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import { useTheme } from '../../../contexts/ThemeContext';
import { useStore } from '../../../store/store';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import IndieSpotlightInfoModal from './IndieSpotlightInfoModal';

interface SpotlightItem {
  Id: string | number;
  WorkId?: number;
  Photo: string;
  Name: string;
  Authors?: string;
  Genres?: string;
  Publisher?: string;
  badgeType?: 'partner_exclusive' | 'publisher_spotlight' | 'biblo_pick' | 'indie_spotlight' | 'arc_live' | 'giveaway_live';
  badgeText?: string;
  hasActiveArc?: boolean;
  arcId?: number | null;
  hasActiveGiveaway?: boolean;
  giveawayId?: number | null;
}

interface SpotlightsProps {
  spotlights: SpotlightItem[];
}

type FilterType = 'all' | 'arcs_giveaways' | 'partners' | 'picks';

const FILTER_CHIPS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'arcs_giveaways', label: 'ARCs & Giveaways', icon: 'flash-outline' },
  { key: 'partners', label: 'Partner Exclusives', icon: 'people-sharp' },
  { key: 'picks', label: 'Biblo Picks', icon: 'star-outline' },
];

const Spotlights: React.FC<SpotlightsProps> = ({ spotlights = [] }) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const navigation = useNavigation<any>();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const userDetails = useStore((state: any) => state.userDetails);

  // Impression tracking deduplication set
  const trackedImpressionsRef = useRef(new Set<string>());

  // Filter spotlights based on active chip
  const filteredSpotlights = useMemo(() => {
    if (!spotlights || spotlights.length === 0) return [];
    if (selectedFilter === 'all') return spotlights;

    const filtered = spotlights.filter((item) => {
      if (selectedFilter === 'arcs_giveaways') {
        return (
          item.hasActiveArc ||
          item.hasActiveGiveaway ||
          item.badgeType === 'arc_live' ||
          item.badgeType === 'giveaway_live'
        );
      }
      if (selectedFilter === 'partners') {
        return (
          item.badgeType === 'partner_exclusive' ||
          item.badgeType === 'publisher_spotlight'
        );
      }
      if (selectedFilter === 'picks') {
        return (
          item.badgeType === 'biblo_pick' ||
          item.badgeType === 'indie_spotlight'
        );
      }
      return true;
    });

    // Fallback to all if category has no items so UI stays rich
    return filtered.length > 0 ? filtered : spotlights;
  }, [spotlights, selectedFilter]);

  const listLength = filteredSpotlights.length;

  // Track impressions for visible campaign books
  const trackImpression = useCallback(
    (item: SpotlightItem) => {
      const accessToken = userDetails?.[0]?.accessToken;
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      if (item.arcId && !trackedImpressionsRef.current.has(`arc-${item.arcId}`)) {
        trackedImpressionsRef.current.add(`arc-${item.arcId}`);
        instance
          .post(requests.trackArcEvent(item.arcId), { eventType: 'impression' }, { headers })
          .catch((err) => console.log('ARC impression track error:', err));
      }

      if (item.giveawayId && !trackedImpressionsRef.current.has(`giveaway-${item.giveawayId}`)) {
        trackedImpressionsRef.current.add(`giveaway-${item.giveawayId}`);
        instance
          .post(requests.trackGiveawayEvent(item.giveawayId), { eventType: 'impression' }, { headers })
          .catch((err) => console.log('Giveaway impression track error:', err));
      }
    },
    [userDetails]
  );

  // Auto-scroll the list gently
  useEffect(() => {
    if (listLength > 1) {
      const intervalId = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % listLength);
      }, 3500);

      return () => clearInterval(intervalId);
    }
  }, [listLength]);

  useEffect(() => {
    if (flatListRef.current && listLength > 0 && currentIndex < listLength) {
      flatListRef.current.scrollToIndex({
        index: currentIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [currentIndex, listLength]);

  // Reset index when filter changes
  const handleFilterChange = (key: FilterType) => {
    setSelectedFilter(key);
    setCurrentIndex(0);
  };

  const renderBadge = (item: SpotlightItem) => {
    let bg = 'rgba(245, 158, 11, 0.15)';
    let textColor = '#F59E0B';
    let label = item.badgeText || 'Indie Spotlight';
    let icon = 'star';

    if (item.hasActiveArc || item.badgeType === 'arc_live') {
      bg = 'rgba(0, 210, 255, 0.15)';
      textColor = '#00D2FF';
      label = item.badgeText || 'Free ARC';
      icon = 'flash';
    } else if (item.hasActiveGiveaway || item.badgeType === 'giveaway_live') {
      bg = 'rgba(255, 153, 0, 0.15)';
      textColor = '#FF9900';
      label = item.badgeText || 'Giveaway Live';
      icon = 'gift';
    } else if (item.badgeType === 'partner_exclusive') {
      bg = 'rgba(168, 85, 247, 0.18)';
      textColor = '#C084FC';
      label = item.badgeText || 'Partner Exclusive';
      icon = 'people-sharp';
    } else if (item.badgeType === 'publisher_spotlight') {
      bg = 'rgba(168, 85, 247, 0.18)';
      textColor = '#C084FC';
      label = item.badgeText || (item.Publisher ? `${item.Publisher} Spotlight` : 'Publisher Spotlight');
      icon = 'book';
    } else if (item.badgeType === 'biblo_pick') {
      bg = 'rgba(245, 158, 11, 0.15)';
      textColor = '#F59E0B';
      label = item.badgeText || 'Biblo Pick';
      icon = 'star';
    }

    return (
      <View style={[styles.cardBadge, { backgroundColor: bg, borderColor: textColor + '40' }]}>
        <Ionicons name={icon as any} size={10} color={textColor} style={styles.cardBadgeIcon} />
        <Text style={[styles.cardBadgeText, { color: textColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    );
  };

  if (!spotlights || spotlights.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <View style={styles.titleWithIcon}>
            <Text style={styles.spotlightTitle}>Indie Spotlight</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setInfoModalVisible(true)}
              style={styles.infoButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={COLORS.primaryLightGreyHex || '#AAAAAA'}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.spotlightSubtitle}>Supporting indie authors & small presses</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = selectedFilter === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              activeOpacity={0.7}
              onPress={() => handleFilterChange(chip.key)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Ionicons
                name={chip.icon as any}
                size={12}
                color={isActive ? COLORS.primaryWhiteHex : (COLORS.primaryLightGreyHex || '#888888')}
                style={styles.filterChipIcon}
              />
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Book Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={filteredSpotlights}
          horizontal
          renderItem={({ item }) => {
            // Track impression when card renders
            trackImpression(item);

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.carouselItem}
                onPress={() => {
                  navigation.navigate('Details', {
                    id: item.Id,
                    type: 'Book',
                    source: 'indie_spotlight',
                    arcId: item.arcId,
                    giveawayId: item.giveawayId,
                    badgeType: item.badgeType,
                  });
                }}
              >
                <View style={styles.bookCard}>
                  <View style={styles.coverWrapper}>
                    <Image
                      source={{ uri: convertHttpToHttps(item.Photo) }}
                      style={styles.bookCover}
                    />
                  </View>

                  <View style={styles.bookInfo}>
                    {/* Badge Pill */}
                    {renderBadge(item)}

                    {/* Book Metadata */}
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {item.Name || 'Book Title'}
                    </Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>
                      {item.Authors || 'Author Name'}
                    </Text>
                    {item.Publisher && (
                      <Text style={styles.bookPublisher} numberOfLines={1}>
                        🏛️ {item.Publisher}
                      </Text>
                    )}

                    {/* Call to Action */}
                    <View style={styles.actionRow}>
                      <Text style={styles.knowMoreText}>
                        {item.hasActiveArc
                          ? 'Get Free ARC →'
                          : item.hasActiveGiveaway
                          ? 'Enter Giveaway →'
                          : 'Explore Book →'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item, index) => `${item.Id}-${index}`}
          showsHorizontalScrollIndicator={false}
          snapToInterval={330}
          decelerationRate="fast"
          initialScrollIndex={0}
          contentContainerStyle={styles.carouselContent}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise((resolve) => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            });
          }}
        />
      </View>

      {/* Info Modal */}
      <IndieSpotlightInfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
      />
    </View>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      marginVertical: SPACING.space_15,
    },
    headerRow: {
      paddingHorizontal: SPACING.space_20,
      marginBottom: SPACING.space_10,
    },
    headerTextGroup: {
      flex: 1,
    },
    titleWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_8,
    },
    spotlightTitle: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
    },
    infoButton: {
      padding: SPACING.space_2,
    },
    spotlightSubtitle: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex || '#888888',
      marginTop: 2,
    },
    filterChipsContainer: {
      paddingHorizontal: SPACING.space_20,
      paddingVertical: SPACING.space_8,
      gap: SPACING.space_8,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.space_12,
      paddingVertical: 6,
      borderRadius: BORDERRADIUS.radius_20,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    filterChipActive: {
      backgroundColor: COLORS.primaryOrangeHex,
      borderColor: COLORS.primaryOrangeHex,
    },
    filterChipIcon: {
      marginRight: SPACING.space_4,
    },
    filterChipText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryLightGreyHex || '#AAAAAA',
    },
    filterChipTextActive: {
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_semibold,
    },
    carouselContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.space_4,
    },
    carouselContent: {
      paddingHorizontal: SPACING.space_15,
      paddingVertical: SPACING.space_8,
    },
    carouselItem: {
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: SPACING.space_8,
      width: 320,
    },
    bookCard: {
      flexDirection: 'row',
      backgroundColor: COLORS.primaryDarkGreyHex || '#222222',
      borderRadius: BORDERRADIUS.radius_15,
      overflow: 'hidden',
      width: '100%',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      minHeight: 155,
    },
    coverWrapper: {
      width: 110,
      height: 155,
      backgroundColor: '#111111',
    },
    bookCover: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    bookInfo: {
      flex: 1,
      padding: SPACING.space_12,
      justifyContent: 'space-between',
    },
    cardBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: SPACING.space_8,
      paddingVertical: 2,
      borderRadius: BORDERRADIUS.radius_10,
      borderWidth: 1,
      marginBottom: 6,
    },
    cardBadgeIcon: {
      marginRight: 4,
    },
    cardBadgeText: {
      fontSize: 10,
      fontFamily: FONTFAMILY.poppins_semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    bookTitle: {
      color: COLORS.primaryWhiteHex,
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      lineHeight: 18,
    },
    bookAuthor: {
      color: COLORS.primaryLightGreyHex || '#CCCCCC',
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      marginTop: 2,
    },
    bookPublisher: {
      color: COLORS.secondaryLightGreyHex || '#888888',
      fontSize: 11,
      fontFamily: FONTFAMILY.poppins_regular,
      marginTop: 2,
    },
    actionRow: {
      marginTop: SPACING.space_8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    knowMoreText: {
      color: COLORS.primaryOrangeHex,
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_semibold,
    },
  });

export default Spotlights;