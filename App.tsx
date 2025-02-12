import React, {useEffect, useState} from 'react';
import { Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import * as Font from 'expo-font';
import {useStore} from './src/store/store';
import TabNavigator from './src/navigators/TabNavigator';
import DetailsScreen from './src/screens/DetailsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ResourceScreen from './src/screens/settings/ResourceScreen';
import SignupLogin from './src/screens/SignupLogin';
import ProfileScreen from './src/screens/settings/ProfileScreen';
import SubscriptionScreen from './src/screens/settings/SubscriptionScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PaymentGatewayScreen from './src/screens/PaymentGatewayScreen';
import StreaksScreen from './src/screens/StreaksScreen';
import StatScreen from './src/screens/StatScreen';
import AboutScreen from './src/screens/settings/AboutScreen';
import ReviewScreen from './src/screens/settings/ReviewScreen';
import ProfileSummaryScreen from './src/screens/settings/ProfileSummaryScreen';
import NotesScreen from './src/screens/settings/NotesScreen';
import DurationTrackScreen from './src/screens/settings/DurationTrackScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import SocialScreen from './src/screens/SocialScreen';
import CartScreen from './src/screens/CartScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import CommonWebViewScreen from './src/screens/CommonWebViewScreen';

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
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    );
  }
};

export default App;
