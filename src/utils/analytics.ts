import { usePostHog } from 'posthog-react-native';
import analytics from '@react-native-firebase/analytics';

export interface Item {
  item_id: string
  item_name: string
  item_category?: string
  item_list_name?: string
  price: number
  quantity: number
}

interface PurchaseData {
  transaction_id: string
  value: number
  currency?: string
  items: Item[]
}

export const useAnalytics = () => {
  const posthog = usePostHog();

  return {
    // --- User identity management ---
    identifyUser: async (userId: string, traits: Record<string, any> = {}) => {
      // Firebase: Set user ID and properties
      await analytics().setUserId(userId);
      for (const [key, value] of Object.entries(traits)) {
        await analytics().setUserProperty(key, String(value));
      }
      posthog?.identify(userId, traits)
    },

    resetUser: async () => {
      await analytics().resetAnalyticsData();
      posthog?.reset()
    },

    // --- User lifecycle events ---
    signup: async (method: string = 'email') => {
      await analytics().logSignUp({ method });
      posthog?.capture('signup', { method })
    },

    login: async (method: string = 'email') => {
      await analytics().logLogin({ method });
      posthog?.capture('login', { method })
    },

    // --- Business events ---
    purchase: async ({ transaction_id, value, currency = 'INR', items }: PurchaseData) => {
      // Firebase: Uses a strictly typed logPurchase method
      await analytics().logPurchase({
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
      })
    },

    // --- Utility ---
    track: async (event: string, properties: Record<string, any> = {}) => {
      // Firebase handles IDFV automatically
      await analytics().logEvent(event, properties);
      // PostHog captures standard event data
      posthog?.capture(event, properties);
    },
  }
}