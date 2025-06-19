import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import instance from '../../../services/axios';
import { COLORS, SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';

export default function CreateBookClubScreen() {
  const [clubName, setClubName] = useState('');
  const [description, setDescription] = useState('');
  const [codeOfConduct, setCodeOfConduct] = useState('');

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;
  const navigation = useNavigation<any>();

  const handleCreateClub = async () => {
    if (!clubName.trim()) {
      Alert.alert('Validation Error', 'Club name is required.');
      return;
    }

    try {
      const data = {
        clubName: clubName.trim(),
        description: description.trim() || null,
        codeOfConduct: codeOfConduct.trim() || null,
      };

      const response = await instance.post(requests.createBookClub, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.status === 'success') {
        navigation.navigate('Social', { initialTab: 'Book Clubs' });
      } else {
        Alert.alert('Error', response.data.error || 'Failed to create book club.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send request. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Create a New Book Club</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Club Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter club name"
          placeholderTextColor={COLORS.secondaryLightGreyHex}
          value={clubName}
          onChangeText={setClubName}
        />
        <Text style={styles.helperText}>Set a name that reflects your club</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Optional. You can add links to readalong or buddy reads."
          placeholderTextColor={COLORS.secondaryLightGreyHex}
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Code of Conduct</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Optional. You can add club guidelines."
          placeholderTextColor={COLORS.secondaryLightGreyHex}
          value={codeOfConduct}
          onChangeText={setCodeOfConduct}
          multiline
        />
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.submitButton} onPress={handleCreateClub}>
          <Text style={styles.submitButtonText}>Create Buddy Read</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.secondaryDarkGreyHex,
    },
    header: {
      fontSize: FONTSIZE.size_24,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_24,
      marginHorizontal: SPACING.space_12,
    },
    formGroup: {
      marginBottom: SPACING.space_20,
      marginHorizontal: SPACING.space_12,
    },
    label: {
      fontSize: FONTSIZE.size_16,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_8,
    },
    input: {
      backgroundColor: COLORS.primaryGreyHex,
      borderColor: COLORS.primaryLightGreyHex,
      borderWidth: 2,
      borderRadius: BORDERRADIUS.radius_8,
      paddingHorizontal: SPACING.space_12,
      paddingVertical: SPACING.space_10,
      color: COLORS.primaryWhiteHex,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    helperText: {
      marginTop: SPACING.space_4,
      fontSize: FONTSIZE.size_12,
      color: COLORS.secondaryLightGreyHex,
    },
    buttonGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: SPACING.space_24,
      marginHorizontal: SPACING.space_12,
    },
    submitButton: {
      backgroundColor: COLORS.primaryOrangeHex,
      paddingVertical: SPACING.space_12,
      paddingHorizontal: SPACING.space_20,
      borderRadius: BORDERRADIUS.radius_10,
      marginRight: SPACING.space_16,
    },
    submitButtonText: {
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_16,
    },
    cancelButton: {
      color: COLORS.primaryWhiteHex,
      textDecorationLine: 'underline',
      fontSize: FONTSIZE.size_16,
    },
  });  