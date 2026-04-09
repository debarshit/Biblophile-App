import * as Linking from 'expo-linking';

const prefixes = [
  Linking.createURL('/'),
  'https://biblophile.com',
  'biblophile://',
];

const config = {
  screens: {
    Stats: {
      path: ':type(streak|readingStreaks)/:action?',
      parse: { action: (action: string) => `${action}` },
    },
    Details: {
      path: 'books/:type/:id/:title?',
      parse: {
        id: (id: string) => `${id}`,
        type: (type: string) => `${type}`,
      },
    },
    History: {
      path: 'dashboard/orders',
    },
    SubmitReview: {
      path: 'books/Book/:bookId/:title?/review-form',
      parse: {
        bookId: (id: string) => parseInt(id, 10),
        isGoogleBook: false,
      },
    },
    Payment: {
      path: 'payment/:action?',
      parse: { action: (action: string) => `${action}` },
    },
    ChallengeDetails: {
      path: 'challenges/:challengeId/:challengeTitle?',
      parse: {
        challengeId: (id: string) => parseInt(id, 10),
      },
    },
    BuddyReadsDetails: {
      path: 'social/buddy-reads/:buddyReadId',
      parse: {
        buddyReadId: (id: string) => parseInt(id, 10),
      },
    },
    ReadalongDetails: {
      path: 'social/readalong/:readalongId',
      parse: {
        readalongId: (id: string) => parseInt(id, 10),
      },
    },
    Library: {
      path: 'city/:citySlug/:type?/:id?',
      parse: {
        type: (type: string) => `${type}`, // places | events
        id: (id: string) => `${id}`,
      },
    },
    Resources: {
      path: ':*', // The asterisk acts as a wildcard
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
