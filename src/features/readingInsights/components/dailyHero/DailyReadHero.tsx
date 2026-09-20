import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useStore } from '../../../../store/store';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';
import { convertHttpToHttps } from '../../../../utils/convertHttpToHttps';
import GlassEffect from '../../../../components/GlassEffect';
import { useStreak } from '../../../../hooks/useStreak';
import StreakCelebration from '../../../../components/StreakCelebration';
import DailyNoteBottomSheet from '../currentReads/DailyNoteBottomSheet';
import BookStatusModal from '../../../reading/components/BookStatusModal';
import QuickLogModal from './QuickLogModal';
import AddCurrentReadModal from './AddCurrentReadModal';
import { useAnalytics } from '../../../../utils/analytics';
import { cancelNightlyNudge } from '../../../../utils/notificationUtils';

interface DailyReadHeroProps {
  onFullWeekComplete?: () => void;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const DailyReadHero: React.FC<DailyReadHeroProps> = ({ onFullWeekComplete }) => {
  const navigation = useNavigation<any>();
  const analytics = useAnalytics();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const userDetails = useStore((state: any) => state.userDetails);
  const setLastReadDate = useStore((state: any) => state.setLastReadDate);
  const accessToken = userDetails[0]?.accessToken;
  const userTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // State
  const [currentReads, setCurrentReads] = useState<any[]>([]);
  const [selectedBookIndex, setSelectedBookIndex] = useState(0);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [pagesReadToday, setPagesReadToday] = useState<number>(0);

  // Modals state
  const [isQuickLogVisible, setIsQuickLogVisible] = useState(false);
  const [isAddBookVisible, setIsAddBookVisible] = useState(false);
  const [isBookStatusModalVisible, setIsBookStatusModalVisible] = useState(false);
  const [showDailyNoteSheet, setShowDailyNoteSheet] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<any>(null);

  // Streak hook
  const handleStreakCelebration = useCallback((streakData: any) => {
    setCelebrationData({
      currentStreak: streakData.currentStreak,
      isNewRecord: streakData.isNewRecord,
      streakFreezes: streakData.streakFreezes,
    });
    setShowCelebration(true);
  }, []);

  const {
    currentStreak,
    latestUpdateTime,
    streakFreezes,
    weeklyProgress,
    updateStreak,
  } = useStreak(accessToken, null, null, handleStreakCelebration);

  // Check if logged today
  const hasLoggedToday = useMemo(() => {
    if (!latestUpdateTime) return false;
    const today = new Date();
    const lastUpdate = new Date(latestUpdateTime);
    return (
      today.getFullYear() === lastUpdate.getFullYear() &&
      today.getMonth() === lastUpdate.getMonth() &&
      today.getDate() === lastUpdate.getDate()
    );
  }, [latestUpdateTime]);

  // Fetch current reads (stable callback, zero volatile dependencies)
  const fetchCurrentReads = useCallback(async () => {
    const user = useStore.getState().userDetails?.[0];
    if (!user?.accessToken) return;
    try {
      const response = await instance.get(requests.fetchCurrentReads, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      const list = response.data?.data?.currentReads || [];
      setCurrentReads(list);
      setSelectedBookIndex((prev) => (prev >= list.length ? 0 : prev));
    } catch (error) {
      console.error('Error fetching current reads in DailyReadHero:', error);
    } finally {
      setIsLoadingBooks(false);
    }
  }, []);

  // Fetch today's pages read (stable callback, zero volatile dependencies)
  const fetchTodayPages = useCallback(async () => {
    const user = useStore.getState().userDetails?.[0];
    if (!user?.accessToken || !user?.userId) return;
    try {
      const response = await instance.get(
        `${requests.fetchPagesRead}?${user.userId}&timezone=${userTimezone}`,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      if (Array.isArray(response.data?.data)) {
        const currentDate = new Date().setHours(0, 0, 0, 0);
        const todayEntry = response.data.data.find((item: any) => {
          return new Date(item.dateRead).setHours(0, 0, 0, 0) === currentDate;
        });
        setPagesReadToday(todayEntry ? todayEntry.pagesRead : 0);
      }
    } catch (error) {
      console.error('Error fetching pages read in DailyReadHero:', error);
    }
  }, [userTimezone]);

  useFocusEffect(
    useCallback(() => {
      fetchCurrentReads();
      fetchTodayPages();
    }, [fetchCurrentReads, fetchTodayPages])
  );

  const activeBook = currentReads[selectedBookIndex] || currentReads[0];

  // Calculate percentage
  const activeBookProgress = useMemo(() => {
    if (!activeBook) return { percentage: 0, current: 0, total: 0, unit: 'pages' };

    const rawCurrent = activeBook.ProgressValue ?? activeBook.progressValue ?? 0;
    const current = typeof rawCurrent === 'number' ? rawCurrent : parseInt(rawCurrent, 10) || 0;
    const total = activeBook.BookPages ?? activeBook.bookPages ?? 0;
    const unit = activeBook.ProgressUnit ?? activeBook.progressUnit ?? 'pages';

    let percentage = 0;
    if (unit === 'percentage') {
      percentage = Math.min(100, Math.max(0, current));
    } else if (total > 0) {
      percentage = Math.min(100, Math.round((current / total) * 100));
    }

    return { percentage, current, total, unit };
  }, [activeBook]);

  // Handle successful quick log
  const handleQuickLogSuccess = async (newProgress: number, delta: number, isFinished: boolean) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setLastReadDate(todayStr);
    cancelNightlyNudge();

    // Trigger celebration
    try {
      await updateStreak(handleStreakCelebration);
    } catch (err) {
      console.error('Streak update error:', err);
    }

    // Refresh data
    await fetchCurrentReads();
    await fetchTodayPages();

    // Offer to add daily note
    setTimeout(() => {
      setShowDailyNoteSheet(true);
    }, 600);
  };

  const handleBookAdded = async (newBook: any) => {
    await fetchCurrentReads();
    setSelectedBookIndex(0);
    // If user entered pages > 0, update streak
    if (newBook.ProgressValue > 0) {
      const todayStr = new Date().toISOString().slice(0, 10);
      setLastReadDate(todayStr);
      cancelNightlyNudge();
      await updateStreak(handleStreakCelebration);
      await fetchTodayPages();
    }
  };

  // Day class helper for week bar
  const getDayStyle = (index: number) => {
    if (weeklyProgress && weeklyProgress.length === 7) {
      const dayData = weeklyProgress[index];
      if (dayData && dayData.hasRead) {
        if (dayData.type === 'freeze') return styles.freezeDay;
        return styles.filledDay;
      }
    }
    return styles.emptyDay;
  };

  const isTodayIndex = (index: number) => new Date().getDay() === index;

  return (
    <View style={styles.container}>
      <GlassEffect
        glassStyle="regular"
        intensity={30}
        borderRadius={BORDERRADIUS.radius_20}
        style={styles.heroCard}
      >
        {/* Top Meta Bar: Week Streak Dots & Streak Counter */}
        <View style={styles.topMetaBar}>
          <View style={styles.weekDotsRow}>
            {DAYS_OF_WEEK.map((day, idx) => {
              const isToday = isTodayIndex(idx);
              return (
                <View
                  key={idx}
                  style={[
                    styles.dayDot,
                    getDayStyle(idx),
                    isToday && !hasLoggedToday && styles.todayPendingDot,
                    isToday && hasLoggedToday && styles.todayCompletedDot,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayDotText,
                      isToday && styles.todayDotText,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.streakBadge}
            onPress={() => navigation.navigate('Stats')}
            activeOpacity={0.7}
          >
            <Text style={styles.streakBadgeFire}>🔥 {currentStreak || 0}</Text>
            {streakFreezes > 0 && (
              <>
                <View style={styles.badgeDivider} />
                <Text style={styles.freezeBadgeText}>❄️ {streakFreezes}</Text>
              </>
            )}
            <Ionicons name="chevron-forward" size={14} color={COLORS.secondaryLightGreyHex} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardDivider} />

        {/* Content Body Based on State */}
        {isLoadingBooks ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
            <Text style={styles.loadingText}>Loading your reading session...</Text>
          </View>
        ) : currentReads.length === 0 ? (
          /* ========================================================================= */
          /* STATE 1: ZERO BOOKS (ACTIVATION ENGINE - DUOLINGO/UBER DESTINATION STYLE) */
          /* ========================================================================= */
          <View style={styles.zeroStateContainer}>
            <View style={styles.zeroStateHeader}>
              <Text style={styles.zeroStateTitle}>Start Your Daily Reading Habit</Text>
              <Text style={styles.zeroStateSubtitle}>
                What book are you reading right now?
              </Text>
            </View>

            {/* Instant Search Trigger Box */}
            <TouchableOpacity
              style={styles.searchTriggerBox}
              onPress={() => setIsAddBookVisible(true)}
              activeOpacity={0.8}
            >
              <Feather name="search" size={20} color={COLORS.primaryOrangeHex} />
              <Text style={styles.searchTriggerPlaceholder}>
                Search title, author, or ISBN to track...
              </Text>
              <View style={styles.searchGoBadge}>
                <Ionicons name="arrow-forward" size={16} color={COLORS.primaryWhiteHex} />
              </View>
            </TouchableOpacity>

            {/* Quick Starter Actions */}
            <View style={styles.zeroQuickActionsRow}>
              <TouchableOpacity
                style={styles.zeroQuickAction}
                onPress={() =>
                  Linking.openURL('https://biblophile.com/goodreads-import').catch((err) =>
                    console.error('Error opening goodreads import:', err)
                  )
                }
              >
                <Ionicons name="cloud-download-outline" size={15} color={COLORS.secondaryLightGreyHex} />
                <Text style={styles.zeroQuickActionText}>Import Goodreads</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.zeroQuickAction}
                onPress={() => navigation.navigate('Discover')}
              >
                <Ionicons name="compass-outline" size={15} color={COLORS.secondaryLightGreyHex} />
                <Text style={styles.zeroQuickActionText}>Browse Discover</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.activeStateContainer}>
            {/* Multiple Books Switcher Strip */}
            {currentReads.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bookSwitcherRow}
              >
                {currentReads.map((b, idx) => {
                  const isSelected = idx === selectedBookIndex;
                  const title = b.BookName ?? b.bookName ?? b.title ?? `Book ${idx + 1}`;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.switcherChip, isSelected && styles.switcherChipActive]}
                      onPress={() => setSelectedBookIndex(idx)}
                    >
                      <Text
                        style={[
                          styles.switcherChipText,
                          isSelected && styles.switcherChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.addMoreChip}
                  onPress={() => setIsAddBookVisible(true)}
                >
                  <Ionicons name="add" size={16} color={COLORS.primaryOrangeHex} />
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Status Callout Banner */}
            <View
              style={[
                styles.statusCallout,
                hasLoggedToday ? styles.statusCalloutDone : styles.statusCalloutPending,
              ]}
            >
              <Text style={styles.statusCalloutText}>
                {hasLoggedToday
                  ? `✨ Streak secured for today! +${pagesReadToday} pages read`
                  : currentStreak > 0
                  ? `🔥 Day ${currentStreak} streak at risk! Read today to keep it`
                  : `🔥 Start Day 1 of your streak today!`}
              </Text>
            </View>

            {/* Book Info Showcase */}
            <View style={styles.bookHeroRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  navigation.push('Details', {
                    id: activeBook.BookId ?? activeBook.bookId,
                    type: 'Book',
                  })
                }
              >
                {activeBook.BookPhoto || activeBook.bookPhoto ? (
                  <Image
                    source={{
                      uri: convertHttpToHttps(activeBook.BookPhoto || activeBook.bookPhoto),
                    }}
                    style={styles.heroBookCover}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.heroBookCover, styles.placeholderCover]}>
                    <FontAwesome5 name="book" size={28} color={COLORS.primaryLightGreyHex} />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.heroBookDetails}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.push('Details', {
                      id: activeBook.BookId ?? activeBook.bookId,
                      type: 'Book',
                    })
                  }
                >
                  <Text style={styles.heroBookTitle} numberOfLines={2}>
                    {activeBook.BookName ?? activeBook.bookName ?? 'Active Book'}
                  </Text>
                </TouchableOpacity>

                {/* Progress Details */}
                <View style={styles.progressDetailRow}>
                  <Text style={styles.progressNumbers}>
                    {activeBookProgress.unit === 'percentage'
                      ? `${activeBookProgress.percentage}% complete`
                      : `Page ${activeBookProgress.current} of ${activeBookProgress.total || '?'}`}
                  </Text>
                  {activeBookProgress.total > 0 && activeBookProgress.unit !== 'percentage' && (
                    <Text style={styles.progressPercentBadge}>
                      {activeBookProgress.percentage}%
                    </Text>
                  )}
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, Math.max(5, activeBookProgress.percentage))}%` },
                    ]}
                  />
                </View>

                {/* Edit Dates / Editions trigger */}
                <TouchableOpacity
                  style={styles.moreOptionsLink}
                  onPress={() => setIsBookStatusModalVisible(true)}
                >
                  <Text style={styles.moreOptionsText}>Full details & options ⚙️</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* THE ONE CLEAR ACTION BUTTON */}
            <View style={styles.primaryActionSection}>
              <TouchableOpacity
                style={[
                  styles.primaryActionButton,
                  hasLoggedToday && styles.primaryActionButtonDone,
                ]}
                onPress={() => setIsQuickLogVisible(true)}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name={hasLoggedToday ? 'check-circle' : 'menu-book'}
                  size={24}
                  color={COLORS.primaryWhiteHex}
                />
                <Text style={styles.primaryActionText}>
                  {hasLoggedToday ? "UPDATE TODAY'S PAGES" : "LOG TODAY'S READING"}
                </Text>
              </TouchableOpacity>

              {/* Secondary Helper Actions */}
              <View style={styles.secondaryActionsRow}>
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={() => setShowDailyNoteSheet(true)}
                >
                  <Ionicons name="create-outline" size={16} color={COLORS.primaryOrangeHex} />
                  <Text style={styles.secondaryActionText}>Daily Note / Quote</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={() => setIsAddBookVisible(true)}
                >
                  <Ionicons name="add-circle-outline" size={16} color={COLORS.secondaryLightGreyHex} />
                  <Text style={styles.secondaryActionText}>+ New Book</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </GlassEffect>

      {/* Confetti Celebration */}
      <StreakCelebration
        visible={showCelebration}
        streakCount={celebrationData?.currentStreak || currentStreak || 1}
        isNewRecord={celebrationData?.isNewRecord || false}
        onAnimationComplete={() => setShowCelebration(false)}
      />

      {/* Quick Log Modal */}
      {activeBook && (
        <QuickLogModal
          visible={isQuickLogVisible}
          onClose={() => setIsQuickLogVisible(false)}
          book={activeBook}
          onLogSuccess={handleQuickLogSuccess}
        />
      )}

      {/* Add New Current Read Modal */}
      <AddCurrentReadModal
        visible={isAddBookVisible}
        onClose={() => setIsAddBookVisible(false)}
        onBookAdded={handleBookAdded}
      />

      {/* Daily Note Bottom Sheet */}
      <DailyNoteBottomSheet
        visible={showDailyNoteSheet}
        onClose={() => setShowDailyNoteSheet(false)}
        userDetails={userDetails}
      />

      {/* Comprehensive Book Status Modal (for full dates/shelf switches) */}
      {activeBook && (
        <BookStatusModal
          visible={isBookStatusModalVisible}
          onClose={() => setIsBookStatusModalVisible(false)}
          bookId={String(activeBook.BookId ?? activeBook.bookId)}
          workId={String(activeBook.WorkId ?? activeBook.workId ?? '')}
          initialStatus="Currently reading"
          initialProgressUnit={activeBook.ProgressUnit ?? activeBook.progressUnit ?? 'pages'}
          initialProgressValue={activeBook.ProgressValue ?? activeBook.progressValue ?? 0}
          initialStartDate={activeBook.StartDate ?? activeBook.startDate}
          userBookId={activeBook.UserbookId ?? activeBook.userbookId}
          bookTitle={activeBook.BookName ?? activeBook.bookName}
          onUpdate={async () => {
            await fetchCurrentReads();
            await fetchTodayPages();
            setIsBookStatusModalVisible(false);
          }}
        />
      )}
    </View>
  );
};

export default DailyReadHero;

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: SPACING.space_16,
      marginTop: SPACING.space_8,
      marginBottom: SPACING.space_16,
    },
    heroCard: {
      backgroundColor: 'rgba(26, 30, 38, 0.78)',
      borderRadius: BORDERRADIUS.radius_20,
      padding: SPACING.space_16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      shadowColor: COLORS.primaryOrangeHex,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 6,
    },
    topMetaBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    weekDotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dayDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyDay: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    filledDay: {
      backgroundColor: COLORS.primaryOrangeHex,
    },
    freezeDay: {
      backgroundColor: '#38BDF8',
    },
    todayPendingDot: {
      borderColor: COLORS.primaryOrangeHex,
      borderWidth: 1.5,
    },
    todayCompletedDot: {
      backgroundColor: COLORS.primaryOrangeHex,
      shadowColor: COLORS.primaryOrangeHex,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 6,
      elevation: 4,
    },
    dayDotText: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: 10,
      color: COLORS.secondaryLightGreyHex,
    },
    todayDotText: {
      color: COLORS.primaryWhiteHex,
      fontWeight: 'bold',
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      paddingHorizontal: SPACING.space_10,
      paddingVertical: SPACING.space_4,
      borderRadius: BORDERRADIUS.radius_15,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      gap: 6,
    },
    streakBadgeFire: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryOrangeHex,
    },
    badgeDivider: {
      width: 1,
      height: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    freezeBadgeText: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_12,
      color: '#38BDF8',
    },
    cardDivider: {
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      marginVertical: SPACING.space_12,
    },
    loadingBox: {
      paddingVertical: SPACING.space_30,
      alignItems: 'center',
      gap: SPACING.space_8,
    },
    loadingText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
    /* Zero state */
    zeroStateContainer: {
      paddingVertical: SPACING.space_8,
    },
    zeroStateHeader: {
      marginBottom: SPACING.space_15,
    },
    zeroStateTitle: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_18,
      color: COLORS.primaryWhiteHex,
      marginBottom: 2,
    },
    zeroStateSubtitle: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: 13,
      color: COLORS.secondaryLightGreyHex,
    },
    searchTriggerBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(209, 120, 66, 0.12)',
      borderRadius: BORDERRADIUS.radius_15,
      paddingHorizontal: SPACING.space_15,
      paddingVertical: SPACING.space_15,
      borderWidth: 1.5,
      borderColor: COLORS.primaryOrangeHex,
      marginBottom: SPACING.space_15,
    },
    searchTriggerPlaceholder: {
      flex: 1,
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryWhiteHex,
      marginLeft: SPACING.space_10,
    },
    searchGoBadge: {
      backgroundColor: COLORS.primaryOrangeHex,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    zeroQuickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: SPACING.space_16,
    },
    zeroQuickAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: SPACING.space_4,
    },
    zeroQuickActionText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
      textDecorationLine: 'underline',
    },
    /* Active State */
    activeStateContainer: {},
    bookSwitcherRow: {
      gap: SPACING.space_8,
      marginBottom: SPACING.space_10,
    },
    switcherChip: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      paddingHorizontal: SPACING.space_12,
      paddingVertical: SPACING.space_4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      maxWidth: 160,
    },
    switcherChipActive: {
      backgroundColor: 'rgba(209, 120, 66, 0.2)',
      borderColor: COLORS.primaryOrangeHex,
    },
    switcherChipText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: 11,
      color: COLORS.secondaryLightGreyHex,
    },
    switcherChipTextActive: {
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryOrangeHex,
    },
    addMoreChip: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    statusCallout: {
      paddingHorizontal: SPACING.space_12,
      paddingVertical: 6,
      borderRadius: BORDERRADIUS.radius_10,
      marginBottom: SPACING.space_12,
    },
    statusCalloutPending: {
      backgroundColor: 'rgba(209, 120, 66, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(209, 120, 66, 0.3)',
    },
    statusCalloutDone: {
      backgroundColor: 'rgba(52, 211, 153, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(52, 211, 153, 0.25)',
    },
    statusCalloutText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryWhiteHex,
      textAlign: 'center',
    },
    bookHeroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_16,
      marginBottom: SPACING.space_16,
    },
    heroBookCover: {
      width: 74,
      height: 112,
      borderRadius: 8,
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    placeholderCover: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroBookDetails: {
      flex: 1,
    },
    heroBookTitle: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: 17,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_4,
    },
    progressDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    progressNumbers: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
    progressPercentBadge: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryOrangeHex,
    },
    progressBarTrack: {
      height: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 6,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: COLORS.primaryOrangeHex,
      borderRadius: 3,
    },
    moreOptionsLink: {
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    moreOptionsText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: 11,
      color: COLORS.secondaryLightGreyHex,
    },
    /* Primary action */
    primaryActionSection: {
      marginTop: SPACING.space_4,
    },
    primaryActionButton: {
      backgroundColor: COLORS.primaryOrangeHex,
      borderRadius: BORDERRADIUS.radius_15,
      paddingVertical: SPACING.space_15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.space_10,
      shadowColor: COLORS.primaryOrangeHex,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    primaryActionButtonDone: {
      backgroundColor: 'rgba(52, 211, 153, 0.9)',
      shadowColor: '#34D399',
    },
    primaryActionText: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_16,
      color: COLORS.primaryWhiteHex,
      letterSpacing: 0.5,
    },
    secondaryActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: SPACING.space_10,
      paddingHorizontal: SPACING.space_4,
    },
    secondaryActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: SPACING.space_4,
    },
    secondaryActionText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
  });
