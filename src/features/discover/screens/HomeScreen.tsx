import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Ionicons from '@expo/vector-icons/Ionicons';
import Spotlights from '../components/Spotlights';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import GlassEffect from '../../../components/GlassEffect';
import { useTabBarScroll } from '../../../contexts/TabBarScrollContext';
import HeaderBar from '../../../components/HeaderBar';
import Banner from '../components/Banner';
import Mascot from '../../../components/Mascot';
import FloatingIcon from '../../bookshop/components/FloatingIcon';
import { useCity } from '../../../contexts/CityContext';
import SeasonalRecommendations from '../components/SeasonalRecommendations';
import DailyReadHero from '../../readingInsights/components/dailyHero/DailyReadHero';
import { useTheme } from '../../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import FriendActivityPreview from '../components/FriendActivityPreview';
import { ResponsiveContainer } from '../../../utils/responsive';
import { useStreak } from '../../../hooks/useStreak';

interface Spotlight {
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

const HomeScreen = ({ navigation }: any) => {
  const userDetails = useStore((state) => state.userDetails);
  const CartList = useStore((state: any) => state.CartList);
  const unreadNotificationCount = useStore((state: any) => state.unreadNotificationCount);

  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [loading, setLoading] = useState(true);
  const { onScroll: onTabBarScroll } = useTabBarScroll();
  const [showConfetti, setShowConfetti] = useState(false);

  // Reactive streak for header bar
  const { currentStreak, streakFreezes } = useStreak(userDetails[0]?.accessToken);

  const scrollViewRef = useRef(null);
  const scrollOffset = useRef(new Animated.Value(0)).current;
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const { latitude, longitude } = useCity();

  useEffect(() => {
    async function getSpotlights() {
      try {
        const response = await instance(requests.getSpotlight);
        setSpotlights(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching spotlights:', error);
      }
    }

    getSpotlights();
  }, []);

  return (
    <SafeAreaView style={styles.ScreenContainer} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      {showConfetti && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} />}

      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}
        contentOffset={{ x: 0, y: scrollOffset }}
        onScroll={onTabBarScroll}
        scrollEventThrottle={16}
      >
        <ResponsiveContainer>
          {/* App Header with Streak Badge & Notifications */}
          <HeaderBar
            showLogo
            rightComponent={
              <View style={styles.headerRightContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Stats')}
                >
                  <GlassEffect
                    glassStyle="clear"
                    intensity={30}
                    borderRadius={15}
                    style={styles.headerStreakBadge}
                  >
                    <Text style={styles.headerStreakText}>🔥 {currentStreak || 0}</Text>
                    <View style={styles.headerBadgeDivider} />
                    <Text style={styles.headerFreezeText}>❄️ {streakFreezes ?? 0}</Text>
                  </GlassEffect>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('Notifications')}
                  style={{ position: 'relative' }}
                >
                  <Ionicons name="notifications" size={24} color={COLORS.primaryWhiteHex} />
                  {unreadNotificationCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            }
          />

          {/* THE ONE CLEAR ACTION: The Daily Read Hero (Activation & Retention Engine) */}
          <DailyReadHero onFullWeekComplete={() => setShowConfetti(true)} />

          {/* Social Proof: Friend Activity */}
          <FriendActivityPreview />

          {/* Promotional Banner */}
          <Banner />

          {/* Spotlight Section (ARCs, Giveaways, Publisher Spotlights) */}
          <Spotlights spotlights={spotlights} />

          {/* Seasonal Recommendations */}
          <SeasonalRecommendations latitude={latitude} longitude={longitude} />

          {/* Biblo Mascot */}
          <View style={styles.welcomeMascot}>
            <Mascot emotion="pendingBooks" />
            <Text style={styles.welcomeMessage}>From India, with love for readers</Text>
          </View>
        </ResponsiveContainer>
      </Animated.ScrollView>
      {CartList.length > 0 && <FloatingIcon />}
    </SafeAreaView>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  hidden: {
    display: 'none',
  },
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  ScrollViewFlex: {
    flexGrow: 1,
  },
  welcomeMascot: {
    opacity: 0.5,
    marginTop: SPACING.space_32,
    marginBottom: SPACING.space_36,
    bottom: 40,
  },
  welcomeMessage: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    textAlign: 'center',
    color: COLORS.primaryWhiteHex,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_12,
  },
  headerStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 33, 40, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BORDERRADIUS.radius_15,
    paddingHorizontal: SPACING.space_10,
    paddingVertical: SPACING.space_4,
    gap: SPACING.space_8,
  },
  headerStreakText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
  },
  headerBadgeDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerFreezeText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: '#38BDF8',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default HomeScreen;