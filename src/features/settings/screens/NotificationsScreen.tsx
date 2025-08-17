import { StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import Mascot from '../../../components/Mascot';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../../../components/HeaderBar';
import TabSelector from '../../readingInsights/components/TabSelector';

const NotificationsScreen = () => {
  const [activeTab, setActiveTab] = useState('notifications');

  const notificationTabs = [
    { key: 'notifications', label: 'Notifications' },
    { key: 'friendRequests', label: 'Friend Requests' }
  ];

  const renderContent = () => {
    if (activeTab === 'notifications') {
      return (
        <View style={styles.mascot}>
          <Mascot emotion="sleeping"/>
          <Text style={styles.infoMessage}>No new notifications</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.mascot}>
          <Mascot emotion="sleeping"/>
          <Text style={styles.infoMessage}>No friend requests</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <HeaderBar showBackButton={true} title='Notifications' />
      <TabSelector 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={notificationTabs} containerStyle={undefined} tabButtonStyle={undefined} activeTabStyle={undefined} tabTextStyle={undefined}      />

    </SafeAreaView>
  )
}

export default NotificationsScreen;

const styles = StyleSheet.create({
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