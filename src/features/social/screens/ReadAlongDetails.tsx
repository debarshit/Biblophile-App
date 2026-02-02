import React, { useState, useEffect, useCallback, useRef, use } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReadalongCheckpoints, { ReadalongCheckpointsRef } from '../components/ReadalongCheckpoints';
import { useNavigation } from '@react-navigation/native';
import HeaderBar from '../../../components/HeaderBar';
import ReadalongParticipants from '../components/ReadalongParticipants';

// Define the Readalong interface
interface Host {
  name: string;
  userId: string;
}

interface CurrentUser {
  userId: string | null;
  readingStatus: string | null;
  progressPercentage: number;
}

interface Readalong {
  readalongId: number;
  bookId: string;
  book_title: string;
  book_photo: string;
  book_pages: number;
  readalong_description: string;
  startDate: string;
  endDate: string;
  maxMembers: number;
  members: number;
  host: Host;
}

interface ReadalongssRouteParams {
  readalongId: string;
}

interface Props {
  route: { params: ReadalongssRouteParams };
}

const ReadAlongDetails: React.FC<Props> = ({ route }) => {
  const { readalongId } = route.params;
  const [readalong, setReadalong] = useState<Readalong | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ userId: null, readingStatus: null, progressPercentage: 0 });
  const [isMember, setIsMember] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('Such empty! Much wow!');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loadingInitialData, setLoadingInitialData] = useState<boolean>(true);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;

  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchReadalongDetails = useCallback(async () => {
    setLoadingInitialData(true);
    setError(null);
    try {
      const readalongResponse = await instance.get(
        `${requests.fetchReadalongDetails(readalongId)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const readalong = readalongResponse.data.data;
      setReadalong(readalong);
      setDescription(readalong?.readalongDescription || 'Such empty! Much wow!');

      let currentUserData: CurrentUser = { userId: null, readingStatus: null, progressPercentage: 0 };
      let isHostUser = false;
      let isMemberUser = false;

      if (accessToken) {
        // Only fetch user-specific data if accessToken is available
        const response = await instance.get(requests.fetchReadingStatusByWork(readalong?.workId), {
          headers: {
              Authorization: `Bearer ${userDetails[0].accessToken}`,
          },
        });

        const currentUserReadingStatusResponse = response.data;

        currentUserData = {
          userId: currentUserReadingStatusResponse.data.userId,
          readingStatus: currentUserReadingStatusResponse.data.status,
          progressPercentage: currentUserReadingStatusResponse.data.progressPercentage,
        };

        // Check if the current user is the host
        isHostUser = readalong?.host?.userId == currentUserData.userId;

         // Check if the current user is a member
         const memberCheckResponse = await instance.post(
            requests.checkReadalongMembership, {
                readalongId: readalongId,
            }, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
          }
        );
        isMemberUser = memberCheckResponse.data.data.isMember || false
      }

      setCurrentUser(currentUserData);
      setIsHost(isHostUser);
      setIsMember(isMemberUser);
    } catch (err: any) {
      setError('Failed to fetch readalong details');
      console.error('Error fetching readalong details:', err);
    } finally {
      setLoadingInitialData(false);
    }
  }, [readalongId]);

  useEffect(() => {
    fetchReadalongDetails();
  }, [fetchReadalongDetails]);

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const updateDescription = async () => {
    if (!accessToken || !readalong?.readalongId || !currentUser.userId) {
      Alert.alert('Error', 'Not authorized or missing readalong/user info.');
      return;
    }
    try {
      const response = await instance.put(
        requests.updateReadalongDescription(readalong.readalongId),
        {
          description: description,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data.message === 'Readalong description updated successfully.') {
        Alert.alert('Success', 'Description updated successfully!');
        setIsEditing(false);
        setReadalong(prev => prev ? { ...prev, readalong_description: description } : prev);
      } else {
        Alert.alert('Error', 'Failed to update description: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating description:', error);
      Alert.alert('Error', 'An error occurred while updating the description.');
    }
  };

  const joinOrLeave = async () => {
    if (readalong?.readalongId && currentUser.userId) {
      try {
        const response = await instance.post(
          requests.JoinLeaveReadalongs,
          {
            readalongId: readalong.readalongId.toString(),
            userId: currentUser.userId.toString(),
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.data.status === 'success') {
          console.log('Join/Leave action performed');
          fetchReadalongDetails(); // Refresh details
        } else {
          Alert.alert('Error', response.data.message || 'Failed to perform action');
        }
      } catch (error) {
        console.error('Error in network:', error);
        Alert.alert('Error', 'Failed to perform action');
      }
    } else {
      Alert.alert('Info', 'Login to join the readalong');
    }
  };

  const sharePage = async () => {
    if (readalong?.book_title) {
      try {
        const result = await Share.share({
          message: `Check out this readalong for "${readalong.book_title}" on Biblophile! https://biblophile.com/social/readalong/${readalong.readalongId}`,
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

  if (!readalong) {
    return <View style={styles.notFoundContainer}><Text style={styles.notFoundText}>Readalong not found.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container} >
      <HeaderBar showBackButton={true} title='Readalong' />
        <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.contentContainer} ref={scrollViewRef} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={sharePage} style={styles.shareButton}>
            <FontAwesome name="share" size={25} color={COLORS.primaryOrangeHex} />
          </TouchableOpacity>
          <Text style={styles.title}>{readalong.book_title}</Text>
          <View style={styles.bookDetailsContainer}>
            {/* Book Image */}
            <TouchableOpacity onPress={() => navigation.navigate('Details', { id: readalong.bookId, type: 'Book' })}>
              <Image source={{ uri: readalong.book_photo }} style={styles.bookImage} />
            </TouchableOpacity>
            {/* Readalong Read Details */}
            <View style={styles.readalongInfo}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isMember ? COLORS.primaryOrangeHex : readalong.members < readalong.maxMembers ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex,
                  },
                ]}
                onPress={joinOrLeave}
                disabled={!isMember && readalong.members >= readalong.maxMembers}
              >
                <Text style={styles.actionButtonText}>
                  {isMember ? 'Leave' : readalong.members < readalong.maxMembers ? 'Join' : 'Full'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Ends on:</Text> {readalong.endDate ? readalong.endDate : 'when everyone finishes'}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Max Members:</Text> {readalong.maxMembers}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Host:</Text> {readalong.host.name}
              </Text>
            </View>
          </View>

          {/* Description Section */}
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
              <ReadalongParticipants readalongId={readalong.readalongId} />
          )}

            {/* update the text color; it is invisible currently */}
          {isHost ? (
            <TouchableOpacity onPress={() => navigation.navigate('CreateReadalongCheckpoint', { readalong: readalong, currentUser: currentUser, isHost: isHost })}>
              <Text style={{color: COLORS.primaryWhiteHex}}>Create a new checkpoint</Text>
            </TouchableOpacity>
          ) : <Text style={{color: COLORS.primaryWhiteHex}}></Text>}

          {isMember && (
            <ReadalongCheckpoints readalong={readalong} currentUser={currentUser} isMember={isMember} isHost={isHost} />
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
    paddingBottom: SPACING.space_10,
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
  readalongInfo: {
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

export default ReadAlongDetails;