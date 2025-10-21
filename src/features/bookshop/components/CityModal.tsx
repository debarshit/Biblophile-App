import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useStore } from '../../../store/store';

const cities = [
  { value: "Bengaluru", label: "Bengaluru", icon: <FontAwesome5 name="city" size={20} color="#D17842" /> },
  { value: "Other", label: "Elsewhere", icon: <FontAwesome5 name="city" size={20} color="#D17842" /> },
];

interface CityModalProps {
  visibility: boolean;
  onClose: () => void;
  modalType: 'firstLaunch' | 'bangaloreDetected' | null;
}

const CityModal = ({ visibility, onClose, modalType=null }: CityModalProps) => {
  const { selectedCity, setSelectedCity } = useStore();
  
  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    onClose();
  };

  // Determine modal title
  let title = 'Choose your city';
  if (modalType === 'firstLaunch') {
    title = 'We’re piloting book rentals in Bangalore — do you live here?';
  } else if (modalType === 'bangaloreDetected') {
    title = 'Looks like you’re in Bangalore — want to unlock local rentals?';
  }

  // Map cities to displayCities with contextual names
  const displayCities = cities.map((city) => {
    if (modalType === 'firstLaunch') {
      if (city.value === 'Bengaluru') return { ...city, label: "Yes, I’m in Bangalore" };
      if (city.value === 'Other') return { ...city, label: "Not now" };
    } else if (modalType === 'bangaloreDetected') {
      if (city.value === 'Bengaluru') return { ...city, label: "Yes" };
      if (city.value === 'Other') return { ...city, label: "Not now" };
    }
    return city;
  });

  return (
    <Modal
      visible={visibility}
      onRequestClose={onClose}
      animationType="slide"
      transparent
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{title}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.instructionText}>
              Choose a location to continue:
            </Text>
            <View style={styles.cityList}>
              {displayCities.map((city) => (
                <TouchableOpacity
                  key={city.value}
                  style={[
                    styles.cityItem,
                    selectedCity === city.value && styles.selectedCityItem,
                  ]}
                  onPress={() => handleCitySelect(city.value)}
                >
                  <View style={styles.cityItemContent}>
                    <Text style={styles.cityIcon}>{city.icon}</Text>
                    <Text style={styles.cityName}>{city.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    backgroundColor: '#0C0F14',
    borderRadius: 20,
    width: '80%',
    padding: 24,
  },
  header: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#252A32',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  body: {
    marginTop: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#AEAEAE',
    marginBottom: 16,
  },
  cityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252A32',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: '48%',
  },
  selectedCityItem: {
    backgroundColor: '#21262E',
  },
  cityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityIcon: {
    marginRight: 8,
  },
  cityName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
});

export default CityModal;