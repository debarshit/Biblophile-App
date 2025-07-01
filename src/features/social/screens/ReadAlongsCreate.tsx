import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme'
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../../store/store';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../../../components/HeaderBar';

const ReadAlongsCreate = ({ route }: any) => {
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;

  const bookId = route.params.bookId;
  const navigation = useNavigation<any>();

  const handleSubmit = async () => {
    if (!bookId) {
      navigation.goBack();
      return;
    }

    if (!accessToken) {
      navigation.navigate('SignupLogin');
      return;
    }

    const readalongData = {
      bookId: bookId,
      description: description || null,
      startDate: startDate || null,
      endDate: endDate || null,
      isPublic: isPublic,
      maxMembers: 1000,
    };

    try {
      // Make a request to the backend to create a new readalong
      const response = await instance.post(requests.createReadalong, readalongData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.data.message == 'Created') {
        Toast.show({
          type: 'success', 
          text1: `Readalong Created`,
          visibilityTime: 2000, 
          autoHide: true, 
          position: 'bottom',
          bottomOffset: 100, 
        });
      }
      else {
        Toast.show({
          type: 'error', 
          text1: response.data.error,
          visibilityTime: 2000, 
          autoHide: true, 
          position: 'bottom',
          bottomOffset: 100, 
        });
      }
    } catch (error) {
        Toast.show({
          type: 'error', 
          text1: "Failed to send the request. Please try again.",
          visibilityTime: 2000, 
          autoHide: true, 
          position: 'bottom',
          bottomOffset: 100, 
        });
    }

  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar showBackButton={true} title='Readalong' />
      <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.header}>Create a New ReadAlong</Text>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Optional. Add details like start date, checkpoints, and more."
          placeholderTextColor={COLORS.secondaryLightGreyHex}
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        {/* Start Date */}
        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.input}>
          <Text style={styles.inputText}>{startDate.toISOString().split('T')[0]}</Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            accentColor={COLORS.primaryOrangeHex}
            onChange={(event, selectedDate) => {
              setShowStartPicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
          />
        )}
        <Text style={styles.hint}>Set a start date. If left blank, it will start today.</Text>

        {/* End Date */}
        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.input}>
          <Text style={styles.inputText}>
            {endDate ? endDate.toISOString().split('T')[0] : 'Select a date'}
          </Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            accentColor={COLORS.primaryOrangeHex}
            onChange={(event, selectedDate) => {
              setShowEndPicker(false);
              if (selectedDate) setEndDate(selectedDate);
            }}
          />
        )}
        <Text style={styles.hint}>
            Set an end date for final thoughts.
        </Text>

        {/* Public Toggle */}
        <Text style={styles.label}>Make this readalong Public?</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity onPress={() => setIsPublic(true)} style={styles.radioOption}>
            <View style={[styles.radioCircle, isPublic && styles.radioSelected]} />
            <Text style={styles.radioLabel}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsPublic(false)} style={styles.radioOption}>
            <View style={[styles.radioCircle, !isPublic && styles.radioSelected]} />
            <Text style={styles.radioLabel}>No</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          A public readalong is discoverable and anyone can join.
        </Text>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Create Readalong</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReadAlongsCreate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondaryDarkGreyHex,
  },
  scrollViewContainer: {
    flex: 1,
    padding: SPACING.space_20,
  },
  contentContainer: {
    paddingBottom: SPACING.space_32,
  },
  header: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_20,
  },
  label: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    marginBottom: SPACING.space_8,
  },
  textArea: {
    backgroundColor: COLORS.primaryGreyHex,
    color: COLORS.primaryWhiteHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    textAlignVertical: 'top',
    marginBottom: SPACING.space_16,
  },
  input: {
    backgroundColor: COLORS.primaryGreyHex,
    color: COLORS.primaryWhiteHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    marginBottom: SPACING.space_8,
  },
  inputText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  hint: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    marginBottom: SPACING.space_16,
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.space_16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primaryOrangeHex,
    marginRight: SPACING.space_8,
    backgroundColor: 'transparent',
  },
  radioSelected: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  radioLabel: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.space_24,
  },
  submitButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_10,
  },
  submitText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
  },
  cancelButton: {
    justifyContent: 'center',
  },
  cancelText: {
    color: COLORS.primaryWhiteHex,
    textDecorationLine: 'underline',
    fontSize: FONTSIZE.size_14,
  },
});