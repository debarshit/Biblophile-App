import React, { forwardRef } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { COLORS, FONTFAMILY } from '../theme/theme';

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
      <View
        ref={ref}
        collapsable={false}
        renderToHardwareTextureAndroid={false}
        needsOffscreenAlphaCompositing
        style={styles.container}
      >
        {/* Blurred background */}
        <ImageBackground
          source={image ? { uri: image } : undefined}
          style={styles.background}
          resizeMode="cover"
          blurRadius={image ? 18 : 0}
        >
          <View style={styles.overlay}>
            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              {/* Clear image card */}
              {image && (
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: image }}
                    style={styles.clearImage}
                    resizeMode="cover"
                  />
                </View>
                )}
            </View>

            {/* Branding */}
            <View style={styles.footer}>
              <Text style={styles.brand}>biblophile</Text>
            </View>
          </View>
        </ImageBackground>
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

  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)', // keeps text readable
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
    marginBottom: 48,
  },

  /* Clear image card */
  imageWrapper: {
    alignItems: 'center',
  },

  clearImage: {
    width: 760/1.5,
    height: 760,
    borderRadius: 32,
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