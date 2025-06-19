import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { notificationService } from '../../../utils/notificationUtils';
import Toast from 'react-native-toast-message';

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
    if (loading) return '#666';
    if (notificationsEnabled) return '#4CAF50';
    return '#FF6B6B';
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  settingsContainer: {
    flex: 1,
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  typesContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  typeText: {
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  troubleshootContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  troubleshootTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  troubleshootButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  troubleshootButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    padding: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;