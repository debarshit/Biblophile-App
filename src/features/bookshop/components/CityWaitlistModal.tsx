import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../../../theme/theme';
import instance from '../../../services/axios';
import { AntDesign, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

interface CityWaitlistModalProps {
  visible: boolean;
  onClose: () => void;
  defaultCity?: string;
  defaultCountry?: string;
}

export default function CityWaitlistModal({
  visible,
  onClose,
  defaultCity = '',
  defaultCountry = '',
}: CityWaitlistModalProps) {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const [cityName, setCityName] = useState(defaultCity);
  const [country, setCountry] = useState(defaultCountry || 'India');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!cityName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'City Required',
        text2: 'Please type the city you want Biblophile in',
        position: 'bottom',
      });
      return;
    }

    try {
      setSubmitting(true);
      await instance.post('city-discover/waitlist/vote', {
        cityName: cityName.trim(),
        country: country.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setSubmitted(true);
      Toast.show({
        type: 'success',
        text1: 'Vote Recorded!',
        text2: `Thanks for voting for ${cityName}!`,
        position: 'bottom',
      });
    } catch (err: any) {
      console.error('Failed to vote city in mobile app:', err);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Please try again.',
        position: 'bottom',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={handleClose}
      animationType="slide"
      transparent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View style={styles.modalContainer}>
          {submitted ? (
            <View style={styles.successContainer}>
              <AntDesign name="check-circle" size={48} color="#2ecc71" />
              <Text style={styles.successTitle}>Vote Recorded!</Text>
              <Text style={styles.successDescription}>
                Thank you! We've logged your demand for{' '}
                <Text style={styles.highlightText}>{cityName}</Text>. We prioritize our expansion of book rentals, reading cafes, and meetups based on community demand!
              </Text>
              <TouchableOpacity style={styles.submitButton} onPress={handleClose}>
                <Text style={styles.submitButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>🌍 Vote for Your City</Text>
                <TouchableOpacity onPress={handleClose}>
                  <AntDesign name="close" size={20} color={COLORS.secondaryLightGreyHex} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Tell us where you want Biblophile book rentals and literary meetups next!
              </Text>

              <Text style={styles.label}>Your City *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Pune, London, Singapore..."
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                value={cityName}
                onChangeText={setCityName}
              />

              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. India, UK, USA..."
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                value={country}
                onChangeText={setCountry}
              />

              <Text style={styles.label}>Notify Me When Launched (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>What events do you want most?</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="e.g. Silent reading party, book club, lit fest..."
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Vote for City</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.space_20,
    },
    modalContainer: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_20,
      width: '100%',
      padding: SPACING.space_20,
      borderWidth: 1,
      borderColor: COLORS.primaryGreyHex,
    },
    formContainer: {
      width: '100%',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.space_8,
    },
    headerTitle: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    subtitle: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      marginBottom: SPACING.space_16,
      lineHeight: 18,
    },
    label: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_4,
    },
    input: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_10,
      borderWidth: 1,
      borderColor: COLORS.primaryGreyHex,
      color: COLORS.primaryWhiteHex,
      paddingHorizontal: SPACING.space_12,
      paddingVertical: SPACING.space_10,
      fontSize: FONTSIZE.size_12,
      marginBottom: SPACING.space_12,
      fontFamily: FONTFAMILY.poppins_regular,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: SPACING.space_8,
      gap: SPACING.space_12,
    },
    cancelButton: {
      paddingVertical: SPACING.space_10,
      paddingHorizontal: SPACING.space_16,
    },
    cancelText: {
      color: COLORS.secondaryLightGreyHex,
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_medium,
    },
    submitButton: {
      backgroundColor: COLORS.primaryOrangeHex,
      paddingVertical: SPACING.space_10,
      paddingHorizontal: SPACING.space_20,
      borderRadius: BORDERRADIUS.radius_10,
      alignItems: 'center',
    },
    submitButtonText: {
      color: COLORS.primaryWhiteHex,
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_semibold,
    },
    successContainer: {
      alignItems: 'center',
      paddingVertical: SPACING.space_16,
    },
    successTitle: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
      marginTop: SPACING.space_12,
      marginBottom: SPACING.space_8,
    },
    successDescription: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: SPACING.space_20,
    },
    highlightText: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_semibold,
    },
  });