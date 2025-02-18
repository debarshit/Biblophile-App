import React, { useState } from 'react';
import {StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import { MaterialIcons, FontAwesome5, FontAwesome, Entypo } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {COLORS} from '../theme/theme';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SocialScreen from '../screens/SocialScreen';
import ChallengesScreen from '../screens/ChallengesScren';
import ProfileSummaryScreen from '../screens/settings/ProfileSummaryScreen';
import { useStore } from '../store/store';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const userDetails = useStore((state: any) => state.userDetails);
  const username = userDetails[0].userUniqueUserName;
    
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBarStyle,
        tabBarBackground: () => (
          <BlurView
            intensity={15}
            style={styles.BlurViewStyles}
          />
        ),
      }}
      screenListeners={{
        tabPress: (e) => {
          const tabName = e.target?.split('-')[0];
          setActiveTab(tabName);
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <MaterialIcons
              name="home"
              size={25}
              color={
                focused ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex
              }
            />
          ),
        }}></Tab.Screen>
      <Tab.Screen
          name="Shop"
          component={LibraryScreen}
          options={{
            tabBarIcon: ({focused, color, size}) => (
              <Entypo
                name="shop"
                size={25}
                color={
                  focused ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex
                }
              />
            ),
          }}></Tab.Screen>
        <Tab.Screen
          name="Challenges"
          component={ChallengesScreen}
          options={{
            tabBarIcon: ({focused, color, size}) => (
              <Entypo
                name="medal"
                size={25}
                color={
                  focused ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex
                }
              />
            ),
          }}></Tab.Screen>
        <Tab.Screen
          name="Social"
          component={SocialScreen}
          options={{
            tabBarIcon: ({focused, color, size}) => (
              <FontAwesome
                name="group"
                size={25}
                color={
                  focused ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex
                }
              />
            ),
          }}></Tab.Screen>
        <Tab.Screen
          name="Bookshelf"
          component={ProfileSummaryScreen}
          initialParams={{ username: username }}
          options={{
            tabBarIcon: ({focused, color, size}) => (
              <FontAwesome5
                name="book-reader"
                size={30}
                color={
                  focused ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex
                }
              />
            ),
          }}></Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarStyle: {
    height: 80,
    position: 'absolute',
    backgroundColor: COLORS.primaryBlackHex,
    borderTopWidth: 0,
    elevation: 0,
    borderTopColor: 'transparent',
  },
  BlurViewStyles: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default TabNavigator;
