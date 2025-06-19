import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';
import ChallengePrompts from '../components/ChallengePrompts';
import ChallengePromptDetails from '../components/ChallengePromptDetails';
import CreatePrompt from '../components/CreatePrompt';

const ChallengeDetailsScreen = ({ route, navigation }: any) => {
  const { challengeId } = route.params;
  const [challenge, setChallenge] = useState(null);
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentView, setCurrentView] = useState<'prompts' | 'create' | 'details'>('prompts');
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;

  const fetchChallengeDetails = async () => {
    try {
      setLoading(true);
      const response = await instance(`${requests.fetchChallengeDetails(challengeId)}`);

      const challengeData = response.data.data;
      console.log(challengeData);
      setChallenge(challengeData);
      setDescription(challengeData.challengeDescription || 'No description available.');
      setIsHost(challengeData.Host.userId === userDetails[0]?.userId);

      const progressResponse = await instance.post(requests.checkChallengeMembership, {
        challengeId: challengeId,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const membershipData = progressResponse.data.data;
      setIsMember(membershipData.isMember);
      setProgress((membershipData.progress || 0) / 100);

    } catch (error) {
      setError('Failed to fetch challenge details');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch challenge details.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengeDetails();
  }, [challengeId]);

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const updateDescription = async () => {
    try {
      const response = await instance.put(requests.updateChallengeDescription(challenge.challengeId), {
        description: description,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = response.data;
      if (result.message === 'Challenge description updated successfully.') {
        Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Description updated!',
        });
      } else {
        Alert.alert('Error', 'Failed to update description: ' + result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the description.');
    }
  };

  const joinOrLeaveChallenge = async () => {
    try {
      const response = await instance.post(requests.JoinLeaveChallenge, {
        challengeId: challenge.challengeId,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = response.data;
      if (data.message === 'User successfully joined the challenge.') {
        setIsMember(true);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'You joined the challenge!',
        });
      } else if (data.message === 'User successfully left the challenge.') {
        setIsMember(false);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'You left the challenge.',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to join/leave the challenge.',
      });
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!challenge) {
    return <Text style={styles.errorText}>Challenge not found.</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
      >
      <Text style={styles.challengeTitle}>{challenge.challengeTitle}</Text>

      {/* Join/Leave Challenge Button */}
      <TouchableOpacity onPress={joinOrLeaveChallenge} style={styles.joinLeaveButton}>
        <Text style={styles.joinLeaveButtonText}>{isMember ? 'Leave Challenge' : 'Join Challenge'}</Text>
      </TouchableOpacity>

      {/* Progress */}
      {isMember && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Your Progress</Text>
          <ProgressChart
            data={{ data: [progress] }}
            width={300}
            height={200}
            strokeWidth={16}
            radius={60}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: COLORS.primaryDarkGreyHex,
              backgroundGradientTo: COLORS.primaryDarkGreyHex,
              color: (opacity = 1) => COLORS.secondaryLightGreyHex,
              labelColor: (opacity = 1) => COLORS.primaryOrangeHex,
            }}
            hideLegend={false}
          />
        </View>
      )}

      {/* Description Section */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>Description</Text>
        {isEditing ? (
          <View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              style={styles.descriptionInput}
            />
            <TouchableOpacity onPress={updateDescription} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.descriptionText}>{description}</Text>
        )}
        {isHost && !isEditing && (
          <TouchableOpacity onPress={toggleEditing} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ChallengePromptlist, createprompt, or promptdetails component based on what user selects */}
      {isMember && (
        <View style={styles.promptsContainer}>
            {currentView === 'prompts' && (
            <ChallengePrompts 
                ChallengeId={challengeId} 
                IsHost={isHost}
                onCreatePrompt={() => setCurrentView('create')}
                onViewPrompt={(prompt) => {
                setSelectedPrompt(prompt);
                setCurrentView('details');
                }}
            />
            )}
            {currentView === 'create' && (
            <CreatePrompt
                IsHost={isHost}
                challengeId={challengeId}
                onBack={() => setCurrentView('prompts')}
                onSuccess={() => {
                setCurrentView('prompts');
                fetchChallengeDetails(); // Refresh the data
                }}
            />
            )}
            {currentView === 'details' && selectedPrompt && (
            <ChallengePromptDetails 
                promptId={selectedPrompt.promptId}
                onBack={() => setCurrentView('prompts')}
            />
            )}
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
    padding: SPACING.space_20,
  },
  scrollContainer: {
    padding: SPACING.space_20,
    paddingBottom: SPACING.space_30,
  },
  challengeTitle: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: SPACING.space_20,
    backgroundColor: COLORS.primaryDarkGreyHex
  },
  progressText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    marginTop: SPACING.space_10,
    marginBottom: SPACING.space_10,
  },
  descriptionContainer: {
    marginTop: SPACING.space_30,
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_10,
  },
  descriptionTitle: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
    marginBottom: SPACING.space_10,
  },
  descriptionInput: {
    height: 100,
    borderColor: COLORS.primaryLightGreyHex,
    borderWidth: 1,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_10,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  descriptionText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_16,
  },
  saveButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_10,
    paddingHorizontal: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_25,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
  },
  editButton: {
    marginTop: SPACING.space_10,
    alignItems: 'center',
  },
  editButtonText: {
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_16,
  },
  joinLeaveButton: {
    marginTop: SPACING.space_20,
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_30,
    borderRadius: BORDERRADIUS.radius_25,
    alignSelf: 'flex-start',
  },
  joinLeaveButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
  },
  promptsContainer: {
    flex: 1,
    minHeight: 300,
  },
  errorText: {
    color: COLORS.primaryRedHex,
    textAlign: 'center',
    marginTop: SPACING.space_20,
  },
});

export default ChallengeDetailsScreen;