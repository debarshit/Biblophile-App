import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';

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
}

const TwinCard: React.FC<TwinCardProps> = ({ twin, COLORS, styles, onPress }) => {
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
        <Text style={styles.sharedBooks}>📚 {twin.sharedWorks} books in common</Text>
        <MatchBar score={twin.matchScore} COLORS={COLORS} styles={styles} />
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

  const [twins, setTwins] = useState<Twin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
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
        <Text style={styles.headerTitle}>Reading Twins</Text>
        <Text style={styles.headerSubtitle}>
          People who've read the most books in common with you
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>💡 Scores update nightly</Text>
        </View>
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
            onPress={() => navigation.push('UserProfile', { userId: twin.userId })}
          />
        ))
      )}
    </ScrollView>
  );
};

export default ReadingTwins;

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (COLORS: any) =>
  StyleSheet.create({
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
    },
    headerTitle: {
      fontSize: FONTSIZE.size_28,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_8,
    },
    headerSubtitle: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      lineHeight: 22,
      marginBottom: SPACING.space_12,
    },
    infoRow: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_8,
      paddingVertical: SPACING.space_8,
      paddingHorizontal: SPACING.space_12,
      alignSelf: 'flex-start',
    },
    infoText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
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