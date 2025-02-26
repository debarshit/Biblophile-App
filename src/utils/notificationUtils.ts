import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Setup function to call once
export const setupNotifications = async () => {
  await registerForPushNotificationsAsync();
  
  // Setup Android channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    
    await Notifications.setNotificationChannelAsync('reading-timer', {
      name: 'Reading Timer',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 0, 0, 0],
      lightColor: '#FF231F7C',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      sound: 'false',
    });
  }
  
  // Set up notification categories/actions
  await Notifications.setNotificationCategoryAsync('timer', [
    {
      identifier: 'stop',
      buttonTitle: 'Stop Session',
      options: {
        isDestructive: true,
      },
    },
  ]);
};

export async function registerForPushNotificationsAsync() {

}

// Timer notification functions
export const updateTimerNotification = async (minutes, seconds) => {
  const notificationId = 'reading-timer-notification';
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Reading Session',
    //   body: `Time elapsed: ${minutes} minutes ${seconds} seconds`,
    body: `Reading session in progress`,
    data: { 
        type: 'timer',
        urlScheme: 'biblophile://streak/updateReadingStreak/'
    },
      sticky: true,
      autoDismiss: false,
      priority: 'high',
      categoryIdentifier: 'timer',
    },
    trigger: null,
    identifier: notificationId,
  });
};

export const dismissTimerNotification = async () => {
  await Notifications.dismissNotificationAsync('reading-timer-notification');
};