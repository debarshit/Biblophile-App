import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import GlassEffect from '../../../components/GlassEffect';
import { Platform } from 'react-native';
import {
  BORDERRADIUS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import UserDisplay from '../../../components/UserDisplay';

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

interface FeedEvent {
  id: number;
  createdAt: string;
  eventType: string;
  actor: Actor;
  book: Book;
  payload?: {
    status?: string;
  };
}

const getRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 2) return 'Yesterday';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const getActionText = (event: FeedEvent): string => {
  const { eventType, payload } = event;
  if (eventType === 'status_change') {
    switch (payload?.status) {
      case 'Read':
        return 'finished reading';
      case 'Currently reading':
        return 'started reading';
      case 'Did not finish':
        return 'gave up on';
      case 'Paused':
        return 'paused';
      default:
        return 'updated';
    }
  }
  if (eventType === 'review') return 'reviewed';
  return 'updated';
};

const SkeletonRow = ({ COLORS, pulse }: { COLORS: any; pulse: Animated.Value }) => {
  const bg = COLORS.secondaryDarkGreyHex;
  return (
    <View style={[styles.eventRow, { borderBottomWidth: 0 }]}>
      <Animated.View style={[styles.avatarFallback, { backgroundColor: bg, opacity: pulse }]} />
      <View style={{ flex: 1, paddingHorizontal: SPACING.space_10 }}>
        <Animated.View style={{ height: 10, width: '40%', backgroundColor: bg, borderRadius: 5, marginBottom: 6, opacity: pulse }} />
        <Animated.View style={{ height: 10, width: '70%', backgroundColor: bg, borderRadius: 5, opacity: pulse }} />
      </View>
      <Animated.View style={{ height: 10, width: 30, backgroundColor: bg, borderRadius: 5, opacity: pulse }} />
    </View>
  );
};

const FriendActivityPreview = () => {
  const { COLORS } = useTheme();
  const navigation = useNavigation<any>();
  const stylesObj = useMemo(() => createStyles(COLORS), [COLORS]);

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      try {
        const response = await instance.get(requests.fetchFollowingFeed(3, 0));
        const data = response.data?.data?.events;
        if (isMounted && data) {
          setEvents(data.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching friend activity preview:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, []);

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

  if (loading) {
    return (
      <GlassEffect
        glassStyle="regular"
        intensity={25}
        borderRadius={BORDERRADIUS.radius_20}
        style={stylesObj.container}
      >
        <View style={stylesObj.headerRow}>
          <Text style={stylesObj.title}>👥 Friend Activity</Text>
          <Text style={stylesObj.seeAll}>See all →</Text>
        </View>
        <View style={stylesObj.separator} />
        <SkeletonRow COLORS={COLORS} pulse={pulse} />
        <SkeletonRow COLORS={COLORS} pulse={pulse} />
      </GlassEffect>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <GlassEffect
      glassStyle="regular"
      intensity={25}
      borderRadius={BORDERRADIUS.radius_20}
      style={stylesObj.container}
    >
      {/* Header */}
      <View style={stylesObj.headerRow}>
        <Text style={stylesObj.title}>👥 Friend Activity</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Social', { initialTab: 'Activity Feed' })}>
          <Text style={stylesObj.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      <View style={stylesObj.separator} />

      {/* Events List */}
      {events.map((event, index) => {
        const actionText = getActionText(event);
        const relativeTime = getRelativeTime(event.createdAt);
        const profilePicUri = event.actor.profilePic ? convertHttpToHttps(event.actor.profilePic) : null;
        const isLast = index === events.length - 1;

        return (
          <View
            key={event.id}
            style={[
              stylesObj.eventRow,
              !isLast && { borderBottomWidth: 0.5, borderBottomColor: COLORS.primaryGreyHex },
            ]}
          >
            <UserDisplay
              username={event.actor.userName}
              name={event.actor.name}
              avatarUrl={profilePicUri || undefined}
              size="small"
              layout="avatar-only"
            />

            <View style={stylesObj.middleContent}>
              <Text style={stylesObj.actionTextRow} numberOfLines={1}>
                <UserDisplay
                  username={event.actor.userName}
                  name={event.actor.name}
                  layout="text-only"
                  textStyle={stylesObj.actorName}
                  size="small"
                />
                <Text style={stylesObj.actionVerb}> {actionText}</Text>
              </Text>
              <Text style={stylesObj.bookTitle} numberOfLines={1}>
                {event.book.title}
              </Text>
            </View>

            <Text style={stylesObj.timeText}>{relativeTime}</Text>
          </View>
        );
      })}
    </GlassEffect>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      marginHorizontal: SPACING.space_20,
      marginBottom: SPACING.space_24,
      backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 33, 40, 0.45)' : COLORS.primaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_20,
      overflow: 'hidden',
      borderWidth: Platform.OS === 'ios' ? 1 : 0,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.space_16,
      paddingTop: SPACING.space_16,
      paddingBottom: SPACING.space_12,
    },
    title: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_16,
      color: COLORS.primaryWhiteHex,
    },
    seeAll: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryOrangeHex,
    },
    separator: {
      height: 1,
      backgroundColor: COLORS.primaryGreyHex,
    },
    eventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.space_16,
      paddingVertical: SPACING.space_12,
    },
    middleContent: {
      flex: 1,
      paddingHorizontal: SPACING.space_10,
    },
    actionTextRow: {
      marginBottom: 2,
    },
    actorName: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryWhiteHex,
    },
    actionVerb: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
    bookTitle: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_11,
      color: COLORS.primaryOrangeHex,
    },
    timeText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_10,
      color: COLORS.primaryLightGreyHex,
    },
  });

// Inline reference styles for SkeletonRow fallback
const styles = StyleSheet.create({
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

export default FriendActivityPreview;
