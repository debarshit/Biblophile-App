import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Entypo } from '@expo/vector-icons';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import { useStore } from '../../../store/store';
import instance from '../../../services/axios';
import requests from '../../../services/requests';

interface BookStatusModalProps {
  visible: boolean;
  onClose: () => void;
  bookId: string;
  initialStatus: string;
  initialPage?: number;
  initialStartDate?: string;
  initialEndDate?: string;
  onUpdate: () => void;
}

const BookStatusModal: React.FC<BookStatusModalProps> = ({
  visible,
  onClose,
  bookId,
  initialStatus,
  initialPage,
  initialStartDate,
  initialEndDate,
  onUpdate,
}) => {
  const [localStatus, setLocalStatus] = useState(initialStatus);
  const [localPage, setLocalPage] = useState(initialPage);
  const [localStartDate, setLocalStartDate] = useState(initialStartDate || '');
  const [localEndDate, setLocalEndDate] = useState(initialEndDate || '');
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const userDetails = useStore((state: any) => state.userDetails);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalStatus(initialStatus);
      setLocalPage(initialPage);
      setLocalStartDate(initialStartDate || '');
      setLocalEndDate(initialEndDate || '');
      setUpdateMessage(null);
    }
  }, [visible, initialStatus, initialPage, initialStartDate, initialEndDate]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const handleSaveDates = async () => {
    if (localStartDate && localEndDate && localStartDate > localEndDate) {
      setUpdateMessage('Start Date cannot be after End Date');
      return;
    }

    try {
      const response = await instance.post(requests.updateBookDates, {
        bookId: bookId,
        startDate: localStartDate,
        endDate: localEndDate
      });

      if (response.data.status === "success") {
        setUpdateMessage("Dates updated successfully!");
        onUpdate();
      } else {
        setUpdateMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error updating dates:', error);
      setUpdateMessage("Uh oh! Please try again");
    }
  };

  const submitReadingStatus = async () => {
    const userId = userDetails?.[0]?.userId;
    if (!userId) {
      setUpdateMessage("Login to update reading status");
      return;
    }

    if (localStatus === 'Read' && localStartDate && localEndDate && localStartDate > localEndDate) {
      setUpdateMessage("Start date cannot be after end date.");
      return;
    }

    try {
      const requestData = {
        userId,
        bookId: bookId,
        status: localStatus,
        currentPage: localStatus === 'Currently reading' ? localPage : undefined,
        startDate: localStartDate || undefined,
        endDate: localStatus === 'Read' ? localEndDate : undefined,
      };

      const response = await instance.post(requests.submitReadingStatus, requestData);
      if (response.data.message === "Updated") {
        setUpdateMessage("Updated successfully!");
        onUpdate();
      } else {
        setUpdateMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error submitting reading status:', error);
      setUpdateMessage("Uh oh! Please try again");
    }
  };

  const handleClose = () => {
    setUpdateMessage(null);
    onClose();
  };

  const handleSaveAndClose = () => {
    onClose();
    submitReadingStatus();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Update Status</Text>
          
          <Picker
            selectedValue={localStatus}
            style={styles.picker}
            onValueChange={(itemValue) => setLocalStatus(itemValue)}
          >
            {(initialStatus === 'Currently reading' || initialStatus === 'Paused') && (
              <Picker.Item label="Paused" value="Paused" color={COLORS.primaryWhiteHex} />
            )}
            <Picker.Item label="Read" value="Read" color={COLORS.primaryWhiteHex} />
            <Picker.Item label="Currently reading" value="Currently reading" color={COLORS.primaryWhiteHex} />
            <Picker.Item label="To be read" value="To be read" color={COLORS.primaryWhiteHex} />
            <Picker.Item label="Did not finish" value="Did not finish" color={COLORS.primaryWhiteHex} />
            <Picker.Item label="Remove" value="Remove" color={COLORS.primaryWhiteHex} />
          </Picker>
          
          {/* Page input for currently reading */}
          {localStatus === 'Currently reading' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Current Page:</Text>
              <TextInput
                style={styles.pageInputModal}
                value={localPage?.toString() || ''}
                keyboardType="numeric"
                onChangeText={(text) => setLocalPage(parseInt(text) || 0)}
                placeholder="Enter page number"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
              />
            </View>
          )}
          
          {/* Date inputs */}
          {(localStatus === 'Currently reading' || localStatus === 'Read') && (
            <View>
              <TextInput
                style={styles.dateInput}
                placeholder="Start Date (YYYY-MM-DD)"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                value={localStartDate}
                onChangeText={setLocalStartDate}
              />
              {localStatus === 'Read' && (
                <TextInput
                  style={styles.dateInput}
                  placeholder="End Date (YYYY-MM-DD)"
                  placeholderTextColor={COLORS.secondaryLightGreyHex}
                  value={localEndDate}
                  onChangeText={setLocalEndDate}
                />
              )}
              
              {/* Date display and separate update option */}
              {(localStartDate || localEndDate) && (
                <View style={styles.dateDisplayContainer}>
                  <Text style={styles.dateDisplayText}>
                    {localStatus === 'Read' 
                      ? `${formatDate(localStartDate)} - ${formatDate(localEndDate || new Date().toISOString().split('T')[0])}`
                      : `Started on: ${formatDate(localStartDate)}`}
                  </Text>
                  <TouchableOpacity onPress={handleSaveDates} style={styles.updateDatesButton}>
                    <Text style={styles.updateDatesText}>Update Dates Only</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          
          {/* Update message */}
          {updateMessage && (
            <Text style={styles.updateMessage}>{updateMessage}</Text>
          )}
          
          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={handleClose}>
              <Entypo name="cross" size={24} color={COLORS.primaryRedHex} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveAndClose}>
              <Entypo name="check" size={24} color={COLORS.primaryOrangeHex} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default BookStatusModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
  },
  modalTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
    textAlign: 'center',
  },
  picker: {
    height: 60,
    color: COLORS.primaryWhiteHex,
  },
  inputContainer: {
    marginTop: SPACING.space_8,
  },
  inputLabel: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    marginBottom: SPACING.space_4,
  },
  pageInputModal: {
    height: 40,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderColor: COLORS.secondaryLightGreyHex,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.space_8,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  dateInput: {
    height: 40,
    marginTop: SPACING.space_8,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderColor: COLORS.secondaryLightGreyHex,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.space_8,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  dateDisplayContainer: {
    marginTop: SPACING.space_12,
    padding: SPACING.space_8,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    borderWidth: 1,
    borderColor: COLORS.secondaryLightGreyHex,
  },
  dateDisplayText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    textAlign: 'center',
    marginBottom: SPACING.space_4,
  },
  updateDatesButton: {
    backgroundColor: COLORS.secondaryLightGreyHex,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
    alignSelf: 'center',
  },
  updateDatesText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
  },
  updateMessage: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    textAlign: 'center',
    marginTop: SPACING.space_8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.space_16,
  },
});