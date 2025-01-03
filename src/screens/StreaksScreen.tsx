import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, SafeAreaView, Share, TextInput } from 'react-native';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AntDesign, Entypo, Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import instance from '../services/axios';
import requests from '../services/requests';
import { useStore } from '../store/store';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import PagesReadInput from '../components/PagesReadInput';
import SessionPrompt from '../components/SessionPrompt';

const StreaksScreen: React.FC = ({ navigation, route }: any) => {

  const userDetails = useStore((state: any) => state.userDetails);

  const [currentStreak, setCurrentStreak] = useState<number>(1);
  const [maxStreak, setMaxStreak] = useState<number>(1);
  const [latestUpdateTime, setLatestUpdateTime] = useState<string>("");
  const [celebration, setCelebration] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('streaks');
  const [showTooltip, setShowTooltip] = useState(false);

  //states for the note feature
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [readingBooks, setReadingBooks] = useState([]);
  
  //states for reading sessions
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  const [showTimerTooltip, setShowTimerTooltip] = useState(false);
  const [timer, setTimer] = useState(0);

  const sessionStartTime = useStore((state: any) => state.sessionStartTime);
  const startSession = useStore(
    (state: any) => state.startSession,
  );
  const clearSession = useStore(
    (state: any) => state.clearSession,
  );

  const { action } = route.params || {}; // Ensure params exist

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  // Handle the deep linked function
  const handleAction = (action: string) => {
    switch (action) {
      case 'updateReadingStreak':
        updateReadingStreak();
        break;
      default:
        Alert.alert('Uh oh!', 'Please try again.');
    }
  };

  const fetchCurrentReads = async () => {
    try {
      const response = await instance.post(requests.fetchCurrentReads, {
        userId: userDetails[0].userId,
      });
      setReadingBooks(response.data.currentReads);
    } catch (error) {
      console.error('Failed to fetch current reads:', error);
    } 
  };

  const getDayClasses = (dayIndex: number) => {
    if (!latestUpdateTime) return styles.day;

    const today = new Date();
    const currentDayIndex = today.getDay();
    const lastUpdateDate = new Date(latestUpdateTime);
    const lastUpdateDayIndex = lastUpdateDate.getDay();

    const weekStartIndex = 0;

    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - currentDayIndex + weekStartIndex);

    const streakEndDayIndex = lastUpdateDayIndex;

    const fillStartDayIndex = Math.max(weekStartIndex, streakEndDayIndex - (currentStreak - 1));
    const fillEndDayIndex = Math.min(currentDayIndex, streakEndDayIndex);

    // Check if the current day index falls within the streak days
    if (dayIndex >= fillStartDayIndex && dayIndex <= fillEndDayIndex) {
      return styles.filledDay;
    }

    return styles.day;
  };

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

      if (fillStartDayIndex === 0 && fillEndDayIndex === 6) {
        setCelebration(true);
      } else {
        setCelebration(false);
      }
    };

    checkAllDaysFilled();
  }, [currentStreak, latestUpdateTime]);

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
  const openWebView = (url: string) => {
    navigation.push('Resources', {
      url: url
    });
  };

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
    // Example of how you can handle the action param from route
    if (action === 'updateReadingStreak') {
      updateReadingStreak();
    }
  }, [action]);

  const handleReminderPress = () => {
    setDatePickerVisible(true);
  };

  const scheduleNotification = async (date: Date) => {
    const now = new Date();
    const notificationTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), date.getHours(), date.getMinutes(), 0);
  
    // If the notification time is already in the past for today, set it for the same time tomorrow
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }
  
    try {
      // First, clear out any existing scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      for (let notification of scheduledNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
  
      // Schedule the new notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to read!",
          body: "Don't forget to read a few pages today!",
        },
        trigger: {
          hour: notificationTime.getHours(),
          minute: notificationTime.getMinutes(),
          repeats: true,
        },
      });
  
      const formattedTime = notificationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
      Alert.alert("Reminder Set", `Notification set for ${formattedTime}`);
  
    } catch (error) {
      console.error("Failed to schedule notification:", error);
      Alert.alert("Error", "Failed to set notification. Please try again.");
    }
  };

  //add functionality to add user to book clubs
  const handleDiscussionPress = () => {
    Alert.alert("Coming Soon", "This feature is coming soon!");
  };

  const handleSharePress = async () => {
    try {
      const result = await Share.share({
        message: `I've been on a reading streak for ${currentStreak} days! 📚✨ Join me and let's read together on Biblophile! https://biblophile.com/`,
      });
      if (result.action === Share.sharedAction && result.activityType) {
        // Shared with activity type
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share the streak.');
    }
  };

  const handleTipsPress = () => {
    async function fetchReadingTips() {
      try {
        const response = await instance(requests.fetchReadingTips);
        const data = response.data;
        Alert.alert("Reading tips", data.tip);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch reading tips.');
        console.error('Error fetching genres:', error);
      }
    }
    fetchReadingTips();
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

  const toggleTooltip = () => {
    setShowTooltip(prev => !prev);
  };

  const toggleNoteInput = () => {
    setShowNoteInput(prev => !prev);
    if (!showNoteInput) {
      fetchCurrentReads();
    }
  };
  
  const handleNoteSubmit = async () => {
    if (!note) {
      Alert.alert('Error', 'Please write a note.');
      return;
    }

    try {
      const noteData = {
        userId: userDetails[0].userId,
        bookId: selectedBook,
        note: note,
      };

      const response = await instance.post(requests.submitNote, noteData);
      if (response.data.message === 'Note added successfully.') {
        Alert.alert('Success', 'Note added successfully.');
      } else {
          Alert.alert('Error', response.data.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Error submitting note:', error);
      Alert.alert('Error', 'There was an error :( Try again in a while');
    }
  };

  const renderNotesInput = () => {
    if (showNoteInput) {
      return (
        <View style={styles.noteInputSection}>
          <TextInput
            style={styles.noteInput}
            placeholder="Jot down your thoughts for today in 300 char..."
            placeholderTextColor={COLORS.secondaryLightGreyHex}
            value={note}
            onChangeText={setNote}
            numberOfLines={5}
          />
          <Picker
            selectedValue={selectedBook}
            style={styles.bookDropdown}
            onValueChange={(itemValue) => setSelectedBook(itemValue)}
          >
            <Picker.Item label="Is it related to a specific book?" value={null} />
            {readingBooks.map((book) => (
              <Picker.Item key={book.BookId} label={book.BookName} value={book.BookId} />
            ))}
          </Picker>
          <TouchableOpacity onPress={handleNoteSubmit}>
            <Entypo name="check" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_24} />
        </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

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

  const handleSessionCheck = () => {
    if (sessionStartTime) {
      setActiveTab('pages');
      setShowPrompt(false);
    }
  };

  // Handle session start persistence
  useEffect(() => {
    if (sessionStartTime) {
      const timerInterval = setInterval(() => {
        const currentTime = new Date();
        const elapsedTime = Math.floor((currentTime.getTime() - new Date(sessionStartTime).getTime()) / 1000); // Timer in seconds
        setTimer(elapsedTime);
      }, 1000);
  
      // Cleanup the interval when the component is unmounted or when sessionStartTime changes
      return () => clearInterval(timerInterval);
    }
  }, [sessionStartTime]);

  useEffect(() => {
    handleSessionCheck();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {celebration && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} />}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} accessibilityLabel="Back" accessibilityHint="Go back to the previous screen">
            <View style={styles.backIconContainer}>
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
                style={styles.LinearGradientBG}>
                <AntDesign name="left" color={COLORS.primaryLightGreyHex} size={FONTSIZE.size_16} />
              </LinearGradient>
            </View>
          </TouchableOpacity>
          <Text style={styles.headerText}>Reading Streak</Text>
          <TouchableOpacity onPress={handleGraphPress} accessibilityLabel="stats" accessibilityHint="Go to the stats screen">
            <View style={styles.graphIconContainer}>
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
                style={styles.LinearGradientBG}>
                <Entypo name="bar-graph" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_16} />
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
        <SessionPrompt
          visible={showPrompt}
          onConfirm={sessionStartTime ? handleSaveSession : handleConfirmSessionStart}
          onCancel={handleCancelSessionStart}
          message={promptMessage}
        />

        {/* Timer display when session is running */}
        {sessionStartTime && (
          <View style={styles.timer}>
            <Text style={styles.greeting}>
              Reading session ongoing for: {Math.floor(timer / 60)} minutes {timer % 60} seconds
            </Text>
            <TouchableOpacity onPress={() => setShowTimerTooltip(!showTimerTooltip)} style={{ marginLeft: 8 }}>
              <FontAwesome name="info-circle" style={styles.infoIcon} />
              {showTimerTooltip && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>Updating your pages will stop the current reading session.</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          )}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'streaks' && styles.activeTab
            ]}
            onPress={() => setActiveTab('streaks')}
          >
            <Text style={styles.tabText}>Streaks</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'pages' && styles.activeTab
            ]}
            onPress={() => setActiveTab('pages')}
          >
            <Text style={styles.tabText}>Pages</Text>
          </TouchableOpacity>
        </View>
        {activeTab === "streaks" ? <>
          <View style={styles.streakInfo}>
            <Text style={styles.streakText}>🌟 {currentStreak}-Day Streak</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressText}>
              <Text style={styles.infoText}>Progress for the week</Text>
              <TouchableOpacity onPress={toggleTooltip} style={styles.infoIconContainer}>
              <FontAwesome name="info-circle" style={styles.infoIcon} />
              {showTooltip && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>
                    Use our nfc bookmarks to maintain reading streak
                  </Text>
                </View>
              )}
          </TouchableOpacity>
            </View>
            <View style={styles.weekContainer}>
              {daysOfWeek.map((day, index) => (
                <View key={index} style={[styles.dayContainer, getDayClasses(index)]}>
                  <Text style={styles.dayText}>{day}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.greeting}>Hello, {userDetails[0].userName.split(' ')[0]}! Keep up the good work! 🎉</Text>
          </View>
          <View style={styles.achievements}>
            <Text style={styles.sectionTitle}>Highest Streak:</Text>
            <Text style={styles.maxStreak}>🏅 {maxStreak}-day Streak</Text>
          </View>
          <View style={styles.addNoteSection}>
          <TouchableOpacity style={styles.addNoteButton} onPress={toggleNoteInput}>
            <Entypo name="feather" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_24} />
            <Text style={styles.addNoteText}>{!showNoteInput ? "Add a note" : "Cancel"}</Text>
          </TouchableOpacity>

            {/* Show the input and dropdown if "Add a note" is clicked */}
            {renderNotesInput()}
          </View>
        </> :
        <PagesReadInput navigation={navigation}/>
        }
      {datePickerVisible && (
      <View style={styles.modalContainer}>
        <DateTimePicker
          value={reminderTime || new Date()}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              setReminderTime(selectedDate);
              setDatePickerVisible(false);
              scheduleNotification(selectedDate);
            } else {
              setDatePickerVisible(false);
            }
          }}
        />
          </View>
      )}
        <View style={styles.reminders}>
          <TouchableOpacity onPress={handleTipsPress} style={styles.reminderButton}>
          <MaterialIcons name="tips-and-updates" size={20} color={COLORS.secondaryLightGreyHex}/>
          <Text style={styles.reminderText}>Reading Tips</Text>
        </TouchableOpacity>
          <TouchableOpacity onPress={handleReminderPress} style={styles.reminderButton}>
            <Entypo name="clock" size={20} color={COLORS.secondaryLightGreyHex} />
            <Text style={styles.reminderText}>Set Reading Time</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.community}>
          <TouchableOpacity onPress={handleDiscussionPress} style={styles.communityButton}>
            <AntDesign name="team" size={20} color={COLORS.secondaryLightGreyHex} />
            <Text style={styles.communityText}>Join the Discussion</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSharePress} style={styles.communityButton}>
            <Entypo name="share" size={20} color={COLORS.secondaryLightGreyHex} />
            <Text style={styles.communityText}>Share Your Progress</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => {
            openWebView('https://biblophile.com/policies/customer-support.php')
          }}>
            <Text style={styles.footerLink}>📞 Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            openWebView('https://biblophile.com/policies/privacy-policy.php')
          }}>
            <Text style={styles.footerLink}>🔒 Privacy</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: COLORS.primaryBlackHex,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backIconContainer: {
    marginRight: SPACING.space_10,
    borderWidth: 2,
    borderColor: COLORS.secondaryDarkGreyHex,
    borderRadius: SPACING.space_12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryDarkGreyHex,
    overflow: 'hidden',
  },
  graphIconContainer: {
    marginLeft: 'auto',
    borderWidth: 2,
    borderColor: COLORS.secondaryDarkGreyHex,
    borderRadius: SPACING.space_12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryDarkGreyHex,
    overflow: 'hidden',
  },
  LinearGradientBG: {
    height: SPACING.space_36,
    width: SPACING.space_36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1, // Take up remaining space
    textAlign: 'center', // Center the text
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_bold,
  },
  timer: {
    alignItems: 'center',
    marginLeft: '10%',
    maxWidth: '80%',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.space_20,
  },
  tabButton: {
    width: '40%',
    padding: SPACING.space_10,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    color: COLORS.primaryWhiteHex,
    borderRadius: BORDERRADIUS.radius_8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  activeTab: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  tabText: {
    color: COLORS.primaryWhiteHex,
  },
  streakInfo: {
    alignItems: 'center',
    marginBottom: SPACING.space_16,
  },
  streakText: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryOrangeHex,
  },
  progressContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.space_24,
    zIndex: -1,
  },
  dayContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_20,
  },
  filledDay: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  day: {
    backgroundColor: COLORS.primaryGreyHex,
  },
  dayText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  streakButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_8,
    backgroundColor: COLORS.primaryBlackHex,
    marginBottom: SPACING.space_12,
    width: '48%',
  },
  buttonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_8,
  },
  greeting: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.secondaryLightGreyHex,
    marginTop: SPACING.space_8,
  },
  infoText: {
    fontSize: FONTSIZE.size_16,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_light,
    marginBottom: SPACING.space_8,
  },
  achievements: {
    marginTop: SPACING.space_15,
    marginBottom: SPACING.space_16,
    flexDirection: 'row',
  },
  sectionTitle: {
    fontSize: FONTSIZE.size_18,
    fontWeight: 'bold',
    marginBottom: SPACING.space_8,
    color: COLORS.primaryWhiteHex,
  },
  maxStreak: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
    marginBottom: SPACING.space_8,
    color: COLORS.primaryOrangeHex,
  },
  reminders: {
    marginTop: SPACING.space_20,
    marginBottom: SPACING.space_16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderText: {
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.primaryOrangeHex,
  },
  community: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  communityButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityText: {
    marginLeft: 8,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    margin: 2,
    color: COLORS.primaryOrangeHex,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '105%',
    backgroundColor: COLORS.primaryBlackHex,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  footerLink: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_light,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  infoIconContainer: {
    position: 'relative',
    marginLeft: SPACING.space_4,
  },
  tooltip: {
    position: 'absolute',
    top: 20,
    right: -5,
    backgroundColor: COLORS.primaryDarkGreyHex,
    color: COLORS.primaryWhiteHex,
    padding: SPACING.space_4,
    borderRadius: 4,
    fontSize: FONTSIZE.size_12,
    width: 200,
    zIndex: 1000,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  tooltipText: {
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  infoIcon: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_18,
  },
  progressText: {
    flexDirection: 'row',
  },
  noteInputSection: {
    marginTop: SPACING.space_8,
    alignItems: 'center',
    flexDirection: 'column',
  },
  noteInput: {
    padding: SPACING.space_12,
    borderWidth: SPACING.space_2,
    borderRadius: BORDERRADIUS.radius_4,
    borderColor: COLORS.primaryLightGreyHex,
    backgroundColor: COLORS.primaryGreyHex,
    color: COLORS.primaryWhiteHex,
  },
  bookDropdown: {
    marginTop: SPACING.space_8,
    padding: SPACING.space_10,
    borderWidth: SPACING.space_2,
    borderRadius: BORDERRADIUS.radius_4,
    borderColor: COLORS.primaryLightGreyHex,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    color: COLORS.primaryWhiteHex,
    width: 250,
  },
  addNoteSection: {
    alignItems: 'center',
  },
  addNoteButton: {
    backgroundColor: COLORS.primaryBlackRGBA,
    color: COLORS.primaryWhiteHex,
    padding: SPACING.space_8,
    flexDirection: 'row',
    alignItems: 'center',    

  },
  addNoteText: {
    color: COLORS.primaryWhiteHex,
  },
});

export default StreaksScreen;
