import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { GiveawayCampaign } from './GiveawayModal';

interface Props {
  giveaway: GiveawayCampaign;
  onPress: (giveaway: GiveawayCampaign) => void;
}

const getDaysLeft = (endDate: string) => {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function GiveawayCard({ giveaway, onPress }: Props) {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const daysLeft = getDaysLeft(giveaway.endDate);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(giveaway)} activeOpacity={0.85}>
      {/* Book cover */}
      {giveaway.bookPhoto ? (
        <Image source={{ uri: giveaway.bookPhoto }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Ionicons name="book-outline" size={32} color={COLORS.primaryLightGreyHex} />
        </View>
      )}

      {/* Days remaining badge */}
      <View style={[styles.badge, daysLeft <= 3 && styles.badgeUrgent]}>
        <Text style={styles.badgeText}>
          {daysLeft === 0 ? 'Ends today' : `${daysLeft}d left`}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{giveaway.title}</Text>
        <Text style={styles.bookName} numberOfLines={1}>{giveaway.bookName}</Text>
        <View style={styles.footer}>
          <Text style={styles.copies}>📚 {giveaway.quantity} {giveaway.quantity === 1 ? 'copy' : 'copies'}</Text>
          <View style={styles.enterBtn}>
            <Text style={styles.enterBtnText}>Enter</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_20,
      overflow: 'hidden',
      width: 200,
    },
    cover: {
      width: '100%',
      height: 140,
    },
    coverPlaceholder: {
      backgroundColor: COLORS.primaryGreyHex,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(209,120,66,0.9)',
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeUrgent: {
      backgroundColor: 'rgba(220,53,53,0.9)',
    },
    badgeText: {
      color: '#fff',
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_10,
    },
    info: {
      padding: SPACING.space_12,
    },
    title: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      marginBottom: 2,
    },
    bookName: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      marginBottom: SPACING.space_10,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    copies: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.primaryLightGreyHex,
    },
    enterBtn: {
      backgroundColor: COLORS.primaryOrangeHex,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    enterBtnText: {
      color: '#fff',
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_10,
    },
  });