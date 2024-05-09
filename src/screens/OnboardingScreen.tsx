import React from 'react';
import { StyleSheet, View, Dimensions, Text} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import LottieView from 'lottie-react-native';
import { COLORS, FONTSIZE } from '../theme/theme';
import Mascot from '../components/Mascot';

const { width } = Dimensions.get("window");

const OnboardingScreen = ({ navigation }: any) => {
  return (
    <Onboarding
      onDone={() => navigation.navigate('SignupLogin')}
      onSkip={() => navigation.navigate('SignupLogin')}
      pages={[
        {
        //to ignore the warning saying title and subtitle are required
          title: (<Text style={styles.titleText}>Welcome to Biblophile!</Text>),
          subtitle: (<Text style={styles.subtitleText}>Explore our vast catalogue of books.</Text>),
          backgroundColor: COLORS.primaryBlackHex,
          image: (
            <View style={styles.container}>
                <View style={styles.lottieContainer}>
                    <LottieView
                        style={styles.lottie}
                        source={require("../lottie/onboarding/books.json")}
                        autoPlay
                        loop
                    />
                </View>
            </View>
          ),
        },
        {   
            title: (<Text style={styles.titleText}>Rent, Read, Return, Repeat!</Text>),
            subtitle: (<Text style={styles.subtitleText}>We deliver books right at your doorstep.</Text>),
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
                      <View  style={styles.tempImage}>
                        <Mascot emotion="reading" />
                      </View>
                  </View>

              </View>
            ),
        },
        {
            title: (<Text style={styles.titleText}>Choose Your Plan</Text>),
            subtitle: (<Text style={styles.subtitleText}>Rent individual books or subscribe for maximum savings</Text>),
            backgroundColor: COLORS.primaryBlackHex,
            image: (
              <View style={styles.container}>
                  <View style={styles.lottieContainer}>
                      <LottieView
                          style={styles.lottie}
                          source={require("../lottie/onboarding/card.json")}
                          autoPlay
                          loop
                      />
                  </View>
              </View>
            ),
        },
        {
            title: (<Text style={styles.titleText}>Start Exploring</Text>),
            subtitle: (<Text style={styles.subtitleText}>Sign up to discover your next read.</Text>),
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
                      <View  style={styles.tempImage}>
                        <Mascot emotion="pendingBooks" />
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
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 100, // Adjust this value to your preference
    },
    lottieContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: width * 0.9,
        height: width,
    },
    tempImage: {
        marginBottom: 100,
    },
    titleText: {
        color: COLORS.primaryOrangeHex,
        fontSize: FONTSIZE.size_30,
        fontWeight: 'bold',
        margin: 10,
    },
    subtitleText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_16,
        margin: 10,
    },
});