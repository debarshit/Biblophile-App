import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Animated, TextInput } from 'react-native';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import ProgressBar from '../components/ProgressBar';

const StreaksScreen: React.FC = ({navigation, route}: any) => {
    
  const [bookName, setBookName] = useState<string>(null);
  const [pagesRead, setPagesRead] = useState<string>(null);
  const [focusedInput, setFocusedInput] = useState<string>('');

  const progress = useRef(new Animated.Value(0)).current;

  function handleFocus(inputName: string) {
    setFocusedInput(inputName);
  }

  const handleSave = () => {
    
}

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        <Text style={styles.greeting}>Hello, [Name]! Keep up the good work! 🎉</Text>
      </View>
      <View style={styles.achievements}>
        <Text style={styles.sectionTitle}>Highest Streak:</Text>
        <Text style={styles.maxStreak}>🏅 7-day Streak</Text>
      </View>
      <Text style={styles.infoText}>Optional</Text>
      <View style={styles.inputBox}>
        <View style={[styles.inputWrapper, focusedInput === 'pagesRead' && styles.highlightedInput]}>
            <TextInput
                style={styles.input}
                placeholder='Pages read today?'
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                autoCapitalize='none'
                keyboardType='numeric'
                onFocus={() => handleFocus('pagesRead')}
                value={pagesRead} 
                onChangeText={(text) => setPagesRead(text)}
            />
        </View>
      </View>
      <TouchableOpacity onPress={() => handleSave()} style={styles.button}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
      <View style={styles.recentReads}>
        <Text style={styles.sectionTitle}>Recent Reads:</Text>
        <ScrollView horizontal>
          <Image source={{uri: 'https://via.placeholder.com/100'}} style={styles.bookCover} />
          <Image source={{uri: 'https://via.placeholder.com/100'}} style={styles.bookCover} />
        </ScrollView>
      </View>
      <View style={styles.recommendations}>
        <Text style={styles.sectionTitle}>Recommendations:</Text>
        <ScrollView horizontal>
          <Image source={{uri: 'https://via.placeholder.com/100'}} style={styles.bookCover} />
          <Image source={{uri: 'https://via.placeholder.com/100'}} style={styles.bookCover} />
        </ScrollView>
      </View>
      <View style={styles.reminders}>
        <TouchableOpacity onPress={handleReminderPress} style={styles.reminderButton}>
          <AntDesign name="notification" size={24} color={COLORS.secondaryLightGreyHex}/>
          <Text style={styles.reminderText}>Enable Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReminderPress} style={styles.reminderButton}>
          <Entypo name="clock" size={24} color={COLORS.secondaryLightGreyHex} />
          <Text style={styles.reminderText}>Set Reading Time</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.community}>
        <TouchableOpacity onPress={() => {}} style={styles.communityButton}>
          <AntDesign name="team" size={24} color={COLORS.secondaryLightGreyHex} />
          <Text style={styles.communityText}>Join the Discussion</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSharePress} style={styles.communityButton}>
          <Entypo name="share" size={24} color={COLORS.secondaryLightGreyHex} />
          <Text style={styles.communityText}>Share Your Progress</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerLink}>📝 Tips</Text>
        <Text style={styles.footerLink}>📞 Contact</Text>
        <Text style={styles.footerLink}>🔒 Legal</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: COLORS.primaryBlackHex,
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
  highlightedInput: {
    borderColor: COLORS.primaryOrangeHex, 
    borderWidth: 2,
  },
  button: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    width: '30%',
    alignSelf: 'center',
  },
  buttonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_medium,
    textAlign: 'center',
  },
  recentReads: {
    marginBottom: 16,
  },
  bookCover: {
    width: 100,
    height: 150,
    marginRight: 8,
  },
  recommendations: {
    marginBottom: 16,
  },
  reminders: {
    marginBottom: 16,
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
    fontSize: 16,
    color: COLORS.primaryOrangeHex,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  footerLink: {
    fontSize: 16,
    color: COLORS.primaryWhiteHex,
  },
});

export default StreaksScreen;
