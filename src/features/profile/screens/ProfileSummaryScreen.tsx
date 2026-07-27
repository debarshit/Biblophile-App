import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Share, Linking } from 'react-native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import { useStore } from '../../../store/store';
import BookshelfComponent from '../components/BookshelfComponent';
import UserReviews from '../../reading/components/UserReviews';
import { AntDesign, Entypo, Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useStreak } from '../../../hooks/useStreak';
import { useTheme } from '../../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

// Only keys with a non-empty URL are rendered.
const SOCIAL_ICON_MAP: Record<string, { lib: 'Entypo' | 'FontAwesome5'; name: string }> = {
  instagram: { lib: 'Entypo', name: 'instagram' },
  twitter: { lib: 'Entypo', name: 'twitter' },
  tiktok: { lib: 'FontAwesome5', name: 'tiktok' },
  goodreads: { lib: 'FontAwesome5', name: 'goodreads' },
  website: { lib: 'FontAwesome5', name: 'blog' },
};

const ProfileSummaryScreen = ({ navigation, route }: any) => {
  const [userData, setUserData] = useState(null);
  const [userRelations, setUserRelations] = useState(null);
  const [privacyStatus, setPrivacyStatus] = useState<boolean>(true);
  const [isPageOwner, setIsPageOwner] = useState(false);
  const [userAverageRating, setUserAverageRating] = useState<number | null>(null);
  const [userAverageEmotions, setUserAverageEmotions] = useState([]);
  const [averageReadingDays, setAverageReadingDays] = useState<number | null>(null);
  const [socialLinks, setSocialLinks] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState('bookshelf');
  const [loading, setLoading] = useState(true);

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Tab', { screen: 'Home' });
    }
  };

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;
  const username = route.params.username;
  const pageOwnerUserId = userData?.userId;

  const { currentStreak } = useStreak(userDetails[0]?.accessToken, pageOwnerUserId);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await instance(
          requests.fetchUserDataFromUsername(username),
          {
            headers: {
              Authorization: accessToken ? `Bearer ${accessToken}` : '',
            },
          }
        );

        const userDataResponse = response.data;
        const userData = userDataResponse.data;
        setUserData(userData);
        setIsPageOwner(userData.isPageOwner || false);

        if (!userData.isPageOwner) {
          const [userRelationsResponse, privacyResponse] = await Promise.all([
            instance(requests.fetchUserRelations(userData.userId), {
              headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' }
            }),
            instance.get(
              `${requests.fetchPrivacyView}?userId=${userData.userId}`,
              {
                headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' }
              }
            )
          ]);

          setUserRelations(userRelationsResponse.data.data);
          setPrivacyStatus(privacyResponse.data.data.canViewProfile);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  useEffect(() => {
    if (userData) {
      const fetchAdditionalData = async () => {
        try {
          const [averageRatingResponse, averageEmotionsResponse, averageReadingDaysResponse, socialLinksResponse] = await Promise.all([
            instance(requests.fetchAverageRatingByUser + userData.userId),
            instance(requests.fetchAverageEmotionsByUser + userData.userId),
            instance(requests.fetchAverageDaystoFinish + userData.userId),
            instance(`${requests.getSocialLinks}?userId=${userData.userId}`),
          ]);
          setUserAverageRating(averageRatingResponse.data.data.averageRating);
          setUserAverageEmotions(averageEmotionsResponse.data.data.topEmotions || []);
          setAverageReadingDays(averageReadingDaysResponse.data.data.averageDaysToFinish);
          setSocialLinks(socialLinksResponse.data?.data || {});
        } catch (error) {
          console.error('Failed to fetch additional user data:', error);
        }
      };

      fetchAdditionalData();
    }
  }, [userData]);

  const handleShareProfile = async () => {
    try {
      const profileUrl = `https://biblophile.com/profile/${username}`;

      await Share.share({
        message: `Check out this profile: ${profileUrl}`,
        title: `${userData?.name}'s Profile`,
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  const handleSocialLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening social link:', error);
    }
  };

  const handleFriendRequest = async (action:string) => {
    const prevState = userRelations;
    // optimistic update
    setUserRelations((prev) => {
      if (!prev) return prev;
      switch (action) {
        case 'add':
          return { ...prev, isPendingRequest: true };

        case 'cancel':
          return { ...prev, isPendingRequest: false };

        case 'unfriend':
          return { ...prev, isFriends: false };

        case 'confirm':
          return {
            ...prev,
            isFriends: true,
            isReversePendingRequest: false,
          };

        case 'reject':
          return {
            ...prev,
            isReversePendingRequest: false,
          };

        default:
          return prev;
      }
    });
    try {
      let apiEndpoint = requests.toggleFriend;
      let requestData;

      if (action === 'confirm' || action === 'reject') {
        apiEndpoint = requests.confirmRejectFriend;

        requestData = {
          sender_user_id: userData.userId,
          action,
        };
      } else {
        apiEndpoint = requests.toggleFriend;

        requestData = {
          receiver_user_id: userData.userId,
        };
      }

      await instance.post(apiEndpoint, requestData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('Error handling friend request:', error);
      // rollback
      setUserRelations(prevState);
    }
  };

  const handleFollowRequest = async () => {
    const prevState = userRelations;
    // optimistic update
    setUserRelations((prev) => ({
      ...prev,
      isFollowing: !prev?.isFollowing,
    }));
    try {
      await instance.post(
        requests.toggleFollow,
        { following_id: userData.userId },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
    } catch (error) {
      console.error('Error handling follow request:', error);
      // rollback if failed
      setUserRelations(prevState);
    }
  };

  const getFriendButtonText = () => {
    if (userRelations?.isFriends) {
      return (<TouchableOpacity style={styles.addFriendButton} onPress={() => handleFriendRequest('unfriend')}>
      <Text style={styles.buttonText}>Friends</Text>
      </TouchableOpacity>);
    } else if (userRelations?.isPendingRequest) {
      return (<TouchableOpacity style={styles.addFriendButton} onPress={() => handleFriendRequest('cancel')}>
      <Text style={styles.buttonText}>Pending Request</Text>
      </TouchableOpacity>);
    } else if (userRelations?.isReversePendingRequest) {
      return (
        <View style={{flexDirection: 'row', gap: SPACING.space_8, justifyContent: 'space-around'}}>
        <TouchableOpacity style={styles.addFriendButton} onPress={() => handleFriendRequest('confirm')}>
          <Text style={styles.buttonText}>Confirm Friend</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addFriendButton} onPress={() => handleFriendRequest('reject')}>
          <Text style={styles.buttonText}>Reject Friend</Text>
        </TouchableOpacity>
        </View>
      );
    } else {
      return (<TouchableOpacity style={styles.addFriendButton} onPress={() => handleFriendRequest('add')}>
      <Text style={styles.buttonText}>Add Friend</Text>
      </TouchableOpacity>);
    }
  };

  const formattedMoodPreferences = userAverageEmotions.map((mood) => mood.Emotion).join(', ');

  const socialLinkEntries = useMemo(() => {
    return Object.keys(SOCIAL_ICON_MAP)
      .filter((key) => !!socialLinks[key])
      .map((key) => ({ key, url: socialLinks[key], ...SOCIAL_ICON_MAP[key] }));
  }, [socialLinks]);

  const renderContent = () => {
    switch (activeTab) {
      case 'bookshelf':
        return (
          <View style={styles.TabContent}>
            <BookshelfComponent userData={userData} />
          </View>
        );
      case 'reviews':
        return (
          <View style={styles.TabContent}>
            <UserReviews userData={userData} />
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={COLORS.primaryWhiteHex} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{username}</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity onPress={handleShareProfile} style={styles.headerShareButton}>
            <Feather name="share-2" size={20} color={COLORS.primaryWhiteHex} />
          </TouchableOpacity>
          {isPageOwner && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.headerSettingsButton}
            >
              <Feather name="menu" size={20} color={COLORS.primaryWhiteHex} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.container}>
        {/* Profile Info Section: side-by-side photo + friends count */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            onPress={isPageOwner ? () => navigation.push('Profile') : undefined}
            style={styles.avatarWrapper}
            disabled={!isPageOwner}
          >
            <View style={styles.avatarBorder}>
              <Image
                source={{ uri: userData?.profilePic }}
                style={styles.profileImage}
              />
            </View>
            {isPageOwner && (
              <View style={styles.editBadge}>
                <Feather name="edit-3" size={10} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.friendsStatContainer}>
            <TouchableOpacity
              style={styles.friendsStatColumn}
              onPress={() =>
                navigation.push('FriendsList', {
                  pageOwnerId: userData.userId,
                  profileName: userData.name,
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.statNumber}>{userData?.friendsCount || 0}</Text>
              <Text style={styles.statLabelText}>Friends</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Name */}
        <View style={styles.bioContainer}>
          <Text style={styles.profileName}>{userData?.name}</Text>
        </View>

        {/* Social Links Row */}
        {socialLinkEntries.length > 0 && (
          <View style={styles.socialLinksRow}>
            {socialLinkEntries.map((entry) => (
              <TouchableOpacity
                key={entry.key}
                style={styles.socialLinkButton}
                onPress={() => handleSocialLinkPress(entry.url)}
              >
                {entry.lib === 'FontAwesome5' ? (
                  <FontAwesome5 name={entry.name} size={18} color={COLORS.primaryWhiteHex} />
                ) : (
                  <Entypo name={entry.name} size={18} color={COLORS.primaryWhiteHex} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          {isPageOwner ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigation.push('Profile')}
            >
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.friendActionWrapper}>
              {getFriendButtonText()}
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleShareProfile}
          >
            <Feather name="share-2" size={13} color={COLORS.primaryWhiteHex} style={{ marginRight: 6 }} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.horizontalLine} />

        {/* Mood Preferences (old style) */}
        <View style={styles.infoSection}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood Preferences</Text>
            {userAverageEmotions.length === 0 ? (
              <Text style={styles.highlightText}>Sufficient data not available.</Text>
            ) : (
              <Text style={styles.descriptionText}>
                Prefers to read books which evoke <Text style={styles.highlightText}>{formattedMoodPreferences}</Text>.
              </Text>
            )}
          </View>
          <View style={styles.section}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}><MaterialCommunityIcons name="bookshelf" size={22} color={COLORS.primaryWhiteHex} /></Text>
                <Text style={styles.statValue}>{averageReadingDays || 0}d</Text>
                <Text style={styles.statLabel}>per book</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statIcon}><AntDesign name="star" size={22} color={COLORS.primaryWhiteHex} /></Text>
                <Text style={styles.statValue}>{userAverageRating ? userAverageRating : '0.0'}</Text>
                <Text style={styles.statLabel}>avg rating</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statIcon}>
                  <FontAwesome5 name="fire" size={20} color={COLORS.primaryWhiteHex} />
                </Text>
                <Text style={styles.statValue}>{currentStreak || 0}</Text>
                <Text style={styles.statLabel}>day streak</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.horizontalLine} />

        {privacyStatus ? (
          <>
            {/* Tab Bar (new style) */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                onPress={() => setActiveTab('bookshelf')}
                style={[styles.tabButton, activeTab === 'bookshelf' && styles.tabButtonActive]}
              >
                <Feather
                  name="grid"
                  size={18}
                  color={activeTab === 'bookshelf' ? COLORS.primaryOrangeHex : COLORS.secondaryLightGreyHex}
                />
                <Text style={[styles.tabLabel, activeTab === 'bookshelf' && styles.tabLabelActive]}>
                  Bookshelf
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('reviews')}
                style={[styles.tabButton, activeTab === 'reviews' && styles.tabButtonActive]}
              >
                <Feather
                  name="message-circle"
                  size={18}
                  color={activeTab === 'reviews' ? COLORS.primaryOrangeHex : COLORS.secondaryLightGreyHex}
                />
                <Text style={[styles.tabLabel, activeTab === 'reviews' && styles.tabLabelActive]}>
                  Reviews
                </Text>
              </TouchableOpacity>
            </View>
            {renderContent()}
          </>
        ) : (
          <View style={styles.privateContainer}>
            <Feather name="lock" size={40} color={COLORS.secondaryLightGreyHex} />
            <Text style={styles.privateText}>This profile is private</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
    },
    container: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
      
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.space_16,
      paddingVertical: SPACING.space_12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.primaryDarkGreyHex,
    },
    backButton: {
      padding: SPACING.space_4,
    },
    headerTitle: {
      fontSize: FONTSIZE.size_16,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
    },
    headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerShareButton: {
      padding: SPACING.space_4,
      marginRight: SPACING.space_12,
    },
    headerSettingsButton: {
      padding: SPACING.space_4,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.space_20,
      marginTop: SPACING.space_20,
    },
    avatarWrapper: {
      position: 'relative',
    },
    avatarBorder: {
      padding: 3,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: COLORS.primaryOrangeHex,
    },
    profileImage: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: COLORS.primaryDarkGreyHex,
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
    friendsStatContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-start',
      marginLeft: SPACING.space_24,
    },
    friendsStatColumn: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    statNumber: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
    },
    statLabelText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      marginTop: 2,
    },
    bioContainer: {
      paddingHorizontal: SPACING.space_20,
      marginTop: SPACING.space_16,
    },
    profileName: {
      fontSize: FONTSIZE.size_16,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    socialLinksRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.space_20,
      marginTop: SPACING.space_12,
      gap: SPACING.space_12,
    },
    socialLinkButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: COLORS.secondaryDarkGreyHex,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: COLORS.primaryDarkGreyHex,
    },
    actionButtonsRow: {
      flexDirection: 'row',
      paddingHorizontal: SPACING.space_20,
      marginTop: SPACING.space_16,
      marginBottom: SPACING.space_16,
      gap: SPACING.space_10,
    },
    actionButton: {
      flex: 1,
      height: 38,
      borderRadius: BORDERRADIUS.radius_8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    primaryButton: {
      backgroundColor: COLORS.primaryOrangeHex,
    },
    secondaryButton: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderWidth: 1,
      borderColor: COLORS.primaryDarkGreyHex,
    },
    actionButtonText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    friendActionWrapper: {
      flex: 1,
    },
    addFriendButton: {
      height: 38,
      borderRadius: BORDERRADIUS.radius_8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.primaryOrangeHex,
    },
    friendStatusButton: {
      height: 38,
      borderRadius: BORDERRADIUS.radius_8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderWidth: 1,
      borderColor: COLORS.primaryDarkGreyHex,
    },
    buttonText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    horizontalLine: {
      borderBottomWidth: 1,
      borderBottomColor: COLORS.primaryLightGreyHex,
      marginHorizontal: SPACING.space_20,
      marginBottom: SPACING.space_20,
    },
    infoSection: {
      flexDirection: 'column',
      gap: SPACING.space_12,
      paddingHorizontal: SPACING.space_20,
    },
    section: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_10,
      padding: SPACING.space_20,
    },
    sectionTitle: {
      fontSize: FONTSIZE.size_20,
      fontFamily: FONTFAMILY.poppins_bold,
      marginBottom: SPACING.space_16,
      color: COLORS.primaryWhiteHex,
      alignSelf: 'center',
    },
    descriptionText: {
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_18,
    },
    highlightText: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_18,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIcon: {
      fontSize: FONTSIZE.size_24,
      marginBottom: SPACING.space_4,
    },
    statValue: {
      fontSize: FONTSIZE.size_20,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryOrangeHex,
      marginBottom: SPACING.space_2,
    },
    statLabel: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      textAlign: 'center',
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: COLORS.secondaryLightGreyHex,
      opacity: 0.3,
    },
    tabBar: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: COLORS.primaryDarkGreyHex,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.primaryDarkGreyHex,
      marginTop: SPACING.space_8,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.space_12,
      gap: SPACING.space_8,
    },
    tabButtonActive: {
      borderBottomWidth: 2,
      borderBottomColor: COLORS.primaryOrangeHex,
    },
    tabLabel: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
    tabLabelActive: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_semibold,
    },
    TabContent: {
      flex: 1,
      padding: SPACING.space_36,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.primaryBlackHex,
    },
    privateContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 60,
      paddingHorizontal: SPACING.space_32,
    },
    privateText: {
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.secondaryLightGreyHex,
      fontSize: FONTSIZE.size_14,
      marginTop: 8,
      textAlign: 'center',
    },
  });

export default ProfileSummaryScreen;