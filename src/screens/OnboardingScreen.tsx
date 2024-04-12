import React from 'react';
import { StyleSheet, View, Dimensions, Text} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import LottieView from 'lottie-react-native';
import { COLORS, FONTSIZE } from '../theme/theme';

const { width } = Dimensions.get("window");

const OnboardingScreen = ({ navigation }: any) => {
  return (
    <Onboarding
      onDone={() => navigation.navigate('SignupLogin')}
      onSkip={() => navigation.navigate('SignupLogin')}
      pages={[
        {
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
                <View style={styles.textContainer}>
                    <Text style={styles.titleText}>Welcome to Biblophile!</Text>
                    <Text style={styles.subtitleText}>Explore our vast catalogue of books.</Text>
                </View>
            </View>
          ),
        },
        {
            backgroundColor: COLORS.primaryBlackHex,
            image: (
              <View style={styles.container}>
                  <View style={styles.lottieContainer}>
                      <LottieView
                          style={styles.lottie}
                          source={require("../lottie/onboarding/reading.json")}
                          autoPlay
                          loop
                      />
                  </View>
                  <View style={styles.textContainer}>
                      <Text style={styles.titleText}>Rent, Read, Return, Repeat!</Text>
                      <Text style={styles.subtitleText}>We deliver books right at your doorstep.</Text>
                  </View>
              </View>
            ),
        },
        {
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
                  <View style={styles.textContainer}>
                      <Text style={styles.titleText}>Choose Your Plan</Text>
                      <Text style={styles.subtitleText}>Rent individual books or subscribe for maximum savings</Text>
                  </View>
              </View>
            ),
        },
        {
            backgroundColor: COLORS.primaryBlackHex,
            image: (
              <View style={styles.container}>
                  <View style={styles.lottieContainer}>
                      <LottieView
                          style={styles.lottie}
                          source={require("../lottie/onboarding/shelf.json")}
                          autoPlay
                          loop
                      />
                  </View>
                  <View style={styles.textContainer}>
                      <Text style={styles.titleText}>Start Exploring</Text>
                      <Text style={styles.subtitleText}>Sign up to discover your next read.</Text>
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
        alignItems: 'center',
    },
    lottieContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: width*0.9,
        height: width,
    },
    textContainer: {
        alignContent: 'flex-start',
        paddingBottom: 250,
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