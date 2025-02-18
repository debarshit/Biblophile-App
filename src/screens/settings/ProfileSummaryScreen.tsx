import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import instance from '../../services/axios';
import requests from '../../services/requests';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../theme/theme';
import { useStore } from '../../store/store';
import BookshelfComponent from '../../components/BookshelfComponent';
import UserReviews from '../../components/UserReviews';

const ProfileSummaryScreen = ({ navigation, route }: any) => {
  const [userData, setUserData] = useState(null);
  const [userRelations, setUserRelations] = useState(null);
  const [privacyStatus, setPrivacyStatus] = useState('public');
  const [isPageOwner, setIsPageOwner] = useState(false);
  const [userAverageRating, setUserAverageRating] = useState<number | null>(null);
  const [userAverageEmotions, setUserAverageEmotions] = useState([]);
  const [averageReadingDays, setAverageReadingDays] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('bookshelf');
  const [loading, setLoading] = useState(true);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;
  const username = route.params.username;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataResponse = await instance.post(
          requests.fetchUserDataFromUsername,
          { username: username },
          {
            headers: {
              Authorization: accessToken ? `Bearer ${accessToken}` : '',
            },
          }
        );

        const userData = userDataResponse.data;
        setUserData(userData);
        setIsPageOwner(userData.isPageOwner || false);

        if (!userData.isPageOwner) {
          const [userRelationsResponse, privacyStatusResponse] = await Promise.all([
            instance.post(requests.fetchUserRelations, { pageOwner: userData.userId }, { headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' } }),
            instance.post(requests.fetchPrivacyStatus, { pageOwner: userData.userId }, { headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' } })
          ]);
          setUserRelations(userRelationsResponse.data);
          setPrivacyStatus(privacyStatusResponse.data);
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
          const [averageRatingResponse, averageEmotionsResponse, averageReadingDaysResponse] = await Promise.all([
            instance(requests.fetchAverageRatingByUser + userData.userId),
            instance(requests.fetchAverageEmotionsByUser + userData.userId),
            instance(requests.fetchAverageDaystoFinish + userData.userId)
          ]);
          setUserAverageRating(averageRatingResponse.data.averageRating);
          setUserAverageEmotions(averageEmotionsResponse.data.topEmotions || []);
          setAverageReadingDays(averageReadingDaysResponse.data.averageDaysToFinish);
        } catch (error) {
          console.error('Failed to fetch additional user data:', error);
        }
      };

      fetchAdditionalData();
    }
  }, [userData]);

  const handleFriendRequest = async (action:string) => {
    try {
      let apiEndpoint = requests.toggleFriend;
      const requestData = {
        sender_user_id: userData.userId,
        action,
      };
  
      if (action === 'add') {
        apiEndpoint = requests.toggleFriend;
      } else if (action === 'unfriend') {
        apiEndpoint = requests.toggleFriend;
      } else if (action === 'cancel') {
        apiEndpoint = requests.toggleFriend;
      } else if (action === 'confirm') {
        apiEndpoint = requests.confirmRejectFriend;
        action = 'confirm';
      } else if (action === 'reject') {
        apiEndpoint = requests.confirmRejectFriend;
        action = 'reject';
      }
  
      const response = await instance.post(apiEndpoint, requestData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      console.log(response.data);
      // Optionally, update the UI to reflect the new relationship state
      // You might want to refresh or update `userRelations` based on the response
    } catch (error) {
      console.error('Error handling friend request:', error);
    }
  };

  const handleFollowRequest = async () => {
    try {
      const response = await instance.post(
        requests.toggleFollow,
        {
          following_id: userData.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      alert(response.data.message);
    } catch (error) {
      console.error('Error handling follow request:', error);
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
        <>
        <TouchableOpacity style={styles.addFriendButton} onPress={() => handleFriendRequest('confirm')}>
          <Text style={styles.buttonText}>Confirm Friend</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addFriendButton} onPress={() => handleFriendRequest('reject')}>
          <Text style={styles.buttonText}>Reject Friend</Text>
        </TouchableOpacity>
        </>
      );
    } else {
      return (<TouchableOpacity style={styles.addFriendButton} onPress={() => handleFriendRequest('add')}>
      <Text style={styles.buttonText}>Add Friend</Text>
      </TouchableOpacity>);
    }
  };

  const formattedMoodPreferences = userAverageEmotions.map((mood) => mood.Emotion).join(', ');

  const renderContent = () => {
    switch (activeTab) {
      case 'bookshelf':
        return (
          <View style={styles.TabContent}>
            <BookshelfComponent userId={userData.userId} />
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
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>{username}'s Reading Journal</Text>
      {!isPageOwner && (
        <View style={styles.buttonsSection}>
          <TouchableOpacity style={styles.addFriendButton}>
            <Text style={styles.buttonText}>{getFriendButtonText()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.followButton} onPress={() => handleFollowRequest()}>
            <Text style={styles.buttonText}>{userRelations?.isFollowing ? "Unfollow" : "Follow"}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.horizontalLine} />
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
          <View style={styles.summaryItem}>
            <Text style={styles.sectionTitle}>Average Days to Finish a Book</Text>
            <Text style={styles.descriptionText}><Text style={styles.highlightText}>{averageReadingDays}</Text> days</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.sectionTitle}>Average Rating</Text>
            <Text style={styles.descriptionText}><Text style={styles.highlightText}>{userAverageRating}</Text> / 5</Text>
          </View>
        </View>
      </View>

      <View style={styles.horizontalLine} />
      <View style={styles.TabBar}>
        <TouchableOpacity onPress={() => setActiveTab('bookshelf')} style={[styles.TabButton, activeTab === 'bookshelf' && styles.TabButtonActive]}>
          <Text style={[styles.TabLabel, activeTab === 'bookshelf' && styles.TabLabelActive]}>Bookshelf</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('reviews')} style={[styles.TabButton, activeTab === 'reviews' && styles.TabButtonActive]}>
          <Text style={[styles.TabLabel, activeTab === 'reviews' && styles.TabLabelActive]}>Reviews</Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.space_20,
    backgroundColor: COLORS.primaryBlackHex,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  booksSection: {
    marginBottom: SPACING.space_20,
  },
  infoSection: {
    flexDirection: 'column',
    gap: SPACING.space_20,
  },
  buttonsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.space_8,
    marginBottom: SPACING.space_8,
  },

  addFriendButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: COLORS.primaryBlackRGBA,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    width: 140,
  },

  followButton: {
    backgroundColor: COLORS.primaryBlackHex,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: COLORS.primaryBlackRGBA,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    width: 140,
  },

  buttonText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_12,
  },
  horizontalLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_20,
  },
  section: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_20,
    marginBottom: SPACING.space_20,
  },
  sectionTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
    marginBottom: SPACING.space_16,
    color: COLORS.primaryWhiteHex,
    alignSelf: 'center',
  },
  booksList: {
    flexDirection: 'row',
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
  summaryItem: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_16,
    textAlign: 'center',
    shadowColor: COLORS.primaryBlackRGBA,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    margin: SPACING.space_10,
    alignItems: 'center',
  },
  TabBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: SPACING.space_8,
  },
  TabButton: {
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
  },
  TabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primaryOrangeHex,
  },
  TabLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  TabLabelActive: {
    color: COLORS.primaryOrangeHex,
  },
  TabContent: {
    flexGrow: 1,
    padding: SPACING.space_20,
  },
});

export default ProfileSummaryScreen;