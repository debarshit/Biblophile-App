import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Alert, Modal, Platform, Pressable, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { notificationService } from '../../../utils/notificationUtils';
import { useTheme } from '../../../contexts/ThemeContext';

const TimePicker = ({ visible, reminderTime, setReminderTime, setDatePickerVisible }) => {
  const [tempTime, setTempTime] = useState(reminderTime || new Date());
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  
  const scheduleNotification = async (date: Date) => {
    try {
      // Delegates to notificationService which only cancels PREFERRED_REMINDER_ID,
      // leaving the nightly nudge untouched.
      const result = await notificationService.schedulePreferredReminder(
        date.getHours(),
        date.getMinutes()
      );

      if (result?.success !== false) {
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        Alert.alert('Reminder Set', `Daily reading reminder set for ${formattedTime}`);
      } else {
        Alert.alert('Error', 'Failed to set reminder. Please enable notifications first.');
      }
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      Alert.alert('Error', 'Failed to set notification. Please try again.');
    }
  };

  const onConfirm = () => {
    setReminderTime(tempTime);
    scheduleNotification(tempTime);
    setDatePickerVisible(false);
  };

  const onCancel = () => {
    setDatePickerVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <DateTimePicker
            value={tempTime}
            mode="time"
            is24Hour={true}
            display='spinner'
            textColor={COLORS.primaryWhiteHex}
            onChange={(event, selectedDate) => {
              if (Platform.OS === 'android') {
                if (event.type === 'set' && selectedDate) {
                  setReminderTime(selectedDate);
                  scheduleNotification(selectedDate);
                }
                setDatePickerVisible(false);
              } else if (selectedDate) {
                setTempTime(selectedDate);
              }
            }}
          />
          {Platform.OS === 'ios' && (
            <View style={styles.buttonContainer}>
              <Pressable onPress={onCancel} style={styles.button}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onConfirm} style={[styles.button, styles.confirmButton]}>
                <Text style={styles.buttonText}>Confirm</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: COLORS.primaryGreyHex,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: COLORS.primaryGreyHex,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TimePicker;