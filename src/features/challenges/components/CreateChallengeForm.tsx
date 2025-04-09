/*
Validations
1. title, start date, type is required
2. description is optional
3. start date should be before end date
4. start date and end date can't be in past and same 
*/

import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    TextInput,
    Button,
    Platform,
  } from 'react-native';
import {
    BORDERRADIUS,
    COLORS,
    FONTFAMILY,
    FONTSIZE,
    SPACING,
} from '../../../theme/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Toast from 'react-native-toast-message';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';

const CreateChallengeForm = ({ modalVisible, setModalVisible, fetchChallenges }) => {
    const [challengeTitle, setChallengeTitle] = useState('');
    const [challengeDescription, setChallengeDescription] = useState('');
    const [challengeType, setChallengeType] = useState('personal');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [currentPickerMode, setCurrentPickerMode] = useState<'start' | 'end'>('start');

    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0]?.accessToken;

    const handleCreateChallenge = () => {
        const challengeData = {
            challengeTitle,
            challengeDescription,
            challengeType,
            startDate: startDate ? startDate.toISOString() : null,
            endDate: endDate ? endDate.toISOString() : null,
        };

        instance.post(requests.createChallenge, challengeData, {
            headers: {
            Authorization: `Bearer ${accessToken}`,
            },
        })
        .then((response) => {
            Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Challenge created successfully!',
            });
            setModalVisible(false); // Close the modal
            fetchChallenges(); // Refresh challenges
        })
        .catch((error) => {
            Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to create challenge. Please try again.',
            });
        });
    };

    const handleDatePress = (mode: 'start' | 'end') => {
      if (Platform.OS === 'android') {
          setCurrentPickerMode(mode);
          setShowDatePicker(true);
          // Hide iOS pickers if they were shown
          setShowStartDatePicker(false);
          setShowEndDatePicker(false);
      } else {
          // iOS
          if (mode === 'start') {
              setShowStartDatePicker(true);
              setShowEndDatePicker(false);
          } else {
              setShowEndDatePicker(true);
              setShowStartDatePicker(false);
          }
          // Hide Android picker if it was shown
          setShowDatePicker(false);
      }
  };

  const onDateChange = (event, selectedDate) => {
      if (Platform.OS === 'android') {
          setShowDatePicker(false);
          if (selectedDate) {
              if (currentPickerMode === 'start') {
                  setStartDate(selectedDate);
              } else {
                  setEndDate(selectedDate);
              }
          }
      } else {
          // iOS
          const currentDate = selectedDate || (showStartDatePicker ? startDate : endDate);
          
          if (showStartDatePicker) {
              setShowStartDatePicker(false);
              setStartDate(currentDate);
          } else if (showEndDatePicker) {
              setShowEndDatePicker(false);
              setEndDate(currentDate);
          }
      }
  };

    return (
        <View>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Create a New Challenge</Text>

                    <Text style={styles.label}>Challenge Title</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter challenge title"
                      placeholderTextColor={COLORS.secondaryLightGreyHex}
                      value={challengeTitle}
                      onChangeText={setChallengeTitle}
                    />

                    <Text style={styles.label}>Challenge Description</Text>
                    <TextInput
                      style={[styles.input, styles.textarea]}
                      placeholder="Optional. Add details like rules, checkpoints, etc."
                      placeholderTextColor={COLORS.secondaryLightGreyHex}
                      value={challengeDescription}
                      onChangeText={setChallengeDescription}
                      multiline
                      numberOfLines={4}
                    />
                    <View style={styles.checkboxGrid}>
                      <View style={styles.checkboxContainer}>
                          <Text style={styles.label}>Challenge Type</Text>
                          <BouncyCheckbox
                              size={25}
                              fillColor="#D17842"
                              unFillColor="#52555A"
                              style={styles.checkbox}
                              text="Personal"
                              onPress={() => setChallengeType('personal')}
                              isChecked={challengeType === 'personal'}
                          />
                          <BouncyCheckbox
                              size={25}
                              fillColor="#D17842"
                              unFillColor="#52555A"
                              style={styles.checkbox}
                              text="Public"
                              onPress={() => setChallengeType('public')}
                              isChecked={challengeType === 'public'}
                          />
                      </View>
                    </View>

                    <Text style={styles.label}>Start Date</Text>
                    <TouchableOpacity 
                      onPress={() => handleDatePress('start')} 
                      style={styles.dateInput}>
                        <Text style={styles.dateText}>
                            {startDate ? startDate.toLocaleDateString() : 'Select Start Date'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>End Date</Text>
                    <TouchableOpacity 
                      onPress={() => handleDatePress('end')} 
                      style={styles.dateInput}>
                          <Text style={styles.dateText}>
                              {endDate ? endDate.toLocaleDateString() : 'Select End Date'}
                          </Text>
                    </TouchableOpacity>
                    
                    {/* Android DateTimePicker - only one instance needed */}
                    {showDatePicker && (
                        <DateTimePicker
                            value={currentPickerMode === 'start' ? startDate : endDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                        />
                    )}

                    {/* iOS DateTimePickers */}
                    {Platform.OS === 'ios' && showStartDatePicker && (
                        <DateTimePicker
                            value={startDate}
                            textColor={COLORS.primaryWhiteHex}
                            mode="date"
                            display="spinner"
                            onChange={onDateChange}
                            
                        />
                    )}
                    {Platform.OS === 'ios' && showEndDatePicker && (
                        <DateTimePicker
                            value={endDate}
                            textColor={COLORS.primaryWhiteHex}
                            mode="date"
                            display="spinner"
                            onChange={onDateChange}
                        />
                    )}

                    <View style={styles.modalActions}>
                    <Button title="Create" color={COLORS.primaryOrangeHex} onPress={handleCreateChallenge} />
                    <Button title="Cancel" color={COLORS.primaryOrangeHex} onPress={() => setModalVisible(false)} />
                    </View>
                </View>
                </View>
            </Modal>
        </View>
    )
};

export default CreateChallengeForm;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_25,
    width: '80%',
  },
  modalTitle: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.primaryLightGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_10,
    color: COLORS.primaryWhiteHex,
    backgroundColor: COLORS.primaryGreyHex,
    marginBottom: SPACING.space_10,
  },
  textarea: {
    height: 100, // Bigger height for the description input
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.space_10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_10,
    gap: SPACING.space_8,
    flexWrap: 'wrap',
  },
  checkbox: {
    marginRight: SPACING.space_8,
  },
  label: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    paddingRight: SPACING.space_10,
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '80%',
  },
  dateInput: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: COLORS.primaryGreyHex,
    borderWidth: 2,
    borderColor: COLORS.primaryLightGreyHex,
    borderRadius: 10,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.primaryWhiteHex,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.space_10,
  },
});