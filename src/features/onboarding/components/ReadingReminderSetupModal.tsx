import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { notificationService } from '../../../utils/notificationUtils';
import { useStore } from '../../../store/store';
import { useTheme } from '../../../contexts/ThemeContext';
import { FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';

interface ReadingReminderSetupModalProps {
  visible: boolean;
  onDone: () => void;
}

const ReadingReminderSetupModal: React.FC<ReadingReminderSetupModalProps> = ({
  visible,
  onDone,
}) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const setReminderSetupShown = useStore((state: any) => state.setReminderSetupShown);

  // Default to 9pm as a sensible first suggestion
  const defaultTime = new Date();
  defaultTime.setHours(21, 0, 0, 0);
  const [selectedTime, setSelectedTime] = useState<Date>(defaultTime);
  const [showPicker, setShowPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedTime = selectedTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSetReminder = async () => {
    setIsSubmitting(true);
    try {
      await notificationService.schedulePreferredReminder(
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );
    } catch (error) {
      console.error('[ReadingReminderSetupModal] Failed to schedule reminder:', error);
    } finally {
      setIsSubmitting(false);
      setReminderSetupShown(true);
      onDone();
    }
  };

  const handleSkip = () => {
    setReminderSetupShown(true);
    onDone();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <Text style={styles.emoji}>📖</Text>
          <Text style={styles.title}>Build your reading habit!</Text>
          <Text style={styles.subtitle}>
            Want a daily reminder to read? We'll give you a gentle nudge at your favourite
            time. No spam, promise.
          </Text>

          {/* Time display / picker trigger */}
          <TouchableOpacity
            style={styles.timeRow}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.timeLabel}>Remind me at</Text>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{formattedTime}</Text>
              <Text style={styles.timeCaret}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Inline picker (iOS stays inline; Android fires immediately on change) */}
          {showPicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              textColor={COLORS.primaryWhiteHex}
              onChange={(event, date) => {
                if (Platform.OS === 'android') {
                  setShowPicker(false);
                  if (event.type === 'set' && date) {
                    setSelectedTime(date);
                  }
                } else if (date) {
                  setSelectedTime(date);
                }
              }}
            />
          )}

          {/* CTA buttons */}
          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={handleSetReminder}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Setting reminder...' : `Set reminder for ${formattedTime}`}
            </Text>
          </TouchableOpacity>

          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    sheet: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: SPACING.space_24,
      paddingTop: SPACING.space_28,
      paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.space_28,
      alignItems: 'center',
    },
    emoji: {
      fontSize: 40,
      marginBottom: SPACING.space_12,
    },
    title: {
      fontSize: FONTSIZE.size_20,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
      textAlign: 'center',
      marginBottom: SPACING.space_10,
    },
    subtitle: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: SPACING.space_24,
      paddingHorizontal: SPACING.space_8,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      backgroundColor: COLORS.primaryGreyHex,
      borderRadius: BORDERRADIUS.radius_15,
      paddingVertical: SPACING.space_15,
      paddingHorizontal: SPACING.space_20,
      marginBottom: SPACING.space_20,
    },
    timeLabel: {
      fontSize: FONTSIZE.size_16,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryWhiteHex,
    },
    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    timeText: {
      fontSize: FONTSIZE.size_16,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryOrangeHex,
    },
    timeCaret: {
      fontSize: FONTSIZE.size_20,
      color: COLORS.primaryOrangeHex,
      marginTop: -2,
    },
    primaryButton: {
      backgroundColor: COLORS.primaryOrangeHex,
      borderRadius: BORDERRADIUS.radius_15,
      paddingVertical: SPACING.space_15,
      width: '100%',
      alignItems: 'center',
      marginBottom: SPACING.space_12,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      fontSize: FONTSIZE.size_16,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    skipButton: {
      paddingVertical: SPACING.space_10,
    },
    skipText: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
    },
  });

export default ReadingReminderSetupModal;