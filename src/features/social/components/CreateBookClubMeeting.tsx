import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { SPACING, COLORS, FONTSIZE, FONTFAMILY, BORDERRADIUS } from '../../../theme/theme';

interface MeetingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bookClubId: number;
  accessToken: string;
  isHost: boolean;
  existingMeeting?: Meeting;
}

interface Meeting {
  meetingId?: string;
  clubId: string;
  agenda: string;
  meetingDate: string;
  meetingLocation: string;
}

const CreateMeetingModal: React.FC<MeetingModalProps> = ({
  visible,
  onClose,
  onSuccess,
  bookClubId,
  accessToken,
  isHost,
  existingMeeting,
}) => {
  const [agenda, setAgenda] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date());
  const [meetingLocation, setMeetingLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (existingMeeting) {
      setAgenda(existingMeeting.agenda || '');
      setMeetingLocation(existingMeeting.meetingLocation || '');
      
      // Convert string date to Date object
      if (existingMeeting.meetingDate) {
        setMeetingDate(new Date(existingMeeting.meetingDate));
      }
    } else {
      // Reset form for new meeting
      setAgenda('');
      setMeetingDate(new Date());
      setMeetingLocation('');
    }
  }, [existingMeeting, visible]);

  const handleSubmit = async () => {
    if (!isHost) {
      setError('You must be the host to create a meeting.');
      return;
    }

    setLoading(true);
    setError(null);

    const meetingData = {
      clubId: bookClubId,
      meetingId: existingMeeting?.meetingId || null,
      agenda: agenda.trim(),
      meetingDate: meetingDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      meetingLocation: meetingLocation.trim(),
    };

    try {
      const response = await instance.post(requests.createOrUpdateBookClubMeetings, meetingData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.data.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.data.error || 'Failed to create meeting');
      }
    } catch (err: any) {
      console.error('Meeting creation error:', err);
      setError(err.message || 'Failed to send the request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const onChangeDatePicker = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || meetingDate;
    setShowDatePicker(Platform.OS === 'ios');
    setMeetingDate(currentDate);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>
              {existingMeeting ? 'Edit Meeting' : 'Create a New Meeting'}
            </Text>
            
            {/* Agenda Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Meeting Agenda</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Optional. For example 'What do you think of MC's decision in this chapter?'"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                value={agenda}
                onChangeText={setAgenda}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Date Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Meeting Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(meetingDate)}</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>Set a meeting date.</Text>
              
              {showDatePicker && (
                <DateTimePicker
                  value={meetingDate}
                  mode="date"
                  display="default"
                  onChange={onChangeDatePicker}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Location Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Meeting Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Address or meet link"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                value={meetingLocation}
                onChangeText={setMeetingLocation}
              />
              <Text style={styles.helperText}>Address or meet link</Text>
            </View>

            {/* Error Message */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.primaryBlackHex} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {existingMeeting ? 'Update Meeting' : 'Create Meeting'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    margin: SPACING.space_16,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_24,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '90%',
  },
  modalTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: SPACING.space_16,
  },
  label: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  input: {
    backgroundColor: COLORS.primaryGreyHex,
    borderWidth: 2,
    borderColor: COLORS.primaryLightGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  textArea: {
    backgroundColor: COLORS.primaryGreyHex,
    borderWidth: 2,
    borderColor: COLORS.primaryLightGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  datePickerButton: {
    backgroundColor: COLORS.primaryGreyHex,
    borderWidth: 2,
    borderColor: COLORS.primaryLightGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    justifyContent: 'center',
  },
  dateText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  helperText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    marginTop: SPACING.space_4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.space_20,
  },
  submitButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_10,
    flex: 2,
    marginRight: SPACING.space_12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
  },
  cancelButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: COLORS.primaryRedHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    textAlign: 'center',
    marginVertical: SPACING.space_12,
  },
});

export default CreateMeetingModal;