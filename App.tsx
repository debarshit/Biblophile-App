import React, {useEffect, useState} from 'react';
import { PostHogProvider } from 'posthog-react-native'
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { notificationService } from './src/utils/notificationUtils';
import { initialize } from '@microsoft/react-native-clarity';
import * as Font from 'expo-font';
import {useStore} from './src/store/store';
import TabNavigator from './src/navigators/TabNavigator';
import DetailsScreen from './src/features/discover/screens/DetailsScreen';
import PaymentScreen from './src/features/payment/screens/PaymentScreen';
import SettingsScreen from './src/features/settings/screens/SettingsScreen';
import ResourceScreen from './src/features/settings/screens/ResourceScreen';
import SignupLogin from './src/features/onboarding/screens/SignupLogin';
import ProfileScreen from './src/features/profile/screens/ProfileScreen';
import SubscriptionScreen from './src/features/bookshop/screens/SubscriptionScreen';
import OnboardingScreen from './src/features/onboarding/screens/OnboardingScreen';
import PaymentGatewayScreen from './src/features/payment/screens/PaymentGatewayScreen';
import StatScreen from './src/features/readingInsights/screens/StatScreen';
import AboutScreen from './src/features/settings/screens/AboutScreen';
import ReviewScreen from './src/features/reading/components/UserReviews';
import ProfileSummaryScreen from './src/features/profile/screens/ProfileSummaryScreen';
import NotesScreen from './src/features/reading/screens/NotesScreen';
import DurationTrackScreen from './src/features/reading/screens/DurationTrackScreen';
import LibraryScreen from './src/features/bookshop/screens/LibraryScreen';
import SocialScreen from './src/features/social/screens/SocialScreen';
import CartScreen from './src/features/bookshop/screens/CartScreen';
import OrderHistoryScreen from './src/features/bookshop/screens/OrderHistoryScreen';
import CommonWebViewScreen from './src/features/discover/screens/CommonWebViewScreen';
import BookListScreen from './src/features/reading/screens/BookListScreen';
import DiscoverScreen from './src/features/discover/screens/DiscoverScreen';
import GenreScreen from './src/features/discover/screens/GenreScreen';
import NotificationsScreen from './src/features/settings/screens/NotificationsScreen';
import ChallengeDetailsScreen from './src/features/challenges/screens/ChallengeDetailsScreen';
import BuddyReadsDetails from './src/features/social/screens/BuddyReadsDetails';
import BuddyReadsCreate from './src/features/social/screens/BuddyReadsCreate';
import ReadAlongsCreate from './src/features/social/screens/ReadAlongsCreate';
import ReadAlongDetails from './src/features/social/screens/ReadAlongDetails';
import CreateReadalongCheckpoint from './src/features/social/screens/CreateReadalongCheckpoint';
import { CityProvider } from './src/contexts/CityContext';
import SearchScreen from './src/features/discover/screens/SearchScreen';
import CreateBookClubScreen from './src/features/social/screens/BookClubsCreate';
import BookClubDetailsScreen from './src/features/social/screens/BookClubDetails';
import NotificationSettingsScreen from './src/features/settings/screens/NotificationSettingsScreen';
import SubmitReviewScreen from './src/features/discover/screens/SubmitReviewScreen';
import { linking } from './src/utils/deepLinking/linking';
import { navigationRef } from './src/utils/deepLinking/navigationRef';
import { navigateFromUrl } from './src/utils/deepLinking/deepLinking';
import MonthlyWrapScreen from './src/features/readingInsights/screens/MonthlyWrapScreen';
import ChallengeScreen from './src/features/challenges/screens/ChallengesScreen';
import AddWorkScreen from './src/features/discover/screens/AddWorkScreen';
import EditionsScreen from './src/features/discover/screens/EditionsScreen';
import AddEditionScreen from './src/features/discover/screens/AddEditionScreen';
import ReadalongCheckpointDiscussion from './src/features/social/screens/ReadalongDiscussionScreen';
import ChallengePromptDetailsScreen from './src/features/challenges/screens/ChallengePromptDetailsScreen';

const Stack = createNativeStackNavigator();

const poppins = {
  'Poppins-Black': require('./src/assets/fonts/Poppins-Black.ttf'),
  'Poppins-Bold': require('./src/assets/fonts/Poppins-Bold.ttf'),
  'Poppins-ExtraBold': require('./src/assets/fonts/Poppins-ExtraBold.ttf'),
  'Poppins-ExtraLight': require('./src/assets/fonts/Poppins-ExtraLight.ttf'),
  'Poppins-Light': require('./src/assets/fonts/Poppins-Light.ttf'),
  'Poppins-Medium': require('./src/assets/fonts/Poppins-Medium.ttf'),
  'Poppins-SemiBold': require('./src/assets/fonts/Poppins-SemiBold.ttf'),
  'Poppins-Regular': require('./src/assets/fonts/Poppins-Regular.ttf'),
  'Poppins-Thin': require('./src/assets/fonts/Poppins-Thin.ttf'),
};

const App = () => {
  const isAuthenticated = useStore((state: any) => state.isAuthenticated);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(Constants.manifest2?.extra?.expoClient?.version);

  useEffect(() => {
    async function loadFontsAsync() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await Font.loadAsync(poppins);
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Error loading custom fonts', error);
      }
    }

    loadFontsAsync();
  }, []);

  useEffect(() => {
    const url = Linking.createURL('streak/');
    console.log(url); //delete this once streak screen is completed
  }, []);

  // Initialize Microsoft Clarity for analytics
  useEffect(() => {
    initialize("qysqkgnhfy");
  }, []);

  //check for OTA updates - silent update on next launch
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          // Silently fetch and download the update in the background
          await Updates.fetchUpdateAsync();
          // The update will be applied on the next app launch automatically
          // Alert.alert(
          //   'Update Available',
          //   'We’ve made some improvements. Restart now to update?',
          //   [
          //     { text: 'Later', style: 'cancel' },
          //     { text: 'Restart', onPress: () => Updates.reloadAsync() },
          //   ]
          // );
          console.log('Update downloaded and will be applied on next launch');
        }
      } catch (e) {
        console.log('Error checking for OTA updates:', e);
      }
    };

    checkForUpdates();
  }, []);
  //check for OTA updates end

  //check for appstores update and implement accordingly start
  const isNewerVersion = (latest, current) => {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);

    for (let i = 0; i < latestParts.length; i++) {
      if (latestParts[i] > currentParts[i]) return true;
      if (latestParts[i] < currentParts[i]) return false;
    }
    return false; // equal
  };

  const checkForAppUpdate = async () => {
    try {
      // Fetch the latest version from own server
      const response = await fetch('https://biblophile.com/apis/prod/appInfo/appVersion.php');
      const data = await response.json();
      const latestVersion = data.latestVersion;

      // Compare the latest version with the current app version
      if (isNewerVersion(latestVersion, currentVersion)) {
        Alert.alert(
          'Update Available',
          'A new version of the app is available. Please update to the latest version.',
          [
            { text: 'Update', onPress: openStore },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking for update:', error);
    }
  };

  const openStore = () => {
    Linking.openURL('https://onelink.to/dxjdkb');
  };

  useEffect(() => {
    checkForAppUpdate();
  }, [currentVersion]);
  //check for appstores update and implement accordingly end

  // for expo notifications start
  // Initialize notification service
  useEffect(() => {
    async function initializeNotifications() {
      try {
        await notificationService.initialize();
        console.log('Notification service initialized');
      } catch (error) {
        console.error('Error initializing notification service:', error);
      }
    }

    initializeNotifications();
  }, []);

  //handle deep links on app launch
  useEffect(() => {
    linking.getInitialURL().then((url) => {
      if (url) {
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          navigateFromUrl(url);
        }, 100);
      }
    });
  }, []);

  // Handle deep links while app is running
  useEffect(() => {
    const subscription = linking.subscribe((url) => {
      navigateFromUrl(url);
    });

    return () => subscription();
  }, []);

  // Handle notification responses

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data.urlScheme;
      if (url) {
        navigateFromUrl(url as string);
      }
    });

    return () => subscription.remove();
  }, []);
  // for expo notifications end

  //temporarily clear out all prev notifications start
  useEffect(() => {
    notificationService.cancelAllNotifications();
  }, []);
  //temporarily clear out all prev notifications end

  if (!fontsLoaded) {
    return null;
  }

  const posthogOptions = {
    host: "https://us.i.posthog.com",
    captureApplicationLifecycleEvents: true,
    captureInAppPurchases: false,
    captureDeepLinks: true,
    captureScreenViews: true,
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <PostHogProvider
        apiKey="phc_FSNgN6xgRp56gSFZVhNVr0PWaPthNY3VjRRc8H6IUFo"
        options={posthogOptions}
      >
        {isAuthenticated ? (
          <CityProvider>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Tab" component={TabNavigator} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="Stats" component={StatScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="Library" component={LibraryScreen} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="Discover" component={DiscoverScreen} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="SearchScreen" component={SearchScreen} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="Shop" component={LibraryScreen} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="Details" component={DetailsScreen} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="Payment" component={PaymentScreen} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="PaymentGateway" component={PaymentGatewayScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="Resources" component={ResourceScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="About" component={AboutScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="Profile" component={ProfileScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="Review" component={ReviewScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="Note" component={NotesScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="Durations" component={DurationTrackScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="ProfileSummary" component={ProfileSummaryScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="Social" component={SocialScreen} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="Cart" component={CartScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="History" component={OrderHistoryScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="CommonWebView" component={CommonWebViewScreen} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="BookListScreen" component={BookListScreen} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="GenreScreen" component={GenreScreen} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="ChallengeDetails" component={ChallengeDetailsScreen} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="ChallengePromptDetails" component={ChallengePromptDetailsScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="BuddyReadsDetails" component={BuddyReadsDetails} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="BuddyReadsCreate" component={BuddyReadsCreate} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="ReadAlongsCreate" component={ReadAlongsCreate} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="ReadalongDetails" component={ReadAlongDetails} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="ReadalongCheckpointDiscussion" component={ReadalongCheckpointDiscussion} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="CreateReadalongCheckpoint" component={CreateReadalongCheckpoint} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="CreateBookClub" component={CreateBookClubScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="BookClubDetails" component={BookClubDetailsScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="SubmitReview" component={SubmitReviewScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="MonthlyWrap" component={MonthlyWrapScreen} options={{animation: 'slide_from_bottom'}} />
              <Stack.Screen name="AddWork" component={AddWorkScreen} options={{animation: 'slide_from_bottom'}} />
              {/* can be removed safely after the challengeBanner removed from HomeScreen */}
              <Stack.Screen name="Challenges" component={ChallengeScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="Editions" component={EditionsScreen} options={{animation: 'slide_from_right'}} />
              <Stack.Screen name="AddEdition" component={AddEditionScreen} options={{animation: 'slide_from_bottom'}} />

            </Stack.Navigator>
          </CityProvider>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{animation: 'slide_from_bottom'}} />
            <Stack.Screen name="SignupLogin" component={SignupLogin} options={{animation: 'slide_from_right'}} />
            <Stack.Screen name="Resources" component={ResourceScreen} options={{animation: 'slide_from_right'}} />
          </Stack.Navigator>
        )}
        <Toast />
      </PostHogProvider>
    </NavigationContainer>
  );
};

export default App;