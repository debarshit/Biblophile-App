// utils/share.ts
import Share, { ShareSingleOptions, ShareOptions, Social } from 'react-native-share';
import * as viewShot from 'react-native-view-shot';

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
  image?: string;
  url?: string;
  backgroundImage?: string; // Base64 for IG Stories bg
}

export interface ShareConfig {
  platform: SharePlatform;
  content: ShareContent;
  screenshotRef?: any;
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
      case 'instagram-stories': {
        if (!screenshotRef) {
          throw new Error('Instagram Stories requires screenshotRef');
        }

        const base64 = await viewShot.default.captureRef(screenshotRef, {
          format: 'png',
          quality: 0.9,
          result: 'base64',
        });

        const image = `data:image/png;base64,${base64}`;

        await Share.shareSingle({
          appId: META_APP_ID,
          social: Social.InstagramStories,
          backgroundImage: image,
          attributionURL: content.url,
        });

        break;
      }

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
          message: `${content.message}`,
          url: content.url || content.image,
          social: Social.Twitter,
        };
        await Share.shareSingle(shareOptions as ShareSingleOptions);
        break;

      case 'whatsapp':
        shareOptions = {
          title: content.title,
          message: content.message,
          url: content.url ?? content.image,
          social: Social.Whatsapp,
        };
        await Share.shareSingle(shareOptions as ShareSingleOptions);
        break;

      case 'facebook':
        shareOptions = {
          title: content.title,
          message: content.message,
          url: content.url ?? content.image,
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
          url: content.url,
        };
        await Share.open(shareOptions);
        break;
    }
  } catch (error) {
    console.error('Error sharing:', error);
    throw error;
  }
}