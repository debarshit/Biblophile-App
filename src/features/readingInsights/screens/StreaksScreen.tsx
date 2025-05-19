import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { COLORS } from '../../../theme/theme';
import PagesReadInput from '../components/PagesReadInput';
import SessionPrompt from '../components/SessionPrompt';
import { dismissTimerNotification, updateTimerNotification } from '../../../utils/notificationUtils';
import Header from '../components/Header';
import TabSelector from '../components/TabSelector';
import StreakAchievements from '../components/StreakAchievements';
import NoteSection from '../components/NoteSection';
import ReminderSection from '../components/ReminderSection';
import CommunitySection from '../components/CommunitySection';
import Footer from '../components/Footer';
import SessionTimer from '../components/SessionTimer';
import TimePicker from '../components/TimePicker';
import StreakCalendarView from '../components/StreakCalendarView';

const StreaksScreen = ({ navigation, route }) => {
  const userDetails = useStore((state) => state.userDetails);
  const sessionStartTime = useStore((state) => state.sessionStartTime);
  const startSession = useStore((state) => state.startSession);
  const clearSession = useStore((state) => state.clearSession);

  const [currentStreak, setCurrentStreak] = useState(1);
  const [maxStreak, setMaxStreak] = useState(1);
  const [latestUpdateTime, setLatestUpdateTime] = useState("");
  const [celebration, setCelebration] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState(null);
  const [activeTab, setActiveTab] = useState('streaks');
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  const [timer, setTimer] = useState(0);

  const { action } = route.params || {};

  // Handle the deep linked function
  const handleAction = (action) => {
    switch (action) {
      case 'updateReadingStreak':
        updateReadingStreak();
        break;
      default:
        Alert.alert('Uh oh!', 'Please try again.');
    }
  };

  const updateReadingStreak = () => {
    if (!sessionStartTime) {
      setPromptMessage('Would you like to start a reading session?');
      setShowPrompt(true);
    }
    async function updateData() {
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await instance.post(requests.updateReadingStreak, {
          userId: userDetails[0].userId,
          currentStreak: currentStreak,
          timezone: userTimezone,
        });
        if (response.data.message) {
          if (response.data.message === "Updated") {
            setCurrentStreak(response.data.streak);
            setMaxStreak(response.data.maxStreak);
            setLatestUpdateTime(response.data.latestUpdateTime);
          }
          else {
            Alert.alert('Error', response.data.message);
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to update reading streak.');
        console.log(error);
      }
    }
    updateData();
  }

  useEffect(() => {
    async function fetchReadingStreak() {
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await instance.post(requests.fetchReadingStreak, {
          userId: userDetails[0].userId,
          timezone: userTimezone,
        });
        const data = response.data;
        setCurrentStreak(data.currentStreak);
        setMaxStreak(data.maxStreak);
        setLatestUpdateTime(data.latestUpdateTime);
        if (action) {
          handleAction(action);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch reading streak.');
        console.error('Error fetching plans:', error);
      }
    }

    fetchReadingStreak();
  }, [currentStreak]);

  useEffect(() => {
    // Check if all days are filled to trigger celebration
    const checkAllDaysFilled = () => {
      const today = new Date();
      const currentDayIndex = today.getDay();
      const lastUpdateDate = new Date(latestUpdateTime);
      const lastUpdateDayIndex = lastUpdateDate.getDay();

      const weekStartIndex = 0;
      const streakEndDayIndex = lastUpdateDayIndex;

      const fillStartDayIndex = Math.max(weekStartIndex, streakEndDayIndex - (currentStreak - 1));
      const fillEndDayIndex = Math.min(currentDayIndex, streakEndDayIndex);

      if (fillStartDayIndex === 0 && fillEndDayIndex === 6) {
        setCelebration(true);
      } else {
        setCelebration(false);
      }
    };

    checkAllDaysFilled();
  }, [currentStreak, latestUpdateTime]);

  useEffect(() => {
    // Example of how you can handle the action param from route
    if (action === 'updateReadingStreak') {
      updateReadingStreak();
    }
  }, [action]);

  // Handle session timer
  useEffect(() => {
    let timerInterval;
    
    if (sessionStartTime) {
      timerInterval = setInterval(() => {
        const currentTime = new Date();
        const elapsedTime = Math.floor((currentTime.getTime() - new Date(sessionStartTime).getTime()) / 1000); // Timer in seconds
        setTimer(elapsedTime);
        
        // Update the notification every second
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        updateTimerNotification(minutes, seconds);
      }, 1000);
    } else {
      // Session ended, clear the interval and dismiss notification
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
  
  // Handle session check when component loads
  useEffect(() => {
    if (sessionStartTime) {
      setActiveTab('pages');
      setShowPrompt(false);
    }
  }, []);

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

  const handleReminderPress = () => {
    setDatePickerVisible(true);
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
  
  const openWebView = (url) => {
    navigation.push('Resources', {
      url: url
    });
  };

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

        {sessionStartTime && (
          <SessionTimer timer={timer} />
        )}
        
        <TabSelector 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
        
        {activeTab === "streaks" ? (
          <>
            <StreakCalendarView />
            
            <StreakAchievements maxStreak={maxStreak} />
            
            <NoteSection userDetails={userDetails} />
          </>
        ) : (
          <PagesReadInput navigation={navigation} />
        )}
        
        {datePickerVisible && (
          <TimePicker
            visible={datePickerVisible}
            reminderTime={reminderTime}
            setReminderTime={setReminderTime}
            setDatePickerVisible={setDatePickerVisible}
          />
        )}
        
        <ReminderSection 
          onReminderPress={handleReminderPress} 
        />
        
        <CommunitySection currentStreak={currentStreak} />
      </ScrollView>
      
      <Footer openWebView={openWebView} />
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
});

export default StreaksScreen;