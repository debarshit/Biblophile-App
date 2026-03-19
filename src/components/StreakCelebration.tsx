import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';

//in future incorporate milestones like 5 days, 7 days, 30 days, etc.
const StreakCelebration = ({ 
  visible, 
  streakCount, 
  isNewRecord = false, 
  onAnimationComplete,
  duration = 2000
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 200,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.delay(duration - 800),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        scaleAnim.setValue(0);
        fadeAnim.setValue(0);
        bounceAnim.setValue(0);
        
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }
  }, [visible]);

  const bounceScale = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.celebrationContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { scale: bounceScale }
              ],
            },
          ]}
        >
          <View style={styles.content}>
            <Text style={styles.emoji}>🔥</Text>
            <Text style={styles.title}>
              {isNewRecord ? 'New Record!' : 'Streak Updated!'}
            </Text>
            <Text style={styles.streakText}>{streakCount} Days</Text>
            {isNewRecord && (
              <Text style={styles.subtitle}>You're on fire!</Text>
            )}
          </View>
          
          {/* Animated decorative elements */}
          <View style={styles.sparkles}>
            <Animated.Text style={[styles.sparkle, { opacity: fadeAnim }]}>✨</Animated.Text>
            <Animated.Text style={[styles.sparkle, styles.sparkle2, { opacity: fadeAnim }]}>⭐</Animated.Text>
            <Animated.Text style={[styles.sparkle, styles.sparkle3, { opacity: fadeAnim }]}>✨</Animated.Text>
            <Animated.Text style={[styles.sparkle, styles.sparkle4, { opacity: fadeAnim }]}>🌟</Animated.Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationContainer: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: 20,
    padding: SPACING.space_30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryOrangeHex,
    elevation: 10,
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    minWidth: 250,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 50,
    marginBottom: SPACING.space_10,
  },
  title: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryOrangeHex,
    textAlign: 'center',
    marginBottom: SPACING.space_10,
  },
  streakText: {
    fontSize: FONTSIZE.size_30,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginBottom: SPACING.space_10,
  },
  subtitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
  },
  sparkles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
  },
  sparkle2: {
    top: 20,
    right: 30,
    fontSize: 16,
  },
  sparkle3: {
    bottom: 30,
    left: 20,
    fontSize: 18,
  },
  sparkle4: {
    top: 40,
    left: 40,
    fontSize: 14,
  },
});

export default StreakCelebration;