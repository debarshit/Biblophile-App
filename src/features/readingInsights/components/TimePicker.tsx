import React, { useState } from 'react';
import { View, StyleSheet, Alert, Modal, Platform, Pressable, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { COLORS } from '../../../theme/theme';

const TimePicker = ({ visible, reminderTime, setReminderTime, setDatePickerVisible }) => {
  const [tempTime, setTempTime] = useState(reminderTime || new Date());
  
  const scheduleNotification = async (date: Date) => {
    const now = new Date();
    const notificationTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), date.getHours(), date.getMinutes(), 0);
  
    // If the notification time is already in the past for today, set it for the same time tomorrow
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }
  
    try {
      // First, clear out any existing scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      for (let notification of scheduledNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
  
      // Schedule the new notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to read!",
          body: "Don't forget to read a few pages today!",
        },
        trigger: {
          type: null,
          hour: notificationTime.getHours(),
          minute: notificationTime.getMinutes(),
          repeats: true,
        },
      });
  
      const formattedTime = notificationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
      Alert.alert("Reminder Set", `Notification set for ${formattedTime}`);
  
    } catch (error) {
      console.error("Failed to schedule notification:", error);
      Alert.alert("Error", "Failed to set notification. Please try again.");
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

const styles = StyleSheet.create({
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