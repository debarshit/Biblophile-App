import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useStore } from '../../../store/store';
import { useAnalytics } from '../../../utils/analytics';
import { useTheme } from '../../../contexts/ThemeContext';

// NOTE: Avoid exposing production API keys in plain text within codebases. 
const GOOGLE_PLACES_API_KEY = 'AIzaSyCVfXqjGvoAtOXMNT9E2QwyEARaRJzupfI'; 

interface CityModalProps {
  visibility: boolean;
  onClose: () => void;
  modalType?: 'firstLaunch' | 'bangaloreDetected' | null;
}

const CityModal = ({ visibility, onClose, modalType = null }: CityModalProps) => {
  const { selectedCity, setSelectedCity } = useStore();
  const analytics = useAnalytics();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  
  // Dynamically resolve the current city title string 
  const currentCityDisplayName = selectedCity || "Select City";

  const handleCitySelect = (cityName: string) => {
    // Track if user was detected in Bangalore and responded
    if (modalType === 'bangaloreDetected') {
      analytics.track('city_choice_after_bangalore_detected', {
        user_choice: cityName,
        detected_city: 'Bangalore',
      });
    }
    // Track if user confirms they are in Bangalore during first launch
    if (modalType === 'firstLaunch' && cityName === 'Bengaluru') {
      analytics.track('user_confirmed_bangalore_on_first_launch');
    }
    setSelectedCity(cityName);
    onClose();
  };

  // Determine contextual dynamic titles based on current city state
  let title = 'Choose your city';
  if (modalType === 'firstLaunch') {
    title = `We’re piloting book rentals in Bengaluru — do you live here?`;
  } else if (modalType === 'bangaloreDetected') {
    title = `Looks like you’re in Bengaluru. Want to unlock local rentals?`;
  }

  return (
    <Modal
      visible={visibility}
      onRequestClose={onClose}
      animationType="slide"
      transparent
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.headerText}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.primaryWhiteHex} />
              </TouchableOpacity>
            </View>
            
            {/* Google Places Autocomplete Engine */}
            <View style={styles.searchContainer}>
              <GooglePlacesAutocomplete
                placeholder="Search for your city..."
                onPress={(data, details = null) => {
                  const cityName = data.structured_formatting?.main_text || data.description;
                  handleCitySelect(cityName);
                }}
                query={{
                  key: GOOGLE_PLACES_API_KEY,
                  language: 'en',
                  types: '(cities)',
                }}
                styles={{
                  container: { flex: 0 },
                  textInput: styles.searchInput,
                  description: { color: COLORS.primaryWhiteHex },
                  predefinedPlacesDescription: { color: COLORS.primaryOrangeHex },
                  listView: styles.autocompleteListView,
                  row: styles.autocompleteRow,
                  separator: styles.autocompleteSeparator,
                }}
                textInputProps={{
                  placeholderTextColor: COLORS.secondaryLightGreyHex,
                  clearButtonMode: 'never',
                }}
                enablePoweredByContainer={false}
                keyboardShouldPersistTaps="handled"
              />
            </View>

            <View style={styles.body}>
              <Text style={styles.instructionText}>Current Selection</Text>
              <View style={styles.cityList}>
                <TouchableOpacity
                  style={[
                    styles.cityItem,
                    selectedCity && styles.selectedCityItem,
                  ]}
                  onPress={() => {
                    if (selectedCity) {
                      handleCitySelect(selectedCity);
                    }
                  }}
                  disabled={!selectedCity}
                >
                  <View style={styles.cityItemContent}>
                    <Text style={styles.cityIcon}>
                      <FontAwesome5 
                        name="city" 
                        size={16} 
                        color={selectedCity ? "#D17842" : COLORS.secondaryLightGreyHex} 
                      />
                    </Text>
                    <Text style={styles.cityName}>
                      {modalType && selectedCity ? `Yes, I’m in ${currentCityDisplayName}` : currentCityDisplayName}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryBlackRGBA,
  },
  modalContainer: {
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: 20,
    width: '85%',
    maxHeight: '80%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    color: COLORS.primaryWhiteHex,
    fontFamily: 'Poppins-Bold',
    flex: 1,
    paddingRight: 8,
  },
  closeButton: {
    padding: 2,
  },
  searchContainer: {
    zIndex: 999,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.primaryGreyHex,
    color: COLORS.primaryWhiteHex,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  autocompleteListView: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: 8,
    marginTop: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  autocompleteRow: {
    backgroundColor: 'transparent',
    padding: 12,
    height: 48,
    justifyContent: 'center',
  },
  autocompleteSeparator: {
    backgroundColor: COLORS.primaryGreyHex,
    height: 0.5,
  },
  body: {
    marginTop: 8,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: 12,
    fontFamily: 'Poppins-Medium',
  },
  cityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreyHex,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  selectedCityItem: {
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
  },
  cityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityIcon: {
    marginRight: 8,
  },
  cityName: {
    color: COLORS.primaryWhiteHex,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },
});

export default CityModal;