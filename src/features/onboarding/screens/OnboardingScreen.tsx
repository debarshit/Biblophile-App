import React from 'react';
import { StyleSheet, View, Dimensions, Text} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import LottieView from 'lottie-react-native';
import { COLORS, FONTSIZE } from '../../../theme/theme';
import Mascot from '../../../components/Mascot';

const { width, height } = Dimensions.get("window");

const OnboardingScreen = ({ navigation }: any) => {
  return (
    <Onboarding
      onDone={() => navigation.navigate('SignupLogin')}
      onSkip={() => navigation.navigate('SignupLogin')}
      pages={[
        {
        //to ignore the warning saying title and subtitle are required
          title: (<Text style={styles.titleText}>Welcome to Biblophile!</Text>),
          subtitle: (<Text style={styles.subtitleText}>Discover a world of endless possibilities with Biblophile. 
            Whether you're an avid reader or just starting your literary journey, we're here to help you explore, 
            learn, and grow. Let's get started!</Text>),
          backgroundColor: COLORS.primaryBlackHex,
          image: (
            <View style={styles.container}>
                <View style={styles.lottieContainer}>
                    <LottieView
                        style={styles.lottie}
                        source={require("../../../lottie/onboarding/books.json")}
                        autoPlay
                        loop
                    />
                </View>
            </View>
          ),
        },
        {   
            title: (<Text style={styles.titleText}>Turn Reading Into a Habit!</Text>),
            subtitle: (<Text style={styles.subtitleText}>Stay motivated with daily and weekly streaks. 
              Biblophile rewards your consistency and helps you make reading part of your lifestyle. 
              {"\n"}{"\n"}Start your reading journey today!</Text>),
            backgroundColor: COLORS.primaryBlackHex,
            image: (
              <View style={styles.container}>
                  <View style={styles.lottieContainer}>
                      {/* <LottieView
                          style={styles.lottie}
                          source={require("../lottie/onboarding/reading.json")}
                          autoPlay
                          loop
                      /> */}
                      <View style={styles.tempImage}>
                        <Mascot emotion="reading" />
                      </View>
                  </View>
              </View>
            ),
        },
        {
            title: (<Text style={styles.titleText}>Challenge Yourself & Friends</Text>),
            subtitle: (<Text style={styles.subtitleText}>Take part in themed reading challenges, track your milestones, 
              and even invite friends to join. Reading is more fun together!</Text>),
            backgroundColor: COLORS.primaryBlackHex,
            image: (
              <View style={styles.container}>
                  <View style={styles.lottieContainer}>
                      {/* <LottieView
                          style={styles.lottie}
                          source={require("../../../lottie/onboarding/card.json")}
                          autoPlay
                          loop
                      /> */}
                      <View style={styles.tempImage}>
                        <Mascot emotion="welcome" />
                      </View>
                  </View>
              </View>
            ),
        },
        {
            title: (<Text style={styles.titleText}>Start Exploring</Text>),
            subtitle: (<Text style={styles.subtitleText}>Discover new reads, share your progress, and see what your friends are reading. Biblophile makes reading a shared adventure.
              {"\n\n"}Happy reading! Sign up to discover your next read.</Text>),
            backgroundColor: COLORS.primaryBlackHex,
            image: (
              <View style={styles.container}>
                  <View style={styles.lottieContainer}>
                      {/* <LottieView
                          style={styles.lottie}
                          source={require("../lottie/onboarding/shelf.json")}
                          autoPlay
                          loop
                      /> */}
                      <View style={styles.tempImage}>
                        <Mascot emotion="eyesPeeping" />
                      </View>
                  </View>
              </View>
            ),
        },
      ]}
    />
  );
}

export default OnboardingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 20,
        marginBottom: height * 0.25,
    },
    lottieContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: height * 0.25,
        width: width * 0.8,
    },
    lottie: {
        width: width * 0.6,
        height: width * 0.6,
        maxWidth: 250,
        maxHeight: 250,
    },
    tempImage: {
        alignItems: 'center',
        justifyContent: 'center',
        height: height * 0.25,
        width: width * 0.8,
    },
    titleText: {
        color: COLORS.primaryOrangeHex,
        fontSize: FONTSIZE.size_30,
        fontWeight: 'bold',
        margin: 10,
        textAlign: 'center',
    },
    subtitleText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_16,
        margin: 10,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});