import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import { BORDERRADIUS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useStore } from '../../../../store/store';
import { shareToplatform } from '../../../../utils/share';
import { useAnalytics } from '../../../../utils/analytics';
import { convertHttpToHttps } from '../../../../utils/convertHttpToHttps';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';

interface ReaderDNAShareModalProps {
  visible: boolean;
  onClose: () => void;
  emotions?: any[];
  userBooks?: any[];
}

const getArchetype = (topEmotion: string) => {
  const norm = (topEmotion || '').toLowerCase();
  if (norm.includes('joy') || norm.includes('happy')) return { title: 'The Comfort Seeker', emoji: '☀️' };
  if (norm.includes('sad') || norm.includes('melancholy')) return { title: 'The Deep Feeler', emoji: '🌧️' };
  if (norm.includes('fear') || norm.includes('dark')) return { title: 'The Midnight Sleuth', emoji: '🔍' };
  if (norm.includes('anticipation') || norm.includes('fast')) return { title: 'The Thrill Addict', emoji: '⚡' };
  if (norm.includes('surprise') || norm.includes('complex')) return { title: 'The Plot Twist Hunter', emoji: '🎭' };
  if (norm.includes('nostalgia')) return { title: 'The Vintage Romantic', emoji: '📼' };
  if (norm.includes('empathy')) return { title: 'The Soulful Empath', emoji: '💫' };
  return { title: 'The Eclectic Explorer', emoji: '📚' };
};

const EMOTION_COLORS = ['#FF7E5F', '#42D1D1', '#FFBC42', '#9C4DD4', '#45B69C'];

const ReaderDNAShareModal: React.FC<ReaderDNAShareModalProps> = ({
  visible,
  onClose,
  emotions: propEmotions,
  userBooks: propUserBooks,
}) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const analytics = useAnalytics();
  const userDetails = useStore((state: any) => state.userDetails);

  const myUsername = userDetails?.[0]?.userName || userDetails?.[0]?.userUniqueUserName || '';
  const myName = userDetails?.[0]?.name || 'Reader';
  const myProfilePic = userDetails?.[0]?.userProfilePic;

  const storyRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [emotions, setEmotions] = useState<any[]>(propEmotions || []);
  const [genres, setGenres] = useState<string[]>([]);
  const [signatureBooks, setSignatureBooks] = useState<any[]>([]);

  useEffect(() => {
    if (!visible) return;

    // Load emotions if needed
    if (!propEmotions || propEmotions.length === 0) {
      instance
        .get(`${requests.fetchAverageEmotionsByUser}${userDetails[0]?.userId}&timeFrame=all-time`)
        .then((res) => {
          if (res.data?.data?.topEmotions) setEmotions(res.data.data.topEmotions);
        })
        .catch(() => {});
    } else {
      setEmotions(propEmotions);
    }

    // Load genres
    instance
      .get(requests.fetchGenreStats, {
        headers: { Authorization: `Bearer ${userDetails[0]?.accessToken}` },
      })
      .then((res) => {
        const items = res.data?.data?.items || [];
        const topGenres = items
          .slice(0, 4)
          .map((g: any) => g.genreName || g.name)
          .filter(Boolean);
        setGenres(topGenres);
      })
      .catch(() => {});

    // Load books if needed
    if (!propUserBooks || propUserBooks.length === 0) {
      instance
        .get(requests.fetchUserBooks, {
          params: { userId: userDetails[0]?.userId, timeFrame: 'all-time' },
        })
        .then((res) => {
          const list = res.data?.data?.userBooks || [];
          setSignatureBooks(list.slice(0, 3));
        })
        .catch(() => {});
    } else {
      setSignatureBooks(propUserBooks.slice(0, 3));
    }
  }, [visible, propEmotions, propUserBooks, userDetails]);

  const topEmotion = emotions[0]?.Emotion || 'Joy';
  const archetype = getArchetype(topEmotion);

  const totalEmotionCount = emotions.reduce(
    (sum, item) => sum + (item.EmotionCount || 1),
    0
  ) || 1;

  const handleShareStory = async () => {
    if (!storyRef.current || isSharing) return;
    setIsSharing(true);
    try {
      await new Promise((res) => requestAnimationFrame(res));
      await shareToplatform({
        platform: 'instagram-stories',
        content: {
          title: 'My Reader DNA on Biblophile',
          message: `Check out my Reader DNA on Biblophile! Compare reading taste with me: https://biblophile.com/twin/${myUsername}`,
          url: `https://biblophile.com/twin/${myUsername}`,
        },
        screenshotRef: storyRef,
      });
      analytics.track('reader_dna_shared', {
        platform: 'instagram-stories',
        archetype: archetype.title,
      });
    } catch (err) {
      console.error('Error sharing Reader DNA story:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareNative = async () => {
    try {
      await shareToplatform({
        platform: 'native',
        content: {
          title: 'My Reader DNA 📚',
          message: `I'm "${archetype.title}" on Biblophile! Compare your reading taste with mine: https://biblophile.com/twin/${myUsername}`,
          url: `https://biblophile.com/twin/${myUsername}`,
        },
      });
      analytics.track('reader_dna_shared', {
        platform: 'native',
        archetype: archetype.title,
      });
    } catch (err) {
      console.error('Error sharing Reader DNA link:', err);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Your Reader DNA</Text>
              <Text style={styles.sheetSubtitle}>Share your taste fingerprint with friends</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={20} color={COLORS.secondaryLightGreyHex} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ─── 9:16 Story Card ─── */}
            <View ref={storyRef} collapsable={false} style={styles.storyCard}>
              {/* Header */}
              <View style={styles.storyHeader}>
                <View style={styles.brandRow}>
                  <Text style={styles.brandLogo}>📚 BIBLOPHILE</Text>
                  <View style={styles.dnaPill}>
                    <Text style={styles.dnaPillText}>READER DNA</Text>
                  </View>
                </View>

                {/* Profile row */}
                <View style={styles.profileRow}>
                  {myProfilePic ? (
                    <Image
                      source={{ uri: convertHttpToHttps(myProfilePic) }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Feather name="user" size={20} color={COLORS.secondaryLightGreyHex} />
                    </View>
                  )}
                  <View style={styles.profileText}>
                    <Text style={styles.userNameText}>{myName}</Text>
                    <Text style={styles.userHandleText}>@{myUsername}</Text>
                  </View>
                </View>
              </View>

              {/* Archetype Banner */}
              <View style={styles.archetypeContainer}>
                <Text style={styles.archetypeEmoji}>{archetype.emoji}</Text>
                <Text style={styles.archetypeLabel}>READER ARCHETYPE</Text>
                <Text style={styles.archetypeTitle}>{archetype.title}</Text>
              </View>

              {/* Emotions / Vibe Breakdown */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeader}>EMOTIONAL PALETTE</Text>
                <View style={styles.emotionsList}>
                  {(emotions.length > 0
                    ? emotions.slice(0, 3)
                    : [
                        { Emotion: 'Joy', EmotionCount: 10 },
                        { Emotion: 'Anticipation', EmotionCount: 6 },
                        { Emotion: 'Nostalgia', EmotionCount: 4 },
                      ]
                  ).map((em, idx) => {
                    const pct = Math.round(((em.EmotionCount || 1) / totalEmotionCount) * 100);
                    const color = EMOTION_COLORS[idx % EMOTION_COLORS.length];
                    return (
                      <View key={em.Emotion} style={styles.emotionRow}>
                        <View style={styles.emotionLabelRow}>
                          <Text style={styles.emotionName}>{em.Emotion}</Text>
                          <Text style={[styles.emotionPct, { color }]}>{pct}%</Text>
                        </View>
                        <View style={styles.track}>
                          <View
                            style={[
                              styles.fill,
                              { width: `${Math.min(pct, 100)}%`, backgroundColor: color },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Genres */}
              {genres.length > 0 && (
                <View style={styles.cardSection}>
                  <Text style={styles.sectionHeader}>FAVORITE REALMS</Text>
                  <View style={styles.genreRow}>
                    {genres.slice(0, 3).map((g) => (
                      <View key={g} style={styles.genreBadge}>
                        <Text style={styles.genreBadgeText}>{g}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Signature Reads */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeader}>RECENT READS</Text>
                <View style={styles.booksRow}>
                  {(signatureBooks.length > 0
                    ? signatureBooks
                    : [
                        { bookId: '1', photo: null },
                        { bookId: '2', photo: null },
                        { bookId: '3', photo: null },
                      ]
                  ).map((b, idx) => {
                    const coverUri = b.photo || b.ProductPhoto ? convertHttpToHttps(b.photo || b.ProductPhoto) : null;
                    return (
                      <View key={b.bookId || idx} style={styles.coverWrapper}>
                        {coverUri ? (
                          <Image
                            source={{ uri: coverUri }}
                            style={styles.bookCover}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.bookCover, styles.bookFallback]}>
                            <Feather name="book" size={20} color={COLORS.secondaryLightGreyHex} />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Footer CTA */}
              <View style={styles.storyFooter}>
                <View style={styles.footerLinkBox}>
                  <Feather name="link" size={12} color={COLORS.primaryOrangeHex} />
                  <Text style={styles.footerUrl}>biblophile.com/twin/{myUsername}</Text>
                </View>
                <Text style={styles.footerSub}>Compare your reading taste with mine</Text>
              </View>
            </View>

            {/* ─── Share Buttons ─── */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.instagramBtn}
                onPress={handleShareStory}
                activeOpacity={0.85}
                disabled={isSharing}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
                ) : (
                  <>
                    <Ionicons name="logo-instagram" size={18} color={COLORS.primaryWhiteHex} />
                    <Text style={styles.btnText}>Share to Instagram Story</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nativeShareBtn}
                onPress={handleShareNative}
                activeOpacity={0.85}
              >
                <Feather name="share-2" size={16} color={COLORS.primaryOrangeHex} />
                <Text style={styles.nativeBtnText}>Share Link / Other Apps</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ReaderDNAShareModal;

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      backgroundColor: COLORS.primaryBlackHex,
      borderTopLeftRadius: BORDERRADIUS.radius_25,
      borderTopRightRadius: BORDERRADIUS.radius_25,
      maxHeight: Dimensions.get('window').height * 0.92,
      paddingTop: SPACING.space_16,
      paddingBottom: SPACING.space_28,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.space_24,
      marginBottom: SPACING.space_16,
    },
    sheetTitle: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
    },
    sheetSubtitle: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
    },
    closeBtn: {
      padding: SPACING.space_4,
    },
    scrollContent: {
      alignItems: 'center',
      paddingHorizontal: SPACING.space_16,
      paddingBottom: SPACING.space_24,
    },

    // 9:16 Card
    storyCard: {
      width: 320,
      minHeight: 568,
      backgroundColor: '#0F0F14',
      borderRadius: BORDERRADIUS.radius_20,
      padding: SPACING.space_20,
      borderWidth: 1.5,
      borderColor: COLORS.primaryOrangeHex + '50',
      justifyContent: 'space-between',
    },
    storyHeader: {
      marginBottom: SPACING.space_12,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.space_12,
    },
    brandLogo: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
      letterSpacing: 1.2,
    },
    dnaPill: {
      backgroundColor: COLORS.primaryOrangeHex + '25',
      paddingHorizontal: SPACING.space_8,
      paddingVertical: 2,
      borderRadius: BORDERRADIUS.radius_4,
      borderWidth: 1,
      borderColor: COLORS.primaryOrangeHex + '50',
    },
    dnaPillText: {
      fontSize: 9,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryOrangeHex,
      letterSpacing: 0.8,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_10,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    avatarFallback: {
      backgroundColor: COLORS.primaryGreyHex,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileText: {
      flex: 1,
    },
    userNameText: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    userHandleText: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
    },

    // Archetype
    archetypeContainer: {
      backgroundColor: '#181822',
      borderRadius: BORDERRADIUS.radius_15,
      padding: SPACING.space_12,
      alignItems: 'center',
      marginVertical: SPACING.space_10,
      borderWidth: 1,
      borderColor: COLORS.primaryOrangeHex + '30',
    },
    archetypeEmoji: {
      fontSize: 28,
      marginBottom: 2,
    },
    archetypeLabel: {
      fontSize: 9,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryOrangeHex,
      letterSpacing: 1.2,
    },
    archetypeTitle: {
      fontSize: FONTSIZE.size_16,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
      marginTop: 2,
    },

    // Sections
    cardSection: {
      marginVertical: SPACING.space_8,
    },
    sectionHeader: {
      fontSize: 9,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.secondaryLightGreyHex,
      letterSpacing: 1,
      marginBottom: 6,
    },
    emotionsList: {
      gap: 6,
    },
    emotionRow: {
      gap: 3,
    },
    emotionLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    emotionName: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryWhiteHex,
    },
    emotionPct: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_semibold,
    },
    track: {
      height: 4,
      borderRadius: 2,
      backgroundColor: COLORS.primaryDarkGreyHex,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 2,
    },

    // Genre
    genreRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    genreBadge: {
      backgroundColor: '#1E1E2A',
      paddingVertical: 4,
      paddingHorizontal: SPACING.space_10,
      borderRadius: BORDERRADIUS.radius_10,
      borderWidth: 1,
      borderColor: COLORS.primaryGreyHex + '50',
    },
    genreBadgeText: {
      fontSize: 10,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryWhiteHex,
    },

    // Books
    booksRow: {
      flexDirection: 'row',
      gap: SPACING.space_8,
      justifyContent: 'center',
    },
    coverWrapper: {
      borderRadius: BORDERRADIUS.radius_8,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
    },
    bookCover: {
      width: 64,
      height: 94,
      borderRadius: BORDERRADIUS.radius_8,
    },
    bookFallback: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Footer
    storyFooter: {
      alignItems: 'center',
      marginTop: SPACING.space_12,
      paddingTop: SPACING.space_10,
      borderTopWidth: 1,
      borderTopColor: COLORS.primaryDarkGreyHex,
      gap: 2,
    },
    footerLinkBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: COLORS.primaryOrangeHex + '20',
      paddingHorizontal: SPACING.space_10,
      paddingVertical: 3,
      borderRadius: BORDERRADIUS.radius_8,
    },
    footerUrl: {
      fontSize: 10,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryOrangeHex,
    },
    footerSub: {
      fontSize: 9,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
    },

    // Action buttons
    actionsContainer: {
      width: 320,
      marginTop: SPACING.space_16,
      gap: SPACING.space_10,
    },
    instagramBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.primaryOrangeHex,
      paddingVertical: SPACING.space_12,
      borderRadius: BORDERRADIUS.radius_15,
      gap: SPACING.space_8,
    },
    btnText: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    nativeShareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderWidth: 1,
      borderColor: COLORS.primaryOrangeHex + '50',
      paddingVertical: SPACING.space_12,
      borderRadius: BORDERRADIUS.radius_15,
      gap: SPACING.space_8,
    },
    nativeBtnText: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryOrangeHex,
    },
  });