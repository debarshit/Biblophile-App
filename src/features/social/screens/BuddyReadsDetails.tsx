import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { SafeAreaView } from 'react-native-safe-area-context';
import BuddyReadMembersSection from '../components/BuddyReadMembersSection';
import BuddyReadCommentsSection from '../components/BuddyReadCommentsSection';

// Define the BuddyRead interface
interface Member {
  name: string;
  userId: string;
}

interface CurrentUser {
  userId: string | null;
  readingStatus: string | null;
  currentPage: number;
}

interface BuddyRead {
  buddy_read_id: number;
  book_id: string;
  book_title: string;
  book_photo: string;
  book_pages: number;
  buddy_read_description: string;
  start_date: string;
  end_date: string;
  max_members: number;
  members: Member[];
  host: Member;
}

interface BuddyReadDetailsRouteParams {
  buddyReadId: string;
}

interface Props {
  route: { params: BuddyReadDetailsRouteParams };
}

const BuddyReadsDetails: React.FC<Props> = ({ route }) => {
  const { buddyReadId } = route.params;
  const [buddyRead, setBuddyRead] = useState<BuddyRead | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ userId: null, readingStatus: null, currentPage: 0 });
  const [isMember, setIsMember] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [memberDisplayCount, setMemberDisplayCount] = useState<number>(4);
  const [description, setDescription] = useState<string>('Such empty! Much wow!');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loadingInitialData, setLoadingInitialData] = useState<boolean>(true);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;

  const fetchBuddyReadDetails = useCallback(async () => {
    setLoadingInitialData(true);
    setError(null);
    try {
      const buddyReadResponse = await instance.get(
        `${requests.fetchBuddyReadDetails}&buddy_read_id=${buddyReadId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const buddyReadData = buddyReadResponse.data;
      setBuddyRead(buddyReadData);
      setDescription(buddyReadData?.buddy_read_description || 'Such empty! Much wow!');

      let currentUserData: CurrentUser = { userId: null, readingStatus: null, currentPage: 0 };
      let isHostUser = false;
      let isMemberUser = false;

      if (accessToken) {
        // Only fetch user-specific data if accessToken is available
        const currentUserReadingStatusResponse = await instance.post(
          requests.fetchReadingStatus,
          { bookId: buddyReadData?.book_id },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        currentUserData = {
          userId: currentUserReadingStatusResponse.data.userId,
          readingStatus: currentUserReadingStatusResponse.data.status,
          currentPage: currentUserReadingStatusResponse.data.currentPage || 0,
        };

        // Check if the current user is the host & member
        isHostUser = buddyReadData?.host?.userId == currentUserData.userId;
        isMemberUser = buddyReadData?.members?.some(member => member.userId == currentUserData.userId) || false;
      }

      setCurrentUser(currentUserData);
      setIsHost(isHostUser);
      setIsMember(isMemberUser);
    } catch (err: any) {
      setError('Failed to fetch Buddy Read details');
      console.error('Error fetching buddy read details:', err);
    } finally {
      setLoadingInitialData(false);
    }
  }, [buddyReadId]);

  useEffect(() => {
    fetchBuddyReadDetails();
  }, [fetchBuddyReadDetails]);

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const updateDescription = async () => {
    if (!accessToken || !buddyRead?.buddy_read_id || !currentUser.userId) {
      Alert.alert('Error', 'Not authorized or missing buddy read/user info.');
      return;
    }
    try {
      const response = await instance.post(
        requests.updateBuddyReadDescription,
        {
          userId: currentUser.userId,
          buddyReadId: buddyRead.buddy_read_id,
          description: description,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data.message === 'Updated') {
        Alert.alert('Success', 'Description updated successfully!');
        setIsEditing(false);
        setBuddyRead(prev => prev ? { ...prev, buddy_read_description: description } : prev);
      } else {
        Alert.alert('Error', 'Failed to update description: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating description:', error);
      Alert.alert('Error', 'An error occurred while updating the description.');
    }
  };

  const joinOrLeave = async () => {
    if (buddyRead?.buddy_read_id && currentUser.userId) {
      try {
        const response = await instance.post(
          requests.JoinLeaveBuddyReads,
          {
            buddyReadId: buddyRead.buddy_read_id.toString(),
            userId: currentUser.userId.toString(),
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.data.status === 'added' || response.data.status === 'removed') {
          console.log('Join/Leave action performed');
          fetchBuddyReadDetails(); // Refresh details
        } else {
          Alert.alert('Error', response.data.message || 'Failed to perform action');
        }
      } catch (error) {
        console.error('Error in network:', error);
        Alert.alert('Error', 'Failed to perform action');
      }
    } else {
      Alert.alert('Info', 'Login to join the buddy read');
    }
  };

  const loadMoreMembers = () => {
    setMemberDisplayCount((prevCount) => prevCount + 4);
  };

  const sharePage = async () => {
    if (buddyRead?.book_title) {
      try {
        const result = await Share.share({
          message: `Check out this buddy read for "${buddyRead.book_title}" on Biblophile! https://biblophile.com/social/buddy-reads/${buddyRead.buddy_read_id}`,
        });

        if (result.action === Share.sharedAction) {
          console.log('Shared successfully');
        } else if (result.action === Share.dismissedAction) {
          console.log('Dismissed');
        }
      } catch (error: any) {
        Alert.alert(error.message);
      }
    }
  };

  if (loadingInitialData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (error) {
    return <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (!buddyRead) {
    return <View style={styles.notFoundContainer}><Text style={styles.notFoundText}>Buddy Read not found.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container} >
      <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity onPress={sharePage} style={styles.shareButton}>
          <FontAwesome name="share" size={25} color={COLORS.primaryOrangeHex} />
        </TouchableOpacity>
        <Text style={styles.title}>{buddyRead.book_title}</Text>
        <View style={styles.bookDetailsContainer}>
          <Image source={{ uri: buddyRead.book_photo }} style={styles.bookImage} />
          <View style={styles.buddyReadInfo}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isMember ? COLORS.primaryOrangeHex : buddyRead.members.length < buddyRead.max_members ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex,
                },
              ]}
              onPress={joinOrLeave}
              disabled={!isMember && buddyRead.members.length >= buddyRead.max_members}
            >
              <Text style={styles.actionButtonText}>
                {isMember ? 'Leave' : buddyRead.members.length < buddyRead.max_members ? 'Join' : 'Full'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Ends on:</Text> {buddyRead.end_date ? buddyRead.end_date : 'when everyone finishes'}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Max Members:</Text> {buddyRead.max_members}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Host:</Text> {buddyRead.host.name}
            </Text>
          </View>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Description</Text>
          {isEditing ? (
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={handleDescriptionChange}
              multiline
            />
          ) : (
            <Text style={styles.descriptionText}>{description}</Text>
          )}

          {isHost && (
            <TouchableOpacity onPress={toggleEditing} style={styles.editButton}>
              <Text style={styles.editText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          )}
          {isEditing && (
            <TouchableOpacity onPress={updateDescription} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        {isMember && (
          <>
            <BuddyReadMembersSection
              buddyRead={buddyRead}
              memberDisplayCount={memberDisplayCount}
              loadMoreMembers={loadMoreMembers}
            />

            <BuddyReadCommentsSection
              buddyReadId={buddyReadId}
              currentUser={currentUser}
              isHost={isHost}
              accessToken={accessToken}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  errorText: {
    color: COLORS.primaryRedHex,
    fontSize: FONTSIZE.size_16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  notFoundText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_16,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  scrollViewContainer: {
    paddingHorizontal: SPACING.space_15,
  },
  contentContainer: {
    paddingBottom: SPACING.space_30,
  },
  shareButton: {
    position: 'absolute',
    right: SPACING.space_15,
    top: SPACING.space_15,
    zIndex: 1,
  },
  title: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
    marginTop: SPACING.space_30,
  },
  bookDetailsContainer: {
    flexDirection: 'row',
    gap: SPACING.space_15,
    marginBottom: SPACING.space_20,
  },
  bookImage: {
    width: 120,
    height: 180,
    borderRadius: BORDERRADIUS.radius_8,
  },
  buddyReadInfo: {
    flex: 1,
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  infoText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  infoLabel: {
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.secondaryLightGreyHex,
  },
  descriptionContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_15,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_20,
  },
  descriptionTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  descriptionText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    marginBottom: SPACING.space_15,
  },
  descriptionInput: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderWidth: 1,
    borderColor: COLORS.primaryLightGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_10,
    marginBottom: SPACING.space_15,
    textAlignVertical: 'top',
  },
  editButton: {
    position: 'absolute',
    top: SPACING.space_15,
    right: SPACING.space_15,
  },
  editText: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  saveButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
    marginTop: SPACING.space_10,
  },
  saveButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
});

export default BuddyReadsDetails;