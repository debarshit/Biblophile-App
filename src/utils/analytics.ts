import { usePostHog } from 'posthog-react-native'

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
    identifyUser: (userId: string, traits: Record<string, any> = {}) => {
      posthog?.identify(userId, traits)
    },

    resetUser: () => {
      posthog?.reset()
    },

    // --- User lifecycle events ---
    signup: (method: string = 'email') => {
      posthog?.capture('signup', { method })
    },

    login: (method: string = 'email') => {
      posthog?.capture('login', { method })
    },

    // --- Business events ---
    purchase: ({ transaction_id, value, currency = 'INR', items }: PurchaseData) => {
      posthog?.capture('purchase', {
        transaction_id,
        value,
        currency,
        items: items as any,
      })
    },

    // --- Utility ---
    track: (event: string, properties: Record<string, any> = {}) => {
      posthog?.capture(event, properties)
    },
  }
}