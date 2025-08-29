import * as Linking from 'expo-linking';
import { navigationRef } from './navigationRef';

const prefixes = [
  Linking.createURL('/'),
  'https://biblophile.com',
  'biblophile://',
];

const config = {
  screens: {
    Streaks: {
      path: 'streaks/:action?',
      parse: { action: (action: string) => `${action}` },
    },
    Details: {
      path: 'books/:type/:id/:title?',
      parse: {
        id: (id: string) => `${id}`,
        type: (type: string) => `${type}`,
      },
    },
    Payment: {
      path: 'payment/:action?',
      parse: { action: (action: string) => `${action}` },
    },
  },
};

export const linking = {
  prefixes,
  config,
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    return url;
  },
  subscribe(listener: (url: string) => void) {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });
    return () => subscription.remove();
  },
};
