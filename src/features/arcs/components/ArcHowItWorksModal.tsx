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
import { AntDesign } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    emoji: '📋',
    title: 'Apply to a campaign',
    desc: "Browse active ARC campaigns and tap Request ARC Copy. Write a brief pitch about why you're a great fit for this book.",
  },
  {
    emoji: '✅',
    title: 'Get approved',
    desc: 'The author reviews applications and approves readers. Linking your social profiles in Settings increases your approval chances significantly.',
  },
  {
    emoji: '📖',
    title: 'Read & submit your review',
    desc: 'Once approved, you\'ll have until the review due date to read the book and submit your honest review on Biblophile.',
  },
  {
    emoji: '💬',
    title: 'Share private feedback with the author',
    desc: 'Found a typo? Have formatting notes? Use the private feedback thread to share constructive notes directly with the author — your kindness helps make the book better.',
  },
];

const EXPECTATIONS = [
  'Read the book before its publication date',
  'Share an honest, thoughtful review on Biblophile',
  'Submit your review before the due date',
  'Optionally share on social media (boosts future approvals)',
];

export default function ArcHowItWorksModal({ visible, onClose }: Props) {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>How ARCs Work</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <AntDesign name="close" size={18} color={COLORS.primaryWhiteHex} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Steps */}
            {STEPS.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <Text style={styles.stepEmoji}>{step.emoji}</Text>
                  {i < STEPS.length - 1 && <View style={styles.stepLine} />}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}

            {/* Reviewer expectations */}
            <View style={styles.expectationsBox}>
              <Text style={styles.expectationsTitle}>Reviewer Expectations</Text>
              {EXPECTATIONS.map((exp, i) => (
                <View key={i} style={styles.expectRow}>
                  <Text style={styles.expectBullet}>→</Text>
                  <Text style={styles.expectText}>{exp}</Text>
                </View>
              ))}
            </View>

            {/* Eligibility note */}
            <View style={styles.noteBox}>
              <Text style={styles.noteIcon}>⚠️</Text>
              <Text style={styles.noteText}>
                <Text style={styles.noteBold}>Maintain 80%+ completion rate</Text>
                {' '}to keep your ARC access. Missing review deadlines reduces your eligibility for future campaigns.
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Got it!</Text>
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
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: '92%',
      overflow: 'hidden',
    },
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
      fontSize: FONTSIZE.size_20,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    closeIcon: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: SPACING.space_8,
    },
    scrollContent: {
      padding: SPACING.space_20,
      paddingBottom: SPACING.space_36,
    },
    stepRow: {
      flexDirection: 'row',
      marginBottom: SPACING.space_4,
    },
    stepLeft: {
      alignItems: 'center',
      width: 40,
      marginRight: SPACING.space_12,
    },
    stepEmoji: {
      fontSize: 22,
    },
    stepLine: {
      flex: 1,
      width: 2,
      backgroundColor: 'rgba(255,255,255,0.12)',
      marginVertical: SPACING.space_4,
    },
    stepContent: {
      flex: 1,
      paddingBottom: SPACING.space_20,
    },
    stepTitle: {
      fontSize: FONTSIZE.size_16,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_4,
    },
    stepDesc: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      lineHeight: 22,
    },
    expectationsBox: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_15,
      padding: SPACING.space_16,
      marginTop: SPACING.space_4,
      marginBottom: SPACING.space_16,
    },
    expectationsTitle: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_12,
    },
    expectRow: {
      flexDirection: 'row',
      gap: SPACING.space_8,
      marginBottom: SPACING.space_8,
    },
    expectBullet: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_14,
    },
    expectText: {
      flex: 1,
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      lineHeight: 22,
    },
    noteBox: {
      flexDirection: 'row',
      backgroundColor: 'rgba(220,53,53,0.1)',
      borderRadius: BORDERRADIUS.radius_15,
      padding: SPACING.space_16,
      marginBottom: SPACING.space_24,
      borderWidth: 1,
      borderColor: 'rgba(220,53,53,0.3)',
      gap: SPACING.space_10,
      alignItems: 'flex-start',
    },
    noteIcon: {
      fontSize: 16,
      marginTop: 2,
    },
    noteText: {
      flex: 1,
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      lineHeight: 22,
    },
    noteBold: {
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    closeBtn: {
      backgroundColor: COLORS.primaryOrangeHex,
      borderRadius: BORDERRADIUS.radius_25,
      paddingVertical: SPACING.space_16,
      alignItems: 'center',
    },
    closeBtnText: {
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_16,
    },
  });