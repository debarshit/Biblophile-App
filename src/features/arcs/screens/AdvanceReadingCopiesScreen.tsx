import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Feather, Ionicons } from '@expo/vector-icons';

import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../../../theme/theme';

import ArcCard from '../components/ArcCard';
import ArcModal, { ArcCampaign, UserApplication } from '../components/ArcModal';
import ArcHowItWorksModal from '../components/ArcHowItWorksModal';
import HeaderBar from '../../../components/HeaderBar';

interface EligibilityData {
  reviewRate: number;
  totalCompletedOrOverdue: number;
  totalSubmitted: number;
}

const APPLICATION_STATUS_COLORS: Record<string, string> = {
  pending: '#F5C518',
  approved: '#4CAF50',
  rejected: '#DC3535',
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  pending: '📖 Reading',
  submitted: '✅ Review Submitted',
  overdue: '⚠️ Review Overdue',
};

const AdvanceReadingCopiesScreen = ({ navigation }: any) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const route = useRoute<any>();
  const { subPath } = route.params || {};

  const [activeArcs, setActiveArcs] = useState<ArcCampaign[]>([]);
  const [myApps, setMyApps] = useState<UserApplication[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedArc, setSelectedArc] = useState<ArcCampaign | null>(null);
  const [selectedApp, setSelectedApp] = useState<UserApplication | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);

  // ─── Fetch data ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [arcsRes, appsRes, eligRes] = await Promise.allSettled([
        instance.get(requests.getActiveArcCampaigns),
        instance.get(requests.getUserAppliedArcs),
        instance.get(requests.getUserArcEligibility),
      ]);

      if (arcsRes.status === 'fulfilled') {
        setActiveArcs(arcsRes.value.data?.data || []);
      }
      if (appsRes.status === 'fulfilled') {
        setMyApps(appsRes.value.data?.data || []);
      }
      if (eligRes.status === 'fulfilled') {
        setEligibility(eligRes.value.data?.data || null);
      }
    } catch (err) {
      console.warn('Error fetching ARC data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Handle deep-link subPath ─────────────────────────────────────────────
  useEffect(() => {
    if (!subPath) return;
    if (subPath === 'how-it-works') {
      setHowItWorksVisible(true);
      return;
    }
    const found = activeArcs.find(a => String(a.id) === String(subPath));
    if (found) {
      openArc(found);
    } else if (!loading) {
      instance
        .get(requests.getARCById(subPath))
        .then(res => {
          const a = res.data?.data;
          if (a) openArc(a);
        })
        .catch(() =>
          Toast.show({ type: 'error', text1: 'ARC not found', position: 'bottom' })
        );
    }
  }, [subPath, activeArcs, loading]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const openArc = (arc: ArcCampaign) => {
    const userApp = myApps.find(a => a.campaignId === arc.id) || null;
    setSelectedArc(arc);
    setSelectedApp(userApp);
    setModalVisible(true);
  };

  const openArcFromApp = (app: UserApplication) => {
    const matchedArc = activeArcs.find(a => a.id === app.campaignId) || {
      id: app.campaignId,
      title: app.title,
      bookName: app.bookName,
      bookPhoto: app.bookPhoto,
      description: '',
      quantityLimit: 0,
      startDate: '',
      endDate: '',
      bookId: parseInt(app.bookId),
      bookDescription: '',
    };
    setSelectedArc(matchedArc as ArcCampaign);
    setSelectedApp(app);
    setModalVisible(true);
  };

  const closeArc = () => {
    setModalVisible(false);
    setSelectedArc(null);
    setSelectedApp(null);
  };

  const reviewRate = eligibility ? Math.round(eligibility.reviewRate * 100) : null;
  const isEligible = reviewRate === null || reviewRate >= 80;

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <HeaderBar showBackButton title="Advance Reading Copies" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sub-header */}
        <View style={styles.subHeader}>
          <View style={styles.subHeaderLeft}>
            <Text style={styles.screenTitle}>Read Before Anyone Else 📖</Text>
            <Text style={styles.screenSubtitle}>
              Apply to read upcoming books before publication and share your honest review.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.infoBtn}
            onPress={() => setHowItWorksVisible(true)}
          >
            <Feather name="info" size={16} color={COLORS.primaryOrangeHex} />
            <Text style={styles.infoBtnText}>How it works</Text>
          </TouchableOpacity>
        </View>

        {/* Eligibility card */}
        {reviewRate !== null && (
          <View style={[styles.eligibilityCard, !isEligible && styles.eligibilityCardWarn]}>
            <View style={styles.eligibilityLeft}>
              <Text style={styles.eligibilityLabel}>Review Completion Rate</Text>
              <View style={styles.eligibilityBar}>
                <View
                  style={[
                    styles.eligibilityFill,
                    {
                      width: `${Math.min(reviewRate, 100)}%`,
                      backgroundColor: isEligible ? '#4CAF50' : '#DC3535',
                    },
                  ]}
                />
              </View>
              <Text style={styles.eligibilityNote}>
                {isEligible
                  ? `${reviewRate}% — You're eligible for ARCs ✅`
                  : `${reviewRate}% — Must be ≥80% for ARC access ⚠️`}
              </Text>
            </View>
          </View>
        )}

        {/* Active ARC campaigns */}
        <Text style={styles.sectionTitle}>Available ARCs</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.primaryOrangeHex} />
          </View>
        ) : activeArcs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={40} color={COLORS.primaryLightGreyHex} />
            <Text style={styles.emptyTitle}>No active ARC campaigns</Text>
            <Text style={styles.emptySubtitle}>
              Authors launch new campaigns regularly. Check back soon!
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {activeArcs.map(arc => (
              <ArcCard key={arc.id} arc={arc} onPress={openArc} />
            ))}
          </ScrollView>
        )}

        {/* My ARCs & Applications */}
        {myApps.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: SPACING.space_32 }]}>
              My ARCs & Applications
            </Text>
            {myApps.map(app => {
              const appStatusColor = APPLICATION_STATUS_COLORS[app.status] || COLORS.primaryLightGreyHex;
              const reviewLabel = app.reviewStatus ? REVIEW_STATUS_LABELS[app.reviewStatus] : null;

              return (
                <TouchableOpacity
                  key={app.applicationId}
                  style={styles.appCard}
                  onPress={() => openArcFromApp(app)}
                  activeOpacity={0.85}
                >
                  {app.bookPhoto ? (
                    <Image
                      source={{ uri: app.bookPhoto }}
                      style={styles.appCover}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.appCover, styles.appCoverPlaceholder]}>
                      <Ionicons name="book-outline" size={20} color={COLORS.primaryLightGreyHex} />
                    </View>
                  )}
                  <View style={styles.appInfo}>
                    <Text style={styles.appTitle} numberOfLines={2}>{app.title}</Text>
                    <Text style={styles.appBook} numberOfLines={1}>{app.bookName}</Text>

                    <View style={styles.badgeRow}>
                      {/* Application status */}
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: `${appStatusColor}22`, borderColor: appStatusColor },
                      ]}>
                        <Text style={[styles.statusText, { color: appStatusColor }]}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Text>
                      </View>

                      {/* Review status — only when approved */}
                      {app.status === 'approved' && reviewLabel && (
                        <View style={styles.reviewBadge}>
                          <Text style={styles.reviewBadgeText}>{reviewLabel}</Text>
                        </View>
                      )}
                    </View>

                    {/* Due date */}
                    {app.status === 'approved' && app.reviewDueDate && (
                      <Text style={styles.dueDate}>
                        Due: {new Date(app.reviewDueDate).toLocaleDateString('en-US', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </Text>
                    )}

                    {/* Private notes access for approved apps */}
                    {app.status === 'approved' && (
                      <Text style={styles.notesHint}>Tap to open private notes →</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Modals — overlaid above screen */}
      <ArcModal
        visible={modalVisible}
        arc={selectedArc}
        userApplication={selectedApp}
        onClose={closeArc}
      />
      <ArcHowItWorksModal
        visible={howItWorksVisible}
        onClose={() => setHowItWorksVisible(false)}
      />
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
    },
    scrollContent: {
      paddingBottom: SPACING.space_36 * 2,
    },
    subHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: SPACING.space_20,
      paddingTop: SPACING.space_16,
      paddingBottom: SPACING.space_8,
    },
    subHeaderLeft: {
      flex: 1,
      marginRight: SPACING.space_12,
    },
    screenTitle: {
      fontSize: FONTSIZE.size_24,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    screenSubtitle: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      lineHeight: 18,
      marginTop: 2,
    },
    infoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(209,120,66,0.12)',
      borderRadius: 20,
      paddingHorizontal: SPACING.space_12,
      paddingVertical: SPACING.space_8,
      borderWidth: 1,
      borderColor: 'rgba(209,120,66,0.3)',
      marginTop: 2,
    },
    infoBtnText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryOrangeHex,
    },
    // Eligibility card
    eligibilityCard: {
      marginHorizontal: SPACING.space_20,
      marginBottom: SPACING.space_24,
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_20,
      padding: SPACING.space_16,
      borderWidth: 1,
      borderColor: 'rgba(76,175,80,0.3)',
    },
    eligibilityCardWarn: {
      borderColor: 'rgba(220,53,53,0.3)',
    },
    eligibilityLeft: {
      gap: SPACING.space_8,
    },
    eligibilityLabel: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    eligibilityBar: {
      height: 6,
      backgroundColor: COLORS.primaryGreyHex,
      borderRadius: 3,
      overflow: 'hidden',
    },
    eligibilityFill: {
      height: '100%',
      borderRadius: 3,
    },
    eligibilityNote: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
    },
    sectionTitle: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      paddingHorizontal: SPACING.space_20,
      marginBottom: SPACING.space_12,
    },
    loadingContainer: {
      paddingVertical: SPACING.space_36,
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: SPACING.space_36,
      paddingHorizontal: SPACING.space_30,
      gap: SPACING.space_10,
    },
    emptyTitle: {
      fontSize: FONTSIZE.size_16,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    emptySubtitle: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      textAlign: 'center',
      lineHeight: 22,
    },
    horizontalList: {
      paddingHorizontal: SPACING.space_20,
      gap: SPACING.space_16,
      paddingRight: SPACING.space_20,
    },
    // Application cards
    appCard: {
      flexDirection: 'row',
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_20,
      marginHorizontal: SPACING.space_20,
      marginBottom: SPACING.space_12,
      overflow: 'hidden',
    },
    appCover: {
      width: 90,
      height: 120,
    },
    appCoverPlaceholder: {
      backgroundColor: COLORS.primaryGreyHex,
      justifyContent: 'center',
      alignItems: 'center',
    },
    appInfo: {
      flex: 1,
      padding: SPACING.space_12,
      justifyContent: 'space-between',
    },
    appTitle: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    appBook: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: SPACING.space_8,
      flexWrap: 'wrap',
      marginTop: SPACING.space_4,
    },
    statusBadge: {
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderWidth: 1,
    },
    statusText: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_semibold,
    },
    reviewBadge: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    reviewBadgeText: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
    },
    dueDate: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.primaryOrangeHex,
      marginTop: SPACING.space_4,
    },
    notesHint: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.primaryLightGreyHex,
      marginTop: 2,
    },
  });

export default AdvanceReadingCopiesScreen;