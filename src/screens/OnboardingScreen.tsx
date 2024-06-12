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
          subtitle: (<Text style={styles.subtitleText}>Discover a world of endless possibilities with Biblophile. 
            Whether you're an avid reader or just starting your literary journey, we're here to help you explore, 
            learn, and grow. Let's get started!</Text>),
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
            subtitle: (<Text style={styles.subtitleText}>Experience the joy of reading without the commitment. 
              With Biblophile, you can easily rent books, immerse yourself in captivating stories, and 
              return them when you're ready for your next adventure. {"\n"}Start your reading journey today!
              We deliver books right at your doorstep.</Text>),
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
            subtitle: (<Text style={styles.subtitleText}>Tailor your reading experience to fit your lifestyle. Select a 
              subscription plan for unlimited access to our vast library of books, or opt to rent without commitment.{"\n\n"} 
              Whether you're a casual reader or a bookworm, we have the perfect option for you. Dive into your next story now!</Text>),
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
            subtitle: (<Text style={styles.subtitleText}>Your literary journey awaits! Begin exploring our collection and embark on an adventure through the pages. Happy reading! Sign up to discover your next read.</Text>),
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
        width: width * 0.85,
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