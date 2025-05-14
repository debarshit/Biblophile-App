// import React from 'react';
// import {
//   StyleSheet,
//   SafeAreaView,
//   View,
//   ScrollView,
//   Text,
//   TouchableOpacity,
//   Image,
//   Share,
//   Alert,
// } from 'react-native';
// import * as Linking from 'expo-linking';
// import { Feather, FontAwesome, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
// import { useStore } from '../../../store/store';
// import  { COLORS, FONTFAMILY, FONTSIZE } from '../../../theme/theme';

// const SettingsScreen = ({navigation, route}: any) => {
//   const userDetails = useStore((state: any) => state.userDetails);
//   const logout = useStore((state: any) => state.logout); 
//   const username = userDetails[0].userUniqueUserName;

//   const openWebView = (url: string) => {
//     navigation.push('Resources', {
//       url: url
//     });
//   };

//   const handleRefer = async () => {
//     try {
//       const result = await Share.share({
//         message: `📚 Discover the Ultimate library App! 📚

// Join me on Biblophile, the app that brings together book lovers, offering a seamless experience for buying, selling, renting books, and more! Explore our extensive collection and enjoy exclusive features today.

// 📲 Download now: https://play.google.com/store/apps/details?id=com.debar_shit.BiblophileApp`,
//       });
//       if (result.action === Share.sharedAction && result.activityType) {
//         // Shared with activity type
//       } else if (result.action === Share.dismissedAction) {
//         // Dismissed
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to refer.');
//     }
//   };

//   const rateApp = () => {
//     const url = 'https://play.google.com/store/apps/details?id=com.debar_shit.BiblophileApp&pcampaignid=web_share';
//     Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryBlackHex }}>
//       <View style={styles.container}>
//         <View style={styles.profile}>
//           <TouchableOpacity
//             onPress={() => {
//               navigation.push('Profile');
//             }}>
//             <View style={styles.profileAvatarWrapper}>
//               <Image
//                 alt=""
//                 source={{
//                   uri: userDetails[0].profilePic,
//                 }}
//                 style={styles.profileAvatar} />

//                 <View style={styles.profileAction}>
//                   <Feather
//                     color="#fff"
//                     name="edit-3"
//                     size={15} />
//                 </View>

//             </View>
//           </TouchableOpacity>

//           <View>
//             <Text style={styles.profileName}>{userDetails[0].userName}</Text>

//             <Text style={styles.profileAddress}>
//               {userDetails[0].userAddress !== null && userDetails[0].userAddress.length > 20 ? userDetails[0].userAddress.substring(0, 20) + '...' : userDetails[0].userAddress}
//             </Text>
//           </View>
//         </View>

//         <ScrollView>
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>My Account</Text>

//             <TouchableOpacity
//               onPress={() => {
//                 navigation.push('History');
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <MaterialIcons name="history" size={20} color="#fff" />
//               </View>

//               <Text style={styles.rowLabel}>My Order History</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => {
//                 navigation.push('Subscription');
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <FontAwesome color="#fff" name="rupee" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Manage Subscription</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//           </View>

//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>My Reading Activity</Text>

//             <TouchableOpacity
//               onPress={() => {
//                 navigation.push('ProfileSummary', { username: username });
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <FontAwesome name="book" size={20} color="#fff" />
//               </View>

//               <Text style={styles.rowLabel}>Reading Journal</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => {
//                 navigation.push('Streaks');
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <Entypo name="bar-graph" size={20} color="#fff" />
//               </View>

//               <Text style={styles.rowLabel}>My Stats</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => {
//                 navigation.push('Note');
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <Entypo name="feather" size={20} color="#fff" />
//               </View>

//               <Text style={styles.rowLabel}>My Notes</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => {
//                 navigation.push('Durations');
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <FontAwesome5 name="user-clock" size={20} color="#fff" />
//               </View>

//               <Text style={styles.rowLabel}>Reading Sessions</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//           </View>

//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Games</Text>

//             <TouchableOpacity
//               onPress={() => {
//                 openWebView('https://biblophile.com/quiz')
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <MaterialIcons color="#fff" name="quiz" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Quiz</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => {
//                 openWebView('https://biblophile.com/hangman/index.php')
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <MaterialIcons color="#fff" name="man" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Hangman</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//           </View>

//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Help & Support</Text>

//             <TouchableOpacity
//               onPress={() => {
//                 openWebView('https://biblophile.com/policies/faq.php')
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <FontAwesome color="#fff" name="question" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>FAQs</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => {
//                 openWebView('https://biblophile.freshdesk.com/support/solutions')
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <FontAwesome color="#fff" name="book" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Solution articles</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => {
//                 openWebView('https://biblophile.freshdesk.com/support/home')
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <MaterialIcons color="#fff" name="feedback" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Report an Issue/Feedback</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => {
//                 openWebView('https://biblophile.com/policies/customer-support.php')
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <Feather color="#fff" name="mail" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Contact Us</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//           </View>

//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Legal & Policies</Text>

//             <TouchableOpacity
//               onPress={() => {
//                 openWebView('https://biblophile.com/policies/terms-of-service.php')
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <Feather color="#fff" name="flag" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Terms of Service</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//                onPress={() => {
//                 openWebView('https://biblophile.com/policies/privacy-policy.php')
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <MaterialIcons color="#fff" name="privacy-tip" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Privacy Policy</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => {
//                 openWebView('https://biblophile.com/policies/refund.php')
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <Feather color="#fff" name="flag" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Return/Refund Policy</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//           </View>

//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>More</Text>

//             <TouchableOpacity
//               onPress={() => {
//                 navigation.push('About');
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <FontAwesome color="#fff" name="group" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>About Us</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={handleRefer}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <FontAwesome5 color="#fff" name="user-friends" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Refer a Friend</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={rateApp}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <Feather color="#fff" name="star" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Rate in App Store</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => logout()}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <MaterialIcons color="#fff" name="logout" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Logout</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity>

//               {/* delete account hidden */}
//             {/* <TouchableOpacity
//               onPress={() => {
//                 // handle onPress
//               }}
//               style={styles.row}>
//               <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
//                 <MaterialIcons color="#fff" name="delete" size={20} />
//               </View>

//               <Text style={styles.rowLabel}>Delete Account</Text>

//               <View style={styles.rowSpacer} />

//               <Feather
//                 color="#C6C6C6"
//                 name="chevron-right"
//                 size={20} />
//             </TouchableOpacity> */}
//           </View>
//         </ScrollView>
//       </View>
//     </SafeAreaView>
//   );
// }

// export default SettingsScreen;

// const styles = StyleSheet.create({
//   container: {
//     padding: 0,
//     flexGrow: 1,
//     flexShrink: 1,
//     flexBasis: 0,
//   },
//   /** Profile */
//   profile: {
//     padding: 24,
//     marginTop: 15,
//     backgroundColor: COLORS.primaryBlackHex,
//     flexDirection: 'column',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   profileAvatarWrapper: {
//     position: 'relative',
//   },
//   profileAvatar: {
//     width: 72,
//     height: 72,
//     borderRadius: 9999,
//   },
//   profileAction: {
//     position: 'absolute',
//     right: -4,
//     bottom: -10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: 28,
//     height: 28,
//     borderRadius: 9999,
//     backgroundColor: COLORS.primaryOrangeHex,
//   },
//   profileName: {
//     marginTop: 20,
//     fontSize: FONTSIZE.size_20,
//     fontFamily: FONTFAMILY.poppins_semibold,
//     color: COLORS.secondaryLightGreyHex,
//     textAlign: 'center',
//   },
//   profileAddress: {
//     marginTop: 5,
//     fontSize: FONTSIZE.size_16,
//     fontFamily: FONTFAMILY.poppins_medium,
//     color: COLORS.primaryLightGreyHex,
//     textAlign: 'center',
//   },
//   /** Section */
//   section: {
//     paddingHorizontal: 24,
//   },
//   sectionTitle: {
//     paddingVertical: 12,
//     fontSize: FONTSIZE.size_14,
//     fontFamily: FONTFAMILY.poppins_bold,
//     color: COLORS.primaryWhiteHex,
//     textTransform: 'uppercase',
//     letterSpacing: 1.1,
//   },
//   /** Row */
//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-start',
//     height: 50,
//     backgroundColor: COLORS.secondaryBlackRGBA,
//     borderRadius: 8,
//     marginBottom: 12,
//     paddingLeft: 12,
//     paddingRight: 12,
//   },
//   rowIcon: {
//     width: 32,
//     height: 32,
//     borderRadius: 9999,
//     marginRight: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   rowLabel: {
//     fontSize: FONTSIZE.size_16,
//     fontFamily: FONTFAMILY.poppins_regular,
//     color: COLORS.secondaryLightGreyHex,
//   },
//   rowSpacer: {
//     flexGrow: 1,
//     flexShrink: 1,
//     flexBasis: 0,
//   },
// });

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

const SettingsScreen = ({navigation, route}: any) => {
  const userDetails = useStore((state: any) => state.userDetails);
  const logout = useStore((state: any) => state.logout); 
  const username = userDetails[0].userUniqueUserName;

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

📲 Download now: https://play.google.com/store/apps/details?id=com.debar_shit.BiblophileApp`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to refer.');
    }
  };

  const rateApp = () => {
    const url = 'https://play.google.com/store/apps/details?id=com.debar_shit.BiblophileApp&pcampaignid=web_share';
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
          bgColor: '#FF8C42',
        },
        {
          icon: <FontAwesome color="#fff" name="rupee" size={20} />,
          label: 'Manage Subscription',
          onPress: () => navigation.push('Subscription'),
          bgColor: '#FF8C42',
        },
      ]
    },
    {
      title: 'My Reading Activity',
      items: [
        {
          icon: <FontAwesome name="book" size={20} color="#fff" />,
          label: 'Reading Journal',
          onPress: () => navigation.push('ProfileSummary', { username: username }),
          bgColor: '#4ECDC4',
        },
        {
          icon: <Entypo name="bar-graph" size={20} color="#fff" />,
          label: 'My Stats',
          onPress: () => navigation.push('Streaks'),
          bgColor: '#4ECDC4',
        },
        {
          icon: <Entypo name="feather" size={20} color="#fff" />,
          label: 'My Notes',
          onPress: () => navigation.push('Note'),
          bgColor: '#4ECDC4',
        },
        {
          icon: <FontAwesome5 name="user-clock" size={20} color="#fff" />,
          label: 'Reading Sessions',
          onPress: () => navigation.push('Durations'),
          bgColor: '#4ECDC4',
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
          bgColor: '#FFD166',
        },
        {
          icon: <MaterialIcons color="#fff" name="man" size={20} />,
          label: 'Hangman',
          onPress: () => openWebView('https://biblophile.com/hangman/index.php'),
          bgColor: '#FFD166',
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
          bgColor: '#6A0572',
        },
        {
          icon: <FontAwesome color="#fff" name="book" size={20} />,
          label: 'Solution articles',
          onPress: () => openWebView('https://biblophile.freshdesk.com/support/solutions'),
          bgColor: '#6A0572',
        },
        {
          icon: <MaterialIcons color="#fff" name="feedback" size={20} />,
          label: 'Report an Issue/Feedback',
          onPress: () => openWebView('https://biblophile.freshdesk.com/support/home'),
          bgColor: '#6A0572',
        },
        {
          icon: <Feather color="#fff" name="mail" size={20} />,
          label: 'Contact Us',
          onPress: () => openWebView('https://biblophile.com/policies/customer-support.php'),
          bgColor: '#6A0572',
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
          bgColor: '#1A535C',
        },
        {
          icon: <MaterialIcons color="#fff" name="privacy-tip" size={20} />,
          label: 'Privacy Policy',
          onPress: () => openWebView('https://biblophile.com/policies/privacy-policy.php'),
          bgColor: '#1A535C',
        },
        {
          icon: <Feather color="#fff" name="flag" size={20} />,
          label: 'Return/Refund Policy',
          onPress: () => openWebView('https://biblophile.com/policies/refund.php'),
          bgColor: '#1A535C',
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
          bgColor: '#7209B7',
        },
        {
          icon: <FontAwesome5 color="#fff" name="user-friends" size={20} />,
          label: 'Refer a Friend',
          onPress: handleRefer,
          bgColor: '#7209B7',
        },
        {
          icon: <Feather color="#fff" name="star" size={20} />,
          label: 'Rate in App Store',
          onPress: rateApp,
          bgColor: '#7209B7',
        },
        {
          icon: <MaterialIcons color="#fff" name="logout" size={20} />,
          label: 'Logout',
          onPress: () => logout(),
          bgColor: '#E71D36',
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
      
      {/* Header with profile info */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.push('Profile')}
          style={styles.profileContainer}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: userDetails[0].profilePic }}
              style={styles.profileImage}
            />
            <View style={styles.editBadge}>
              <Feather name="edit-3" size={12} color="#fff" />
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userDetails[0].userName}</Text>
            <Text style={styles.profileAddress}>
              {userDetails[0].userAddress !== null && userDetails[0].userAddress.length > 20 
                ? userDetails[0].userAddress.substring(0, 20) + '...' 
                : userDetails[0].userAddress}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

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
          <Text style={styles.footerText}>Biblophile v2.5.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#161616',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.primaryOrangeHex,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primaryOrangeHex,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryBlackHex,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  profileAddress: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
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