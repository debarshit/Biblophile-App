import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Animated, TextInput, SafeAreaView } from 'react-native';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/store';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import ProgressBar from '../components/ProgressBar';

const StreaksScreen: React.FC = ({navigation, route}: any) => {

  const userDetails = useStore((state: any) => state.userDetails);
    
  const [pagesRead, setPagesRead] = useState<string>('');

  const progress = useRef(new Animated.Value(0)).current;

  const handleSave = () => {
    //update pages read to database
  }

  const openWebView = (url: string) => {
    navigation.push('Resources', {
      url: url
    });
  };

  useEffect(() => {
      // Animate the progress bar from 0 to 100 over 10 seconds (example)
      Animated.timing(progress, {
      toValue: 51,
      duration: 2000,
      useNativeDriver: false,
      }).start();
  }, [progress]);

  const handleReminderPress = () => {
      Alert.alert("Set Reminder", "Reminder functionality coming soon!");
  };

  const handleSharePress = () => {
      Alert.alert("Share", "Share functionality coming soon!");
  };

  const handleTipsPress = () => {
    //add function to fetch tips from database
    Alert.alert("Reading tips", "Will show randomly fetched reading tips from database");
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
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
          <Text style={styles.streakText}>🌟 10-Day Streak</Text>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.infoText}>Progress till next achievement</Text>
          <ProgressBar progress={progress}/> 
          <Text style={styles.greeting}>Hello, {userDetails[0].userName.split(' ')[0]}! Keep up the good work! 🎉</Text>
        </View>
        <View style={styles.achievements}>
          <Text style={styles.sectionTitle}>Highest Streak:</Text>
          <Text style={styles.maxStreak}>🏅 7-day Streak</Text>
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
              />
          </View>
        </View>
        <TouchableOpacity onPress={() => handleSave()} style={styles.button}>
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
        <View style={styles.reminders}>
          <TouchableOpacity onPress={handleReminderPress} style={styles.reminderButton}>
            <AntDesign name="notification" size={20} color={COLORS.secondaryLightGreyHex}/>
            <Text style={styles.reminderText}>Enable Reminders</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReminderPress} style={styles.reminderButton}>
            <Entypo name="clock" size={20} color={COLORS.secondaryLightGreyHex} />
            <Text style={styles.reminderText}>Set Reading Time</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.community}>
          <TouchableOpacity onPress={() => {}} style={styles.communityButton}>
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
        <TouchableOpacity onPress={handleTipsPress}>
          <Text style={styles.footerLink}>📝 Tips</Text>
        </TouchableOpacity>
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
    paddingVertical: 10,
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
});

export default StreaksScreen;
