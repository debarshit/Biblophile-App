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
import { ArcCampaign } from './ArcModal';

interface Props {
  arc: ArcCampaign;
  onPress: (arc: ArcCampaign) => void;
}

const getDaysLeft = (endDate: string) => {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function ArcCard({ arc, onPress }: Props) {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const daysLeft = getDaysLeft(arc.endDate);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(arc)} activeOpacity={0.85}>
      {arc.bookPhoto ? (
        <Image source={{ uri: arc.bookPhoto }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Ionicons name="book-outline" size={32} color={COLORS.primaryLightGreyHex} />
        </View>
      )}

      {/* ARC badge */}
      <View style={styles.arcBadge}>
        <Text style={styles.arcBadgeText}>ARC</Text>
      </View>

      {/* Days left */}
      <View style={[styles.daysBadge, daysLeft <= 3 && styles.daysBadgeUrgent]}>
        <Text style={styles.daysBadgeText}>
          {daysLeft === 0 ? 'Ends today' : `${daysLeft}d left`}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{arc.title}</Text>
        <Text style={styles.bookName} numberOfLines={1}>{arc.bookName}</Text>
        <View style={styles.footer}>
          <Text style={styles.slots}>👥 {arc.quantityLimit} slots</Text>
          <View style={styles.requestBtn}>
            <Text style={styles.requestBtnText}>Apply</Text>
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
    arcBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: 'rgba(53,99,220,0.85)',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    arcBadgeText: {
      color: '#fff',
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_10,
      letterSpacing: 1,
    },
    daysBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(209,120,66,0.9)',
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    daysBadgeUrgent: {
      backgroundColor: 'rgba(220,53,53,0.9)',
    },
    daysBadgeText: {
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
    slots: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.primaryLightGreyHex,
    },
    requestBtn: {
      backgroundColor: COLORS.primaryOrangeHex,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    requestBtnText: {
      color: '#fff',
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_10,
    },
  });