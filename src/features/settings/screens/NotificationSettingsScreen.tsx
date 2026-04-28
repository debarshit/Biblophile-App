import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Switch, Alert, StyleSheet, TouchableOpacity, SafeAreaView, AppState, ScrollView, Platform } from 'react-native';
import { notificationService } from '../../../utils/notificationUtils';
import Toast from 'react-native-toast-message';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';
import { useFocusEffect } from '@react-navigation/native';
import { useStore } from '../../../store/store';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useTheme } from '../../../contexts/ThemeContext';

const CATEGORY_META = {
  social: {
    title: "Social Interactions",
    description: "Likes, replies, and follows",
    icon: "👥",
    channels: ["push"]
  },

  group_reading: {
    title: "Group Reading",
    description: "Buddy reads and readalong activity",
    icon: "📚",
    channels: ["push"]
  },

  challenges: {
    title: "Reading Challenges",
    description: "Challenge progress and completions",
    icon: "🏁",
    channels: ["push", "email"]
  },

  reading_updates: {
    title: "Reading Updates",
    description: "Book reviews, imports, and delivery updates",
    icon: "📖",
    channels: ["push", "email"]
  },

  reminders: {
    title: "Reminders",
    description: "Reading streaks and nudges",
    icon: "⏰",
    channels: ["push", "email"]
  },

  collaborative_lists: {
    title: "Collaborative Lists",
    description: "Shared lists, invites, and book activity",
    icon: "🤝",
    channels: ["push"]
  }
};

const NotificationSettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('not_asked');
  const [preferences, setPreferences] = useState({});
  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  useFocusEffect(
  useCallback(() => {
    checkNotificationStatus();
    fetchPreferences();
  }, [])
);

useEffect(() => {

  const subscription = AppState.addEventListener('change', state => {

    if (state === 'active') {
      checkNotificationStatus();
    }

  });

  return () => subscription.remove();

}, []);

const fetchPreferences = async () => {
  try {

    const res = await instance.get(
      requests.getNotificationPreferences,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    setPreferences(res.data.data.preferences);

  } catch (error) {
    console.log('Failed to load preferences', error);
  }
};

  const checkNotificationStatus = async () => {
  try {
      setLoading(true);

      const status = await notificationService.getFullPermissionStatus();

      setNotificationsEnabled(status.enabled);
      setPermissionStatus(status.inApp);

    } catch (error) {
      console.error('Error checking notification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      // User wants to disable - direct them to settings
      notificationService.showPermissionSettingsAlert();
    }
    // User wants to enable
    const result = await notificationService.requestPermissions('general');
    
    if (!notificationsEnabled && result.success) {
      await checkNotificationStatus();
      const token = notificationService.getPushToken();
      if (token) {
        try {
          await instance.post(requests.registerNotificationToken, {
            userId: userDetails[0].userId,
            token: token,
            device: Platform.OS,
          });
        } catch (err) {
          console.log("Failed to register token", err);
        }
      }
      Toast.show({
        type: 'success',
        text1: 'Notifications Enabled! 🎉',
        text2: 'You\'ll now receive reading updates and reminders'
      });
    } else {
      if (result.reason === 'device_denied') {
        notificationService.showPermissionSettingsAlert();
      } else {
        handlePermissionDenied(result.reason);
      }
    }
  };

  const handlePermissionDenied = (reason) => {
    switch (reason) {
      case 'in_app_denied':
        Toast.show({
          type: 'info',
          text1: 'Notifications Disabled',
          text2: 'You can always enable them later in settings'
        });
        break;
      case 'device_denied':
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => notificationService.showPermissionSettingsAlert() 
            }
          ]
        );
        break;
      case 'in_app_previously_denied':
        Alert.alert(
          'Enable Notifications?',
          'Notifications help you stay on track with your reading goals and connect with friends.',
          [
            { text: 'Not Now', style: 'cancel' },
            { 
              text: 'Enable', 
              onPress: () => notificationService.showPermissionSettingsAlert() 
            }
          ]
        );
        break;
    }
  };

  const resetPermissions = async () => {
    Alert.alert(
      'Reset Notification Preferences',
      'This will reset your notification preferences. You\'ll be asked again about enabling notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await notificationService.resetInAppPermissions();
            setNotificationsEnabled(false);
            setPermissionStatus('not_asked');
            Toast.show({
              type: 'info',
              text1: 'Preferences Reset',
              text2: 'You can now set up notifications again'
            });
          }
        }
      ]
    );
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (notificationsEnabled) return 'Enabled';
    
    switch (permissionStatus) {
      case 'not_asked':
        return 'Not configured';
      case 'denied':
        return 'Declined';
      case 'device_denied':
        return 'Blocked in device settings';
      default:
        return 'Disabled';
    }
  };

  const getStatusColor = () => {
    if (loading) return COLORS.secondaryLightGreyHex;
    if (notificationsEnabled) return COLORS.primaryOrangeHex;
    return COLORS.primaryRedHex;
  };

 const toggleChannel = async (category, channel, currentValue) => {

  const newValue = !currentValue;

  // optimistic update
  setPreferences(prev => ({
    ...prev,
    [category]: {
      ...prev[category],
      [channel]: newValue
    }
  }));

  try {

    await instance.patch(requests.updateNotificationPreferences, {
      updates: [
        {
          category,
          channel,
          enabled: newValue
        }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
    });

  } catch (err) {
    console.log("Update failed", err);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title='Notification Settings' showBackButton={true} />
      <ScrollView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Settings</Text>
        <Text style={styles.subtitle}>
          Stay updated with your reading progress and social activities
        </Text>
      </View>

      <View style={styles.settingsContainer}>
        {/* Main notification toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={[styles.settingStatus, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            disabled={loading}
            trackColor={{ false: COLORS.primaryGreyHex, true: COLORS.primaryOrangeHex }}
            thumbColor={notificationsEnabled ? COLORS.primaryWhiteHex : COLORS.secondaryLightGreyHex}
          />
        </View>

        {/* Notification types */}
        {notificationsEnabled && (
  <View style={styles.preferencesGroup}>
    {Object.keys(preferences).map((category, index) => {

  const meta = CATEGORY_META[category];

  const pushEnabled = preferences[category]?.push;
  const emailEnabled = preferences[category]?.email;
  const supportedChannels = meta.channels;

  return (

    <View
  key={category}
  style={[
    styles.preferenceRow,
    index !== Object.keys(preferences).length - 1 && styles.rowDivider
  ]}
>
  <View style={styles.preferenceText}>
    <Text style={styles.preferenceTitle}>
      {meta.icon} {meta.title}
    </Text>

    <Text style={styles.preferenceDescription}>
      {meta.description}
    </Text>
  </View>

  <View style={styles.channelContainer}>
  {supportedChannels.includes("push") && (
    <TouchableOpacity
      style={[
        styles.channelButton,
        pushEnabled && styles.channelActive
      ]}
      onPress={() =>
        toggleChannel(category, "push", pushEnabled)
      }
    >
      <Text style={styles.channelIcon}>📱</Text>
    </TouchableOpacity>
  )}

  {supportedChannels.includes("email") && (
    <TouchableOpacity
      style={[
        styles.channelButton,
        emailEnabled && styles.channelActive
      ]}
      onPress={() =>
        toggleChannel(category, "email", emailEnabled)
      }
    >
      <Text style={styles.channelIcon}>✉️</Text>
    </TouchableOpacity>
  )}

</View>
</View>
  );

})}
</View>
)}

        {/* Troubleshooting */}
        {!notificationsEnabled && permissionStatus !== 'not_asked' && (
          <View style={styles.troubleshootContainer}>
            <Text style={styles.troubleshootTitle}>Having trouble?</Text>
            <TouchableOpacity
              style={styles.troubleshootButton}
              onPress={() => notificationService.showPermissionSettingsAlert()}
            >
              <Text style={styles.troubleshootButtonText}>
                Open Device Settings
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetPermissions}
            >
              <Text style={styles.resetButtonText}>Reset Preferences</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info section */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>About Notifications</Text>
          <Text style={styles.infoText}>
            Notifications help you maintain reading habits and stay connected with the Biblophile community. 
            You can always disable them in your device settings if needed.
          </Text>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  header: {
    padding: SPACING.space_20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
  },
  title: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  subtitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    lineHeight: SPACING.space_24,
  },
  settingsContainer: {
    flex: 1,
    padding: SPACING.space_20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_15,
    marginBottom: SPACING.space_16,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  settingStatus: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  troubleshootContainer: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_15,
    marginBottom: SPACING.space_16,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  troubleshootTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_12,
  },
  troubleshootButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  troubleshootButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  resetButton: {
    padding: SPACING.space_12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: COLORS.primaryRedHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  infoContainer: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_15,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  infoTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  infoText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    lineHeight: SPACING.space_20,
  },
  channelContainer: {
  flexDirection: "row",
  gap: 12,
   minWidth: 70,
  justifyContent: "flex-end"
},

channelButton: {
  padding: 10,
  borderRadius: 10,
  backgroundColor: COLORS.primaryGreyHex,
  alignItems: "center",
  justifyContent: "center"
},

channelActive: {
  borderWidth: 1,
  borderColor: COLORS.primaryWhiteHex,
},

channelIcon: {
  fontSize: 18
},
preferencesGroup: {
  backgroundColor: COLORS.secondaryDarkGreyHex,
  borderRadius: BORDERRADIUS.radius_15,
  borderWidth: 1,
  borderColor: COLORS.primaryGreyHex,
  marginBottom: SPACING.space_16,
},

preferenceRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: SPACING.space_15,
  paddingHorizontal: SPACING.space_20,
},

rowDivider: {
  borderBottomWidth: 1,
  borderBottomColor: COLORS.primaryGreyHex,
},

preferenceText: {
  flex: 1,
  paddingRight: 10,
},

preferenceTitle: {
  fontSize: FONTSIZE.size_16,
  fontFamily: FONTFAMILY.poppins_semibold,
  color: COLORS.primaryWhiteHex,
},

preferenceDescription: {
  fontSize: FONTSIZE.size_12,
  fontFamily: FONTFAMILY.poppins_regular,
  color: COLORS.secondaryLightGreyHex,
  marginTop: 2,
},
});

export default NotificationSettingsScreen;