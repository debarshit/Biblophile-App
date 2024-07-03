import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, TextInput, SafeAreaView, Share } from 'react-native';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AntDesign, Entypo, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import instance from '../services/axios';
import requests from '../services/requests';
import { useStore } from '../store/store';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import ProgressBar from '../components/ProgressBar';

const StreaksScreen: React.FC = ({ navigation, route }: any) => {

  const userDetails = useStore((state: any) => state.userDetails);

  const [pagesRead, setPagesRead] = useState<string>('');
  const [currentStreak, setCurrentStreak] = useState<number>(1);
  const [maxStreak, setMaxStreak] = useState<number>(1);
  const [celebration, setCelebration] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);

  const { action } = route.params || {}; // Ensure params exist

  //handle the deep linked function
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
    async function updateData() {
      try {
        const response = await instance.post(requests.updateReadingStreak, {
          userId: userDetails[0].userId,
          currentStreak: currentStreak,
        });
        if (response.data.message) {
          if (response.data.message === "Updated") {
            setCurrentStreak(response.data.streak);
            setMaxStreak(response.data.maxStreak);
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

  const progress = useRef(new Animated.Value(0)).current;

  const updatePagesRead = () => {
    if (pagesRead !== "") {
      async function updateData() {
        try {
          const response = await instance.post(requests.updatePagesRead, {
            userId: userDetails[0].userId,
            pageCount: pagesRead,
          });
          if (response.data.message === "Updated") {
            Alert.alert("Success", "Updated");
          }
          else {
            Alert.alert("Error", response.data.message);
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to update pages read.');
          console.log(error);
        }
      }
      updateData();
    }
    else {
      Alert.alert("Page count is 0", "Please enter number of pages read!");
    }
  }

  const openWebView = (url: string) => {
    navigation.push('Resources', {
      url: url
    });
  };

  useEffect(() => {
    // Making the target value as the next higher multiple of 10
    const progressValue = ((currentStreak % 10) || 10) * 10;

    // Animate the progress bar from 0 to 100 over 10 seconds (example)
    Animated.timing(progress, {
      toValue: progressValue,
      duration: 2000,
      useNativeDriver: false,
    }).start(() => {
      if (progressValue === 100) {
        setCelebration(true);
      }
    });
  }, [currentStreak, progress]);

  useEffect(() => {
    async function fetchReadingStreak() {
      try {
        const response = await instance.post(requests.fetchReadingStreak, {
          userId: userDetails[0].userId,
        });
        const data = response.data;
        setCurrentStreak(data.currentStreak);
        setMaxStreak(data.maxStreak);
        if (action) {
          handleAction(action);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch reading streak.');
        console.error('Error fetching plans:', error);
      }
    }

    fetchReadingStreak();
  }, []);

  const handleReminderPress = () => {
    setDatePickerVisible(true);
  };

  const scheduleNotification = async (date: Date) => {
    const now = new Date();
    const notificationTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), date.getHours(), date.getMinutes(), 0);

    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

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

    Alert.alert("Reminder Set", `Notification set for ${notificationTime.toLocaleTimeString()}`);
  };

  //add functionality to add user to book clubs
  const handleDiscussionPress = () => {
    Alert.alert("Coming Soon", "This feature is coming soon!");
  };

  const handleSharePress = async () => {
    try {
      const result = await Share.share({
        message: `I've been on a reading streak for ${currentStreak} days! 📚✨ Join me and let's read together on Biblophile!`,
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
        <View style={styles.streakInfo}>
          <Text style={styles.streakText}>🌟 {currentStreak}-Day Streak</Text>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.infoText}>Progress till next achievement</Text>
          <ProgressBar progress={progress} />
          <Text style={styles.greeting}>Hello, {userDetails[0].userName.split(' ')[0]}! Keep up the good work! 🎉</Text>
        </View>
        <View style={styles.achievements}>
          <Text style={styles.sectionTitle}>Highest Streak:</Text>
          <Text style={styles.maxStreak}>🏅 {maxStreak}-day Streak</Text>
        </View>
        <Text style={styles.sectionTitle}>Have you read today?</Text>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Enter pages read(optional)"
            placeholderTextColor={COLORS.secondaryLightGreyHex}
            keyboardType="numeric"
            style={styles.input}
            value={pagesRead}
            onChangeText={setPagesRead}
            accessibilityLabel="Pages read"
            accessibilityHint="Enter the number of pages read today"
          />
          <TouchableOpacity onPress={updatePagesRead} accessibilityLabel="Submit" accessibilityHint="Submit the number of pages read">
            <View style={styles.iconContainer}>
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
                style={styles.LinearGradientBG}>
                <AntDesign name="check" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_24} />
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.reminderContainer}>
          <TouchableOpacity onPress={handleReminderPress} accessibilityLabel="Set Reminder" accessibilityHint="Set a reminder for your reading">
            <LinearGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
              style={styles.reminderButton}>
              <MaterialIcons name="access-alarm" size={24} color={COLORS.primaryOrangeHex} />
              <Text style={styles.reminderText}>Set Reminder</Text>
            </LinearGradient>
          </TouchableOpacity>
          {datePickerVisible && (
            <DateTimePicker
              value={reminderTime || new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedDate) => {
                setDatePickerVisible(false);
                if (selectedDate) {
                  setReminderTime(selectedDate);
                  scheduleNotification(selectedDate);
                }
              }}
            />
          )}
        </View>
        <View style={styles.socialContainer}>
          <TouchableOpacity onPress={handleDiscussionPress} accessibilityLabel="Join Discussion" accessibilityHint="Join the book discussion">
            <View style={styles.socialButton}>
              <MaterialIcons name="chat" size={24} color={COLORS.primaryOrangeHex} />
              <Text style={styles.socialButtonText}>Join Discussion</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSharePress} accessibilityLabel="Share Streak" accessibilityHint="Share your reading streak">
            <View style={styles.socialButton}>
              <AntDesign name="sharealt" size={24} color={COLORS.primaryOrangeHex} />
              <Text style={styles.socialButtonText}>Share Streak</Text>
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleTipsPress} accessibilityLabel="Reading Tips" accessibilityHint="Get reading tips">
          <View style={styles.tipsButton}>
            <AntDesign name="book" size={24} color={COLORS.primaryOrangeHex} />
            <Text style={styles.tipsButtonText}>Get Reading Tips</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  scrollContent: {
    margin: SPACING.space_12,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
    justifyContent: 'space-between',
  },
  backIconContainer: {
    marginRight: SPACING.space_8,
    
  },
  headerText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  graphIconContainer: {
    marginLeft: 'auto',
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
    alignItems: 'center',
    marginBottom: SPACING.space_24,
  },
  infoText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_light,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_8,
  },
  greeting: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
    marginTop: SPACING.space_8,
  },
  achievements: {
    alignItems: 'center',
    marginBottom: SPACING.space_24,
  },
  sectionTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  maxStreak: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryOrangeHex,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: COLORS.primaryGreyHex,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: SPACING.space_8,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  iconContainer: {
    marginLeft: SPACING.space_8,
  },
  reminderContainer: {
    marginBottom: SPACING.space_24,
    alignItems: 'center',
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.space_8,
    paddingHorizontal: SPACING.space_16,
    borderRadius: 5,
  },
  reminderText: {
    marginLeft: SPACING.space_8,
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.space_8,
    paddingHorizontal: SPACING.space_16,
    borderRadius: 5,
    borderWidth: 1,
  },
  socialButtonText: {
    marginLeft: SPACING.space_8,
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  tipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_12,
    borderWidth: 1,
    borderRadius: 5,
  },
  tipsButtonText: {
    marginLeft: SPACING.space_8,
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  LinearGradientBG: {
    padding: SPACING.space_4,
    borderRadius: 5,
  },
});

export default StreaksScreen;
