import React, {useEffect} from 'react';
import * as SplashScreen from 'expo-splash-screen';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useStore} from './src/store/store';
import TabNavigator from './src/navigators/TabNavigator';
import DetailsScreen from './src/screens/DetailsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ResourceScreen from './src/screens/settings/ResourceScreen';
import SignupLogin from './src/screens/SignupLogin';

const Stack = createNativeStackNavigator();

const App = () => {
  const user = useStore((state: any) => state.user);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (user == null) {
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
      </NavigationContainer>
    );
  }
};

export default App;
