import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from '../services/axios';
import requests from '../services/requests';
import { useStore } from '../store/store';
import { BORDERRADIUS, COLORS, FONTSIZE, SPACING } from '../theme/theme';

interface SourceReferralModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

const SourceReferralModal: React.FC<SourceReferralModalProps> = ({ isOpen, onRequestClose }) => {
  const [source, setSource] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const userDetails = useStore((state: any) => state.userDetails);

  const updateSourceReferral = async () => {
    if (source !== null) {
      try {
        const updateResponse = await axios.put(requests.updateUserData, {
          property: 'sourceReferral',
          value: source,
        }, {
          headers: {
            Authorization: `Bearer ${userDetails[0].accessToken}`
          },
        });
        const response = updateResponse.data;
        if (response.data.message === 'Updated') {
          setSource(null);
          onRequestClose();
        } else {
          setErrorMessage('Uh oh! Something went wrong.');
        }
      } catch (error) {
        console.error('Error updating:', error);
        setErrorMessage('Uh oh! Something went wrong.');
      }
    } else {
      setErrorMessage('Please select a source.');
    }
  };

  const handleSubmit = () => {
    updateSourceReferral();
  };

  return (
    <Modal transparent={true} visible={isOpen} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
          <Text style={styles.title}>How did you find us?</Text>
          <Picker
            selectedValue={source}
            style={styles.picker}
            onValueChange={(itemValue) => setSource(itemValue)}
          >
            <Picker.Item label="Select an option" value={null} />
            <Picker.Item label="Social Media" value="Social Media" />
            <Picker.Item label="Friends/Word of Mouth" value="Word of Mouth" />
            <Picker.Item label="Online Ads" value="Online Ads" />
            <Picker.Item label="App Store" value="App Store" />
            <Picker.Item label="Influencer/Online Communities" value="Forums or Online Communities" />
            <Picker.Item label="Print Media" value="Print Media" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
          <View style={styles.modalButtons}>
          <TouchableOpacity onPress={onRequestClose} style={styles.cancelButton}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryBlackRGBA,
  },
  modalContent: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_24,
    borderRadius: BORDERRADIUS.radius_10,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: FONTSIZE.size_28,
    fontWeight: 'bold',
    marginBottom: SPACING.space_16,
    color: COLORS.primaryWhiteHex,
  },
  errorMessage: {
    color: COLORS.primaryRedHex,
    marginBottom: 16,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 20,
    color: COLORS.secondaryLightGreyHex,
    backgroundColor: COLORS.secondaryDarkGreyHex,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_10,
    flex: 1,
    marginRight: SPACING.space_10,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_10,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.primaryWhiteHex,
    fontWeight: 'bold',
  },
});

export default SourceReferralModal;