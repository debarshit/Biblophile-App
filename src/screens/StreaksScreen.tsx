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

const StreaksScreen: React.FC = ({navigation, route}: any) => {

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
              if (response.data.message === "Updated")
                {
                  setCurrentStreak(response.data.streak);
                  setMaxStreak(response.data.maxStreak);
                }
                else
                {
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
            if (response.data.message === "Updated")
            {
              Alert.alert("Success", "Updated");
            }
            else
            {
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

  return (
    <SafeAreaView style={styles.container}>
      {celebration && <ConfettiCannon count={200} origin={{x: -10, y: 0}} />}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} accessibilityLabel="Back" accessibilityHint="Go back to the previous screen">
              <View style={styles.backIconContainer}>
                  <LinearGradient
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
                      style={styles.LinearGradientBG}>
                      <AntDesign name="left" color={COLORS.primaryLightGreyHex} size={FONTSIZE.size_16}/>
                  </LinearGradient>
              </View>
          </TouchableOpacity>
          <Text style={styles.headerText}>Reading Streak</Text>
        </View>
        <View style={styles.streakInfo}>
          <Text style={styles.streakText}>🌟 {currentStreak}-Day Streak</Text>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.infoText}>Progress till next achievement</Text>
          <ProgressBar progress={progress}/> 
          <Text style={styles.greeting}>Hello, {userDetails[0].userName.split(' ')[0]}! Keep up the good work! 🎉</Text>
        </View>
        <View style={styles.achievements}>
          <Text style={styles.sectionTitle}>Highest Streak:</Text>
          <Text style={styles.maxStreak}>🏅 {maxStreak}-day Streak</Text>
        </View>
        <Text style={styles.infoText}>Pages read today?</Text>
        <View style={styles.inputBox}>
          <View style={styles.inputWrapper}>
              <TextInput
                  style={styles.input}
                  placeholder='Optional'
                  placeholderTextColor={COLORS.secondaryLightGreyHex}
                  autoCapitalize='none'
                  keyboardType='numeric'
                  value={pagesRead} 
                  onChangeText={(text) => setPagesRead(text)}
                  accessibilityLabel="Pages Read"
                  accessibilityHint="Enter the number of pages read today"
              />
          </View>
        </View>
        <TouchableOpacity onPress={() => updatePagesRead()} style={styles.button}>
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
        {datePickerVisible && (
          <View style={styles.modalContainer}>
            <DateTimePicker
              value={reminderTime || new Date()}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setReminderTime(selectedDate);
                  setDatePickerVisible(false);
                  scheduleNotification(selectedDate);
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
    marginBottom: 16,
  },
  backIconContainer: {
    position: 'absolute',
    top: SPACING.space_10,
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
    marginLeft: SPACING.space_20,
    top: SPACING.space_10,
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    alignSelf: 'center',
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
    marginBottom: SPACING.space_16,
  },
  greeting: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.secondaryLightGreyHex,
    marginTop: SPACING.space_8,
  },
  progressBar: {
    width: '100%',
    height: 10,
    borderRadius: 5,
  },
  infoText: {
    fontSize: FONTSIZE.size_16,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_light,
    marginBottom: SPACING.space_8,
  },
  achievements: {
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
  inputBox: {
    marginBottom: 10,
    width: 300,
  },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderColor: COLORS.primaryLightGreyHex,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  button: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 20,
    width: '30%',
    alignSelf: 'center',
  },
  buttonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_medium,
    textAlign: 'center',
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
    width: '100%',
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
});

export default StreaksScreen;
