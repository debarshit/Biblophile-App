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
import {
  BORDERRADIUS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';

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

export const mockFriendActivity: FeedEvent[] = [
  {
    id: 1,
    createdAt: "2026-07-11T10:20:00Z",
    eventType: "status_change",
    actor: {
      userId: 101,
      name: "Emma Watson",
      userName: "emmaw",
      profilePic: "https://i.pravatar.cc/150?img=1",
    },
    book: {
      workId: 501,
      title: "Atomic Habits",
      photo: "https://covers.openlibrary.org/b/id/10523338-L.jpg",
    },
    payload: {
      status: "Currently reading",
    },
  },
  {
    id: 2,
    createdAt: "2026-07-11T07:15:00Z",
    eventType: "review",
    actor: {
      userId: 102,
      name: "James Lee",
      userName: "jamesl",
      profilePic: "https://i.pravatar.cc/150?img=12",
    },
    book: {
      workId: 502,
      title: "The Midnight Library",
      photo: "https://covers.openlibrary.org/b/id/12610547-L.jpg",
    },
  },
  {
    id: 3,
    createdAt: "2026-07-10T18:40:00Z",
    eventType: "status_change",
    actor: {
      userId: 103,
      name: "Sophia Brown",
      userName: "sophiab",
      profilePic: "https://i.pravatar.cc/150?img=20",
    },
    book: {
      workId: 503,
      title: "Project Hail Mary",
      photo: "https://covers.openlibrary.org/b/id/12617631-L.jpg",
    },
    payload: {
      status: "Read",
    },
  },
  {
    id: 4,
    createdAt: "2026-07-09T14:00:00Z",
    eventType: "status_change",
    actor: {
      userId: 104,
      name: "Michael Scott",
      userName: "michael",
      profilePic: "https://i.pravatar.cc/150?img=8",
    },
    book: {
      workId: 504,
      title: "Dune",
    },
    payload: {
      status: "Paused",
    },
  },
  {
    id: 5,
    createdAt: "2026-07-08T09:30:00Z",
    eventType: "status_change",
    actor: {
      userId: 105,
      name: "Olivia Carter",
      userName: "olivia",
      profilePic: "",
    },
    book: {
      workId: 505,
      title: "The Psychology of Money",
    },
    payload: {
      status: "Did not finish",
    },
  },
];

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

  // useEffect(() => {
  //   let isMounted = true;
  //   const fetchPreview = async () => {
  //     try {
  //       const response = await instance.get(requests.fetchFollowingFeed(3, 0));
  //       const data = response.data?.data?.events;
  //       if (isMounted && data) {
  //         setEvents(data.slice(0, 3));
  //       }
  //     } catch (error) {
  //       console.error('Error fetching friend activity preview:', error);
  //     } finally {
  //       if (isMounted) setLoading(false);
  //     }
  //   };

  //   fetchPreview();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, []);

  useEffect(() => {
  setLoading(true);

  setTimeout(() => {
    setEvents(mockFriendActivity.slice(0, 3));
    setLoading(false);
  }, 1000); // simulate network delay
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
      <View style={stylesObj.container}>
        <View style={stylesObj.headerRow}>
          <Text style={stylesObj.title}>👥 Friend Activity</Text>
          <Text style={stylesObj.seeAll}>See all →</Text>
        </View>
        <View style={stylesObj.separator} />
        <SkeletonRow COLORS={COLORS} pulse={pulse} />
        <SkeletonRow COLORS={COLORS} pulse={pulse} />
      </View>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <View style={stylesObj.container}>
      {/* Header */}
      <View style={stylesObj.headerRow}>
        <Text style={stylesObj.title}>👥 Friend Activity</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Social', { initialTab: 'Activity' })}>
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
            {profilePicUri ? (
              <Image source={{ uri: profilePicUri }} style={stylesObj.avatar} />
            ) : (
              <View style={stylesObj.avatarFallback}>
                <Feather name="user" size={14} color={COLORS.secondaryLightGreyHex} />
              </View>
            )}

            <View style={stylesObj.middleContent}>
              <Text style={stylesObj.actionTextRow} numberOfLines={1}>
                <Text style={stylesObj.actorName}>{event.actor.name} </Text>
                <Text style={stylesObj.actionVerb}>{actionText}</Text>
              </Text>
              <Text style={stylesObj.bookTitle} numberOfLines={1}>
                {event.book.title}
              </Text>
            </View>

            <Text style={stylesObj.timeText}>{relativeTime}</Text>
          </View>
        );
      })}
    </View>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      marginHorizontal: SPACING.space_20,
      marginBottom: SPACING.space_24,
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_20,
      overflow: 'hidden',
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
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    avatarFallback: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: COLORS.primaryGreyHex,
      alignItems: 'center',
      justifyContent: 'center',
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
