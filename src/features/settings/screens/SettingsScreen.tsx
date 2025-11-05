import React from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Share,
  Alert,
  StatusBar,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Feather, FontAwesome, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { useStore } from '../../../store/store';
import { COLORS, FONTFAMILY, FONTSIZE } from '../../../theme/theme';
import Constants from 'expo-constants';
import HeaderBar from '../../../components/HeaderBar';
import { useAnalytics } from '../../../utils/analytics';
import CityModal from '../../bookshop/components/CityModal';

const SettingsScreen = ({navigation, route}: any) => {
  const [cityModalVisible, setCityModalVisible] = React.useState(false);
  const userDetails = useStore((state: any) => state.userDetails);
  const logout = useStore((state: any) => state.logout); 
  const username = userDetails[0].userUniqueUserName;
  const analytics = useAnalytics();

  const openWebView = (url: string) => {
    navigation.push('Resources', {
      url: url
    });
  };

  const handleRefer = async () => {
    try {
      const result = await Share.share({
        message: `📚 Discover the Ultimate library App! 📚

Join me on Biblophile, the app that brings together book lovers, offering a seamless experience for buying, selling, renting books, and more! Explore our extensive collection and enjoy exclusive features today.

📲 Download now: https://onelink.to/dxjdkb`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to refer.');
    }
  };

  const rateApp = () => {
    const url = 'https://onelink.to/rpe3dq';
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  // Group settings into categories for better organization
  const settingsCategories = [
    {
      title: 'My Account',
      items: [
        {
          icon: <MaterialIcons name="history" size={20} color="#fff" />,
          label: 'My Order History',
          onPress: () => navigation.push('History'),
          // bgColor: '#FF8C42',
        },
        {
          icon: <FontAwesome color="#fff" name="rupee" size={20} />,
          label: 'Manage Subscription',
          onPress: () => navigation.push('Subscription'),
          // bgColor: '#FF8C42',
        },
        {
          icon: <MaterialIcons color="#fff" name="notifications-none" size={20} />,
          label: 'Manage Notifications',
          onPress: () => navigation.push('NotificationSettings'),
          // bgColor: '#FF8C42',
        },
        {
          icon: <FontAwesome5 color="#fff" name="city" size={20} />,
          label: 'Manage City',
          onPress: () => setCityModalVisible(true),
          // bgColor: '#FF8C42',
        },
      ]
    },
    {
      title: 'My Reading Activity',
      items: [
        // {
        //   icon: <FontAwesome name="book" size={20} color="#fff" />,
        //   label: 'Reading Journal',
        //   onPress: () => navigation.push('ProfileSummary', { username: username }),
        //   // bgColor: '#4ECDC4',
        // },
        {
          icon: <Entypo name="bar-graph" size={20} color="#fff" />,
          label: 'My Stats',
          onPress: () => navigation.push('Streaks'),
          // bgColor: '#4ECDC4',
        },
        {
          icon: <Entypo name="feather" size={20} color="#fff" />,
          label: 'My Notes',
          onPress: () => navigation.push('Note'),
          // bgColor: '#4ECDC4',
        },
        {
          icon: <FontAwesome5 name="user-clock" size={20} color="#fff" />,
          label: 'Reading Sessions',
          onPress: () => navigation.push('Durations'),
          // bgColor: '#4ECDC4',
        },
      ]
    },
    {
      title: 'Games',
      items: [
        {
          icon: <MaterialIcons color="#fff" name="quiz" size={20} />,
          label: 'Quiz',
          onPress: () => openWebView('https://biblophile.com/quiz'),
          // bgColor: '#FFD166',
        },
        {
          icon: <MaterialIcons color="#fff" name="man" size={20} />,
          label: 'Hangman',
          onPress: () => openWebView('https://biblophile.com/hangman/index.php'),
          // bgColor: '#FFD166',
        },
      ]
    },
    {
      title: 'Help & Support',
      items: [
        {
          icon: <FontAwesome color="#fff" name="question" size={20} />,
          label: 'FAQs',
          onPress: () => openWebView('https://biblophile.com/policies/faq.php'),
          // bgColor: '#6A0572',
        },
        {
          icon: <FontAwesome color="#fff" name="book" size={20} />,
          label: 'Solution articles',
          onPress: () => openWebView('https://biblophile.freshdesk.com/support/solutions'),
          // bgColor: '#6A0572',
        },
        {
          icon: <MaterialIcons color="#fff" name="feedback" size={20} />,
          label: 'Report an Issue/Feedback',
          onPress: () => openWebView('https://biblophile.freshdesk.com/support/home'),
          // bgColor: '#6A0572',
        },
        {
          icon: <Feather color="#fff" name="mail" size={20} />,
          label: 'Contact Us',
          onPress: () => openWebView('https://biblophile.com/policies/customer-support.php'),
          // bgColor: '#6A0572',
        },
      ]
    },
    {
      title: 'Legal & Policies',
      collapsed: true,
      items: [
        {
          icon: <Feather color="#fff" name="flag" size={20} />,
          label: 'Terms of Service',
          onPress: () => openWebView('https://biblophile.com/policies/terms-of-service.php'),
          // bgColor: '#1A535C',
        },
        {
          icon: <MaterialIcons color="#fff" name="privacy-tip" size={20} />,
          label: 'Privacy Policy',
          onPress: () => openWebView('https://biblophile.com/policies/privacy-policy.php'),
          // bgColor: '#1A535C',
        },
        {
          icon: <Feather color="#fff" name="flag" size={20} />,
          label: 'Return/Refund Policy',
          onPress: () => openWebView('https://biblophile.com/policies/refund.php'),
          // bgColor: '#1A535C',
        },
      ]
    },
    {
      title: 'More',
      items: [
        {
          icon: <FontAwesome color="#fff" name="group" size={20} />,
          label: 'About Us',
          onPress: () => navigation.push('About'),
          // bgColor: '#7209B7',
        },
        {
          icon: <FontAwesome5 color="#fff" name="user-friends" size={20} />,
          label: 'Refer a Friend',
          onPress: handleRefer,
          // bgColor: '#7209B7',
        },
        {
          icon: <Feather color="#fff" name="star" size={20} />,
          label: 'Rate in App Store',
          onPress: rateApp,
          // bgColor: '#7209B7',
        },
        {
          icon: <MaterialIcons color="#fff" name="delete" size={20} />,
          label: 'Delete Account',
          onPress: () =>
            Alert.alert(
              'Confirm Deletion',
              'Are you sure you want to delete your account? This action cannot be undone.',
              [
                { text: 'No', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: () => {
                    // deleteUserAccount(); // Add your API call or logic here
                    Alert.alert('Delete', 'You will receive a deletion confirmation email shortly.');
                  },
                },
              ],
              { cancelable: true }
            ),
        },
        {
          icon: <MaterialIcons color="#fff" name="logout" size={20} />,
          label: 'Logout',
          onPress: async () => {
            analytics.track("logout", {
              userId: userDetails?.[0]?.userId,
              email: userDetails?.[0]?.userEmail,
            });

            analytics.resetUser();

            logout();
          },
          // bgColor: '#E71D36',
        },
      ]
    },
  ];

  const [expandedSections, setExpandedSections] = React.useState(
    settingsCategories.map((_, index) => !settingsCategories[index].collapsed)
  );

  const toggleSection = (index) => {
    const newExpandedSections = [...expandedSections];
    newExpandedSections[index] = !newExpandedSections[index];
    setExpandedSections(newExpandedSections);
  };

  const renderSettingItem = (item) => (
    <TouchableOpacity
      key={item.label}
      onPress={item.onPress}
      style={styles.settingItem}>
      <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
        {item.icon}
      </View>
      <Text style={styles.settingLabel}>{item.label}</Text>
      <Feather color="#9E9E9E" name="chevron-right" size={20} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryBlackHex} />
      <HeaderBar showBackButton title='Settings and activity' />

      {/* Settings content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {settingsCategories.map((category, categoryIndex) => (
          <View key={category.title} style={styles.categoryContainer}>
            <TouchableOpacity 
              style={styles.categoryHeader}
              onPress={() => toggleSection(categoryIndex)}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Feather 
                name={expandedSections[categoryIndex] ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={COLORS.primaryWhiteHex} 
              />
            </TouchableOpacity>
            
            {expandedSections[categoryIndex] && (
              <View style={styles.categoryItems}>
                {category.items.map(renderSettingItem)}
              </View>
            )}
          </View>
        ))}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Biblophile {Constants.manifest2?.extra?.expoClient?.version}</Text>
        </View>
      </ScrollView>
      <CityModal
        visibility={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
        modalType={null}
      />
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  scrollContainer: {
    flex: 1,
  },
  categoryContainer: {
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginTop: 8,
  },
  categoryTitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryItems: {
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202020',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingLabel: {
    flex: 1,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.secondaryLightGreyHex,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  footerText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
  },
});