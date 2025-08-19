import { Alert } from 'react-native';
import instance from '../services/axios';
import requests from '../services/requests';

//Updates the user's reading streak
export const updateReadingStreak = async ({
  accessToken,
  onSuccess = null,
  onError = null,
  showAlert = true,
  silent = false
}) => {
  try {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const updateReadingStreakResponse = await instance.post(
      requests.updateReadingStreak,
      {
        timezone: userTimezone,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const response = updateReadingStreakResponse.data;
    
    if (response.data.message) {
      if (response.data.message === "Updated") {
        const streakData = {
          currentStreak: response.data.streak,
          maxStreak: response.data.maxStreak,
          latestUpdateTime: response.data.latestUpdateTime,
          isNewRecord: response.data.streak > 0,
          // isNewRecord: response.data.streak > currentStreak,
        };

        if (onSuccess) {
          onSuccess(streakData);
        }

        // if (!silent && showAlert) {
        //   const message = streakData.isNewRecord 
        //     ? `🔥 New streak record! ${streakData.currentStreak} days!`
        //     : `✅ Streak updated: ${streakData.currentStreak} days`;
        //   Alert.alert('Success', message);
        // }

        return streakData;
      } else if (response.data.message === "Already updated today" || 
                 response.data.message.includes("already updated")) {
        // Handle "already updated" case - fetch current streak data instead of showing error
        const streakData = {
          currentStreak: response.data.streak || response.data.currentStreak,
          maxStreak: response.data.maxStreak,
          latestUpdateTime: response.data.latestUpdateTime,
          isAlreadyUpdated: true,
        };

        // Don't call onSuccess for already updated case, but return the data
        return streakData;
      } else {
        if (onError && !silent) {
          onError(response.data.message);
        }
        
        if (showAlert && !silent) {
          Alert.alert('Error', response.data.message);
        }
        return null;
      }
    }
  } catch (error) {
    console.error('Error updating reading streak:', error);
    
    const errorMessage = 'Failed to update reading streak.';
    
    if (onError && !silent) {
      onError(errorMessage);
    }
    
    if (showAlert && !silent) {
      Alert.alert('Error', errorMessage);
    }
    
    return null;
  }
};

//Fetches the current reading streak
export const fetchReadingStreak = async ({
  accessToken,
  onSuccess = null,
  onError = null,
  showAlert = true
}) => {
  try {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const response = await instance(
      `${requests.fetchReadingStreak}?timezone=${userTimezone}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = response.data.data;
    const streakData = {
      currentStreak: data.currentStreak,
      maxStreak: data.maxStreak,
      latestUpdateTime: data.latestUpdateTime,
    };

    if (onSuccess) {
      onSuccess(streakData);
    }

    return streakData;
  } catch (error) {
    console.error('Error fetching reading streak:', error);
    
    const errorMessage = 'Failed to fetch reading streak.';
    
    if (onError) {
      onError(errorMessage);
    }
    
    if (showAlert) {
      Alert.alert('Error', errorMessage);
    }
    
    return null;
  }
};