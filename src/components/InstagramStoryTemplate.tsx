import React, { forwardRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE } from '../theme/theme';

const { width, height } = Dimensions.get('window');

// Instagram story aspect ratio (9:16)
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

interface InstagramStoryTemplateProps {
  image?: string;
  title: string;
  message: string;
}

const InstagramStoryTemplate = forwardRef<View, InstagramStoryTemplateProps>(
  ({ image, title, message }, ref) => {
    return (
      <View ref={ref} style={styles.container}>
        {/* Background image */}
        {image && (
          <Image
            source={{ uri: image }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        )}

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Branding */}
          <View style={styles.footer}>
            <Text style={styles.brand}>biblophile</Text>
          </View>
        </View>
      </View>
    );
  }
);

export default InstagramStoryTemplate;

const styles = StyleSheet.create({
  container: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    backgroundColor: COLORS.primaryDarkGreyHex,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 80,
    justifyContent: 'space-between',
  },
  content: {
    marginTop: 300,
  },
  title: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: 64,
    color: COLORS.primaryWhiteHex,
    marginBottom: 24,
  },
  message: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: 42,
    color: COLORS.primaryWhiteHex,
    lineHeight: 56,
  },
  footer: {
    alignItems: 'center',
    opacity: 0.85,
  },
  brand: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: 28,
    letterSpacing: 2,
    color: COLORS.primaryWhiteHex,
    textTransform: 'uppercase',
  },
});