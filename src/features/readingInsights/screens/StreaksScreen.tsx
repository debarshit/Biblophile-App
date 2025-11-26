import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, View, TouchableOpacity, Text } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useStore } from '../../../store/store';
import { COLORS } from '../../../theme/theme';
import SessionPrompt from '../components/SessionPrompt';
import { dismissTimerNotification, updateTimerNotification } from '../../../utils/notificationUtils';
import Header from '../components/Header';
import SessionTimer from '../components/SessionTimer';
import StreakCelebration from '../../../components/StreakCelebration';
import { useStreak } from '../../../hooks/useStreak';

const StreaksScreen = ({ navigation, route }) => {
  const userDetails = useStore((state) => state.userDetails);
  const sessionStartTime = useStore((state) => state.sessionStartTime);
  const startSession = useStore((state) => state.startSession);
  const clearSession = useStore((state) => state.clearSession);

  const { action } = route.params || {};

  // Remaining local state (UI-only)
  const [celebration, setCelebration] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);

  // Handle celebration
  const handleCelebration = useCallback((streakData) => {
    setCelebrationData({
      currentStreak: streakData.currentStreak,
      isNewRecord: streakData.isNewRecord,
    });
    setShowStreakCelebration(true);
  }, []);

  const handleCelebrationComplete = useCallback(() => {
    setShowStreakCelebration(false);
    setCelebrationData(null);
  }, []);
  
  const {
    currentStreak,
    maxStreak,
    latestUpdateTime,
  } = useStreak(userDetails[0]?.accessToken, action, handleCelebration);

  // Confetti logic (unchanged)
  useEffect(() => {
    const checkAllDaysFilled = () => {
      const today = new Date();
      const currentDayIndex = today.getDay();
      const lastUpdateDate = new Date(latestUpdateTime);
      const lastUpdateDayIndex = lastUpdateDate.getDay();

      const weekStartIndex = 0;
      const streakEndDayIndex = lastUpdateDayIndex;
      const fillStartDayIndex = Math.max(weekStartIndex, streakEndDayIndex - (currentStreak - 1));
      const fillEndDayIndex = Math.min(currentDayIndex, streakEndDayIndex);

      setCelebration(fillStartDayIndex === 0 && fillEndDayIndex === 6);
    };

    checkAllDaysFilled();
  }, [currentStreak, latestUpdateTime]);

  useEffect(() => {
    if (sessionStartTime) {
      setShowPrompt(false);
    }
  }, [sessionStartTime]);

  // Session timer logic (unchanged)
  useEffect(() => {
    let timerInterval;
    
    if (sessionStartTime) {
      timerInterval = setInterval(() => {
        const currentTime = new Date();
        const elapsedTime = Math.floor((currentTime.getTime() - new Date(sessionStartTime).getTime()) / 1000);
        setTimer(elapsedTime);
        
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        updateTimerNotification(minutes, seconds);
      }, 1000);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        dismissTimerNotification();
      }
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        dismissTimerNotification();
      }
    };
  }, [sessionStartTime]);
  
  const handleConfirmSessionStart = () => {
    startSession();
    setShowPrompt(false);
  };

  const handleCancelSessionStart = () => {
    setShowPrompt(false);
  };

  const handleSaveSession = () => {
    clearSession();
    alert("Session saved!");
    setShowPrompt(false);
  };

  const handleBackPress = () => {
    if (action === "updateReadingStreak") {
      navigation.navigate('Tab');
    } else {
      navigation.goBack();
    }
  };

  const handleGraphPress = () => {
    navigation.navigate('Stats');
  };

  const StartSessionButton = () => (
    <View style={styles.sessionButtonContainer}>
      <TouchableOpacity 
        style={styles.startSessionButton} 
        onPress={() => {setPromptMessage('Would you like to start a reading session?');
      setShowPrompt(true);}}
        activeOpacity={0.8}
      >
        <Text style={styles.startSessionButtonText}>Start Reading Session</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {celebration && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} />}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header 
          onBackPress={handleBackPress} 
          onGraphPress={handleGraphPress} 
        />
        
        <SessionPrompt
          visible={showPrompt}
          onConfirm={sessionStartTime ? handleSaveSession : handleConfirmSessionStart}
          onCancel={handleCancelSessionStart}
          message={promptMessage}
        />

        {sessionStartTime ? (
          <SessionTimer timer={timer} />
        ) : (
          <StartSessionButton />
        )}
        
      </ScrollView>
      
      <StreakCelebration
        visible={showStreakCelebration}
        streakCount={celebrationData?.currentStreak || 0}
        isNewRecord={celebrationData?.isNewRecord || false}
        onAnimationComplete={handleCelebrationComplete}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  scrollContent: {
    paddingBottom: 20,
  },
   sessionButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  startSessionButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startSessionButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default StreaksScreen;