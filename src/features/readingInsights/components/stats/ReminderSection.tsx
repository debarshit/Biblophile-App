import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Entypo, MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';

const ReminderSection = ({ onReminderPress }) => {
  const handleTipsPress = async () => {
    try {
      const response = await instance(requests.fetchReadingTips);
      const data = response.data.data;
      Alert.alert("Reading tips", data.tip);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch reading tips.');
      console.error('Error fetching tips:', error);
    }
  };

  return (
    <View style={styles.reminders}>
      <TouchableOpacity onPress={handleTipsPress} style={styles.reminderButton}>
        <MaterialIcons name="tips-and-updates" size={20} color={COLORS.secondaryLightGreyHex} />
        <Text style={styles.reminderText}>Reading Tips</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onReminderPress} style={styles.reminderButton}>
        <Entypo name="clock" size={20} color={COLORS.secondaryLightGreyHex} />
        <Text style={styles.reminderText}>Set Reading Time</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  reminders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: SPACING.space_15,
  },
  reminderButton: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: 15,
    padding: SPACING.space_15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '45%',
  },
  reminderText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_10,
  },
});

export default ReminderSection;