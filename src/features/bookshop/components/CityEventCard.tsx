import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';

interface CityEvent {
  id: string;
  title: string;
  type: string;
  location?: string;
  photo?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  registrationLink?: string;
  interested?: number;
  going?: number;
  userStatus?: 'interested' | 'going' | null;
}

interface CityEventCardProps {
  event: CityEvent;
  accessToken?: string;
}

export default function CityEventCard({ event, accessToken }: CityEventCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interested, setInterested] = useState(event.interested || 0);
  const [going, setGoing] = useState(event.going || 0);
  const [userStatus, setUserStatus] = useState<'interested' | 'going' | null>(
    event.userStatus || null
  );

  const handleStatus = async (status: 'interested' | 'going') => {
    if (!accessToken) {
      Alert.alert('Sign In Required', 'Please sign in to RSVP for events.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await instance.post(
        requests.submitEventStatus,
        { eventId: event.id, status },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const { interested: newInterested, going: newGoing } = response.data.data;
      setUserStatus(prev => (prev === status ? null : status));
      setInterested(newInterested);
      setGoing(newGoing);

      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(
          'RSVP updated successfully',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        );
      } else {
        Toast.show({
          type: 'success',
          text1: 'RSVP updated successfully',
          visibilityTime: 2000,
          position: 'bottom',
          bottomOffset: 100,
        });
      }
    } catch (error) {
      console.error('RSVP update failed:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRegistration = () => {
    if (event.registrationLink) {
      Linking.openURL(event.registrationLink).catch(err =>
        console.error('Error opening link:', err)
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.card}>
      {event.photo && (
        <Image
          source={{ uri: event.photo }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        {event.location && (
          <Text style={styles.location} numberOfLines={1}>
            {event.location}
          </Text>
        )}
        <Text style={styles.date}>
          {formatDate(event.startDate)}
          {event.endDate && ` – ${formatDate(event.endDate)}`}
        </Text>

        {event.description && (
          <Text style={styles.description} numberOfLines={3}>
            {event.description}
          </Text>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            disabled={isSubmitting}
            onPress={() => handleStatus('interested')}
            style={[
              styles.button,
              userStatus === 'interested' && styles.buttonActive,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                userStatus === 'interested' && styles.buttonTextActive,
              ]}
            >
              ⭐ Interested ({interested})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isSubmitting}
            onPress={() => handleStatus('going')}
            style={[
              styles.button,
              userStatus === 'going' && styles.buttonActive,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                userStatus === 'going' && styles.buttonTextActive,
              ]}
            >
              ✅ Going ({going})
            </Text>
          </TouchableOpacity>
        </View>

        {event.registrationLink && (
          <TouchableOpacity onPress={openRegistration} style={styles.linkContainer}>
            <Text style={styles.link}>Details →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDERRADIUS.radius_20,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    overflow: 'hidden',
    marginBottom: SPACING.space_16,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: SPACING.space_16,
  },
  title: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  location: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  date: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_12,
  },
  description: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_12,
    lineHeight: FONTSIZE.size_20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.space_12,
    marginBottom: SPACING.space_12,
  },
  button: {
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryDarkGreyHex,
  },
  buttonActive: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  buttonText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  buttonTextActive: {
    color: COLORS.primaryWhiteHex,
  },
  linkContainer: {
    alignSelf: 'flex-end',
  },
  link: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
});