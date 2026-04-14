// hooks/useStreak.js
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  fetchReadingStreak,
  updateReadingStreak,
} from '../utils/streakUtils';

export const useStreak = (accessToken, userId = null, initialAction = null, onCelebration = null) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [latestUpdateTime, setLatestUpdateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateStreakState = useCallback((data) => {
    setCurrentStreak(data.currentStreak);
    setMaxStreak(data.maxStreak);
    setLatestUpdateTime(data.latestUpdateTime);
  }, []);

  const fetchStreak = useCallback(async () => {
    if (!accessToken) return null;

    setLoading(true);
    setError(null);

    const result = await fetchReadingStreak({
      accessToken,
      userId,
      onSuccess: updateStreakState,
      onError: setError,
      showAlert: false,
    });

    setLoading(false);
    return result;
  }, [accessToken, userId, updateStreakState]);

  const updateStreak = useCallback(async (onCelebrationCallback) => {
    if (!accessToken) return null;

    setLoading(true);
    setError(null);

    const result = await updateReadingStreak({
      accessToken,
      onSuccess: (data) => {
        updateStreakState(data);

        // Only trigger celebration for actual updates, not "already updated" cases
        const shouldCelebrate = !data.isAlreadyUpdated && 
          (data.isNewRecord || data.currentStreak % 5 === 0);
        
        if (onCelebrationCallback && shouldCelebrate) {
          onCelebrationCallback(data);
        }
      },
      onError: setError,
      silent: true, // Don't show alerts for streak updates from book status changes
    });

    // Even if "already updated", we still want to refresh the state with current data
    if (result && result.isAlreadyUpdated) {
      updateStreakState(result);
    }

    setLoading(false);
    return result;
  }, [accessToken, updateStreakState]);

  // Auto-fetch on mount + handle 'updateReadingStreak' if needed
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!accessToken || hasInitialized.current) return;

    const initializeStreak = async () => {
      await fetchStreak();

      if (initialAction === 'updateReadingStreak') {
        await updateStreak(onCelebration);
      }

      hasInitialized.current = true;
    };

    initializeStreak();
  }, [accessToken, initialAction, fetchStreak, updateStreak, onCelebration]);

  return {
    currentStreak,
    maxStreak,
    latestUpdateTime,
    loading,
    error,
    fetchStreak,
    updateStreak,
    hasStreak: currentStreak > 0,
    isLoaded: !loading && currentStreak >= 0,
  };
};