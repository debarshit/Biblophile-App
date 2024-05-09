import { StyleSheet, View, Image } from 'react-native';
import React from 'react';

// Define a mapping of emotions to image paths
const emotionImages = {
  sleeping: require('../assets/app_images/sleeping.png'),
  welcome: require('../assets/app_images/welcome.png'),
  eyesClosed: require('../assets/app_images/eyesClosed.png'),
  eyesPeeping: require('../assets/app_images/eyesPeeping.png'),
  reading: require('../assets/app_images/reading.png'),
  pendingBooks: require('../assets/app_images/pendingBooks.png'),
};

const Mascot = ({ emotion }) => {
  // Get the image path based on the emotion prop
  const imagePath = emotionImages[emotion] || require('../assets/app_images/sleeping.png');

  return (
    <View>
      <Image source={imagePath} style={styles.image} />
    </View>
  );
};

export default Mascot;

const styles = StyleSheet.create({
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
});
