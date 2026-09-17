import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import { useStore } from '../../../store/store';
import { useAnalytics } from '../../../utils/analytics';
import { shareToplatform, SharePlatform } from '../../../utils/share';
import ReadingTwinStoryTemplate from '../../../components/ReadingTwinStoryTemplate';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TheyAlsoRead {
  workId: number;
  title: string;
  photo?: string;
}

interface Twin {
  userId: number;
  name: string;
  userName: string;
  userProfilePic?: string;
  matchScore: number;
  sharedWorks: number;
  theyAlsoRead: TheyAlsoRead[];
}

// ─── Match Bar ────────────────────────────────────────────────────────────────

interface MatchBarProps {
  score: number; // 0–1
  COLORS: any;
  styles: any;
}

const MatchBar: React.FC<MatchBarProps> = ({ score, COLORS, styles }) => {
  const pct = Math.round(score * 100);
  return (
    <View style={styles.matchBarRow}>
      <View style={[styles.matchBarTrack]}>
        <View style={[styles.matchBarFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.matchPct}>{pct}% match</Text>
    </View>
  );
};

// ─── Twin Card ────────────────────────────────────────────────────────────────

interface TwinCardProps {
  twin: Twin;
  COLORS: any;
  styles: any;
  onPress: () => void;
  onShare: (twin: Twin) => void;
}

const TwinCard: React.FC<TwinCardProps> = ({ twin, COLORS, styles, onPress, onShare }) => {
  const picUri = twin.userProfilePic
    ? convertHttpToHttps(twin.userProfilePic)
    : null;
  const covers = twin.theyAlsoRead.slice(0, 3);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Left: avatar */}
      <View style={styles.avatarContainer}>
        {picUri ? (
          <Image source={{ uri: picUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Feather name="user" size={24} color={COLORS.secondaryLightGreyHex} />
          </View>
        )}
      </View>

      {/* Middle: info */}
      <View style={styles.cardMiddle}>
        <Text style={styles.twinName} numberOfLines={1}>{twin.name}</Text>
        <Text style={styles.twinUsername} numberOfLines={1}>@{twin.userName}</Text>
        <Text style={styles.sharedBooks}>{twin.sharedWorks} books in common</Text>
        <View style={styles.matchBarRowContainer}>
          <View style={{ flex: 1 }}>
            <MatchBar score={twin.matchScore} COLORS={COLORS} styles={styles} />
          </View>
          <TouchableOpacity
            style={styles.cardShareBtn}
            onPress={(e: any) => {
              e?.stopPropagation?.();
              onShare(twin);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="share-2" size={12} color={COLORS.primaryOrangeHex} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Right: they also read */}
      <View style={styles.alsoReadSection}>
        <Text style={styles.alsoReadLabel}>Also read</Text>
        <View style={styles.coverStack}>
          {covers.length > 0 ? (
            covers.map((book, idx) => {
              const coverUri = book.photo ? convertHttpToHttps(book.photo) : null;
              return coverUri ? (
                <Image
                  key={book.workId}
                  source={{ uri: coverUri }}
                  style={[styles.miniCover, { marginTop: idx * -8, zIndex: covers.length - idx }]}
                  resizeMode="cover"
                />
              ) : (
                <View
                  key={book.workId}
                  style={[styles.miniCover, styles.miniCoverFallback, { marginTop: idx * -8, zIndex: covers.length - idx }]}
                >
                  <Feather name="book" size={10} color={COLORS.secondaryLightGreyHex} />
                </View>
              );
            })
          ) : (
            <View style={[styles.miniCover, styles.miniCoverFallback]}>
              <Feather name="book" size={14} color={COLORS.secondaryLightGreyHex} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyTwins: React.FC<{ styles: any }> = ({ styles }) => (
  <View style={styles.emptyCard}>
    <Text style={styles.emptyIcon}>🔄</Text>
    <Text style={styles.emptyTitle}>No twins yet</Text>
    <Text style={styles.emptyBody}>
      Your reading twins will appear here once the daily matching runs.
      Add more books to your shelves to improve your matches!
    </Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ReadingTwins: React.FC = () => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const navigation = useNavigation<any>();

  const userDetails = useStore((state: any) => state.userDetails);
  const myUsername = userDetails?.[0]?.userUniqueUserName || '';
  const myName = userDetails?.[0]?.userName || 'Me';
  const myProfilePic = userDetails?.[0]?.profilePic;
  const analytics = useAnalytics();

  const [twins, setTwins] = useState<Twin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [sharingTwin, setSharingTwin] = useState<Twin | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const storyRef = useRef<View>(null);

  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideTooltip = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowTooltip(false);
    });
  }, [tooltipOpacity]);

  const showInfoTooltip = useCallback(() => {
    if (showTooltip) {
      hideTooltip();
      return;
    }
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setShowTooltip(true);
    Animated.timing(tooltipOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    tooltipTimeoutRef.current = setTimeout(() => {
      hideTooltip();
    }, 3500);
  }, [showTooltip, hideTooltip, tooltipOpacity]);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  const fetchTwins = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await instance.get(requests.fetchReadingTwins);
      setTwins(res.data.data.twins ?? []);
    } catch (err) {
      setError('Failed to load reading twins. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTwins();
  }, [fetchTwins]);

  const handleRefresh = useCallback(() => fetchTwins(true), [fetchTwins]);

  const handleShareTwin = useCallback(
    async (twin: Twin) => {
      setSharingTwin(twin);
      setIsGeneratingStory(true);

      setTimeout(async () => {
        try {
          await shareToplatform({
            platform: 'instagram-stories',
            content: {
              title: 'My Reading Twin on Biblophile',
              message: `I found my ${Math.round(twin.matchScore * 100)}% Reading Twin on Biblophile! 📚 See our match: https://biblophile.com/twin/${myUsername}`,
              url: `https://biblophile.com/twin/${myUsername}`,
            },
            screenshotRef: storyRef,
          });
          analytics.track('twin_card_shared', {
            match_score: twin.matchScore,
            twin_user_id: twin.userId,
            platform: 'instagram-stories',
          });
        } catch (err) {
          console.error('Error sharing twin story:', err);
        } finally {
          setIsGeneratingStory(false);
        }
      }, 450);
    },
    [myUsername, analytics]
  );

  const handleShareInviteLink = useCallback(async () => {
    try {
      await shareToplatform({
        platform: 'native',
        content: {
          title: 'Are we Reading Twins? 📚',
          message: `Are we Reading Twins? Compare your reading taste with mine on Biblophile.`,
          url: `https://biblophile.com/twin/${myUsername}`,
        },
      });
      analytics.track('compare_link_shared', { my_user_name: myUsername });
    } catch (err) {
      console.error('Error sharing invite link:', err);
    }
  }, [myUsername, analytics]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Feather name="alert-circle" size={36} color={COLORS.primaryRedHex} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchTwins()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={hideTooltip}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primaryOrangeHex]}
            tintColor={COLORS.primaryOrangeHex}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Reading Twins</Text>
            <View style={styles.betaBadge}>
              <Text style={styles.betaText}>Beta</Text>
            </View>
            <View style={styles.infoWrapper}>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={showInfoTooltip}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Scores update info"
              >
                <Feather name="info" size={15} color={COLORS.secondaryLightGreyHex} />
              </TouchableOpacity>

              {showTooltip && (
                <Animated.View style={[styles.tooltipBubble, { opacity: tooltipOpacity }]}>
                  <View style={styles.tooltipArrow} />
                  <Text style={styles.tooltipText}>Scores update nightly</Text>
                </Animated.View>
              )}
            </View>
          </View>

          <Text style={styles.headerSubtitle}>
            People who've read the most books in common with you
          </Text>

          {/* Invite Friends Banner */}
          {myUsername ? (
            <View style={styles.inviteBanner}>
              <View style={styles.inviteBannerContent}>
                <Text style={styles.inviteBannerTitle}>Are your friends your twins?</Text>
                <Text style={styles.inviteBannerSubtitle}>
                  Share your personal link and let friends compare their taste with yours!
                </Text>
              </View>
              <TouchableOpacity
                style={styles.inviteBannerBtn}
                onPress={handleShareInviteLink}
                activeOpacity={0.85}
              >
                <Feather name="share-2" size={14} color={COLORS.primaryWhiteHex} />
                <Text style={styles.inviteBannerBtnText}>Compare With Friends</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Twins list */}
        {twins.length === 0 ? (
          <EmptyTwins styles={styles} />
        ) : (
          twins.map(twin => (
            <TwinCard
              key={twin.userId}
              twin={twin}
              COLORS={COLORS}
              styles={styles}
              onPress={() => navigation.push('ProfileSummary', { username: twin.userName })}
              onShare={handleShareTwin}
            />
          ))
        )}

        {/* Offscreen 9:16 story container for captureRef */}
        {sharingTwin && (
          <View style={styles.offscreenStory} pointerEvents="none">
            <ReadingTwinStoryTemplate
              ref={storyRef}
              myName={myName}
              myUserName={myUsername}
              myProfilePic={myProfilePic}
              twinName={sharingTwin.name}
              twinUserName={sharingTwin.userName}
              twinProfilePic={sharingTwin.userProfilePic}
              matchScore={sharingTwin.matchScore}
              sharedWorks={sharingTwin.sharedWorks}
              covers={sharingTwin.theyAlsoRead}
            />
          </View>
        )}
      </ScrollView>

      {/* Backdrop to dismiss tooltip on tapping elsewhere */}
      {showTooltip && (
        <TouchableWithoutFeedback onPress={hideTooltip}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default ReadingTwins;

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    rootContainer: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
      position: 'relative',
    },
    container: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
    },
    scrollContent: {
      paddingHorizontal: SPACING.space_16,
      paddingBottom: SPACING.space_36,
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING.space_32,
    },

    // Header
    headerSection: {
      paddingTop: SPACING.space_20,
      paddingBottom: SPACING.space_20,
      zIndex: 10,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.space_8,
    },
    headerTitle: {
      fontSize: FONTSIZE.size_28,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
    },
    betaBadge: {
      backgroundColor: COLORS.primaryOrangeHex + '20',
      borderColor: COLORS.primaryOrangeHex + '60',
      borderWidth: 1,
      borderRadius: BORDERRADIUS.radius_4,
      paddingHorizontal: 6,
      paddingVertical: 1,
      marginLeft: SPACING.space_8,
      alignSelf: 'center',
    },
    betaText: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryOrangeHex,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoWrapper: {
      position: 'relative',
      zIndex: 20,
    },
    infoButton: {
      padding: SPACING.space_4,
      marginLeft: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tooltipBubble: {
      position: 'absolute',
      top: 30,
      right: -4,
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_8,
      paddingVertical: 6,
      paddingHorizontal: SPACING.space_10,
      borderWidth: 1,
      borderColor: COLORS.primaryOrangeHex + '40',
      zIndex: 100,
      elevation: 8,
      shadowColor: COLORS.primaryBlackHex,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 165,
    },
    tooltipArrow: {
      position: 'absolute',
      top: -5,
      right: 8,
      width: 10,
      height: 10,
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderLeftWidth: 1,
      borderTopWidth: 1,
      borderLeftColor: COLORS.primaryOrangeHex + '40',
      borderTopColor: COLORS.primaryOrangeHex + '40',
      transform: [{ rotate: '45deg' }],
    },
    tooltipText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.primaryWhiteHex,
    },
    headerSubtitle: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      lineHeight: 22,
      marginBottom: SPACING.space_12,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
      zIndex: 50,
    },

    // Invite banner
    inviteBanner: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_15,
      padding: SPACING.space_16,
      marginTop: SPACING.space_16,
      borderWidth: 1,
      borderColor: COLORS.primaryOrangeHex + '40',
      flexDirection: 'column',
      gap: SPACING.space_12,
    },
    inviteBannerContent: {
      width: '100%',
    },
    inviteBannerTitle: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
      marginBottom: 2,
    },
    inviteBannerSubtitle: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      lineHeight: 16,
    },
    inviteBannerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.primaryOrangeHex,
      paddingVertical: SPACING.space_8,
      paddingHorizontal: SPACING.space_16,
      borderRadius: BORDERRADIUS.radius_8,
      gap: SPACING.space_8,
      alignSelf: 'flex-start',
    },
    inviteBannerBtnText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },

    // Card
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_15,
      padding: SPACING.space_16,
      marginBottom: SPACING.space_12,
    },

    // Avatar
    avatarContainer: {
      marginRight: SPACING.space_12,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    avatarFallback: {
      backgroundColor: COLORS.primaryGreyHex,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Middle
    cardMiddle: {
      flex: 1,
      marginRight: SPACING.space_12,
    },
    twinName: {
      fontSize: FONTSIZE.size_16,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      marginBottom: 2,
    },
    twinUsername: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.primaryLightGreyHex,
      marginBottom: SPACING.space_8,
    },
    sharedBooks: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.secondaryLightGreyHex,
      marginBottom: SPACING.space_8,
    },
    matchBarRowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_8,
    },
    cardShareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primaryOrangeHex + '20',
      paddingVertical: 3,
      paddingHorizontal: SPACING.space_8,
      borderRadius: BORDERRADIUS.radius_8,
      gap: 4,
    },

    // Match bar
    matchBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_8,
    },
    matchBarTrack: {
      flex: 1,
      height: 6,
      borderRadius: BORDERRADIUS.radius_4,
      backgroundColor: COLORS.primaryGreyHex,
      overflow: 'hidden',
    },
    matchBarFill: {
      height: '100%',
      borderRadius: BORDERRADIUS.radius_4,
      backgroundColor: COLORS.primaryOrangeHex,
    },
    matchPct: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryOrangeHex,
      minWidth: 62,
    },

    // Offscreen story
    offscreenStory: {
      position: 'absolute',
      left: -9999,
      top: -9999,
    },

    // They also read
    alsoReadSection: {
      alignItems: 'center',
    },
    alsoReadLabel: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.primaryLightGreyHex,
      marginBottom: SPACING.space_8,
    },
    coverStack: {
      alignItems: 'center',
    },
    miniCover: {
      width: 32,
      height: 44,
      borderRadius: BORDERRADIUS.radius_4,
      borderWidth: 1,
      borderColor: COLORS.primaryBlackHex,
    },
    miniCoverFallback: {
      backgroundColor: COLORS.primaryGreyHex,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Empty state
    emptyCard: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_15,
      padding: SPACING.space_24,
      alignItems: 'center',
      marginTop: SPACING.space_20,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: SPACING.space_16,
    },
    emptyTitle: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_12,
    },
    emptyBody: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      textAlign: 'center',
      lineHeight: 22,
    },

    // Error
    errorText: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_medium,
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
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
  });