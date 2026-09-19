import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTFAMILY } from '../../theme/theme';
import { convertHttpToHttps } from '../../utils/convertHttpToHttps';
import { ReadingTwinStoryTemplateProps } from './types';

const STORY_WIDTH = 390;
const STORY_HEIGHT = 693; // 9:16

/**
 * VARIANT C: Gradient & Sticker (Rich Dynamic Style)
 * Uses a smooth ambient midnight-plum gradient, scaled hero elements, and an Instagram-style link sticker.
 */
const VariantCGradientSticker = forwardRef<View, ReadingTwinStoryTemplateProps>(
  (
    {
      myName = 'Me',
      myUserName,
      myProfilePic,
      twinName,
      twinUserName,
      twinProfilePic,
      matchScore,
      sharedWorks,
      covers = [],
    },
    ref
  ) => {
    const pct = Math.round(matchScore * 100);
    const myPic = myProfilePic ? convertHttpToHttps(myProfilePic) : null;
    const twinPic = twinProfilePic ? convertHttpToHttps(twinProfilePic) : null;

    return (
      <View
        ref={ref}
        collapsable={false}
        renderToHardwareTextureAndroid={false}
        needsOffscreenAlphaCompositing
        style={styles.container}
      >
        {/* Ambient background gradient */}
        <LinearGradient
          colors={['#191220', '#0E1018', '#07080D']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Top bar branding */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/logo-white.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brand}>biblophile</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>👯‍♀️ READING TWINS</Text>
          </View>
        </View>

        {/* Central comparison card */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.taglineBadge}>
              <Text style={styles.taglineText}>✨ TASTE COMPATIBILITY ✨</Text>
            </View>
            <Text style={styles.headline}>We're Reading Twins!</Text>
            <Text style={styles.subheadline}>Our reading tastes are in sync</Text>
          </View>

          {/* Avatars Duel */}
          <View style={styles.avatarDuel}>
            <View style={styles.avatarWrapper}>
              {myPic ? (
                <Image source={{ uri: myPic }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>{myName.charAt(0)}</Text>
                </View>
              )}
              <Text style={styles.avatarLabel} numberOfLines={1}>
                {myName}
              </Text>
            </View>

            <View style={styles.matchScoreBadge}>
              <Text style={styles.matchScoreText}>{pct}%</Text>
              <Text style={styles.matchLabel}>MATCH</Text>
            </View>

            <View style={styles.avatarWrapper}>
              {twinPic ? (
                <Image source={{ uri: twinPic }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>{twinName.charAt(0)}</Text>
                </View>
              )}
              <Text style={styles.avatarLabel} numberOfLines={1}>
                @{twinUserName}
              </Text>
            </View>
          </View>

          {/* Shared Books Pill */}
          <View style={styles.sharedBooksPill}>
            <Text style={styles.sharedBooksText}>
              📚 {sharedWorks} books in common
            </Text>
          </View>

          {/* Books in Common / Also Read Preview */}
          {covers.length > 0 ? (
            <View style={styles.coversSection}>
              <Text style={styles.coversLabel}>BOOKS WE BOTH LOVE</Text>
              <View style={styles.coversRow}>
                {covers.slice(0, 3).map((book) => {
                  const coverUri = book.photo ? convertHttpToHttps(book.photo) : null;
                  return (
                    <View key={book.workId} style={styles.bookCoverWrapper}>
                      {coverUri ? (
                        <Image source={{ uri: coverUri }} style={styles.bookCover} resizeMode="cover" />
                      ) : (
                        <View style={[styles.bookCover, styles.bookFallback]}>
                          <Text style={styles.bookFallbackText} numberOfLines={2}>
                            {book.title}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.fallbackSection}>
              <Text style={styles.fallbackIcon}>📖</Text>
              <Text style={styles.fallbackTitle}>Soulmate Reading Vibes</Text>
              <Text style={styles.fallbackSubtitle}>
                Similar shelf ratings & genre favorites
              </Text>
            </View>
          )}
        </View>

        {/* Footer Call to Action / Story Link Sticker */}
        <View style={styles.footer}>
          <Text style={styles.footerPrompt}>Think your taste matches mine?</Text>
          <View style={styles.linkSticker}>
            <Text style={styles.linkStickerIcon}>🔗</Text>
            <Text style={styles.linkStickerUrl} numberOfLines={1}>
              biblophile.com/twin/{myUserName || twinUserName}
            </Text>
            <Text style={styles.linkStickerArrow}>➔</Text>
          </View>
        </View>
      </View>
    );
  }
);

export default VariantCGradientSticker;

const styles = StyleSheet.create({
  container: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    backgroundColor: '#0C0D14',
    paddingHorizontal: 22,
    paddingVertical: 20,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 22,
    height: 22,
  },
  brand: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: 20,
    color: '#FF7E5F',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: 'rgba(255, 126, 95, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 126, 95, 0.3)',
  },
  badgeText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: 10,
    color: '#FF7E5F',
    letterSpacing: 0.5,
  },
  card: {
    flex: 1,
    marginVertical: 14,
    backgroundColor: '#151722',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  cardTop: {
    alignItems: 'center',
    width: '100%',
  },
  taglineBadge: {
    backgroundColor: 'rgba(255, 126, 95, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  taglineText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: 9,
    color: '#FF7E5F',
    letterSpacing: 1.5,
  },
  headline: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
  },
  subheadline: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },
  avatarDuel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    width: '100%',
    marginVertical: 4,
  },
  avatarWrapper: {
    alignItems: 'center',
    width: 86,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2.5,
    borderColor: '#FF7E5F',
    marginBottom: 6,
  },
  avatarFallback: {
    backgroundColor: '#25283d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: 24,
    color: '#FFFFFF',
  },
  avatarLabel: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: 12,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  matchScoreBadge: {
    backgroundColor: '#FF7E5F',
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7E5F',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  matchScoreText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  matchLabel: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  sharedBooksPill: {
    backgroundColor: 'rgba(255, 126, 95, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 126, 95, 0.25)',
    marginVertical: 4,
  },
  sharedBooksText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: 13,
    color: '#FFE0D6',
  },
  coversSection: {
    width: '100%',
    alignItems: 'center',
  },
  coversLabel: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: 10,
    color: '#9CA3AF',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  coversRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  bookCoverWrapper: {
    width: 72,
    height: 108,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#1E2235',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  bookCover: {
    width: '100%',
    height: '100%',
  },
  bookFallback: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookFallbackText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  fallbackSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  fallbackIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  fallbackTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: 14,
    color: '#F3F4F6',
  },
  fallbackSubtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: 11,
    color: '#9CA3AF',
  },
  footer: {
    alignItems: 'center',
    zIndex: 10,
    paddingBottom: 2,
  },
  footerPrompt: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  linkSticker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  linkStickerIcon: {
    fontSize: 12,
  },
  linkStickerUrl: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: 12,
    color: '#FF7E5F',
    maxWidth: 240,
  },
  linkStickerArrow: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: 11,
    color: '#FF7E5F',
  },
});
