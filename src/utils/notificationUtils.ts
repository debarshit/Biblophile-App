import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { useStore } from '../store/store'; // Adjust path to your store

// In-app permission states
export const PERMISSION_STATES = {
  NOT_ASKED: 'not_asked',
  GRANTED: 'granted',
  DENIED: 'denied',
  DEVICE_DENIED: 'device_denied',
};

class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize the service (call this once in App.js)
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Set up notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      // Setup Android channels
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Set up notification categories/actions
      await this.setupNotificationCategories();

      this.isInitialized = true;
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Error initializing NotificationService:', error);
    }
  }

  // Setup Android notification channels
  async setupAndroidChannels() {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
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
      sound: false,
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reading Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('social', {
      name: 'Social Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Setup notification categories
  async setupNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('timer', [
      {
        identifier: 'stop',
        buttonTitle: 'Stop Session',
        options: {
          isDestructive: true,
        },
      },
    ]);
  }

  // Check current in-app permission status
  getInAppPermissionStatus() {
    const { notifications } = useStore.getState();
    
    if (notifications.inAppPermissionGranted) return PERMISSION_STATES.GRANTED;
    if (notifications.inAppPermissionAsked) return PERMISSION_STATES.DENIED;
    return PERMISSION_STATES.NOT_ASKED;
  }

  // Check if we should show in-app permission request
  shouldShowInAppPermissionRequest() {
    const status = this.getInAppPermissionStatus();
    return status === PERMISSION_STATES.NOT_ASKED;
  }

  // Show in-app permission request dialog
  async requestInAppPermission(context = 'general') {
    const { setInAppPermissionAsked, setInAppPermissionGranted } = useStore.getState();
    
    return new Promise((resolve) => {
      const messages = {
        general: {
          title: 'Stay Updated!',
          message: 'Get notified about your reading streaks, buddy reads, and book recommendations. You can always change this later in settings.',
        },
        timer: {
          title: 'Reading Timer',
          message: 'Allow notifications to keep track of your reading sessions even when the app is in the background.',
        },
        social: {
          title: 'Social Features',
          message: 'Get notified when friends comment on your reviews or invite you to buddy reads.',
        },
        reminders: {
          title: 'Reading Reminders',
          message: 'Set daily reading reminders to help maintain your reading habit.',
        },
      };

      const { title, message } = messages[context] || messages.general;

      Alert.alert(
        title,
        message,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => {
              setInAppPermissionAsked(true);
              setInAppPermissionGranted(false);
              resolve(false);
            },
          },
          {
            text: 'Allow',
            onPress: () => {
              setInAppPermissionAsked(true);
              setInAppPermissionGranted(true);
              resolve(true);
            },
          },
        ],
        { cancelable: false }
      );
    });
  }

  // Request device permission (only after in-app permission is granted)
  async requestDevicePermission() {
    try {
      const inAppStatus = this.getInAppPermissionStatus();
      if (inAppStatus !== PERMISSION_STATES.GRANTED) {
        console.log('In-app permission not granted, skipping device permission');
        return false;
      }

      // Check existing device permissions
      let { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('Existing device permission status:', existingStatus);

      let finalStatus = existingStatus;

      // Request device permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('New device permission status:', finalStatus);
        
        const { setDevicePermissionAsked } = useStore.getState();
        setDevicePermissionAsked(true);
      }

      if (finalStatus === 'granted') {
        // Get push token
        const token = (await Notifications.getExpoPushTokenAsync({
          projectId: "1c34706d-2df8-4c6b-939c-9e3f1e5185d3",  //project id copied from app.json
        })).data;
        console.log('Push token:', token);
        
        // Store token in store
        await this.storePushToken(token);
        
        return true;
      } else {
        console.log('Device permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting device permission:', error);
      return false;
    }
  }

  // Store push token
  async storePushToken(token) {
    try {
      // Store in Zustand store
      const { setExpoPushToken } = useStore.getState();
      setExpoPushToken(token);
      
      // TODO: Send to your backend
      // const { userDetails } = useStore.getState();
      // const currentUser = userDetails[0];
      // if (currentUser) {
      //   await fetch('your-backend-endpoint', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ token, userId: currentUser.userId })
      //   });
      // }
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  }

  // Combined permission flow - call this when you need notifications
  async requestPermissions(context = 'general') {
    // Step 1: Check and request in-app permission
    const inAppStatus = this.getInAppPermissionStatus();
    
    if (inAppStatus === PERMISSION_STATES.NOT_ASKED) {
      const inAppGranted = await this.requestInAppPermission(context);
      if (!inAppGranted) {
        return { success: false, reason: 'in_app_denied' };
      }
    } else if (inAppStatus === PERMISSION_STATES.DENIED) {
      return { success: false, reason: 'in_app_previously_denied' };
    }

    // Step 2: Request device permission
    const deviceGranted = await this.requestDevicePermission();
    
    return { 
      success: deviceGranted, 
      reason: deviceGranted ? 'granted' : 'device_denied' 
    };
  }

  // Check if notifications are fully enabled
  async areNotificationsEnabled() {
    const inAppStatus = this.getInAppPermissionStatus();
    if (inAppStatus !== PERMISSION_STATES.GRANTED) return false;

    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // Reset in-app permissions (useful for testing or settings)
  resetInAppPermissions() {
    const { resetNotificationPermissions } = useStore.getState();
    resetNotificationPermissions();
  }

  // Show settings alert when permissions are needed but denied
  showPermissionSettingsAlert() {
    Alert.alert(
      'Notifications Disabled',
      'To receive notifications, please enable them in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => Notifications.openSettingsAsync() 
        },
      ]
    );
  }

  // Timer notification functions
  async updateTimerNotification(minutes, seconds) {
    const enabled = await this.areNotificationsEnabled();
    if (!enabled) return false;

    const notificationId = 'reading-timer-notification';
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reading Session',
          body: 'Reading session in progress',
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
      return true;
    } catch (error) {
      console.error('Error updating timer notification:', error);
      return false;
    }
  }

  async dismissTimerNotification() {
    try {
      await Notifications.dismissNotificationAsync('reading-timer-notification');
      return true;
    } catch (error) {
      console.error('Error dismissing timer notification:', error);
      return false;
    }
  }

  // Schedule a local notification
  async scheduleNotification({ title, body, data = {}, trigger, channelId = 'default' }) {
    const enabled = await this.areNotificationsEnabled();
    if (!enabled) return { success: false, reason: 'permissions_denied' };

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          ...(Platform.OS === 'android' && { channelId }),
        },
        trigger,
      });

      return { success: true, identifier };
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return { success: false, reason: 'schedule_failed', error };
    }
  }

  // Cancel a scheduled notification
  async cancelNotification(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      return false;
    }
  }

  // Get stored push token from store
  getPushToken() {
    const { notifications } = useStore.getState();
    return notifications.expoPushToken;
  }

  // Check if device permission was asked
  wasDevicePermissionAsked() {
    const { notifications } = useStore.getState();
    return notifications.devicePermissionAsked;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export convenience functions
export const {
  initialize,
  requestPermissions,
  areNotificationsEnabled,
  updateTimerNotification,
  dismissTimerNotification,
  scheduleNotification,
  cancelNotification,
  showPermissionSettingsAlert,
  resetInAppPermissions,
  getPushToken,
  wasDevicePermissionAsked,
} = notificationService;