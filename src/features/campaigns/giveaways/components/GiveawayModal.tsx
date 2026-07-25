import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../../../../theme/theme';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';
import { useAnalytics } from '../../../../utils/analytics';
import { useStore } from '../../../../store/store';

export interface GiveawayCampaign {
  id: number;
  title: string;
  description: string;
  quantity: number;
  startDate: string;
  endDate: string;
  startDateFormatted?: string;
  endDateFormatted?: string;
  bookId: number;
  bookName: string;
  bookPhoto: string;
  bookDescription: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  giveaway: GiveawayCampaign | null;
  navigation?: any;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getDaysLeft = (endDate: string) => {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

type ModalView = 'detail' | 'claim';

export default function GiveawayModal({ visible, onClose, giveaway, navigation }: Props) {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const analytics = useAnalytics();
  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;

  const [joining, setJoining] = useState(false);
  const [view, setView] = useState<ModalView>('detail');
  // Claim prize form
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!giveaway?.id) return;
    instance.post(requests.trackGiveawayEvent(giveaway.id), { eventType: 'impression' }, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    }).catch(err => console.error("Error logging impression:", err));

    instance.post(requests.trackGiveawayEvent(giveaway.id), { eventType: 'giveaway_pageview' }, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    }).catch(err => console.error("Error logging pageview:", err));
  }, [giveaway?.id, accessToken]);

  if (!giveaway) return null;

  const daysLeft = getDaysLeft(giveaway.endDate);

  const handleJoin = async () => {
    try {
      setJoining(true);
      await instance.post(requests.joinGiveaway(giveaway.id));
      analytics.track('giveaway_entered', { giveaway_id: giveaway.id, title: giveaway.title });
      Toast.show({ type: 'success', text1: "You're in the draw! 🎉", position: 'bottom' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Something went wrong';
      Toast.show({ type: 'error', text1: msg, position: 'bottom' });
    } finally {
      setJoining(false);
    }
  };

  const handleShare = () => {
    const url = `https://biblophile.com/giveaways/${giveaway.id}`;
    Share.share({
      title: giveaway.title,
      message: `Check out this book giveaway 🎁\n\n${giveaway.title}\n${url}`,
    });
    analytics.track('giveaway_shared', { giveaway_id: giveaway.id });
  };

  const handleClaim = async () => {
    if (!shippingAddress.trim() || !contactPhone.trim()) {
      Toast.show({ type: 'error', text1: 'Please fill in all fields', position: 'bottom' });
      return;
    }
    try {
      setClaiming(true);
      await instance.post(requests.claimGiveawayPrize(giveaway.id), {
        shippingAddress,
        contactPhone,
      });
      analytics.track('giveaway_prize_claimed', { giveaway_id: giveaway.id });
      Toast.show({ type: 'success', text1: 'Prize claimed! 🎊 We\'ll be in touch.', position: 'bottom' });
      setView('detail');
      setShippingAddress('');
      setContactPhone('');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Claim failed. Please try again.';
      Toast.show({ type: 'error', text1: msg, position: 'bottom' });
    } finally {
      setClaiming(false);
    }
  };

  const handleClose = () => {
    setView('detail');
    setShippingAddress('');
    setContactPhone('');
    onClose();
  };

  const handleViewBook = () => {
    if (!giveaway?.bookId || !navigation) return;
    handleClose();
    navigation.navigate('Details', {
      id: String(giveaway.bookId),
      type: 'Book',
      giveawayId: giveaway.id,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kavWrapper}
        >
          <View style={styles.modalContainer}>

            {/* ─── CLAIM PRIZE VIEW ─── */}
            {view === 'claim' ? (
              <>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setView('detail')} style={styles.backBtn}>
                    <AntDesign name="arrow-left" size={18} color={COLORS.primaryWhiteHex} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Claim Your Prize</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeIcon}>
                    <AntDesign name="close" size={18} color={COLORS.primaryWhiteHex} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  contentContainerStyle={styles.claimScrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.claimSubtitle}>
                    Congratulations on winning! Enter your details so we can send you{' '}
                    <Text style={styles.highlight}>{giveaway.bookName}</Text>.
                  </Text>

                  <Text style={styles.fieldLabel}>Shipping Address</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Full address including city, state, ZIP / postal code"
                    placeholderTextColor={COLORS.primaryLightGreyHex}
                    multiline
                    numberOfLines={4}
                    value={shippingAddress}
                    onChangeText={setShippingAddress}
                  />

                  <Text style={styles.fieldLabel}>Contact Phone</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="9864075081"
                    placeholderTextColor={COLORS.primaryLightGreyHex}
                    keyboardType="phone-pad"
                    value={contactPhone}
                    onChangeText={setContactPhone}
                  />

                  <TouchableOpacity
                    style={[styles.primaryBtn, claiming && styles.btnDisabled]}
                    onPress={handleClaim}
                    disabled={claiming}
                  >
                    {claiming
                      ? <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
                      : <Text style={styles.primaryBtnText}>Submit Claim</Text>
                    }
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : (
              /* ─── DETAIL VIEW ─── */
              <>
                {/* Book cover image */}
                <View style={styles.imageContainer}>
                  {giveaway.bookPhoto ? (
                    <Image
                      source={{ uri: giveaway.bookPhoto }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                      <Ionicons name="book-outline" size={48} color={COLORS.primaryLightGreyHex} />
                    </View>
                  )}
                  {/* Days left badge */}
                  <View style={[
                    styles.daysBadge,
                    daysLeft <= 3 && styles.daysBadgeUrgent,
                  ]}>
                    <Text style={styles.daysBadgeText}>
                      {daysLeft === 0 ? 'Ends today!' : `${daysLeft}d left`}
                    </Text>
                  </View>
                  {/* Share button */}
                  <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <AntDesign name="share-alt" size={16} color="#fff" />
                  </TouchableOpacity>
                  {/* Close button */}
                  <TouchableOpacity style={styles.closeFloating} onPress={handleClose}>
                    <AntDesign name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* Meta */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaTag}>
                      <Text style={styles.metaTagText}>Giveaway</Text>
                    </View>
                    <View style={styles.metaTag}>
                      <Text style={styles.metaTagText}>{giveaway.quantity} {giveaway.quantity === 1 ? 'copy' : 'copies'}</Text>
                    </View>
                  </View>

                  <Text style={styles.title}>{giveaway.title}</Text>
                  <TouchableOpacity onPress={handleViewBook} activeOpacity={0.7}>
                    <Text style={[styles.bookName, navigation && styles.bookNameLink]}>{giveaway.bookName}</Text>
                  </TouchableOpacity>

                  {/* Dates */}
                  <View style={styles.datesRow}>
                    <Feather name="calendar" size={13} color={COLORS.primaryOrangeHex} />
                    <Text style={styles.dateText}>
                      {formatDate(giveaway.startDate)} — {formatDate(giveaway.endDate)}
                    </Text>
                  </View>

                  {/* Description */}
                  {giveaway.description ? (
                    <Text style={styles.description}>{giveaway.description}</Text>
                  ) : null}

                  {/* CTA Buttons */}
                  <TouchableOpacity
                    style={[styles.primaryBtn, joining && styles.btnDisabled]}
                    onPress={handleJoin}
                    disabled={joining}
                  >
                    {joining
                      ? <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
                      : <Text style={styles.primaryBtnText}>Enter Giveaway</Text>
                    }
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare}>
                    <AntDesign name="share-alt" size={14} color={COLORS.primaryOrangeHex} />
                    <Text style={styles.secondaryBtnText}>Share</Text>
                  </TouchableOpacity>

                  {/* Claim prize CTA — shown for won giveaways */}
                  <TouchableOpacity
                    style={styles.claimPrizeBtn}
                    onPress={() => setView('claim')}
                  >
                    <Ionicons name="trophy-outline" size={14} color="#F5C518" />
                    <Text style={styles.claimPrizeBtnText}>Claim Prize (won)</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
      <Toast />
    </Modal>
  );
}

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    kavWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: '90%',
      overflow: 'hidden',
    },
    // Image area
    imageContainer: {
      position: 'relative',
    },
    image: {
      width: '100%',
      height: 220,
    },
    imagePlaceholder: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      justifyContent: 'center',
      alignItems: 'center',
    },
    daysBadge: {
      position: 'absolute',
      bottom: 12,
      left: 12,
      backgroundColor: 'rgba(209,120,66,0.9)',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    daysBadgeUrgent: {
      backgroundColor: 'rgba(220,53,53,0.9)',
    },
    daysBadgeText: {
      color: '#fff',
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_12,
    },
    shareBtn: {
      position: 'absolute',
      top: 12,
      right: 52,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 20,
      padding: 10,
    },
    closeFloating: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 20,
      padding: 10,
    },
    scrollContent: {
      padding: SPACING.space_20,
      paddingBottom: SPACING.space_36,
    },
    metaRow: {
      flexDirection: 'row',
      gap: SPACING.space_8,
      marginBottom: SPACING.space_10,
    },
    metaTag: {
      backgroundColor: 'rgba(209,120,66,0.15)',
      borderRadius: 20,
      paddingHorizontal: SPACING.space_10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: 'rgba(209,120,66,0.3)',
    },
    metaTagText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryOrangeHex,
    },
    title: {
      fontSize: FONTSIZE.size_20,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_4,
    },
    bookName: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      marginBottom: SPACING.space_10,
    },
    bookNameLink: {
      color: COLORS.primaryOrangeHex,
      textDecorationLine: 'underline',
    },
    datesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_6 || 6,
      marginBottom: SPACING.space_12,
    },
    dateText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.primaryOrangeHex,
    },
    description: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      lineHeight: 22,
      marginBottom: SPACING.space_20,
    },
    primaryBtn: {
      backgroundColor: COLORS.primaryOrangeHex,
      borderRadius: BORDERRADIUS.radius_25,
      paddingVertical: SPACING.space_16,
      alignItems: 'center',
      marginBottom: SPACING.space_12,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    primaryBtnText: {
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_16,
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.space_8,
      borderWidth: 1,
      borderColor: COLORS.primaryOrangeHex,
      borderRadius: BORDERRADIUS.radius_25,
      paddingVertical: SPACING.space_12,
      marginBottom: SPACING.space_12,
    },
    secondaryBtnText: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_14,
    },
    claimPrizeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.space_8,
      backgroundColor: COLORS.primaryGreyHex,
      borderWidth: 1,
      borderColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_25,
      paddingVertical: SPACING.space_12,
    },
    claimPrizeBtnText: {
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_14,
    },
    // Claim view styles
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.space_20,
      paddingTop: SPACING.space_20,
      paddingBottom: SPACING.space_16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    headerTitle: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    backBtn: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: SPACING.space_8,
    },
    closeIcon: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: SPACING.space_8,
    },
    claimScrollContent: {
      padding: SPACING.space_20,
      paddingBottom: SPACING.space_36,
    },
    claimSubtitle: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      lineHeight: 22,
      marginBottom: SPACING.space_20,
    },
    highlight: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_semibold,
    },
    fieldLabel: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_8,
    },
    textArea: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_15,
      paddingHorizontal: SPACING.space_16,
      paddingTop: SPACING.space_12,
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_14,
      height: 110,
      textAlignVertical: 'top',
      marginBottom: SPACING.space_16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_15,
      paddingHorizontal: SPACING.space_16,
      height: 52,
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_14,
      marginBottom: SPACING.space_20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
  });