import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONTSIZE, FONTFAMILY, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import GradientBGIcon from '../../../components/GradientBGIcon';
import BookClubTabNavigator from '../components/BookClubTabNavigator';
import BookClubMeetings from '../components/BookClubMeetings';
import BookClubAbout from '../components/BookClubAbout';

interface Member {
  name: string;
  userId: string;
}

interface BookClub {
  clubId: number;
  clubName: string;
  description: string;
  about: string;
  codeOfConduct: string;
  hosts: Member[];
  isHost: boolean;
  createdByUserId: string;
}

export default function BookClubDetailsScreen() {
  const route = useRoute<any>();
  const { bookClubId } = route.params;

  const [bookClub, setBookClub] = useState<BookClub | null>(null);
  const [activeTab, setActiveTab] = useState('meetings');
  const [isMember, setIsMember] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;

  useEffect(() => {
    fetchBookClubDetails();
  }, []);

  const fetchBookClubDetails = async () => {
    try {
      const bookclubResponse = await instance.get(
        `${requests.fetchBookClubDetails(bookClubId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const response = bookclubResponse.data;
      if (response.data) {
        setBookClub(response.data);
        setDescription(response.data.description || 'Such empty! Much wow!');
        setIsHost(response.data.isHost);

        const membershipCheck = await instance.get(
          `${requests.checkBookClubMembership(bookClubId)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        setIsMember(membershipCheck.data.data?.isMember ?? false);
      }
    } catch (err) {
      setError('Failed to fetch Book club details');
    }
  };

  const toggleEditing = () => setIsEditing(prev => !prev);

  const updateDescription = async () => {
    try {
      const response = await instance.put(
        `${requests.updateBookClubDescription(bookClub?.clubId)}`,
        {
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data?.message === 'Book club description updated successfully.') {
        Alert.alert('Success', 'Description updated successfully!');
        toggleEditing();
      } else {
        Alert.alert('Failed', response.data?.message || 'Update failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the description.');
    }
  };

  const joinOrLeave = async () => {
    try {
      const joinLeaveResponse = await instance.post(
        `${requests.JoinLeaveBookClub}`,
        { bookClubId: bookClub?.clubId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const response = joinLeaveResponse.data;
      if (joinLeaveResponse.data.message === 'added') {
        setIsMember(true);
      } else if (joinLeaveResponse.data.message === 'removed') {
        setIsMember(false);
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error) {
      Alert.alert('Network Error', 'Failed to update membership status.');
    }
  };

  const sharePage = async () => {
    try {
      await Share.share({
        title: bookClub?.clubName ?? 'Book Club',
        message: `Check out this book club: https://www.biblophile.com/social/book-clubs/${bookClub?.clubName}/${bookClub?.clubName}`,
      });
    } catch (error) {
      console.error('Sharing failed:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'meetings':
        return (
          <BookClubMeetings bookClub={bookClub} isHost={isHost} isMember={isMember}/>
        );
      case 'forum':
        return (
          <Text style={styles.label}>forum</Text>
        );
      case 'about':
        return (
          <BookClubAbout bookClub={bookClub} isHost={isHost} />
        );
      default:
        return null;
    }
  };

  if (error) {
    return <Text style={{ color: 'red', padding: SPACING.space_20 }}>{error}</Text>;
  }

  if (!bookClub) {
    return <Text style={{ color: 'gray', padding: SPACING.space_20 }}>Loading...</Text>;
  }

  let runByText = '';
  const hosts = bookClub.hosts;
  if (hosts.length === 1) runByText = hosts[0].name;
  else if (hosts.length === 2) runByText = `${hosts[0].name} and ${hosts[1].name}`;
  else if (hosts.length > 2) runByText = `${hosts[0].name}, ${hosts[1].name} and more`;

  return (
    <ScrollView style={styles.container}>
        <SafeAreaView>
            <TouchableOpacity onPress={sharePage}>
            <GradientBGIcon 
                name="sharealt" 
                color={COLORS.primaryLightGreyHex} 
                size={FONTSIZE.size_16} 
            />
            </TouchableOpacity>
            <Text style={styles.title}>{bookClub.clubName}</Text>

            <View style={styles.section}>
                <TouchableOpacity style={styles.joinButton} onPress={joinOrLeave}>
                <Text style={styles.joinButtonText}>{isMember ? 'Leave' : 'Join'}</Text>
                </TouchableOpacity>
                <Text style={styles.runBy}>
                <Text style={styles.label}>Run by:</Text> {runByText}
                </Text>
            </View>

            <View style={styles.descriptionBox}>
                <Text style={styles.descriptionTitle}>Description</Text>
                {isEditing ? (
                <>
                    <TextInput
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    style={styles.textArea}
                    />
                    <TouchableOpacity onPress={updateDescription} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </>
                ) : (
                <>
                    <Text style={styles.descriptionText}>{description}</Text>
                    {isHost && (
                    <TouchableOpacity onPress={toggleEditing}>
                        <Text style={styles.editLink}>Edit</Text>
                    </TouchableOpacity>
                    )}
                </>
                )}
            </View>

            {isMember && (
                <View style={styles.FooterInfoArea}>
                  <BookClubTabNavigator activeTab={activeTab} setActiveTab={setActiveTab} />
                  {renderContent()}
                </View>
            )}
        </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.secondaryDarkGreyHex,
      padding: SPACING.space_20,
    },
    shareIcon: {
      alignSelf: 'flex-end',
      marginBottom: SPACING.space_16,
    },
    title: {
      fontSize: FONTSIZE.size_24,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_20,
      textAlign: 'center',
    },
    section: {
      marginBottom: SPACING.space_20,
    },
    joinButton: {
      backgroundColor: COLORS.primaryOrangeHex,
      paddingVertical: SPACING.space_10,
      paddingHorizontal: SPACING.space_20,
      borderRadius: BORDERRADIUS.radius_10,
      alignSelf: 'flex-start',
    },
    joinButtonText: {
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_16,
    },
    runBy: {
      marginTop: SPACING.space_12,
      color: COLORS.secondaryLightGreyHex,
    },
    label: {
      fontWeight: 'bold',
    },
    descriptionBox: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      padding: SPACING.space_16,
      borderRadius: BORDERRADIUS.radius_10,
      marginTop: SPACING.space_16,
    },
    descriptionTitle: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_12,
    },
    descriptionText: {
      color: COLORS.primaryLightGreyHex,
      marginBottom: SPACING.space_8,
    },
    textArea: {
      borderColor: COLORS.primaryLightGreyHex,
      borderWidth: 1,
      borderRadius: BORDERRADIUS.radius_10,
      padding: SPACING.space_12,
      color: COLORS.primaryLightGreyHex,
      backgroundColor: COLORS.primaryDarkGreyHex,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    saveButton: {
      backgroundColor: COLORS.primaryOrangeHex,
      padding: SPACING.space_10,
      borderRadius: BORDERRADIUS.radius_10,
      marginTop: SPACING.space_8,
      alignItems: 'center',
    },
    saveButtonText: {
      color: COLORS.primaryWhiteHex,
      fontSize: FONTSIZE.size_16,
      fontFamily: FONTFAMILY.poppins_medium,
    },
    editLink: {
      color: COLORS.primaryOrangeHex,
      textDecorationLine: 'underline',
    },
    FooterInfoArea: {
      padding: SPACING.space_20,
    },
  });  