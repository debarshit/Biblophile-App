import { usePostHog } from 'posthog-react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperty,
  resetAnalyticsData,
} from '@react-native-firebase/analytics';

export interface Item {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_list_name?: string;
  price: number;
  quantity: number;
}

interface PurchaseData {
  transaction_id: string;
  value: number;
  currency?: string;
  items: Item[];
}

export const useAnalytics = () => {
  const posthog = usePostHog();
  const analytics = getAnalytics(getApp());
  const isDevelopment = __DEV__;

  return {
    // --- User identity management ---
    identifyUser: async (userId: string, traits: Record<string, any> = {}) => {
      if (isDevelopment) {
        return;
      }
      await Promise.all([
        setUserId(analytics, userId),
        ...Object.entries(traits).map(([key, value]) =>
          setUserProperty(analytics, key, String(value))
        ),
      ]);

      posthog?.identify(userId, traits);
    },

    resetUser: async () => {
      if (isDevelopment) {
        console.log('[Analytics Dev] Reset user session');
        return;
      }
      await resetAnalyticsData(analytics);
      posthog?.reset();
    },

    // --- User lifecycle events ---
    signup: async (method: string = 'email') => {
      if (isDevelopment) {
        return;
      }
      await logEvent(analytics, 'sign_up', { method });
      posthog?.capture('signup', { method });
    },

    login: async (method: string = 'email') => {
      if (isDevelopment) {
        return;
      }
      await logEvent(analytics, 'login', { method });
      posthog?.capture('login', { method });
    },

    // --- Business events ---
    purchase: async ({ transaction_id, value, currency = 'INR', items }: PurchaseData) => {
      if (isDevelopment) {
        return;
      }
      await logEvent(analytics, 'purchase', {
        transaction_id,
        value,
        currency,
        items: items as any,
      });

      posthog?.capture('purchase', {
        transaction_id,
        value,
        currency,
        items: items as any,
      });
    },

    // --- Utility ---
    track: async (event: string, properties: Record<string, any> = {}) => {
      if (isDevelopment) {
        return;
      }
      await logEvent(analytics, event, properties);
      posthog?.capture(event, properties);
    },
  };
};