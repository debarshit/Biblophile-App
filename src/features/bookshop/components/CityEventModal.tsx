import React, { useMemo } from 'react';
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
import { useTheme } from '../../../contexts/ThemeContext';
import {
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../../../theme/theme';
import { useAnalytics } from '../../../utils/analytics';

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

    analytics.track('event_modal_share', {
      event_id: event.id,
      title: event.title,
    });

    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(
      `Check this bookish event 👇\n\n${event.title}\n${url}`
    )}`);
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
            {/* 📸 Image */}
            {event.photo && (
              <Image
                source={{ uri: event.photo }}
                style={styles.image}
                resizeMode="cover"
              />
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

              {/* ⚡ Actions */}
              <View style={styles.actions}>
                {event.registrationLink && (
                  <TouchableOpacity onPress={openRegistration}>
                    <Text style={styles.link}>🎟 Register</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={addToCalendar}>
                  <Text style={styles.link}>📅 Add to Calendar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={shareEvent}>
                  <Text style={styles.link}>📤 Share Event</Text>
                </TouchableOpacity>
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
    title: {
      fontSize: FONTSIZE.size_20,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      marginBottom: SPACING.space_4,
    },
    type: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      textTransform: 'capitalize',
      marginBottom: SPACING.space_4,
    },
    location: {
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryLightGreyHex,
      marginBottom: SPACING.space_4,
    },
    date: {
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryOrangeHex,
      marginBottom: SPACING.space_12,
    },
    description: {
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryWhiteHex,
      lineHeight: FONTSIZE.size_20,
      marginBottom: SPACING.space_16,
    },
    actions: {
      gap: SPACING.space_10,
    },
    link: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryOrangeHex,
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