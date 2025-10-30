import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';

interface CityPlace {
  id: string;
  name: string;
  type: string;
  address?: string;
  photo?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
}

interface CityPlacesSectionProps {
  cityPlaces: CityPlace[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

export default function CityPlacesSection({ cityPlaces }: CityPlacesSectionProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const contentWidth = event.nativeEvent.contentSize.width;
    const viewWidth = event.nativeEvent.layoutMeasurement.width;
    const maxScroll = contentWidth - viewWidth;
    const progress = maxScroll > 0 ? scrollX / maxScroll : 0;
    setScrollProgress(progress);
  };

  const openMap = (latitude?: number, longitude?: number) => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      Linking.openURL(url).catch(err =>
        console.error('Error opening maps:', err)
      );
    }
  };

  if (!cityPlaces || cityPlaces.length === 0) return null;

  // Group places in pairs
  const groupedPlaces: CityPlace[][] = [];
  for (let i = 0; i < cityPlaces.length; i += 2) {
    groupedPlaces.push(cityPlaces.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reading Spots & Cafes</Text>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {groupedPlaces.map((group, groupIdx) => {
          const groupProgress = scrollProgress * 100;

          return (
            <View key={groupIdx} style={styles.groupContainer}>
              {group.map((place, idx) => {
                const cardOffset = (groupIdx * 2 + idx) * -10;
                const imageTransform = groupProgress + cardOffset;

                return (
                  <View key={place.id} style={styles.card}>
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: place.photo || '/placeholder.jpg' }}
                        style={[
                          styles.image,
                          {
                            transform: [
                              { translateX: imageTransform },
                              { scale: 1.15 },
                            ],
                          },
                        ]}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.placeName} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <Text style={styles.placeType}>
                        {place.type.replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.address} numberOfLines={2}>
                        {place.address}
                      </Text>
                      <View style={styles.footer}>
                        <Text style={styles.rating}>
                          ⭐ {place.rating?.toFixed(1) || '0.0'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => openMap(place.latitude, place.longitude)}
                        >
                          <Text style={styles.mapLink}>View Map →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.space_24,
    backgroundColor: COLORS.primaryBlackHex,
    paddingVertical: SPACING.space_20,
  },
  title: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
    paddingHorizontal: SPACING.space_30,
  },
  scrollContent: {
    paddingHorizontal: SPACING.space_20,
    gap: SPACING.space_20,
  },
  groupContainer: {
    width: CARD_WIDTH,
    gap: SPACING.space_20,
    marginRight: SPACING.space_4,
  },
  card: {
    borderRadius: BORDERRADIUS.radius_20,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 160,
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  cardContent: {
    padding: SPACING.space_16,
  },
  placeName: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    marginBottom: SPACING.space_4,
  },
  placeType: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    textTransform: 'capitalize',
    marginTop: SPACING.space_4,
  },
  address: {
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    marginTop: SPACING.space_8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.space_12,
  },
  rating: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  mapLink: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_medium,
  },
});