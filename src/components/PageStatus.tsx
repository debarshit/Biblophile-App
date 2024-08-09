import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useStore } from '../store/store';
import instance from '../services/axios';
import requests from '../services/requests';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';

interface PageStatusProps {
  id: string;
  page: number;
  onUpdate: () => void;
}

const PageStatus: React.FC<PageStatusProps> = ({ id, page, onUpdate }) => {
  const [status, setStatus] = useState<string>('Currently reading');
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const userDetails = useStore((state: any) => state.userDetails);

  const submitReadingStatus = async () => {
    const userId = userDetails?.[0]?.userId;
    if (userId) {
      try {
        const requestData = {
          userId: userId,
          bookId: id,
          status: status,
          currentPage: status === 'Currently reading' ? currentPage : undefined,
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
          selectedValue={status}
          style={styles.picker}
          onValueChange={(itemValue) => setStatus(itemValue as string)}
        >
          <Picker.Item label="Read" value="Read" />
          <Picker.Item label="Currently reading" value="Currently reading" />
          <Picker.Item label="To be read" value="To be read" />
        </Picker>
      </View>
      {status === 'Currently reading' && (
        <View style={styles.pageNumberInput}>
          <Text style={styles.label}>Current Page:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={currentPage.toString()}
            onChangeText={(text) => setCurrentPage(parseInt(text) || 0)}
          />
        </View>
      )}
      <TouchableOpacity onPress={submitReadingStatus} style={styles.iconButton}>
        <Text style={styles.iconText}>✔️</Text>
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
    height: 40,
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
    fontSize: FONTSIZE.size_16,
    width: 100,
    textAlign: 'center',
  },
  iconButton: {
    marginTop: SPACING.space_16,
  },
  iconText: {
    fontSize: 25,
    color: COLORS.primaryOrangeHex,
  },
  updateMessage: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_8,
  },
});
