// hooks/useStreak.js
import { useEffect, useState, useCallback } from 'react';
import {
  fetchReadingStreak,
  updateReadingStreak,
} from '../utils/streakUtils';

export const useStreak = (accessToken, initialAction = null, onCelebration = null) => {
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
      onSuccess: updateStreakState,
      onError: setError,
      showAlert: false,
    });

    setLoading(false);
    return result;
  }, [accessToken, updateStreakState]);

  const updateStreak = useCallback(async (onCelebrationCallback) => {
    if (!accessToken) return null;

    setLoading(true);
    setError(null);

    const result = await updateReadingStreak({
      accessToken,
      onSuccess: (data) => {
        updateStreakState(data);

        const shouldCelebrate = data.isNewRecord || data.currentStreak % 5 === 0;
        if (onCelebrationCallback && shouldCelebrate) {
          onCelebrationCallback(data);
        }
      },
      onError: setError,
    });

    setLoading(false);
    return result;
  }, [accessToken, currentStreak, updateStreakState]);

  // Auto-fetch on mount + handle 'updateReadingStreak' if needed
  useEffect(() => {
    if (!accessToken) return;

    const initializeStreak = async () => {
      await fetchStreak();

      if (initialAction === 'updateReadingStreak') {
        // Give time for state to apply
        setTimeout(() => {
          updateStreak(onCelebration);
        }, 100);
      }
    };

    initializeStreak();
  }, [accessToken, initialAction]);

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