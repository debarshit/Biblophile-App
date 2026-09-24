import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ScrollView,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../../../theme/theme';
import { useAnalytics } from '../../../utils/analytics';
import { useStore } from '../../../store/store';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { AntDesign, FontAwesome } from '@expo/vector-icons';

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
}

interface EventModalProps {
  visible: boolean;
  onClose: () => void;
  event: CityEvent | null;
}

export default function EventModal({
  visible,
  onClose,
  event,
}: EventModalProps) {
  const analytics = useAnalytics();
  const navigation = useNavigation<any>();
  const userDetails = useStore((state: any) => state.userDetails);
  const user = userDetails?.[0];
  const [isBooking, setIsBooking] = useState(false);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  if (!event) return null;

  // 📅 Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const openRegistration = () => {
    if (event.registrationLink) {
      analytics.track('event_modal_open_registration', {
        event_id: event.id,
        title: event.title,
        type: event.type,
      });

      Linking.openURL(event.registrationLink).catch(err =>
        console.error('Error opening registration link:', err)
      );
    }
  };

  const addToCalendar = () => {
    const start = new Date(event.startDate)
      .toISOString()
      .replace(/-|:|\.\d+/g, '');
    const end = new Date(event.endDate || event.startDate)
      .toISOString()
      .replace(/-|:|\.\d+/g, '');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${start}/${end}`,
      details: event.description || '',
      location: event.location || '',
    });

    const url = `https://calendar.google.com/calendar/render?${params.toString()}`;

    analytics.track('event_modal_add_to_calendar', {
      event_id: event.id,
      title: event.title,
    });

    Linking.openURL(url).catch(err =>
      console.error('Error opening calendar:', err)
    );
  };

  const shareEvent = () => {
    const url = `https://biblophile.com/city/bengaluru/events/${event.id}`;

    const message =
      `Check this bookish event 👇\n\n` +
      `${event.title}\n` +
      `${event.location || ''}\n\n` +
      `${url}`;

    Share.share({
      title: event.title,
      message,
    });

    analytics.track('event_modal_share', {
      event_id: event.id,
      title: event.title,
    });
  };

  const rawPrice = event.ticketPrice ?? event.price;
  const isPaid = Boolean(rawPrice && Number(rawPrice) > 0);
  const displayPrice = isPaid ? Number(rawPrice) : 0;

  const handleBookTicket = async () => {
    if (!user?.accessToken) {
      Alert.alert('Sign In Required', 'Please sign in to book event tickets or get passes.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => { onClose(); navigation.navigate('Profile'); } },
      ]);
      return;
    }

    const attendeeName = user.userName || 'Attendee';
    const attendeeEmail = user.userEmail || user.email || '';
    const attendeePhone = user.userPhone || user.phone || '9999999999';

    setIsBooking(true);

    if (isPaid) {
      analytics.track('event_modal_book_ticket_click', {
        event_id: event.id,
        title: event.title,
        isPaid: true,
        price: displayPrice,
      });

      try {
        const res = await instance.post(
          requests.createTicketPayment(event.id),
          {
            attendeeName,
            attendeeEmail,
            attendeePhone,
            returnUrl: 'https://biblophile.com/dashboard/my-tickets',
          },
          {
            headers: { Authorization: `Bearer ${user.accessToken}` },
          }
        );

        const paymentUrl = res.data?.data?.paymentUrl;
        if (paymentUrl) {
          onClose();
          navigation.navigate('PaymentGateway', { url: paymentUrl });
        } else {
          Alert.alert('Payment Error', 'Could not obtain checkout URL from payment gateway.');
        }
      } catch (err: any) {
        console.error('Failed to create ticket payment:', err);
        const msg = err.response?.data?.message || 'Could not initiate payment. Please try again.';
        Alert.alert('Payment Error', msg);
      } finally {
        setIsBooking(false);
      }
    } else {
      analytics.track('event_modal_free_pass_click', {
        event_id: event.id,
        title: event.title,
        isPaid: false,
      });

      try {
        const res = await instance.post(
          requests.bookTicket(event.id),
          {
            attendeeName,
            attendeeEmail,
            attendeePhone,
          },
          {
            headers: { Authorization: `Bearer ${user.accessToken}` },
          }
        );

        const ticket = res.data?.data?.ticket;
        const ticketCode = ticket?.ticketCode || res.data?.data?.ticketCode || 'Confirmed';

        Alert.alert(
          '🎉 Spot Confirmed!',
          `Your admission pass has been registered successfully.\n\nTicket Code: ${ticketCode}\n\nPresent this code or your QR pass at the entrance.`,
          [{ text: 'Great!', onPress: onClose }]
        );
      } catch (err: any) {
        console.error('Failed to claim free ticket:', err);
        const msg = err.response?.data?.message || 'Could not claim free pass. Please try again.';
        Alert.alert('Booking Error', msg);
      } finally {
        setIsBooking(false);
      }
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
            {event.photo && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: event.photo }}
                  style={styles.image}
                  resizeMode="cover"
                />
                {/* Share Button */}
                <TouchableOpacity style={styles.shareButton} onPress={shareEvent}>
                  <AntDesign name="share-alt" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* 📄 Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{event.title}</Text>

              <Text style={styles.type}>
                {event.type.replace(/_/g, ' ')}
              </Text>

              {/* 📍 Location */}
              {event.location && (
                <Text style={styles.location}>{event.location}</Text>
              )}

              {/* 📅 Date */}
              <Text style={styles.date}>
                {formatDate(event.startDate)}
                {event.endDate && ` – ${formatDate(event.endDate)}`}
              </Text>

              {/* 📝 Description */}
              {event.description && (
                <Text style={styles.description}>
                  {event.description}
                </Text>
              )}

              {/* 🎫 Ticketing & Price */}
              <View style={{ marginVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                {isPaid ? (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(255, 122, 0, 0.15)', borderWidth: 1, borderColor: COLORS.primaryOrangeHex }}>
                    <Text style={{ color: COLORS.primaryOrangeHex, fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_12 }}>
                      🎟 ₹{displayPrice} per ticket
                    </Text>
                  </View>
                ) : (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(46, 204, 113, 0.15)', borderWidth: 1, borderColor: '#2ecc71' }}>
                    <Text style={{ color: '#2ecc71', fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_12 }}>
                      Free RSVP Pass
                    </Text>
                  </View>
                )}
                {event.capacity ? (
                  <Text style={{ color: COLORS.secondaryLightGreyHex, fontSize: FONTSIZE.size_12, fontFamily: FONTFAMILY.poppins_regular }}>
                    Capacity: {event.capacity} seats
                  </Text>
                ) : null}
              </View>

              {/* ⚡ Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  disabled={isBooking}
                  onPress={handleBookTicket}
                  style={{
                    backgroundColor: COLORS.primaryOrangeHex,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  {isBooking ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_12 }}>
                      {isPaid ? `🎟 Book Ticket (₹${displayPrice})` : '🎟 Get Free Pass'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={addToCalendar}
                  style={{
                    backgroundColor: COLORS.secondaryDarkGreyHex,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: COLORS.primaryGreyHex,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: COLORS.primaryWhiteHex, fontFamily: FONTFAMILY.poppins_medium, fontSize: FONTSIZE.size_12 }}>
                    📅 Calendar
                  </Text>
                </TouchableOpacity>
              </View>

              {event.registrationLink && (
                <TouchableOpacity
                  onPress={openRegistration}
                  style={{ marginTop: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: COLORS.secondaryLightGreyHex, fontSize: 11, textDecorationLine: 'underline', fontFamily: FONTFAMILY.poppins_regular }}>
                    Prefer external organizer website? Register here →
                  </Text>
                </TouchableOpacity>
              )}

              {/* Host note */}
              <View style={{ marginTop: 14, padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: COLORS.primaryGreyHex }}>
                <Text style={{ color: COLORS.secondaryLightGreyHex, fontSize: 11, textAlign: 'center', fontFamily: FONTFAMILY.poppins_regular }}>
                  Conducting an event? Host on <Text style={{ color: COLORS.primaryOrangeHex, fontFamily: FONTFAMILY.poppins_medium }} onPress={() => Linking.openURL('https://biblophile.com/events/create')}>biblophile.com</Text>
                </Text>
              </View>
            </View>

            {/* ❌ Close */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderTopLeftRadius: BORDERRADIUS.radius_20,
      borderTopRightRadius: BORDERRADIUS.radius_20,
      maxHeight: '85%',
      overflow: 'hidden',
    },
    imageContainer: {
      position: 'relative',
    },
    image: {
      width: '100%',
      height: 200,
    },
    shareButton: {
      position: 'absolute',
      top: SPACING.space_16,
      right: SPACING.space_16,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: SPACING.space_8,
      borderRadius: 20,
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
    type: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryOrangeHex,
      textTransform: 'capitalize',
      marginBottom: SPACING.space_8,
    },
    location: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      marginBottom: SPACING.space_8,
    },
    date: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.primaryOrangeHex,
      marginBottom: SPACING.space_12,
    },
    description: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      marginBottom: SPACING.space_12,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: SPACING.space_8,
    },
    closeButton: {
      marginHorizontal: SPACING.space_16,
      marginTop: SPACING.space_8,
      backgroundColor: COLORS.secondaryDarkGreyHex,
      paddingVertical: SPACING.space_12,
      borderRadius: BORDERRADIUS.radius_10,
      alignItems: 'center',
    },
    closeText: {
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_14,
    },
  });