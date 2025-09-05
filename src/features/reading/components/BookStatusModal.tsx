import React, { useState, useEffect } from 'react';
import {
  Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Animated, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import { useStore } from '../../../store/store';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import CustomPicker, { PickerOption } from '../../../components/CustomPickerComponent';
import { useAnalytics } from '../../../utils/analytics';

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
  visible, onClose, bookId, initialStatus, initialPage, initialStartDate, initialEndDate, onUpdate,
}) => {
  const [localStatus, setLocalStatus] = useState(initialStatus);
  const [localPage, setLocalPage] = useState(initialPage);
  const [localStartDate, setLocalStartDate] = useState(initialStartDate || '');
  const [localEndDate, setLocalEndDate] = useState(initialEndDate || '');
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [fadeAnimation] = useState(new Animated.Value(0));

  const userDetails = useStore((state: any) => state.userDetails);
  const analytics = useAnalytics();

  const statusOptions: PickerOption[] = [
    { label: 'Currently reading', value: 'Currently reading', icon: 'menu-book' },
    { label: 'Read', value: 'Read', icon: 'check-circle' },
    { label: 'To be read', value: 'To be read', icon: 'bookmark-border' },
    { label: 'Paused', value: 'Paused', icon: 'pause-circle' },
    { label: 'Did not finish', value: 'Did not finish', icon: 'cancel' },
    { label: 'Remove', value: 'Remove', icon: 'delete' },
  ];

  const availableOptions = statusOptions.filter(option => 
    initialStatus === 'Currently reading' || initialStatus === 'Paused' || option.value !== 'Paused'
  );

  useEffect(() => {
    if (visible) {
      setLocalStatus(initialStatus);
      setLocalPage(initialPage);
      setLocalStartDate(initialStartDate || '');
      setLocalEndDate(initialEndDate || '');
      setUpdateMessage(null);
      Animated.timing(fadeAnimation, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      fadeAnimation.setValue(0);
    }
  }, [visible, initialStatus, initialPage, initialStartDate, initialEndDate]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleSaveDates = async () => {
    if (localStartDate && localEndDate && localStartDate > localEndDate) {
      setUpdateMessage('Start Date cannot be after End Date');
      return;
    }

    try {
      const updateBookDatesResponse = await instance.put(requests.updateBookDates, {
        bookId, startDate: localStartDate, endDate: localEndDate
      }, {
        headers: {
          Authorization: `Bearer ${userDetails[0].accessToken}`
        },
      });
      const response = updateBookDatesResponse.data;
      setUpdateMessage(response.data.status === "success" ? "Dates updated successfully!" : response.data.message);
      if (response.data.status === "success") onUpdate();
    } catch (error) {
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
      const response = await instance.post(requests.submitReadingStatus, {
        bookId, status: localStatus,
        currentPage: localStatus === 'Currently reading' ? localPage : undefined,
        startDate: localStartDate || undefined,
        endDate: localStatus === 'Read' ? localEndDate : undefined,
      }, {
        headers: {
          Authorization: `Bearer ${userDetails[0].accessToken}`,
        },
      });
      const submitReadingStatusResponse = response.data;
      setUpdateMessage(submitReadingStatusResponse.data.message === "Updated" ? "Updated successfully!" : submitReadingStatusResponse.data.message);
      if (submitReadingStatusResponse.data.message === "Updated") onUpdate();
      analytics.track('reading_status_updated');
    } catch (error) {
      setUpdateMessage("Uh oh! Please try again");
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnimation, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setUpdateMessage(null);
      onClose();
    });
  };

  const handleSaveAndClose = () => {
    submitReadingStatus();
    setTimeout(handleClose, 1000);
  };

  const renderInput = (icon: string, placeholder: string, value: string, onChangeText: (text: string) => void, keyboardType?: any) => (
    <View style={styles.inputContainer}>
      <MaterialIcons name={icon as keyof typeof MaterialIcons.glyphMap} size={20} color={COLORS.primaryOrangeHex} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.secondaryLightGreyHex}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, {
          opacity: fadeAnimation,
          transform: [{ scale: fadeAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
        }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerIcon}>
                <MaterialIcons name="edit" size={24} color={COLORS.primaryOrangeHex} />
              </View>
              <Text style={styles.modalTitle}>Update Reading Status</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={COLORS.secondaryLightGreyHex} />
              </TouchableOpacity>
            </View>
            
            {/* Status Picker */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Reading Status</Text>
              <CustomPicker
                options={availableOptions}
                selectedValue={localStatus}
                onValueChange={setLocalStatus}
                placeholder="Select reading status"
              />
            </View>
            
            {/* Page Input */}
            {localStatus === 'Currently reading' && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Current Page</Text>
                {renderInput('bookmark', 'Page number', localPage?.toString() || '', 
                  (text) => setLocalPage(parseInt(text) || 0), 'numeric')}
              </View>
            )}
            
            {/* Date Inputs */}
            {(localStatus === 'Currently reading' || localStatus === 'Read') && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Reading Dates</Text>
                {renderInput('event', 'Start Date (YYYY-MM-DD)', localStartDate, setLocalStartDate)}
                {localStatus === 'Read' && renderInput('event-available', 'End Date (YYYY-MM-DD)', localEndDate, setLocalEndDate)}
                
                {(localStartDate || localEndDate) && (
                  <View style={styles.dateDisplayContainer}>
                    <View style={styles.dateDisplay}>
                      <MaterialIcons name="schedule" size={16} color={COLORS.primaryOrangeHex} />
                      <Text style={styles.dateDisplayText}>
                        {localStatus === 'Read' 
                          ? `${formatDate(localStartDate)} - ${formatDate(localEndDate || new Date().toISOString().split('T')[0])}`
                          : `Started: ${formatDate(localStartDate)}`}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={handleSaveDates} style={styles.updateDatesButton}>
                      <MaterialIcons name="update" size={16} color={COLORS.primaryWhiteHex} />
                      <Text style={styles.updateDatesText}>Update Dates Only</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            
            {/* Update Message */}
            {updateMessage && (
              <View style={[styles.updateMessageContainer, updateMessage.includes('successfully') && styles.successMessage]}>
                <MaterialIcons name={updateMessage.includes('successfully') ? "check-circle" : "error"} size={16} 
                  color={updateMessage.includes('successfully') ? COLORS.primaryOrangeHex : COLORS.primaryRedHex} />
                <Text style={styles.updateMessage}>{updateMessage}</Text>
              </View>
            )}
          </ScrollView>
          
          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
              <MaterialIcons name="close" size={20} color={COLORS.primaryRedHex} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveAndClose} style={styles.saveButton}>
              <MaterialIcons name="check" size={20} color={COLORS.primaryWhiteHex} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default BookStatusModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.space_20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondaryDarkGreyHex,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.space_10,
  },
  closeButton: {
    padding: SPACING.space_4,
  },
  section: {
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
  },
  sectionLabel: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    marginBottom: SPACING.space_8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: COLORS.secondaryLightGreyHex,
    paddingHorizontal: SPACING.space_12,
    marginBottom: SPACING.space_8,
  },
  input: {
    flex: 1,
    height: 48,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    marginLeft: SPACING.space_8,
  },
  dateDisplayContainer: {
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
    marginTop: SPACING.space_8,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  dateDisplayText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    marginLeft: SPACING.space_8,
  },
  updateDatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    alignSelf: 'center',
  },
  updateDatesText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    marginLeft: SPACING.space_4,
  },
  updateMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryRedHex,
    marginHorizontal: SPACING.space_20,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    marginBottom: SPACING.space_12,
  },
  successMessage: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  updateMessage: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    marginLeft: SPACING.space_8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_16,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondaryDarkGreyHex,
    gap: SPACING.space_12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryDarkGreyHex,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: COLORS.primaryRedHex,
  },
  cancelButtonText: {
    color: COLORS.primaryRedHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    marginLeft: SPACING.space_4,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
  },
  saveButtonText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    marginLeft: SPACING.space_4,
  },
});