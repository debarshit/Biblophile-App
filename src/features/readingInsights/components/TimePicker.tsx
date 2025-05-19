import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { COLORS } from '../../../theme/theme';

const TimePicker = ({ visible, reminderTime, setReminderTime, setDatePickerVisible }) => {
  
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

  if (!visible) return null;

  return (
    <View style={styles.modalContainer}>
      <DateTimePicker
        value={reminderTime || new Date()}
        mode="time"
        is24Hour={true}
        display="spinner"
        onChange={(event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            setReminderTime(selectedDate);
            setDatePickerVisible(false);
            scheduleNotification(selectedDate);
          } else {
            setDatePickerVisible(false);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primaryGreyHex,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 1000,
  },
});

export default TimePicker;