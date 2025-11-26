import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTFAMILY, SPACING } from '../../../../theme/theme';
import SessionTimer from './SessionTimer';

interface SessionControlsProps {
  startingTime: any;
  timer: number;
  onStartSession: () => void;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  startingTime,
  timer,
  onStartSession,
}) => {
  if (startingTime) {
    return <SessionTimer timer={timer} />;
  }

  return (
    <View style={styles.sessionButtonContainer}>
      <TouchableOpacity
        style={styles.startSessionButton}
        onPress={onStartSession}
      >
        <Text style={styles.startSessionButtonText}>Start Reading Session</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SessionControls;

const styles = StyleSheet.create({
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