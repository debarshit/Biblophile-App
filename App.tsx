import React, {useEffect, useState} from 'react';
import { Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
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
import StreaksScreen from './src/features/readingInsights/screens/StreaksScreen';
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

const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Streaks: {
        path: 'streak/:action',
        parse: {
          action: (action) => `${action}`,
        },
      },
      Details: {
        path: 'details/:action',
        parse: {
          action: (action) => `${action}`,
          productId: (id) => `${id}`,
          productType: (type) => `${type}`,
        },
      },
      Payment: {
        path: 'payment/:action',
        parse: {
          action: (action) => `${action}`,
        },
      },
    },
  },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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
  // useEffect(() => {
  //   initialize("qysqkgnhfy");
  // }, []);

  //check for OTA updates start
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync(); 
        }
      } catch (e) {
        console.log(e);
      }
    };

    checkForUpdates();
  }, []);
  //check for OTA updates end

  //check for appstores update and implement accordingly start
  const checkForAppUpdate = async () => {
    try {
      // Fetch the latest version from own server
      const response = await fetch('https://biblophile.com/apis/prod/appInfo/appVersion.php');
      const data = await response.json();
      const latestVersion = data.latestVersion;

      // Compare the latest version with the current app version
      if (latestVersion !== currentVersion) {
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
    if (Platform.OS === 'ios') {
      Linking.openURL('itms-apps://itunes.apple.com/app/idYOUR_APP_ID');
    } else {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.debar_shit.BiblophileApp');
    }
  };

  useEffect(() => {
    checkForAppUpdate();
  }, [currentVersion]);
  //check for appstores update and implement accordingly end

  // for expo notifications start
  useEffect(() => {
    registerForPushNotificationsAsync();
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data.urlScheme;
      if (url) {
        Linking.openURL(url);
      }
    });
  
    return () => subscription.remove();
  }, []);

  async function registerForPushNotificationsAsync() {
    try {
      // Check existing permissions
      let { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('Existing permission status:', existingStatus);

      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('New permission status:', finalStatus);
      }

      // Handle permissions
      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!');
        return;
      }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: "1c34706d-2df8-4c6b-939c-9e3f1e5185d3",  //project id copied from app.json
    })).data;
    console.log(token);

    // Configure Android-specific settings
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (error) {
    console.error('Error in registering for push notifications:', error);
    // Alert.alert('Error in registering for push notifications!');
  }
  }
  // for expo notifications end

  //temporarily clear out all prev notifications start
  useEffect(() => {
    Notifications.cancelAllScheduledNotificationsAsync();
  }, []);
  //temporarily clear out all prev notifications end

  if (!fontsLoaded) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{animation: 'slide_from_bottom'}}></Stack.Screen>
          <Stack.Screen
            name="SignupLogin"
            component={SignupLogin}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
          <Stack.Screen
            name="Resources"
            component={ResourceScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  else {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen
            name="Tab"
            component={TabNavigator}
            options={{animation: 'slide_from_bottom'}}></Stack.Screen>
          <Stack.Screen
            name="Streaks"
            component={StreaksScreen}
            options={{animation: 'slide_from_bottom'}}></Stack.Screen>
          <Stack.Screen
            name="Stats"
            component={StatScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
          <Stack.Screen
            name="Library"
            component={LibraryScreen}
            options={{animation: 'slide_from_bottom'}}></Stack.Screen>
            <Stack.Screen
            name="Discover"
            component={DiscoverScreen}
            options={{animation: 'slide_from_bottom'}}></Stack.Screen>
            <Stack.Screen
            name="Shop"
            component={LibraryScreen}
            options={{animation: 'slide_from_bottom'}}></Stack.Screen>
          <Stack.Screen
            name="Details"
            component={DetailsScreen}
            options={{animation: 'slide_from_bottom'}}></Stack.Screen>
          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{animation: 'slide_from_bottom'}}></Stack.Screen>
          <Stack.Screen
            name="PaymentGateway"
            component={PaymentGatewayScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
          <Stack.Screen
            name="Resources"
            component={ResourceScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
          <Stack.Screen
            name="Review"
            component={ReviewScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
          <Stack.Screen
            name="Note"
            component={NotesScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
          <Stack.Screen
            name="Durations"
            component={DurationTrackScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
          <Stack.Screen
            name="ProfileSummary"
            component={ProfileSummaryScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
            <Stack.Screen
            name="Social"
            component={SocialScreen}
            options={{animation: 'slide_from_bottom'}}></Stack.Screen>
            <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
            <Stack.Screen
            name="History"
            component={OrderHistoryScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
            <Stack.Screen
            name="CommonWebView"
            component={CommonWebViewScreen}
            options={{animation: 'slide_from_bottom'}}></Stack.Screen>
            <Stack.Screen
            name="BookListScreen"
            component={BookListScreen}
            options={{animation: 'slide_from_bottom'}}></Stack.Screen>
            <Stack.Screen
            name="GenreScreen"
            component={GenreScreen}
            options={{animation: 'slide_from_bottom'}}></Stack.Screen>
            <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    );
  }
};

export default App;
