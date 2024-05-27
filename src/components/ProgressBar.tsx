import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../theme/theme';

const ProgressBar = ({ progress }) => {
  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.progressBar, { width }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 30,
    width: '90%',
    backgroundColor: COLORS.primaryWhiteHex,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: 5,
  },
});

export default ProgressBar;
