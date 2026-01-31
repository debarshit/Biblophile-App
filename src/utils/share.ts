// utils/share.ts
import Share, { ShareSingleOptions, ShareOptions, Social } from 'react-native-share';
import * as viewShot from 'react-native-view-shot';
import { Platform } from 'react-native';

const META_APP_ID = '1899922437581251'; // Your Facebook App ID for Instagram Stories

export type SharePlatform = 
  | 'native' 
  | 'instagram-stories' 
  | 'bluesky' 
  | 'x' 
  | 'threads'
  | 'whatsapp'
  | 'facebook';

export interface ShareContent {
  title: string;
  message: string;
  image?: string; // Local image URI or remote URL
  url?: string; // App deep link or store URL
  backgroundImage?: string; // Base64 for IG Stories bg
}

export interface ShareConfig {
  platform: SharePlatform;
  content: ShareContent;
  screenshotRef?: any; // react-native-view-shot ref for custom screenshot
}

export const SHARE_PLATFORMS = [
  {
    id: 'instagram-stories' as SharePlatform,
    name: 'Instagram Stories',
    icon: 'instagram',
    requiresImage: true,
  },
  {
    id: 'x' as SharePlatform,
    name: 'X (Twitter)',
    icon: 'twitter',
    requiresImage: false,
  },
//   {
//     id: 'threads' as SharePlatform,
//     name: 'Threads',
//     icon: 'threads',
//     requiresImage: false,
//   },
  {
    id: 'whatsapp' as SharePlatform,
    name: 'WhatsApp',
    icon: 'whatsapp',
    requiresImage: false,
  },
  {
    id: 'facebook' as SharePlatform,
    name: 'Facebook',
    icon: 'facebook',
    requiresImage: false,
  },
  {
    id: 'bluesky' as SharePlatform,
    name: 'Bluesky',
    icon: 'cloud',
    requiresImage: false,
  },
];

export async function shareToplatform(config: ShareConfig): Promise<void> {
  const { platform, content, screenshotRef } = config;

  let shareOptions: ShareOptions | ShareSingleOptions;

  try {
    switch (platform) {
      case 'instagram-stories':
        // Capture screenshot if ref provided or use provided image
        const uri = screenshotRef 
          ? await viewShot.default.captureRef(screenshotRef, { format: 'png', quality: 1 })
          : content.image;

        if (!uri) throw new Error('Image required for Instagram Stories');

        shareOptions = {
          appId: META_APP_ID,
          social: Social.InstagramStories,
          stickerImage: uri,
          backgroundTopColor: '#FF6B6B', // Biblophile-themed gradients
          backgroundBottomColor: '#4ECDC4',
          attributionURL: content.url,
        };
        await Share.shareSingle(shareOptions as ShareSingleOptions);
        break;

      case 'bluesky':
        shareOptions = {
          title: content.title,
          message: `${content.message}\n\n${content.url || ''}`,
          url: content.image || content.url,
        };
        // Bluesky may need custom handling or fallback to native
        await Share.open(shareOptions);
        break;

      case 'x':
        shareOptions = {
          title: content.title,
          message: `${content.message}\n\n${content.url || ''}`,
          url: content.image || content.url,
          social: Social.Twitter,
        };
        await Share.shareSingle(shareOptions as ShareSingleOptions);
        break;

      case 'whatsapp':
        shareOptions = {
          title: content.title,
          message: content.message,
          url: content.image || content.url,
          social: Social.Whatsapp,
        };
        await Share.shareSingle(shareOptions as ShareSingleOptions);
        break;

      case 'facebook':
        shareOptions = {
          title: content.title,
          message: content.message,
          url: content.url || content.image,
          social: Social.Facebook,
        };
        await Share.shareSingle(shareOptions as ShareSingleOptions);
        break;

      case 'native':
      default:
        // Universal native sheet for all available apps
        shareOptions = {
          title: content.title,
          message: content.message,
          url: content.image || content.url,
        };
        await Share.open(shareOptions);
        break;
    }
  } catch (error) {
    console.error('Error sharing:', error);
    throw error;
  }
}