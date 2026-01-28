import React, { useState } from 'react';
import {StyleSheet, Image, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import { MaterialIcons, FontAwesome5, FontAwesome, Entypo } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {COLORS, SPACING} from '../theme/theme';
import HomeScreen from '../features/discover/screens/HomeScreen';
import LibraryScreen from '../features/bookshop/screens/LibraryScreen';
import SocialScreen from '../features/social/screens/SocialScreen';
import ChallengesScreen from '../features/challenges/screens/ChallengesScreen';
import ProfileSummaryScreen from '../features/profile/screens/ProfileSummaryScreen';
import { useStore } from '../store/store';
import DiscoverScreen from '../features/discover/screens/DiscoverScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const userDetails = useStore((state: any) => state.userDetails);
  const username = userDetails[0].userUniqueUserName;
  const profilePic = userDetails[0].profilePic;
    
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBarStyle,
        tabBarLabelStyle: styles.tabBarLabelStyle,
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
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({focused, color, size}) => (
            <MaterialIcons
              name="travel-explore"
              size={25}
              color={
                focused ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex
              }
            />
          ),
        }}></Tab.Screen>
      {/* <Tab.Screen
          name="Library"
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
          }}></Tab.Screen> */}
        {/* <Tab.Screen
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
          }}></Tab.Screen> */}
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
        name="Profile"
        component={ProfileSummaryScreen}
        initialParams={{ username: username }}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Image
              source={{ uri: profilePic }}
              style={[
                styles.profilePic,
                { borderColor: focused ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex },
              ]}
            />
          ),
        }}></Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarStyle: {
    height:  Platform.OS === 'ios' ? 80 : 60,
    position: 'absolute',
    backgroundColor: COLORS.primaryBlackHex,
    borderTopWidth: 0,
    elevation: 0,
    borderTopColor: 'transparent',
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: SPACING.space_4,
    color: COLORS.primaryWhiteHex,
  },
  BlurViewStyles: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  profilePic: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
  },
});

export default TabNavigator;
