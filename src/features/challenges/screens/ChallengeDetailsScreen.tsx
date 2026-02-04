import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';
import ChallengePrompts from '../components/ChallengePrompts';
import ChallengePromptDetails from './ChallengePromptDetailsScreen';
import CreatePrompt from '../components/CreatePrompt';
import GradientBGIcon from '../../../components/GradientBGIcon';

const { width } = Dimensions.get('window');

const ChallengeDetailsScreen = ({ route, navigation }) => {
  const challengeId = route.params?.challengeId;
  const [state, setState] = useState({
    challenge: null,
    description: '',
    isEditing: false,
    progress: 0,
    isMember: false,
    isHost: false,
    loading: true,
    updateLoading: false,
    joinLeaveLoading: false,
    error: '',
    currentView: 'prompts',
    selectedPrompt: null,
  });

  const userDetails = useStore((state) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;

  const updateState = (updates) => setState(prev => ({ ...prev, ...updates }));

  const showToast = (type, text1, text2) => Toast.show({ type, text1, text2 });

  const BackHandler = () => {
    if (navigation.canGoBack()) {
      navigation.pop();
    } else {
      navigation.navigate('Tab');
    }
  };

  const handleShare = async () => {
    if (!state.challenge) return;
    try {
      await Share.share({ message: `Checkout this challenge at https://biblophile.com/challenges/${challengeId}/${challenge.challengeTitle}}` });
    } catch {
      Alert.alert('Error', 'Failed to share.');
    }
  };

  const fetchChallengeDetails = async () => {
    try {
      updateState({ loading: true });
      const [challengeResponse, membershipResponse] = await Promise.all([
        instance(`${requests.fetchChallengeDetails(challengeId)}`),
        instance.post(requests.checkChallengeMembership, { challengeId }, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      ]);

      const challengeData = challengeResponse.data.data;
      const membershipData = membershipResponse.data.data;

      if (!challengeData) {
        updateState({
          loading: false,
          error: 'Challenge not found',
        });
        return;
      }

      updateState({
        challenge: challengeData,
        description: challengeData.challengeDescription || 'Such empty! Much wow!',
        isHost: challengeData.Host.userId === userDetails[0]?.userId,
        isMember: membershipData.isMember,
        progress: (membershipData.progress || 0) / 100,
        loading: false,
      });
    } catch (error) {
      updateState({ error: 'Failed to fetch challenge details', loading: false });
      showToast('error', 'Error', 'Failed to fetch challenge details.');
    }
  };

  useEffect(() => {
  if (challengeId && accessToken) {
    fetchChallengeDetails();
  }
}, [challengeId, accessToken]);

  const toggleEditing = () => {
    updateState({
      isEditing: !state.isEditing,
      description: !state.isEditing ? state.description : state.challenge?.challengeDescription || 'Such empty! Much wow!'
    });
  };

  const updateDescription = async () => {
    try {
      updateState({ updateLoading: true });
      const response = await instance.put(
        requests.updateChallengeDescription(state.challenge.challengeId),
        { description: state.description },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data.message === 'Challenge description updated successfully.') {
        updateState({ isEditing: false, updateLoading: false });
        showToast('success', 'Success', 'Description updated!');
      }
    } catch (error) {
      updateState({ updateLoading: false });
      showToast('error', 'Error', 'Failed to update description.');
    }
  };

  const joinOrLeaveChallenge = async () => {
    try {
      updateState({ joinLeaveLoading: true });
      const response = await instance.post(
        requests.JoinLeaveChallenge,
        { challengeId: state.challenge.challengeId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const { message } = response.data;
      const isJoining = message === 'User successfully joined the challenge.';
      
      updateState({ 
        isMember: isJoining, 
        joinLeaveLoading: false 
      });
      
      showToast('success', 'Success', isJoining ? 'You joined the challenge!' : 'You left the challenge.');
    } catch (error) {
      updateState({ joinLeaveLoading: false });
      showToast('error', 'Error', 'Failed to join/leave the challenge.');
    }
  };

  const LoadingButton = ({ loading, onPress, style, children, ...props }) => (
    <TouchableOpacity onPress={onPress} style={style} disabled={loading} {...props}>
      {loading ? (
        <View style={styles.loadingButtonContent}>
          <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
          <Text style={styles.buttonText}>Loading...</Text>
        </View>
      ) : children}
    </TouchableOpacity>
  );

  const LoadingScreen = ({ message }) => (
    <SafeAreaView style={styles.container}>
      <HeaderBar showBackButton={true} title="" />
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </SafeAreaView>
  );

  if (state.loading) return <LoadingScreen message="Loading challenge..." />;
  if (state.error) return <LoadingScreen message={state.error} />;
  if (!state.challenge) return <LoadingScreen message="Challenge not found" />;

  const { challenge, description, isEditing, progress, isMember, isHost } = state;
  const isExpired = challenge.endDate < new Date().toISOString();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
          <TouchableOpacity onPress={BackHandler}>
            <GradientBGIcon name="left" color={COLORS.primaryLightGreyHex} size={FONTSIZE.size_16} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <GradientBGIcon name="sharealt" color={COLORS.primaryLightGreyHex} size={FONTSIZE.size_16} />
          </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header Card */}
        <View style={styles.card}>
          <View style={styles.titleContainer}>
            <Text style={styles.challengeTitle}>{challenge.challengeTitle}</Text>
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>
                Run by: <Text style={styles.hostName}>{challenge.Host.name}</Text>
              </Text>
            </View>
          </View>

          {!isExpired && (
            <View style={styles.actionButtonContainer}>
              <LoadingButton 
                loading={state.joinLeaveLoading}
                onPress={joinOrLeaveChallenge}
                style={[styles.joinLeaveButton, isMember ? styles.leaveButton : styles.joinButton]}
              >
                <Text style={styles.buttonText}>
                  {isMember ? 'Leave Challenge' : 'Join Challenge'}
                </Text>
              </LoadingButton>
            </View>
          )}

          {isMember && progress !== null && (
            <View style={styles.progressCard}>
              <Text style={styles.progressLabel}>Your Progress</Text>
              <ProgressChart
                data={{ data: [progress] }}
                width={width - 120}
                height={180}
                strokeWidth={12}
                radius={50}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: COLORS.primaryDarkGreyHex,
                  backgroundGradientTo: COLORS.primaryDarkGreyHex,
                  color: (opacity = 1) => `rgba(255, 138, 101, ${opacity})`,
                  labelColor: (opacity = 1) => COLORS.primaryWhiteHex,
                }}
                hideLegend={false}
              />
            </View>
          )}
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <View style={styles.descriptionHeader}>
            <Text style={styles.descriptionTitle}>Description</Text>
            {isHost && !isEditing && (
              <TouchableOpacity onPress={toggleEditing} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editingContainer}>
              <TextInput
                value={description}
                onChangeText={(text) => updateState({ description: text })}
                multiline
                style={styles.descriptionInput}
                placeholder="Enter challenge description..."
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                textAlignVertical="top"
              />
              <View style={styles.editButtonsContainer}>
                <TouchableOpacity onPress={toggleEditing} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <LoadingButton 
                  loading={state.updateLoading}
                  onPress={updateDescription}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </LoadingButton>
              </View>
            </View>
          ) : (
            <Text style={styles.descriptionText}>{description}</Text>
          )}
        </View>

        {/* Prompts Section */}
        {isMember && (
          <View style={styles.promptsContainer}>
            {state.currentView === 'prompts' && (
              <ChallengePrompts 
                ChallengeId={challengeId} 
                IsHost={isHost}
                onCreatePrompt={() => updateState({ currentView: 'create' })}
                onViewPrompt={(prompt) =>
                  navigation.navigate('ChallengePromptDetails', {
                    promptId: prompt.promptId,
                  })
                }
              />
            )}
            {state.currentView === 'create' && (
              <CreatePrompt
                IsHost={isHost}
                challengeId={challengeId}
                onBack={() => updateState({ currentView: 'prompts' })}
                onSuccess={() => {
                  updateState({ currentView: 'prompts' });
                  fetchChallengeDetails();
                }}
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
  },
  header: { 
    padding: SPACING.space_20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  scrollContainer: {
    padding: SPACING.space_16,
    paddingBottom: SPACING.space_30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    marginTop: SPACING.space_10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_24,
    marginBottom: SPACING.space_16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.space_20,
  },
  challengeTitle: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginBottom: SPACING.space_12,
    lineHeight: 36,
  },
  hostBadge: {
    backgroundColor: COLORS.secondaryGreyHex,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_25,
  },
  hostBadgeText: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  hostName: {
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  actionButtonContainer: {
    alignItems: 'center',
    marginBottom: SPACING.space_16,
  },
  joinLeaveButton: {
    paddingVertical: SPACING.space_16,
    paddingHorizontal: SPACING.space_32,
    borderRadius: BORDERRADIUS.radius_15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 160,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  leaveButton: {
    backgroundColor: COLORS.primaryRedHex,
  },
  buttonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  progressCard: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    alignItems: 'center',
  },
  progressLabel: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    marginBottom: SPACING.space_8,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
  },
  descriptionTitle: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  editButton: {
    paddingVertical: SPACING.space_4,
    paddingHorizontal: SPACING.space_8,
  },
  editButtonText: {
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  editingContainer: {
    gap: SPACING.space_16,
  },
  descriptionInput: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderColor: COLORS.primaryLightGreyHex,
    borderWidth: 1,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.space_12,
  },
  cancelButton: {
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_20,
  },
  cancelButtonText: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  saveButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_24,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
    minWidth: 80,
  },
  saveButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  descriptionText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    lineHeight: 22,
  },
  promptsContainer: {
    flex: 1,
    minHeight: 300,
  },
});

export default ChallengeDetailsScreen;