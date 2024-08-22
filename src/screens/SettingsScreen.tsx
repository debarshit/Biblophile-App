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
} from 'react-native';
import * as Linking from 'expo-linking';
import { Feather, FontAwesome, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useStore } from '../store/store';
import  { COLORS, FONTFAMILY, FONTSIZE } from '../theme/theme';

const SettingsScreen = ({navigation, route}: any) => {
  const userDetails = useStore((state: any) => state.userDetails);
  const logout = useStore((state: any) => state.logout); 

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
      if (result.action === Share.sharedAction && result.activityType) {
        // Shared with activity type
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refer.');
    }
  };

  const rateApp = () => {
    const url = 'https://play.google.com/store/apps/details?id=com.debar_shit.BiblophileApp&pcampaignid=web_share';
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryBlackHex }}>
      <View style={styles.container}>
        <View style={styles.profile}>
          <TouchableOpacity
            onPress={() => {
              navigation.push('Profile');
            }}>
            <View style={styles.profileAvatarWrapper}>
              <Image
                alt=""
                source={{
                  uri: userDetails[0].profilePic,
                }}
                style={styles.profileAvatar} />

                <View style={styles.profileAction}>
                  <Feather
                    color="#fff"
                    name="edit-3"
                    size={15} />
                </View>

            </View>
          </TouchableOpacity>

          <View>
            <Text style={styles.profileName}>{userDetails[0].userName}</Text>

            <Text style={styles.profileAddress}>
              {userDetails[0].userAddress !== null && userDetails[0].userAddress.length > 20 ? userDetails[0].userAddress.substring(0, 20) + '...' : userDetails[0].userAddress}
            </Text>
          </View>
        </View>

        <ScrollView>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription</Text>

            <TouchableOpacity
              onPress={() => {
                navigation.push('Subscription');
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <FontAwesome color="#fff" name="rupee" size={20} />
              </View>

              <Text style={styles.rowLabel}>Manage Subscription</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Games</Text>

            <TouchableOpacity
              onPress={() => {
                openWebView('https://biblophile.com/quiz')
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <MaterialIcons color="#fff" name="quiz" size={20} />
              </View>

              <Text style={styles.rowLabel}>Quiz</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                openWebView('https://biblophile.com/hangman')
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <MaterialIcons color="#fff" name="man" size={20} />
              </View>

              <Text style={styles.rowLabel}>Hangman</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Help & Support</Text>

            <TouchableOpacity
              onPress={() => {
                openWebView('https://biblophile.com/policies/faq.php')
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <FontAwesome color="#fff" name="question" size={20} />
              </View>

              <Text style={styles.rowLabel}>FAQs</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                openWebView('https://forms.gle/abqJbuW5UxducZst7')
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <FontAwesome color="#fff" name="book" size={20} />
              </View>

              <Text style={styles.rowLabel}>Request a book</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                openWebView('https://forms.gle/JMbjx6iEn4HVZvvS6')
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <MaterialIcons color="#fff" name="sell" size={20} />
              </View>

              <Text style={styles.rowLabel}>Wish to sell/rent books?</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                openWebView('https://forms.gle/1RgWuAXJamudCRmB7')
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <MaterialIcons color="#fff" name="feedback" size={20} />
              </View>

              <Text style={styles.rowLabel}>Report an Issue</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                openWebView('https://biblophile.com/policies/customer-support.php')
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <Feather color="#fff" name="mail" size={20} />
              </View>

              <Text style={styles.rowLabel}>Contact Us</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal & Policies</Text>

            <TouchableOpacity
              onPress={() => {
                openWebView('https://biblophile.com/policies/terms-of-service.php')
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <Feather color="#fff" name="flag" size={20} />
              </View>

              <Text style={styles.rowLabel}>Terms of Service</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

            <TouchableOpacity
               onPress={() => {
                openWebView('https://biblophile.com/policies/privacy-policy.php')
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <MaterialIcons color="#fff" name="privacy-tip" size={20} />
              </View>

              <Text style={styles.rowLabel}>Privacy Policy</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                openWebView('https://biblophile.com/policies/refund.php')
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <Feather color="#fff" name="flag" size={20} />
              </View>

              <Text style={styles.rowLabel}>Return/Refund Policy</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>More</Text>

            <TouchableOpacity
              onPress={() => {
                navigation.push('About');
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <FontAwesome color="#fff" name="group" size={20} />
              </View>

              <Text style={styles.rowLabel}>About Us</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRefer}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <FontAwesome5 color="#fff" name="user-friends" size={20} />
              </View>

              <Text style={styles.rowLabel}>Refer a Friend</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={rateApp}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <Feather color="#fff" name="star" size={20} />
              </View>

              <Text style={styles.rowLabel}>Rate in App Store</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => logout()}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <MaterialIcons color="#fff" name="logout" size={20} />
              </View>

              <Text style={styles.rowLabel}>Logout</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity>

              {/* delete account hidden */}
            {/* <TouchableOpacity
              onPress={() => {
                // handle onPress
              }}
              style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: COLORS.primaryOrangeHex }]}>
                <MaterialIcons color="#fff" name="delete" size={20} />
              </View>

              <Text style={styles.rowLabel}>Delete Account</Text>

              <View style={styles.rowSpacer} />

              <Feather
                color="#C6C6C6"
                name="chevron-right"
                size={20} />
            </TouchableOpacity> */}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  /** Profile */
  profile: {
    padding: 24,
    marginTop: 15,
    backgroundColor: COLORS.primaryBlackHex,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarWrapper: {
    position: 'relative',
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 9999,
  },
  profileAction: {
    position: 'absolute',
    right: -4,
    bottom: -10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: COLORS.primaryOrangeHex,
  },
  profileName: {
    marginTop: 20,
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
  profileAddress: {
    marginTop: 5,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
  },
  /** Section */
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    paddingVertical: 12,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  /** Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 50,
    backgroundColor: COLORS.secondaryBlackRGBA,
    borderRadius: 8,
    marginBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
  },
  rowSpacer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
});