import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { FONTFAMILY, FONTSIZE } from '../theme/theme';
import { convertHttpToHttps } from '../utils/convertHttpToHttps';

const STORY_WIDTH = 390;
const STORY_HEIGHT = 693; // 9:16

interface TheyAlsoRead {
  workId: number;
  title: string;
  photo?: string;
}

interface ReadingTwinStoryTemplateProps {
  myUserName?: string;
  myName?: string;
  myProfilePic?: string;
  twinName: string;
  twinUserName: string;
  twinProfilePic?: string;
  matchScore: number;
  sharedWorks: number;
  covers?: TheyAlsoRead[];
}

const ReadingTwinStoryTemplate = forwardRef<View, ReadingTwinStoryTemplateProps>(
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
        {/* Ambient background glow */}
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        {/* Top bar branding */}
        <View style={styles.header}>
          <Text style={styles.brand}>biblophile</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>👯‍♀️ READING TWINS</Text>
          </View>
        </View>

        {/* Central comparison card */}
        <View style={styles.card}>
          <Text style={styles.headline}>We're Reading Twins!</Text>
          <Text style={styles.subheadline}>Our reading tastes are in sync</Text>

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
          {covers.length > 0 && (
            <View style={styles.coversSection}>
              <Text style={styles.coversLabel}>BOOKS WE LOVE</Text>
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
          )}
        </View>

        {/* Footer Call to Action */}
        <View style={styles.footer}>
          <Text style={styles.footerPrompt}>Think your taste matches mine?</Text>
          <Text style={styles.footerUrl}>biblophile.com/twin/{myUserName || twinUserName}</Text>
        </View>
      </View>
    );
  }
);

export default ReadingTwinStoryTemplate;

const styles = StyleSheet.create({
  container: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    backgroundColor: '#0C0D14',
    padding: 24,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 126, 95, 0.25)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(103, 139, 244, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  brand: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: 20,
    color: '#FF7E5F',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: 'rgba(255, 126, 95, 0.15)',
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
    backgroundColor: '#161824',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#25293d',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  headline: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  subheadline: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarDuel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 18,
  },
  avatarWrapper: {
    alignItems: 'center',
    width: 80,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
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
    fontSize: 20,
    color: '#FFFFFF',
  },
  avatarLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: 12,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  matchScoreBadge: {
    backgroundColor: '#FF7E5F',
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7E5F',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  matchScoreText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  matchLabel: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sharedBooksPill: {
    backgroundColor: '#202438',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#2e344e',
  },
  sharedBooksText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: 13,
    color: '#F3F4F6',
  },
  coversSection: {
    width: '100%',
    alignItems: 'center',
  },
  coversLabel: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: 10,
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 10,
  },
  coversRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  bookCoverWrapper: {
    width: 64,
    height: 96,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1E2235',
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
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    zIndex: 10,
  },
  footerPrompt: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: 13,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  footerUrl: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: 12,
    color: '#FF7E5F',
  },
});