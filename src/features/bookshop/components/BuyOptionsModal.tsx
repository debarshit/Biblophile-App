import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import { useAnalytics } from '../../../utils/analytics';

const BuyOptionsModal = ({
  isVisible,
  onClose,
  onOptionSelect,
  bookPrice,
  showDirectOption,
  bookTitle,
}) => {
  const analytics = useAnalytics();
  // Handle opening Amazon with affiliate link
  const handleAmazonPurchase = () => {
    const encodedTitle = encodeURIComponent(bookTitle || "");
    // Amazon affiliate link with tag
    const amazonLink = `https://www.amazon.in/s?k=${encodedTitle}&tag=abhi1302-21`;
    analytics.track('amazon_redirect', {
      book_title: bookTitle,
      price: bookPrice,
      affiliate_link: amazonLink,
    });
    Linking.openURL(amazonLink)
      .catch(err => console.error('Error opening Amazon link:', err));
    
    onClose();
  };

  // Handle direct purchase through the app
  const handleDirectPurchase = () => {
    onOptionSelect("direct");
    onClose();
  };

  // Close modal when clicking outside the modal content
  const handleOutsidePress = () => {
    onClose();
  };

  // Prevent clicks inside the modal from closing it
  const handleModalPress = (e) => {
    e.stopPropagation();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleModalPress}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Purchase Options</Text>
              
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleAmazonPurchase}
                >
                  <Text style={styles.optionButtonText}>Buy on Amazon</Text>
                </TouchableOpacity>
                
                {showDirectOption && (
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={handleDirectPurchase}
                  >
                    <Text style={styles.optionButtonText}>
                      Buy a Gently Used Copy | ₹{bookPrice}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={styles.affiliateText}>
                *We earn a small commission from affiliate links. This helps support our platform.
              </Text>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Dimensions.get('window').width * 0.85,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_24,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
  },
  optionsContainer: {
    marginBottom: SPACING.space_16,
    gap: SPACING.space_12,
  },
  optionButton: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_8,
    alignItems: 'center',
  },
  optionButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  affiliateText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    fontStyle: 'italic',
  },
  cancelButton: {
    marginTop: SPACING.space_16,
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
  },
});

export default BuyOptionsModal;