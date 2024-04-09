import React, {useEffect, useState} from 'react';
import * as SplashScreen from 'expo-splash-screen';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import * as Font from 'expo-font';
import {useStore} from './src/store/store';
import TabNavigator from './src/navigators/TabNavigator';
import DetailsScreen from './src/screens/DetailsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ResourceScreen from './src/screens/settings/ResourceScreen';
import SignupLogin from './src/screens/SignupLogin';

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

  if (!fontsLoaded) {
    return null;
  }


  if (!isAuthenticated) {
    return (
      <SignupLogin />
    );
  }
  else {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen
            name="Tab"
            component={TabNavigator}
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
            name="Settings"
            component={SettingsScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
            <Stack.Screen
            name="Resources"
            component={ResourceScreen}
            options={{animation: 'slide_from_right'}}></Stack.Screen>
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    );
  }
};

export default App;
