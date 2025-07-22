import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import instance from '../../../services/axios';

interface PickupLocation {
  locationId: string;
  locationName: string;
  address: string;
}

interface DeliveryOptionsProps {
  deliveryOption: "delivery" | "self-pickup";
  onDeliveryOptionChange: (option: "delivery" | "self-pickup") => void;
  selectedPickupLocationId: string;
  onPickupLocationSelect: (locationId: string) => void;
  userToken: string;
}

const DeliveryOptions: React.FC<DeliveryOptionsProps> = ({
  deliveryOption,
  onDeliveryOptionChange,
  selectedPickupLocationId,
  onPickupLocationSelect,
  userToken,
}) => {
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [showPickupModal, setShowPickupModal] = useState(false);

  // Fetch pickup locations when self-pickup is selected
  useEffect(() => {
    if (deliveryOption === "self-pickup") {
      fetchPickupLocations();
    }
  }, [deliveryOption]);

  const fetchPickupLocations = async () => {
    try {
      const isDevelopment = __DEV__;
      const APIURL = isDevelopment ? 'api/v0/' : 'backend/api/v0/';
      const response = await instance.get(`${APIURL}orders/pickup-locations`, {
      });
      if (response.data?.data) {
        setPickupLocations(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching pickup locations:", error);
    }
  };

  const handlePickupLocationSelect = (location: PickupLocation) => {
    onPickupLocationSelect(location.locationId);
    setShowPickupModal(false);
  };

  const getSelectedLocationName = () => {
    const location = pickupLocations.find(loc => loc.locationId === selectedPickupLocationId);
    return location ? `${location.locationName} (${location.address})` : "Select location";
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Delivery Method</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            deliveryOption === "delivery" && styles.selectedOption
          ]}
          onPress={() => onDeliveryOptionChange("delivery")}
        >
          <Text style={[
            styles.optionText,
            deliveryOption === "delivery" && styles.selectedOptionText
          ]}>
            Delivery
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.optionButton,
            deliveryOption === "self-pickup" && styles.selectedOption
          ]}
          onPress={() => onDeliveryOptionChange("self-pickup")}
        >
          <Text style={[
            styles.optionText,
            deliveryOption === "self-pickup" && styles.selectedOptionText
          ]}>
            Self Pickup
          </Text>
        </TouchableOpacity>
      </View>

      {deliveryOption === "self-pickup" && (
        <TouchableOpacity
          style={styles.pickupLocationButton}
          onPress={() => setShowPickupModal(true)}
        >
          <Text style={styles.pickupLocationText}>
            {getSelectedLocationName()}
          </Text>
        </TouchableOpacity>
      )}

      {/* Pickup Location Modal */}
      <Modal
        visible={showPickupModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPickupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Pickup Location</Text>
              <TouchableOpacity 
                onPress={() => setShowPickupModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.locationsList}>
              {pickupLocations.map((location) => (
                <TouchableOpacity
                  key={location.locationId}
                  style={[
                    styles.locationItem,
                    selectedPickupLocationId === location.locationId && styles.selectedLocationItem
                  ]}
                  onPress={() => handlePickupLocationSelect(location)}
                >
                  <Text style={styles.locationName}>{location.locationName}</Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondaryDarkGreyHex,
  },
  sectionTitle: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: SPACING.space_10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_15,
    borderWidth: 1,
    borderColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    backgroundColor: COLORS.secondaryBlackRGBA,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderColor: COLORS.primaryOrangeHex,
  },
  optionText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  selectedOptionText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  pickupLocationButton: {
    marginTop: SPACING.space_10,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_15,
    borderWidth: 1,
    borderColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    backgroundColor: COLORS.secondaryBlackRGBA,
  },
  pickupLocationText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.primaryBlackHex,
    borderTopLeftRadius: BORDERRADIUS.radius_20,
    borderTopRightRadius: BORDERRADIUS.radius_20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.space_20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondaryDarkGreyHex,
  },
  modalTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  closeButton: {
    padding: SPACING.space_8,
  },
  closeButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryOrangeHex,
  },
  locationsList: {
    maxHeight: 300,
  },
  locationItem: {
    padding: SPACING.space_20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondaryDarkGreyHex,
  },
  selectedLocationItem: {
    backgroundColor: COLORS.secondaryBlackRGBA,
  },
  locationName: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  locationAddress: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
  },
});

export default DeliveryOptions;