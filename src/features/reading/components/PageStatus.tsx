import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Entypo from '@expo/vector-icons/Entypo';
import { useStore } from '../../../store/store';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

interface PageStatusProps {
  id: string;
  page: number;
  status: string;
  startDate?: string;
  endDate?: string;
  onUpdate: () => void;
}

const PageStatus: React.FC<PageStatusProps> = ({ id, page, status, startDate, endDate, onUpdate }) => {
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [bookStatus, setBookStatus] = useState<string>(status);
  const [newStartDate, setNewStartDate] = useState<string | undefined>(startDate);
  const [newEndDate, setNewEndDate] = useState<string | undefined>(endDate);
  const [isEditingDates, setIsEditingDates] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const userDetails = useStore((state: any) => state.userDetails);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const handleSaveDates = async () => {
    if (newStartDate && newEndDate && newStartDate > newEndDate) {
      setUpdateMessage('Start Date cannot be after End Date');
      return;
    }

    try {
      const response = await instance.post(requests.updateBookDates, {
        bookId: id,
        startDate: newStartDate,
        endDate: newEndDate
      });

      if (response.data.status === "success") {
        setUpdateMessage("Dates updated successfully!");
-       setIsEditingDates(false);
      } else {
        setUpdateMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error updating dates:', error);
      setUpdateMessage("Uh oh! Please try again");
    }
  };

  const handleCancelDateEdit = () => {
    setIsEditingDates(false);
    setNewStartDate(startDate); // Reset to original dates
    setNewEndDate(endDate);
  };

  const submitReadingStatus = async () => {
    const userId = userDetails?.[0]?.userId;
    if (userId) {
      try {
        const requestData = {
          userId: userId,
          bookId: id,
          status: bookStatus,
          currentPage: bookStatus === 'Currently reading' ? currentPage : undefined,
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
    } else {
      setUpdateMessage("Login to update reading status");
    }
  };

  return (
    <View style={styles.container}>
      {updateMessage && <Text style={styles.updateMessage}>{updateMessage}</Text>}
      <View style={styles.statusDropdown}>
        {/* <Text style={styles.label}>Status: </Text> */}
        <Picker
          selectedValue={bookStatus}
          style={styles.picker}
          onValueChange={(itemValue) => setBookStatus(itemValue)}
        >
          {(status === 'Currently reading' || status === 'Paused') && (
              <Picker.Item label="Paused" value="Paused" />
          )}
          <Picker.Item label="Read" value="Read" />
          <Picker.Item label="Currently reading" value="Currently reading" />
          <Picker.Item label="To be read" value="To be read" />
          <Picker.Item label="Did not finish" value="Did not finish" />
          <Picker.Item label="Remove" value="Remove" />
        </Picker>
      </View>
      {bookStatus === 'Currently reading' && (
        <View style={styles.pageNumberInput}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={currentPage.toString()}
            onChangeText={(text) => setCurrentPage(parseInt(text) || 0)}
          />
        </View>
      )}

      {/* Date Editing for Read and Currently Reading */}
      {(bookStatus === 'Read' || bookStatus === 'Currently reading') && (
        <View>
          {isEditingDates ? (
            <View style={styles.dateEditContainer}>
              <TextInput
                style={styles.dateInput}
                value={newStartDate}
                onChangeText={setNewStartDate}
                placeholder="Start Date (YYYY-MM-DD)"
              />
              {bookStatus === 'Read' && (
                <TextInput
                  style={styles.dateInput}
                  value={newEndDate}
                  onChangeText={setNewEndDate}
                  placeholder="End Date (YYYY-MM-DD)"
                />
              )}
              <View style={styles.editButtons}>
              <TouchableOpacity onPress={handleCancelDateEdit}>
                  <Entypo name="cross" color={COLORS.primaryRedHex} size={FONTSIZE.size_24} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveDates}>
                  <Entypo name="check" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_24} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditingDates(true)}>
              <Text style={styles.dateText}>
                {bookStatus === 'Read' 
                  ? `${formatDate(newStartDate)} - ${formatDate(newEndDate || 'today')}`
                  : `Started on: ${formatDate(newStartDate)}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <TouchableOpacity onPress={submitReadingStatus} style={styles.iconButton}>
      <Entypo name="check" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_24}/>
      </TouchableOpacity>
    </View>
  );
};

export default PageStatus;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
  },
  statusDropdown: {
    marginVertical: SPACING.space_16,
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
  },
  label: {
    color: COLORS.primaryWhiteHex,
    marginRight: SPACING.space_8,
  },
  picker: {
    height: 60,
    width: 200,
    borderColor: COLORS.secondaryLightGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
    backgroundColor: COLORS.primaryGreyHex,
  },
  pageNumberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
  },
  input: {
    height: 40,
    paddingHorizontal: SPACING.space_8,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderColor: COLORS.secondaryLightGreyHex,
    borderWidth: 1,
    borderRadius: 8,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    width: 100,
    paddingTop: SPACING.space_2,
    textAlign: 'center',
  },
  dateInput: {
    height: 40,
    paddingHorizontal: SPACING.space_8,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderColor: COLORS.secondaryLightGreyHex,
    borderWidth: 1,
    borderRadius: 8,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    width: 150,
    textAlign: 'center',
  },
  dateText: {
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_10,
  },
  dateEditContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: SPACING.space_8,
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: SPACING.space_8,
    marginLeft: SPACING.space_16,
    gap: SPACING.space_16,
  },
  iconButton: {
    marginTop: SPACING.space_16,
  },
  updateMessage: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_8,
  },
});
