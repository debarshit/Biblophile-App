import React, { useMemo, useState } from 'react';
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
import { useTheme } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const userDetails = useStore((state: any) => state.userDetails);
  const username = userDetails[0].userUniqueUserName;
  const profilePic = userDetails[0].profilePic;
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
    
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

const createStyles = (COLORS) => StyleSheet.create({
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

// import React, { useMemo, useState } from 'react';
// import { StyleSheet, Image, Platform, View } from 'react-native';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { MaterialIcons, FontAwesome, Entypo } from '@expo/vector-icons';
// import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
// import { BlurView } from 'expo-blur';
// import { SPACING } from '../theme/theme';
// import HomeScreen from '../features/discover/screens/HomeScreen';
// import DiscoverScreen from '../features/discover/screens/DiscoverScreen';
// import ChallengesScreen from '../features/challenges/screens/ChallengesScreen';
// import SocialScreen from '../features/social/screens/SocialScreen';
// import ProfileSummaryScreen from '../features/profile/screens/ProfileSummaryScreen';
// import { useStore } from '../store/store';
// import { useTheme } from '../contexts/ThemeContext';

// const Tab = createBottomTabNavigator();

// const TabNavigator = () => {
//   const [activeTab, setActiveTab] = useState('Home');
//   const userDetails = useStore((state: any) => state.userDetails);
//   const username = userDetails[0].userUniqueUserName;
//   const profilePic = userDetails[0].profilePic;
//   const { COLORS } = useTheme();
//   const styles = useMemo(() => createStyles(COLORS), [COLORS]);

//   const useLiquidGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarHideOnKeyboard: true,
//         headerShown: false,
//         tabBarShowLabel: true,
//         tabBarStyle: styles.tabBarStyle,
//         tabBarLabelStyle: styles.tabBarLabelStyle,
//         // We set this to true so the screens render edge-to-edge behind our floating capsule
//         extendsToInvertedSafeAreaEdges: true, 
//         tabBarBackground: () => {
//           if (useLiquidGlass) {
//             return (
//               <GlassView
//                 glassEffectStyle="clear"  // 'clear' style gives that ultra-vibrant, magnified lens characteristic
//                 colorScheme="auto"
//                 isInteractive={true}      // Crucial: handles real-time parallax glints as the user moves the device
//                 style={styles.glassViewStyles}
//               />
//             );
//           }
//           return (
//             <BlurView
//               intensity={30}
//               style={styles.blurViewStyles}
//               tint="dark"
//             />
//           );
//         },
//       }}
//       screenListeners={{
//         tabPress: (e) => {
//           const tabName = e.target?.split('-')[0];
//           setActiveTab(tabName);
//         },
//       }}>
//       <Tab.Screen
//         name="Home"
//         component={HomeScreen}
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <MaterialIcons
//               name="home"
//               size={24}
//               color={focused ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
//             />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Discover"
//         component={DiscoverScreen}
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <MaterialIcons
//               name="travel-explore"
//               size={24}
//               color={focused ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
//             />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Challenges"
//         component={ChallengesScreen}
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <Entypo
//               name="medal"
//               size={24}
//               color={focused ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
//             />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Social"
//         component={SocialScreen}
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <FontAwesome
//               name="group"
//               size={24}
//               color={focused ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
//             />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Profile"
//         component={ProfileSummaryScreen}
//         initialParams={{ username: username }}
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <Image
//               source={{ uri: profilePic }}
//               style={[
//                 styles.profilePic,
//                 { borderColor: focused ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex },
//               ]}
//             />
//           ),
//         }}
//       />
//     </Tab.Navigator>
//   );
// };

// const createStyles = (COLORS) => StyleSheet.create({
//   tabBarStyle: {
//     // 1. Exact dimensions & Floating layout positions
//     position: 'absolute',
//     height: 66,
//     left: 20,
//     right: 20,
//     bottom: Platform.OS === 'ios' ? 34 : 20, // Hover clear of the home indicator bar
    
//     // 2. Clear out standard system baselines
//     backgroundColor: 'transparent',
//     borderTopWidth: 0,
//     elevation: 0,
    
//     // 3. Apple Capsule Geometry
//     borderRadius: 33, // Half of height ensures a clean stadium shape capsule
//     overflow: 'hidden', // Forces the internal GlassView to clip seamlessly to the rounded corners
    
//     // 4. Subtle native dimension definition
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.08)',
//   },
//   tabBarLabelStyle: {
//     fontSize: 10,
//     fontWeight: '600',
//     marginBottom: 8,
//     color: COLORS.primaryWhiteHex,
//   },
//   glassViewStyles: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     borderRadius: 33,
//   },
//   blurViewStyles: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     borderRadius: 33,
//     backgroundColor: 'rgba(20, 20, 20, 0.4)', // Ensures high contrast on Android fallbacks
//   },
//   profilePic: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     borderWidth: 1.5,
//     marginTop: 2,
//   },
// });

// export default TabNavigator;