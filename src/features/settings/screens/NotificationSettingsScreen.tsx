import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Alert, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { notificationService } from '../../../utils/notificationUtils';
import Toast from 'react-native-toast-message';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';

const NotificationSettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('not_asked');

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      setLoading(true);
      const enabled = await notificationService.areNotificationsEnabled();
      const inAppStatus = await notificationService.getInAppPermissionStatus();
      
      setNotificationsEnabled(enabled);
      setPermissionStatus(inAppStatus);
    } catch (error) {
      console.error('Error checking notification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      // User wants to disable - direct them to settings
      Alert.alert(
        'Disable Notifications',
        'To disable notifications, you\'ll need to turn them off in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => notificationService.showPermissionSettingsAlert() 
          }
        ]
      );
    } else {
      // User wants to enable
      const result = await notificationService.requestPermissions('general');
      
      if (result.success) {
        setNotificationsEnabled(true);
        Toast.show({
          type: 'success',
          text1: 'Notifications Enabled! 🎉',
          text2: 'You\'ll now receive reading updates and reminders'
        });
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

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title='Notification Settings' showBackButton={true} />
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
          <View style={styles.typesContainer}>
            <Text style={styles.typesTitle}>You'll receive notifications for:</Text>
            
            <View style={styles.typeRow}>
              <Text style={styles.typeIcon}>📚</Text>
              <Text style={styles.typeText}>Daily reading reminders</Text>
            </View>
            
            <View style={styles.typeRow}>
              <Text style={styles.typeIcon}>🔥</Text>
              <Text style={styles.typeText}>Reading streak milestones</Text>
            </View>
            
            <View style={styles.typeRow}>
              <Text style={styles.typeIcon}>👥</Text>
              <Text style={styles.typeText}>Buddy read invitations and updates</Text>
            </View>
            
            <View style={styles.typeRow}>
              <Text style={styles.typeIcon}>⏱️</Text>
              <Text style={styles.typeText}>Reading session progress</Text>
            </View>
            
            <View style={styles.typeRow}>
              <Text style={styles.typeIcon}>🎯</Text>
              <Text style={styles.typeText}>Challenge updates and achievements</Text>
            </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  typesContainer: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_15,
    marginBottom: SPACING.space_16,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  typesTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  typeIcon: {
    fontSize: FONTSIZE.size_20,
    marginRight: SPACING.space_12,
  },
  typeText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    flex: 1,
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
});

export default NotificationSettingsScreen;