import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../../../theme/theme';
import { AntDesign, Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const BADGES_INFO = [
  {
    icon: 'flash',
    color: '#00D2FF',
    title: 'Free ARC',
    desc: 'Advance Reader Copies provided by indie authors and presses. Read before release in exchange for your honest review.',
  },
  {
    icon: 'gift',
    color: '#FF9900',
    title: 'Giveaway Live',
    desc: 'Limited-time giveaways giving community members a chance to win free physical or digital book copies.',
  },
  {
    icon: 'people-sharp',
    color: '#A855F7',
    title: 'Partner Exclusive',
    desc: 'Special collaborations and exclusive editions from our partnered independent publishers and small presses.',
  },
  {
    icon: 'star',
    color: '#F59E0B',
    title: 'Biblo Pick',
    desc: 'Hand-picked recommendations by the Biblo team to support indie writers. Purely editorial, never paid.',
  },
];

export default function IndieSpotlightInfoModal({ visible, onClose }: Props) {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="information-circle" size={20} color={COLORS.primaryOrangeHex} />
              <Text style={styles.headerTitle}>About Indie Spotlight</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AntDesign name="close" size={18} color={COLORS.primaryWhiteHex} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Intro text */}
            <Text style={styles.missionText}>
              Biblo's Indie Spotlight is our initiative to celebrate and uplift independent authors, small presses, and unique literary voices.
            </Text>

            {/* Badges Guide */}
            <Text style={styles.sectionHeader}>What the badges mean</Text>

            {BADGES_INFO.map((item, index) => (
              <View key={index} style={styles.badgeRow}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <View style={styles.badgeInfo}>
                  <Text style={[styles.badgeTitle, { color: item.color }]}>{item.title}</Text>
                  <Text style={styles.badgeDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}

            {/* Note */}
            <View style={styles.calloutBox}>
              <Ionicons name="heart-outline" size={18} color={COLORS.primaryOrangeHex} style={styles.calloutIcon} />
              <Text style={styles.calloutText}>
                Reading, reviewing, and sharing indie books directly helps independent creators thrive.
              </Text>
            </View>

            {/* Close action */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actionButton}
              onPress={onClose}
            >
              <Text style={styles.actionButtonText}>Got it</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.space_20,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '85%',
      backgroundColor: COLORS.primaryDarkGreyHex || '#1E1E1E',
      borderRadius: BORDERRADIUS.radius_20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.space_20,
      paddingTop: SPACING.space_20,
      paddingBottom: SPACING.space_15,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_8,
    },
    headerTitle: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    closeIcon: {
      padding: SPACING.space_4,
    },
    scrollContent: {
      padding: SPACING.space_20,
    },
    missionText: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.primaryLightGreyHex || '#CCCCCC',
      lineHeight: 22,
      marginBottom: SPACING.space_20,
    },
    sectionHeader: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: SPACING.space_15,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: SPACING.space_15,
      gap: SPACING.space_12,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: BORDERRADIUS.radius_10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    badgeInfo: {
      flex: 1,
    },
    badgeTitle: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      marginBottom: 2,
    },
    badgeDesc: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex || '#999999',
      lineHeight: 18,
    },
    calloutBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(217, 119, 6, 0.12)',
      borderRadius: BORDERRADIUS.radius_10,
      borderWidth: 1,
      borderColor: 'rgba(217, 119, 6, 0.3)',
      padding: SPACING.space_12,
      marginTop: SPACING.space_10,
      marginBottom: SPACING.space_20,
      gap: SPACING.space_10,
    },
    calloutIcon: {
      marginTop: 1,
    },
    calloutText: {
      flex: 1,
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryWhiteHex,
      lineHeight: 18,
    },
    actionButton: {
      backgroundColor: COLORS.primaryOrangeHex,
      paddingVertical: SPACING.space_12,
      borderRadius: BORDERRADIUS.radius_10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonText: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
  });