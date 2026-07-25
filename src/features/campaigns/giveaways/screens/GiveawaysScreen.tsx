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

import instance from '../../../../services/axios';
import requests from '../../../../services/requests';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useStore } from '../../../../store/store';
import {
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../../../../theme/theme';

import GiveawayCard from '../components/GiveawayCard';
import GiveawayModal, { GiveawayCampaign } from '../components/GiveawayModal';
import GiveawayHowItWorksModal from '../components/GiveawayHowItWorksModal';
import HeaderBar from '../../../../components/HeaderBar';

interface UserWin {
  giveawayId: number;
  title: string;
  wonAt: string;
  claimStatus: 'pending' | 'claimed' | 'expired';
  bookName: string;
  bookPhoto: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F5C518',
  claimed: '#4CAF50',
  expired: '#DC3535',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '🏆 Claim Prize',
  claimed: '✅ Claimed',
  expired: '⏳ Expired',
};

const GiveawaysScreen = ({ navigation }: any) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const route = useRoute<any>();
  const { subPath } = route.params || {};

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;

  const [activeGiveaways, setActiveGiveaways] = useState<GiveawayCampaign[]>([]);
  const [myWins, setMyWins] = useState<UserWin[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGiveaway, setSelectedGiveaway] = useState<GiveawayCampaign | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);

  // Deep-link claim view — track which win triggered the claim modal
  const [claimingWin, setClaimingWin] = useState<UserWin | null>(null);

  // ─── Fetch data ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [giveawaysRes, winsRes] = await Promise.allSettled([
        instance.get(requests.getActiveGiveaways),
        instance.get(requests.getUserWonGiveaways),
      ]);

      if (giveawaysRes.status === 'fulfilled') {
        const data = giveawaysRes.value.data?.data || [];
        setActiveGiveaways(data);
        if (data.length > 0) {
          data.forEach((g: any) => {
            instance.post(requests.trackGiveawayEvent(g.id), { eventType: 'impression' }, {
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
            }).catch(err => console.error("Error logging impression:", err));

            instance.post(requests.trackGiveawayEvent(g.id), { eventType: 'giveaway_pageview' }, {
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
            }).catch(err => console.error("Error logging pageview:", err));
          });
        }
      }
      if (winsRes.status === 'fulfilled') {
        setMyWins(winsRes.value.data?.data || []);
      }
    } catch (err) {
      console.warn('Error fetching giveaway data:', err);
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
    // Numeric giveaway ID — try list first, then fetch directly
    const found = activeGiveaways.find(g => String(g.id) === String(subPath));
    if (found) {
      setSelectedGiveaway(found);
      setModalVisible(true);
    } else if (!loading) {
      // Fetch individually (e.g., expired campaign deep link)
      instance
        .get(requests.getGiveawayById(subPath))
        .then(res => {
          const g = res.data?.data;
          if (g) {
            setSelectedGiveaway(g);
            setModalVisible(true);
          }
        })
        .catch(() =>
          Toast.show({ type: 'error', text1: 'Giveaway not found', position: 'bottom' })
        );
    }
  }, [subPath, activeGiveaways, loading]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const openGiveaway = (giveaway: GiveawayCampaign) => {
    setSelectedGiveaway(giveaway);
    setModalVisible(true);
  };

  const closeGiveaway = () => {
    setModalVisible(false);
    setSelectedGiveaway(null);
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <HeaderBar showBackButton title="Giveaways" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sub-header */}
        <View style={styles.subHeader}>
          <View style={styles.subHeaderLeft}>
            <Text style={styles.screenTitle}>
              Win Free Books
                        <TouchableOpacity
            style={styles.infoBtn}
            onPress={() => setHowItWorksVisible(true)}
          >
            <Feather name="info" size={16} color={COLORS.primaryOrangeHex} />
          </TouchableOpacity>
            </Text>
            <Text style={styles.screenSubtitle}>
              Browse active book giveaways and track prizes you've won.
            </Text>
          </View>
        </View>

        {/* Active giveaways */}
        <Text style={styles.sectionTitle}>Active Giveaways</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.primaryOrangeHex} />
          </View>
        ) : activeGiveaways.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={40} color={COLORS.primaryLightGreyHex} />
            <Text style={styles.emptyTitle}>No active giveaways</Text>
            <Text style={styles.emptySubtitle}>
              Check back soon — authors run giveaways regularly!
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {activeGiveaways.map(g => (
              <GiveawayCard key={g.id} giveaway={g} onPress={openGiveaway} />
            ))}
          </ScrollView>
        )}

        {/* Prizes I've Won */}
        {myWins.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: SPACING.space_32 }]}>
              🏆 Prizes I've Won
            </Text>
            {myWins.map(win => (
              <View key={win.giveawayId} style={styles.winCard}>
                {win.bookPhoto ? (
                  <Image
                    source={{ uri: win.bookPhoto }}
                    style={styles.winCover}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.winCover, styles.winCoverPlaceholder]}>
                    <Ionicons name="book-outline" size={20} color={COLORS.primaryLightGreyHex} />
                  </View>
                )}
                <View style={styles.winInfo}>
                  <Text style={styles.winTitle} numberOfLines={2}>{win.title}</Text>
                  <Text style={styles.winBook} numberOfLines={1}>{win.bookName}</Text>
                  <View style={styles.winFooter}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: `${STATUS_COLORS[win.claimStatus]}22`, borderColor: STATUS_COLORS[win.claimStatus] },
                    ]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[win.claimStatus] }]}>
                        {win.claimStatus.charAt(0).toUpperCase() + win.claimStatus.slice(1)}
                      </Text>
                    </View>
                    {win.claimStatus === 'pending' && (
                      <TouchableOpacity
                        style={styles.claimBtn}
                        onPress={() => {
                          // Open GiveawayModal in 'claim' view for this giveaway
                          const matchedGiveaway = activeGiveaways.find(
                            g => g.id === win.giveawayId
                          ) || {
                            id: win.giveawayId,
                            title: win.title,
                            bookName: win.bookName,
                            bookPhoto: win.bookPhoto,
                            description: '',
                            quantity: 1,
                            startDate: '',
                            endDate: '',
                            bookId: 0,
                            bookDescription: '',
                          };
                          setSelectedGiveaway(matchedGiveaway as GiveawayCampaign);
                          setModalVisible(true);
                        }}
                      >
                        <Text style={styles.claimBtnText}>Claim Prize</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Modals — overlaid above screen */}
      <GiveawayModal
        visible={modalVisible}
        giveaway={selectedGiveaway}
        onClose={closeGiveaway}
        navigation={navigation}
      />
      <GiveawayHowItWorksModal
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
      paddingHorizontal: SPACING.space_4,
      paddingVertical: SPACING.space_8,
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
    // Win cards
    winCard: {
      flexDirection: 'row',
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_20,
      marginHorizontal: SPACING.space_20,
      marginBottom: SPACING.space_12,
      overflow: 'hidden',
    },
    winCover: {
      width: 90,
      height: 110,
    },
    winCoverPlaceholder: {
      backgroundColor: COLORS.primaryGreyHex,
      justifyContent: 'center',
      alignItems: 'center',
    },
    winInfo: {
      flex: 1,
      padding: SPACING.space_12,
      justifyContent: 'space-between',
    },
    winTitle: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    winBook: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
    },
    winFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.space_8,
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
    claimBtn: {
      backgroundColor: '#F5C518',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    claimBtnText: {
      color: '#000',
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_10,
    },
  });

export default GiveawaysScreen;