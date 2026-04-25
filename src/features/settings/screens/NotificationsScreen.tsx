import { StyleSheet, Text, View } from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../../../components/HeaderBar';
import TabSelector from '../../../components/TabSelector';
import FriendRequestsComponent from '../components/FriendRequestsComponent';
import GeneralNotificationsComponent from '../components/GeneralNotificationsComponent';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import { useTheme } from '../../../contexts/ThemeContext';

const NotificationsScreen = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [countsLoading, setCountsLoading] = useState(true);
  const userDetails = useStore((state: any) => state.userDetails);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const setUnreadNotificationCount = useStore(
    (state) => state.setUnreadNotificationCount
  );

  useEffect(() => {
    setUnreadNotificationCount(0);
  }, []);

  const fetchCounts = async () => {
    try {
      // Fetch both counts in parallel
      const [friendRequestsResponse, unreadNotificationsResponse] = await Promise.all([
        instance.get(requests.fetchFriendRequests, {
          headers: { 'Authorization': `Bearer ${userDetails[0].accessToken}` },
        }),
        instance.get(requests.getUnreadNotificationCount, {
          headers: { 'Authorization': `Bearer ${userDetails[0].accessToken}` },
        })
      ]);

      let friendCount = 0;
      let notificationCount = 0;

      if (friendRequestsResponse.status === 200) {
        friendCount = friendRequestsResponse.data.data?.incomingRequests?.length || 0;
      }

      if (unreadNotificationsResponse.status === 200) {
        notificationCount = unreadNotificationsResponse.data.data?.unreadCount || 0;
      }

      setFriendRequestCount(friendCount);
      setNotificationUnreadCount(notificationCount);

      // update global badge correctly
      setUnreadNotificationCount(friendCount + notificationCount);
    } catch (error) {
      console.error('Failed to fetch counts:', error);
      setFriendRequestCount(0);
      setNotificationUnreadCount(0);
    } finally {
      setCountsLoading(false);
    }
  };

  useEffect(() => { fetchCounts(); }, []);

  const notificationTabs = [
    { 
      key: 'notifications', 
      label: countsLoading ? 'Notifications...' : `Notifications${notificationUnreadCount > 0 ? ` (${notificationUnreadCount})` : ''}` 
    },
    { 
      key: 'friendRequests', 
      label: countsLoading ? 'Friend Requests...' : `Friend Requests${friendRequestCount > 0 ? ` (${friendRequestCount})` : ''}` 
    }
  ];

  const renderContent = () => (
    activeTab === 'notifications' ? (
      <GeneralNotificationsComponent 
        onUnreadCountChange={setNotificationUnreadCount}
        initialUnreadCount={notificationUnreadCount}
      />
    ) : (
      <FriendRequestsComponent 
        onRequestCountChange={setFriendRequestCount}
        initialCount={friendRequestCount}
      />
    )
  );

  return (
    <SafeAreaView style={styles.screenContainer}>
      <HeaderBar showBackButton={true} title='Notifications' />
      <TabSelector 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={notificationTabs} 
        containerStyle={undefined} 
        tabButtonStyle={undefined} 
        activeTabStyle={undefined} 
        tabTextStyle={undefined} 
      />
      {renderContent()}
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const createStyles = (COLORS) => StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
    },
    mascot: {
        marginTop: SPACING.space_32,
        marginBottom: SPACING.space_36,
      },
      infoMessage: {
        fontSize: FONTSIZE.size_18,
        fontFamily: FONTFAMILY.poppins_semibold,
        textAlign: 'center',
        color: COLORS.primaryWhiteHex,
      },
})