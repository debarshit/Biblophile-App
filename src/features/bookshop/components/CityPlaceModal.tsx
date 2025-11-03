import React from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import { useAnalytics } from '../../../utils/analytics';

interface CityPlace {
  id: string;
  name: string;
  type: string;
  address?: string;
  description?: string;
  rating?: number;
  photo?: string;
  contact?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
}

interface CityPlaceModalProps {
  visible: boolean;
  onClose: () => void;
  place: CityPlace | null;
}

export default function CityPlaceModal({ visible, onClose, place }: CityPlaceModalProps) {
  const analytics = useAnalytics();
  if (!place) return null;

  const openWebsite = () => {
    if (place.website) {
      analytics.track('visit_website', { place_id: place.id, name: place.name });
      Linking.openURL(place.website).catch(err => console.error('Error opening website:', err));
    }
  };

  const openMap = () => {
    if (place.latitude && place.longitude) {
      analytics.track('view_place_on_map', {
        place_id: place.id,
        name: place.name,
        type: place.type,
      });
      Linking.openURL(`https://www.google.com/maps?q=${place.latitude},${place.longitude}`);
    }
  };

  const callNumber = () => {
    if (place.contact) {
      Linking.openURL(`tel:${place.contact}`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: SPACING.space_20 }}
          >
            {/* Image */}
            {place.photo && (
              <Image
                source={{ uri: place.photo }}
                style={styles.image}
                resizeMode="cover"
              />
            )}

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.name}>{place.name}</Text>
              <Text style={styles.type}>{place.type.replace(/_/g, ' ')}</Text>

              {place.rating !== undefined && (
                <Text style={styles.rating}>⭐ {place.rating.toFixed(1)}</Text>
              )}

              {place.address && (
                <Text style={styles.address}>{place.address}</Text>
              )}

              {place.description && (
                <Text style={styles.description}>{place.description}</Text>
              )}

              {/* Action buttons */}
              <View style={styles.actions}>
                {place.website && (
                  <TouchableOpacity onPress={openWebsite}>
                    <Text style={styles.link}>🌐 Visit Website</Text>
                  </TouchableOpacity>
                )}
                {place.contact && (
                  <TouchableOpacity onPress={callNumber}>
                    <Text style={styles.link}>📞 Call</Text>
                  </TouchableOpacity>
                )}
                {place.latitude && place.longitude && (
                  <TouchableOpacity onPress={openMap}>
                    <Text style={styles.link}>📍 View Map</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_16,
  },
  modalContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: SPACING.space_16,
  },
  name: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  type: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_8,
    textTransform: 'capitalize',
  },
  rating: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    marginBottom: SPACING.space_8,
  },
  address: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    marginBottom: SPACING.space_12,
  },
  description: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    lineHeight: FONTSIZE.size_20,
    marginBottom: SPACING.space_16,
  },
  actions: {
    flexDirection: 'column',
    gap: SPACING.space_8,
  },
  link: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  closeButton: {
    alignSelf: 'center',
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingVertical: SPACING.space_10,
    paddingHorizontal: SPACING.space_30,
    marginTop: SPACING.space_16,
  },
  closeText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
});