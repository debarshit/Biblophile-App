//if i chose this, then on the first event card along with icons write interested and going, but in the next in same row just icons

import React, { useMemo, useState } from 'react';
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
import { useAnalytics } from '../../../utils/analytics';
import { useTheme } from '../../../contexts/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';

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
  price?: number | string;
  ticketPrice?: number | string;
  requiresTicketing?: boolean | number;
  capacity?: number;
  cityName?: string;
  interested?: number;
  going?: number;
  userStatus?: 'interested' | 'going' | null;
}

interface CityEventCardProps {
  event: CityEvent;
  accessToken?: string;
  onPress?: (event: CityEvent) => void;
}

export default function CityEventCard({ event, accessToken, onPress }: CityEventCardProps) {
  const analytics = useAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interested, setInterested] = useState(event.interested || 0);
  const [going, setGoing] = useState(event.going || 0);
  const [userStatus, setUserStatus] = useState<'interested' | 'going' | null>(
    event.userStatus || null
  );
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const rawPrice = event.ticketPrice ?? event.price;
  const isPaid = Boolean(rawPrice && Number(rawPrice) > 0);
  const displayPrice = isPaid ? Number(rawPrice) : 0;

  const handleStatus = async (status: 'interested' | 'going') => {
    if (!accessToken) {
      Alert.alert('Sign In Required', 'Please sign in to RSVP for events.');
      return;
    }

    analytics.track(status === 'interested' ? 'event_marked_interested' : 'event_marked_going', {
      event_id: event.id,
      title: event.title,
      type: event.type,
      location: event.location,
    });

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

  const getGoogleCalendarUrl = (ev: CityEvent) => {
    try {
      const start = new Date(ev.startDate).toISOString().replace(/-|:|\.\d+/g, '');
      const end = new Date(ev.endDate || ev.startDate).toISOString().replace(/-|:|\.\d+/g, '');

      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: ev.title,
        dates: `${start}/${end}`,
        details: ev.description || '',
        location: ev.location || '',
      });

      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    } catch {
      return '#';
    }
  };

  const formatCardDate = (startDateStr: string, endDateStr?: string) => {
    try {
      const s = new Date(startDateStr);
      if (isNaN(s.getTime())) return 'TBD';

      if (endDateStr) {
        const e = new Date(endDateStr);
        if (!isNaN(e.getTime())) {
          const isSameDay =
            s.getFullYear() === e.getFullYear() &&
            s.getMonth() === e.getMonth() &&
            s.getDate() === e.getDate();

          if (!isSameDay) {
            const startFormatted = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const endFormatted = e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `${startFormatted} – ${endFormatted}`;
          }
        }
      }

      const day = s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const time = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${day} • ${time}`;
    } catch {
      return 'TBD';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress?.(event)}
      style={styles.card}
    >
      {/* Top Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              event.photo ||
              'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
          }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Overlay Badges */}
        <View style={styles.badgeRow}>
          {/* Category Tag */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {(event.type || 'Event').replace(/_/g, ' ')}
            </Text>
          </View>

          {/* Pricing Tag */}
          <View style={[styles.priceBadge, isPaid ? styles.priceBadgePaid : styles.priceBadgeFree]}>
            <Text style={[styles.priceBadgeText, isPaid ? styles.priceBadgePaidText : styles.priceBadgeFreeText]}>
              {isPaid ? `₹${displayPrice}` : 'Free Pass'}
            </Text>
          </View>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.content}>
        {/* Date & Calendar Row */}
        <View style={styles.dateRow}>
          <View style={styles.dateInfo}>
            <FontAwesome name="calendar" size={11} color={COLORS.primaryOrangeHex} style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>
              {formatCardDate(event.startDate, event.endDate)}
            </Text>
          </View>

          {event.startDate ? (
            <TouchableOpacity
              onPress={() => {
                const calendarUrl = getGoogleCalendarUrl(event);
                analytics.track('add_to_calendar', {
                  event_id: event.id,
                  title: event.title,
                  type: event.type,
                  location: event.location,
                });
                Linking.openURL(calendarUrl).catch(err => console.error('Error opening calendar:', err));
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FontAwesome name="calendar-plus-o" size={12} color={COLORS.secondaryLightGreyHex} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>

        {/* Location */}
        {event.location ? (
          <View style={styles.locationRow}>
            <FontAwesome name="map-marker" size={11} color={COLORS.secondaryLightGreyHex} style={{ marginRight: 5 }} />
            <Text style={styles.locationText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        ) : null}

        {/* Description snippet */}
        {event.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>
        ) : null}

        {/* Footer Actions */}
        <View style={styles.footerRow}>
          {/* Compact RSVP Interaction */}
          <View style={styles.rsvpContainer}>
            <TouchableOpacity
              disabled={isSubmitting}
              onPress={() => handleStatus('interested')}
              style={[
                styles.rsvpPill,
                userStatus === 'interested' && styles.rsvpPillActiveInterested,
              ]}
            >
              <FontAwesome
                name={userStatus === 'interested' ? 'star' : 'star-o'}
                size={11}
                color={userStatus === 'interested' ? '#fff' : COLORS.secondaryLightGreyHex}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.rsvpText,
                  userStatus === 'interested' && styles.rsvpTextActive,
                ]}
              >
                {interested}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isSubmitting}
              onPress={() => handleStatus('going')}
              style={[
                styles.rsvpPill,
                userStatus === 'going' && styles.rsvpPillActiveGoing,
              ]}
            >
              <FontAwesome
                name="check"
                size={10}
                color={userStatus === 'going' ? '#fff' : COLORS.secondaryLightGreyHex}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.rsvpText,
                  userStatus === 'going' && styles.rsvpTextActive,
                ]}
              >
                {going}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Primary CTA Button */}
          <TouchableOpacity
            onPress={() => onPress?.(event)}
            style={styles.bookButton}
          >
            <FontAwesome name="ticket" size={11} color="#fff" style={{ marginRight: 5 }} />
            <Text style={styles.bookButtonText}>
              {isPaid ? `Book • ₹${displayPrice}` : 'Get Pass'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    card: {
      borderRadius: BORDERRADIUS.radius_20,
      backgroundColor: COLORS.secondaryDarkGreyHex,
      borderWidth: 1,
      borderColor: COLORS.primaryGreyHex,
      overflow: 'hidden',
      marginBottom: SPACING.space_16,
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: 145,
      backgroundColor: COLORS.primaryDarkGreyHex,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    badgeRow: {
      position: 'absolute',
      top: 10,
      left: 10,
      right: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryBadge: {
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    categoryBadgeText: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 10,
      fontFamily: FONTFAMILY.poppins_medium,
      textTransform: 'capitalize',
    },
    priceBadge: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
    },
    priceBadgePaid: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderWidth: 1,
      borderColor: 'rgba(209, 120, 66, 0.6)',
    },
    priceBadgePaidText: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: 11,
    },
    priceBadgeFree: {
      backgroundColor: 'rgba(10, 45, 25, 0.85)',
      borderWidth: 1,
      borderColor: 'rgba(46, 204, 113, 0.5)',
    },
    priceBadgeFreeText: {
      color: '#2ecc71',
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: 10,
    },
    priceBadgeText: {
      fontSize: 11,
    },
    content: {
      padding: SPACING.space_12,
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    dateInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    dateText: {
      fontSize: 11,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryOrangeHex,
    },
    title: {
      fontSize: 15,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      marginBottom: 3,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    locationText: {
      fontSize: 11,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      flex: 1,
    },
    description: {
      fontSize: 11,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      opacity: 0.85,
      marginBottom: 6,
      lineHeight: 16,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 10,
      marginTop: 6,
      borderTopWidth: 1,
      borderTopColor: 'rgba(37, 42, 50, 0.6)',
    },
    rsvpContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rsvpPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderWidth: 1,
      borderColor: COLORS.primaryGreyHex,
    },
    rsvpPillActiveInterested: {
      backgroundColor: COLORS.primaryOrangeHex,
      borderColor: COLORS.primaryOrangeHex,
    },
    rsvpPillActiveGoing: {
      backgroundColor: '#27ae60',
      borderColor: '#2ecc71',
    },
    rsvpText: {
      fontSize: 11,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.secondaryLightGreyHex,
    },
    rsvpTextActive: {
      color: '#fff',
    },
    bookButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primaryOrangeHex,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    bookButtonText: {
      color: '#fff',
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: 11,
    },
  });