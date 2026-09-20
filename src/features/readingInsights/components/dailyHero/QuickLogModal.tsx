import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useStore } from '../../../../store/store';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';
import { convertHttpToHttps } from '../../../../utils/convertHttpToHttps';
import GlassEffect from '../../../../components/GlassEffect';
import { useAnalytics } from '../../../../utils/analytics';

interface QuickLogModalProps {
  visible: boolean;
  onClose: () => void;
  book: any;
  onLogSuccess: (updatedProgress: number, delta: number, isFinished: boolean) => void;
}

const QuickLogModal: React.FC<QuickLogModalProps> = ({
  visible,
  onClose,
  book,
  onLogSuccess,
}) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const userDetails = useStore((state: any) => state.userDetails);
  const analytics = useAnalytics();

  const rawInitial = book?.ProgressValue ?? book?.progressValue ?? 0;
  const initialValue = typeof rawInitial === 'number' ? rawInitial : parseInt(rawInitial, 10) || 0;
  const totalPages = book?.BookPages ?? book?.bookPages ?? 0;
  const unit = book?.ProgressUnit ?? book?.progressUnit ?? 'pages';

  const [currentValue, setCurrentValue] = useState<number>(initialValue);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentValue(initialValue);
    }
  }, [visible, initialValue]);

  const delta = Math.max(0, currentValue - initialValue);
  const isFinished = totalPages > 0 && currentValue >= totalPages;

  const handleStep = (step: number) => {
    setCurrentValue((prev) => {
      const next = prev + step;
      if (next < 0) return 0;
      if (totalPages > 0 && next > totalPages) return totalPages;
      return next;
    });
  };

  const handleInputChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned === '') {
      setCurrentValue(0);
      return;
    }
    const val = parseInt(cleaned, 10);
    if (totalPages > 0 && val > totalPages) {
      setCurrentValue(totalPages);
    } else {
      setCurrentValue(val);
    }
  };

  const handleSave = async () => {
    if (!userDetails[0]?.accessToken) return;

    setLoading(true);
    analytics.track('quick_log_submitted', {
      bookId: book?.BookId ?? book?.bookId,
      delta,
      newProgress: currentValue,
      isFinished,
    });

    try {
      const statusToSubmit = isFinished ? 'Read' : 'Currently reading';
      const payload: any = {
        bookId: book?.BookId ?? book?.bookId,
        status: statusToSubmit,
        progressUnit: unit,
        progressValue: currentValue,
        userBookId: book?.UserbookId ?? book?.userbookId ?? book?.UserBookId,
      };

      if (isFinished) {
        payload.endDate = new Date().toISOString().slice(0, 10);
      }

      await instance.post(requests.submitReadingStatus, payload, {
        headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
      });

      onLogSuccess(currentValue, delta, isFinished);
      onClose();
    } catch (error) {
      console.error('Error saving reading progress:', error);
      Alert.alert('Error', 'Could not save reading progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!book) return null;

  const bookTitle = book?.BookName ?? book?.bookName ?? book?.title ?? 'Your Book';
  const bookPhoto = book?.BookPhoto ?? book?.bookPhoto ?? book?.photo;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <GlassEffect
              glassStyle="regular"
              intensity={45}
              borderRadius={BORDERRADIUS.radius_20}
              style={styles.modalCard}
            >
              {/* Header with Close */}
              <View style={styles.headerRow}>
                <View style={styles.badgeRow}>
                  <Text style={styles.badgeText}>⚡ QUICK LOG</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={22} color={COLORS.secondaryLightGreyHex} />
                </TouchableOpacity>
              </View>

              {/* Book Info */}
              <View style={styles.bookInfoRow}>
                {bookPhoto ? (
                  <Image
                    source={{ uri: convertHttpToHttps(bookPhoto) }}
                    style={styles.bookThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.bookThumb, styles.placeholderThumb]}>
                    <FontAwesome5 name="book" size={20} color={COLORS.primaryLightGreyHex} />
                  </View>
                )}
                <View style={styles.bookDetails}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {bookTitle}
                  </Text>
                  <Text style={styles.lastReadText}>
                    Last saved: {initialValue} {totalPages > 0 ? `of ${totalPages}` : ''} {unit}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Page Input & Delta Section */}
              <View style={styles.inputSection}>
                <Text style={styles.sectionLabel}>Where are you now?</Text>

                <View style={styles.stepperContainer}>
                  {/* Stepper Down */}
                  <TouchableOpacity
                    style={styles.stepButton}
                    onPress={() => handleStep(-5)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepButtonText}>-5</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.stepButton}
                    onPress={() => handleStep(-1)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepButtonText}>-1</Text>
                  </TouchableOpacity>

                  {/* Numeric Input */}
                  <View style={styles.numberInputBox}>
                    <TextInput
                      style={styles.numberInput}
                      value={String(currentValue)}
                      onChangeText={handleInputChange}
                      keyboardType="number-pad"
                      selectTextOnFocus
                    />
                    <Text style={styles.unitSubtext}>{unit}</Text>
                  </View>

                  {/* Stepper Up */}
                  <TouchableOpacity
                    style={styles.stepButton}
                    onPress={() => handleStep(1)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepButtonText}>+1</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.stepButton}
                    onPress={() => handleStep(5)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepButtonText}>+5</Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Jumps */}
                <View style={styles.quickJumpRow}>
                  <TouchableOpacity
                    style={styles.quickJumpPill}
                    onPress={() => handleStep(10)}
                  >
                    <Text style={styles.quickJumpText}>+10 {unit}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickJumpPill}
                    onPress={() => handleStep(25)}
                  >
                    <Text style={styles.quickJumpText}>+25 {unit}</Text>
                  </TouchableOpacity>
                  {totalPages > 0 && (
                    <TouchableOpacity
                      style={[styles.quickJumpPill, styles.finishPill]}
                      onPress={() => setCurrentValue(totalPages)}
                    >
                      <Text style={styles.finishPillText}>Finish Book 🏁</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Live Delta Progress Feedback */}
                <View style={styles.deltaBox}>
                  {isFinished ? (
                    <Text style={styles.finishedAlertText}>
                      🎉 You will mark this book as finished!
                    </Text>
                  ) : delta > 0 ? (
                    <Text style={styles.deltaText}>
                      🔥 <Text style={styles.deltaHighlight}>+{delta} {unit}</Text> added to today's reading!
                    </Text>
                  ) : (
                    <Text style={styles.neutralDeltaText}>
                      No progress added yet. Tap + to record what you read.
                    </Text>
                  )}
                </View>
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  loading && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.primaryWhiteHex} />
                ) : (
                  <View style={styles.saveButtonContent}>
                    <MaterialIcons name="check-circle" size={20} color={COLORS.primaryWhiteHex} />
                    <Text style={styles.saveButtonText}>
                      {isFinished ? 'Complete Book & Keep Streak' : 'Save Progress & Keep Streak'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </GlassEffect>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default QuickLogModal;

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.space_20,
    },
    keyboardContainer: {
      width: '100%',
      maxWidth: 400,
    },
    modalCard: {
      backgroundColor: 'rgba(28, 32, 40, 0.95)',
      borderRadius: BORDERRADIUS.radius_20,
      padding: SPACING.space_20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      shadowColor: COLORS.primaryOrangeHex,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.space_16,
    },
    badgeRow: {
      backgroundColor: 'rgba(209, 120, 66, 0.2)',
      paddingHorizontal: SPACING.space_10,
      paddingVertical: SPACING.space_4,
      borderRadius: BORDERRADIUS.radius_10,
      borderWidth: 1,
      borderColor: 'rgba(209, 120, 66, 0.4)',
    },
    badgeText: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_10,
      color: COLORS.primaryOrangeHex,
      letterSpacing: 1,
    },
    closeButton: {
      padding: SPACING.space_4,
    },
    bookInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_12,
    },
    bookThumb: {
      width: 48,
      height: 72,
      borderRadius: 6,
      backgroundColor: COLORS.secondaryDarkGreyHex,
    },
    placeholderThumb: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    bookDetails: {
      flex: 1,
    },
    bookTitle: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_16,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_4,
    },
    lastReadText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
    divider: {
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      marginVertical: SPACING.space_16,
    },
    inputSection: {
      alignItems: 'center',
    },
    sectionLabel: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryLightGreyHex,
      marginBottom: SPACING.space_12,
    },
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_8,
      marginBottom: SPACING.space_12,
    },
    stepButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    stepButtonText: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryWhiteHex,
    },
    numberInputBox: {
      backgroundColor: 'rgba(15, 17, 22, 0.7)',
      paddingHorizontal: SPACING.space_16,
      paddingVertical: 6,
      borderRadius: BORDERRADIUS.radius_15,
      borderWidth: 1.5,
      borderColor: COLORS.primaryOrangeHex,
      minWidth: 100,
      alignItems: 'center',
    },
    numberInput: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_24,
      color: COLORS.primaryWhiteHex,
      textAlign: 'center',
      padding: 0,
    },
    unitSubtext: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_10,
      color: COLORS.secondaryLightGreyHex,
      textTransform: 'uppercase',
    },
    quickJumpRow: {
      flexDirection: 'row',
      gap: SPACING.space_8,
      marginBottom: SPACING.space_12,
    },
    quickJumpPill: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      paddingHorizontal: SPACING.space_10,
      paddingVertical: SPACING.space_4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    quickJumpText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
    finishPill: {
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    finishPillText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
      color: '#38BDF8',
    },
    deltaBox: {
      backgroundColor: 'rgba(209, 120, 66, 0.1)',
      borderRadius: BORDERRADIUS.radius_10,
      paddingHorizontal: SPACING.space_12,
      paddingVertical: SPACING.space_8,
      width: '100%',
      alignItems: 'center',
      marginBottom: SPACING.space_16,
    },
    deltaText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryWhiteHex,
    },
    deltaHighlight: {
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryOrangeHex,
    },
    neutralDeltaText: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
    finishedAlertText: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: 13,
      color: '#34D399',
    },
    saveButton: {
      backgroundColor: COLORS.primaryOrangeHex,
      borderRadius: BORDERRADIUS.radius_15,
      paddingVertical: SPACING.space_15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: COLORS.primaryOrangeHex,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_8,
    },
    saveButtonText: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_16,
      color: COLORS.primaryWhiteHex,
    },
  });
