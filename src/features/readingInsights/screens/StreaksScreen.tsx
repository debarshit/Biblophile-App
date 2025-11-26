import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, View, TouchableOpacity, Text } from 'react-native';
import { useStore } from '../../../store/store';
import { COLORS } from '../../../theme/theme';
import SessionPrompt from '../components/SessionPrompt';
import Header from '../components/Header';
import SessionTimer from '../components/SessionTimer';

const StreaksScreen = ({ navigation, route }) => {
  const sessionStartTime = useStore((state) => state.sessionStartTime);

  const { action } = route.params || {};

  const handleBackPress = () => {
    if (action === "updateReadingStreak") {
      navigation.navigate('Tab');
    } else {
      navigation.goBack();
    }
  };

  const handleGraphPress = () => {
    navigation.navigate('Stats');
  };


  return (
    <SafeAreaView style={styles.container}>      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header 
          onBackPress={handleBackPress} 
          onGraphPress={handleGraphPress} 
        />
        
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  scrollContent: {
    paddingBottom: 20,
  },
   sessionButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  startSessionButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startSessionButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default StreaksScreen;