import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../../../../theme/theme';
import { AntDesign } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    emoji: '●',
    title: 'Enter before it closes',
    desc: 'Browse active giveaways and tap "Enter Giveaway" to add your name to the draw. No purchase required.',
  },
  {
    emoji: '●',
    title: 'Sit back — everyone has equal odds',
    desc: "Once you've entered, just wait. Every participant has the same chance of winning, no matter how early or late they joined.",
  },
  {
    emoji: '●',
    title: 'Winners are drawn randomly',
    desc: "When the campaign closes, winners are selected at random. You'll be notified immediately if you've won.",
  },
  {
    emoji: '●',
    title: 'Your copy is sent out',
    desc: "Winners provide their shipping details and the author or publisher sends the book directly to you — completely free.",
  },
];

export default function GiveawayHowItWorksModal({ visible, onClose }: Props) {
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
            <Text style={styles.headerTitle}>How Giveaways Work</Text>
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

            {/* Note */}
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                <Text style={styles.noteBold}>No strings attached.</Text>
                {' '}Unlike ARCs, giveaway winners are not required to leave a review. It's a pure gift from the author to readers.
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
      maxHeight: '88%',
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
      fontSize: FONTSIZE.size_16,
      color: COLORS.primaryWhiteHex,
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
    noteBox: {
      flexDirection: 'row',
      borderRadius: BORDERRADIUS.radius_15,
      padding: SPACING.space_16,
      marginTop: SPACING.space_8,
      marginBottom: SPACING.space_24,
      borderWidth: 1,
      borderColor: 'rgba(209,120,66,0.3)',
      gap: SPACING.space_10,
      alignItems: 'flex-start',
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
      color: COLORS.primaryOrangeHex,
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