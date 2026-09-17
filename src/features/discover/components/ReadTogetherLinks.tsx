import React, { useMemo, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useNavigation } from '@react-navigation/native';
import { BORDERRADIUS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAnalytics } from '../../../utils/analytics';

interface ReadTogetherProps {
  id: string;
  isGoogleBook: boolean;
  product: any;
  onBookPromoted?: (newId: string) => void;
}

const ReadTogetherLinks: React.FC<ReadTogetherProps> = ({
  id,
  isGoogleBook,
  product,
  onBookPromoted,
}) => {
  const [loadingAction, setLoadingAction] = useState<'buddy' | 'readalong' | null>(null);
  const navigation = useNavigation<any>();
  const analytics = useAnalytics();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const bookTitle = isGoogleBook
    ? product?.volumeInfo?.title || 'This Book'
    : product?.ProductName || 'This Book';

  const fetchBookId = async (): Promise<string | null> => {
    let fetchedBookId = id;

    if (isGoogleBook) {
      try {
        const workPayload = {
          title: product.volumeInfo?.title || '',
          description: product.volumeInfo?.description || '',
          originalLanguage: 'en',
          authors: product.volumeInfo?.authors || [],
          genres: product.volumeInfo?.categories || [],
          edition: {
            isbn:
              product.volumeInfo?.industryIdentifiers?.find(
                (item: any) => item.type === 'ISBN_13'
              )?.identifier || null,
            format: 'paperback',
            pageCount: product.volumeInfo?.pageCount || null,
            language: 'en',
            publisher: null,
            publicationYear: null,
            cover: product.volumeInfo?.imageLinks?.thumbnail || null,
          },
        };
        const response = await instance.post(requests.createWork, workPayload);
        const bookResponse = response.data;

        if (bookResponse.status === 'success') {
          fetchedBookId = bookResponse.data.bookId;
          onBookPromoted?.(fetchedBookId);
        }
      } catch (error) {
        console.error('Error auto-creating work for social action:', error);
      }
    }

    return fetchedBookId;
  };

  const handleBuddyRead = async () => {
    if (loadingAction) return;
    setLoadingAction('buddy');
    try {
      const currentBookId = await fetchBookId();
      analytics.track('details_buddy_read_clicked', {
        bookId: currentBookId,
        bookTitle,
      });
      if (currentBookId) {
        navigation.navigate('BuddyReadsCreate', { bookId: currentBookId });
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReadalong = async () => {
    if (loadingAction) return;
    setLoadingAction('readalong');
    try {
      const currentBookId = await fetchBookId();
      analytics.track('details_readalong_clicked', {
        bookId: currentBookId,
        bookTitle,
      });
      if (currentBookId) {
        navigation.navigate('ReadAlongsCreate', { bookId: currentBookId });
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLearnMorePress = () => {
    Linking.openURL('https://biblophile.freshdesk.com/support/solutions/articles/1060000111956');
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Feather name="users" size={12} color={COLORS.primaryOrangeHex} />
          <Text style={styles.badgeText}>READ TOGETHER</Text>
        </View>
        <Text style={styles.headerHint}>More fun with friends</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleBuddyRead}
          activeOpacity={0.8}
          disabled={loadingAction !== null}
        >
          {loadingAction === 'buddy' ? (
            <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
          ) : (
            <>
              <View style={styles.btnIconCircle}>
                <Feather name="user-check" size={16} color={COLORS.primaryOrangeHex} />
              </View>
              <View style={styles.btnTextContainer}>
                <Text style={styles.btnTitle}>Buddy Read</Text>
                <Text style={styles.btnSubtitle}>Small group chat</Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={handleReadalong}
          activeOpacity={0.8}
          disabled={loadingAction !== null}
        >
          {loadingAction === 'readalong' ? (
            <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
          ) : (
            <>
              <View style={[styles.btnIconCircle, styles.btnIconCircleSecondary]}>
                <Feather name="bookmark" size={16} color={COLORS.primaryOrangeHex} />
              </View>
              <View style={styles.btnTextContainer}>
                <Text style={styles.btnTitle}>Readalong</Text>
                <Text style={styles.btnSubtitle}>With checkpoints</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Learn More Link */}
      <View style={styles.learnMoreContainer}>
        <Text style={styles.learnMoreText}>
          Not sure which option to choose?{' '}
          <Text onPress={handleLearnMorePress} style={styles.learnMoreLink}>
            Learn more about Buddy Reads vs Readalongs
          </Text>
        </Text>
      </View>
    </View>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_15,
      padding: SPACING.space_16,
      borderWidth: 1,
      borderColor: COLORS.primaryOrangeHex + '25',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.space_16,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: COLORS.primaryOrangeHex + '18',
      paddingHorizontal: SPACING.space_8,
      paddingVertical: 3,
      borderRadius: BORDERRADIUS.radius_8,
    },
    badgeText: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryOrangeHex,
      letterSpacing: 0.8,
    },
    headerHint: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
    },
    buttonsRow: {
      flexDirection: 'row',
      gap: SPACING.space_12,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primaryDarkGreyHex,
      paddingVertical: SPACING.space_12,
      paddingHorizontal: SPACING.space_12,
      borderRadius: BORDERRADIUS.radius_10,
      borderWidth: 1,
      borderColor: COLORS.primaryOrangeHex + '30',
      minHeight: 52,
    },
    actionBtnSecondary: {
      borderColor: COLORS.primaryGreyHex,
    },
    btnIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: COLORS.primaryOrangeHex + '1A',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.space_8,
    },
    btnIconCircleSecondary: {
      backgroundColor: COLORS.primaryGreyHex + '60',
    },
    btnTextContainer: {
      flex: 1,
    },
    btnTitle: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    btnSubtitle: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
    },
    learnMoreContainer: {
      marginTop: SPACING.space_16,
      paddingTop: SPACING.space_12,
      borderTopWidth: 1,
      borderTopColor: COLORS.primaryDarkGreyHex,
    },
    learnMoreText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryLightGreyHex,
      textAlign: 'center',
      lineHeight: 18,
    },
    learnMoreLink: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_medium,
      textDecorationLine: 'underline',
    },
  });

export default ReadTogetherLinks;