import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useTheme } from '../../../contexts/ThemeContext';
import { FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import UserDisplay from '../../../components/UserDisplay';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Actor {
  userId: number;
  name: string;
  userName: string;
  profilePic?: string;
}

interface Book {
  workId: number;
  title: string;
  photo?: string;
}

interface Payload {
  status?: string;
  reviewSnippet?: string;
}

interface FeedEvent {
  id: number;
  createdAt: string;
  eventType: string;
  actor: Actor;
  book: Book;
  payload: Payload;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 2) return 'Yesterday';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const getActionText = (event: FeedEvent): string => {
  const { eventType, payload } = event;
  if (eventType === 'status_change') {
    switch (payload?.status) {
      case 'Read':               return 'finished reading';
      case 'Currently reading':  return 'started reading';
      case 'Did not finish':     return 'gave up on';
      case 'Paused':             return 'paused reading';
      default:                   return 'updated';
    }
  }
  if (eventType === 'review') return 'reviewed';
  return 'updated';
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard: React.FC<{ COLORS: any }> = ({ COLORS }) => {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const bg = COLORS.secondaryDarkGreyHex;

  return (
    <View style={[skeletonStyles.card, { backgroundColor: COLORS.primaryDarkGreyHex }]}>
      <Animated.View style={[skeletonStyles.avatar, { backgroundColor: bg, opacity: pulse }]} />
      <View style={skeletonStyles.content}>
        <Animated.View style={[skeletonStyles.line, { width: '60%', backgroundColor: bg, opacity: pulse }]} />
        <Animated.View style={[skeletonStyles.line, { width: '45%', backgroundColor: bg, opacity: pulse, marginTop: SPACING.space_8 }]} />
        <Animated.View style={[skeletonStyles.line, { width: '30%', backgroundColor: bg, opacity: pulse, marginTop: SPACING.space_8 }]} />
      </View>
      <Animated.View style={[skeletonStyles.cover, { backgroundColor: bg, opacity: pulse }]} />
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: SPACING.space_12,
  },
  content: {
    flex: 1,
  },
  line: {
    height: 12,
    borderRadius: BORDERRADIUS.radius_4,
  },
  cover: {
    width: 32,
    height: 44,
    borderRadius: BORDERRADIUS.radius_4,
    marginLeft: SPACING.space_12,
  },
});

// ─── Event Card ───────────────────────────────────────────────────────────────

interface EventCardProps {
  event: FeedEvent;
  COLORS: any;
  styles: any;
}

const EventCard: React.FC<EventCardProps> = ({ event, COLORS, styles }) => {
  const actionText = getActionText(event);
  const relativeTime = getRelativeTime(event.createdAt);
  const profilePicUri = event.actor.profilePic
    ? convertHttpToHttps(event.actor.profilePic)
    : null;
  const bookPhotoUri = event.book.photo
    ? convertHttpToHttps(event.book.photo)
    : null;

  return (
    <View style={styles.card}>
      {/* Actor avatar */}
      <View style={styles.avatarContainer}>
        <UserDisplay
          username={event.actor.userName}
          name={event.actor.name}
          avatarUrl={profilePicUri || undefined}
          size="medium"
          layout="avatar-only"
        />
      </View>

      {/* Content */}
      <View style={styles.eventContent}>
        {/* Row 1: name + action */}
        <Text style={styles.actionRow} numberOfLines={2}>
          <UserDisplay
            username={event.actor.userName}
            name={event.actor.name}
            layout="text-only"
            textStyle={styles.actorName}
            size="medium"
          />
          <Text style={styles.actionText}> {actionText}</Text>
        </Text>

        {/* Row 2: book title + cover */}
        <View style={styles.bookRow}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {event.book.title}
          </Text>
          {bookPhotoUri ? (
            <Image source={{ uri: bookPhotoUri }} style={styles.bookCover} resizeMode="cover" />
          ) : (
            <View style={[styles.bookCover, styles.bookCoverFallback]}>
              <Feather name="book" size={14} color={COLORS.secondaryLightGreyHex} />
            </View>
          )}
        </View>

        {/* Row 3: review snippet */}
        {event.eventType === 'review' && event.payload?.reviewSnippet ? (
          <Text style={styles.reviewSnippet} numberOfLines={2}>
            "{event.payload.reviewSnippet}"
          </Text>
        ) : null}

        {/* Row 4: relative time */}
        <Text style={styles.timeText}>{relativeTime}</Text>
      </View>
    </View>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ styles: any }> = ({ styles }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyEmoji}>📖</Text>
    <Text style={styles.emptyTitle}>Your feed is empty</Text>
    <Text style={styles.emptySubtitle}>
      Follow readers to see what they're reading, finishing, and reviewing
    </Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const LIMIT = 20;

const ActivityFeed: React.FC = () => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState('');

  const fetchFeed = useCallback(async (newOffset: number, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (newOffset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');

    try {
      const res = await instance.get(requests.fetchFollowingFeed(LIMIT, newOffset));
      const { events: incoming, hasMore: more } = res.data.data;
      setEvents(prev => (newOffset === 0 ? incoming : [...prev, ...incoming]));
      setHasMore(more);
      setOffset(newOffset);
    } catch (err) {
      setError('Failed to load your activity feed. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(0);
  }, [fetchFeed]);

  const handleRefresh = useCallback(() => {
    fetchFeed(0, true);
  }, [fetchFeed]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchFeed(offset + LIMIT);
    }
  }, [loadingMore, hasMore, offset, fetchFeed]);

  const renderItem = useCallback(
    ({ item }: { item: FeedEvent }) => (
      <EventCard event={item} COLORS={COLORS} styles={styles} />
    ),
    [COLORS, styles]
  );

  const keyExtractor = useCallback((item: FeedEvent) => String(item.id), []);

  const ListFooter = () => {
    if (loadingMore) {
      return (
        <ActivityIndicator
          size="small"
          color={COLORS.primaryOrangeHex}
          style={{ marginVertical: SPACING.space_16 }}
        />
      );
    }
    if (hasMore) {
      return (
        <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
          <Text style={styles.loadMoreText}>Load more</Text>
          <Feather name="chevron-down" size={16} color={COLORS.primaryOrangeHex} />
        </TouchableOpacity>
      );
    }
    if (events.length > 0) {
      return (
        <Text style={styles.endText}>You're all caught up ✓</Text>
      );
    }
    return null;
  };

  // Skeleton loading
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Activity</Text>
        </View>
        {[1, 2, 3].map(i => (
          <SkeletonCard key={i} COLORS={COLORS} />
        ))}
      </View>
    );
  }

  // Error state
  if (error && events.length === 0) {
    return (
      <View style={[styles.container, styles.centeredState]}>
        <Feather name="alert-circle" size={36} color={COLORS.primaryRedHex} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchFeed(0)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={events.length === 0 ? styles.flatListEmpty : styles.flatListContent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Activity</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState styles={styles} />}
        ListFooterComponent={<ListFooter />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primaryOrangeHex]}
            tintColor={COLORS.primaryOrangeHex}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default ActivityFeed;

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
      paddingHorizontal: SPACING.space_16,
    },
    headerContainer: {
      paddingTop: SPACING.space_20,
      paddingBottom: SPACING.space_16,
    },
    headerText: {
      fontSize: FONTSIZE.size_24,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
    },

    // Card
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_15,
      padding: SPACING.space_16,
      marginBottom: SPACING.space_12,
    },
    avatarContainer: {
      marginRight: SPACING.space_12,
    },
    eventContent: {
      flex: 1,
    },
    actionRow: {
      marginBottom: SPACING.space_4,
      flexShrink: 1,
    },
    actorName: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryWhiteHex,
    },
    actionText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_14,
      color: COLORS.secondaryLightGreyHex,
    },
    bookRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.space_4,
    },
    bookTitle: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryOrangeHex,
      flex: 1,
      marginRight: SPACING.space_8,
    },
    bookCover: {
      width: 32,
      height: 44,
      borderRadius: BORDERRADIUS.radius_4,
    },
    bookCoverFallback: {
      backgroundColor: COLORS.primaryGreyHex,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reviewSnippet: {
      fontFamily: FONTFAMILY.poppins_light,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
      fontStyle: 'italic',
      marginBottom: SPACING.space_4,
    },
    timeText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_10,
      color: COLORS.primaryLightGreyHex,
      marginTop: SPACING.space_4,
    },

    // Load more
    loadMoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.space_12,
      marginBottom: SPACING.space_16,
      gap: SPACING.space_8,
    },
    loadMoreText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryOrangeHex,
    },
    endText: {
      textAlign: 'center',
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryLightGreyHex,
      paddingVertical: SPACING.space_16,
    },

    // FlatList
    flatListContent: {
      paddingBottom: SPACING.space_30,
    },
    flatListEmpty: {
      flexGrow: 1,
    },

    // Empty state
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING.space_32,
      paddingTop: SPACING.space_36,
    },
    emptyEmoji: {
      fontSize: 64,
      marginBottom: SPACING.space_20,
    },
    emptyTitle: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_20,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_12,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_14,
      color: COLORS.secondaryLightGreyHex,
      textAlign: 'center',
      lineHeight: 22,
    },

    // Error state
    centeredState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING.space_32,
    },
    errorText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_14,
      color: COLORS.secondaryLightGreyHex,
      textAlign: 'center',
      marginTop: SPACING.space_12,
      marginBottom: SPACING.space_20,
    },
    retryBtn: {
      backgroundColor: COLORS.primaryOrangeHex,
      paddingVertical: SPACING.space_10,
      paddingHorizontal: SPACING.space_28,
      borderRadius: BORDERRADIUS.radius_8,
    },
    retryText: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryWhiteHex,
    },
  });