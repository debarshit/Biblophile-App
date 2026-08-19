import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Image,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { MaterialIcons, FontAwesome, Entypo } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, SPACING } from '../theme/theme';
import HomeScreen from '../features/discover/screens/HomeScreen';
import DiscoverScreen from '../features/discover/screens/DiscoverScreen';
import ChallengesScreen from '../features/challenges/screens/ChallengesScreen';
import SocialScreen from '../features/social/screens/SocialScreen';
import ProfileSummaryScreen from '../features/profile/screens/ProfileSummaryScreen';
import { useStore } from '../store/store';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassBackground } from '../components/GlassEffect';
import {
  TabBarScrollProvider,
  useTabBarScroll,
} from '../contexts/TabBarScrollContext';
import { useResponsive } from '../utils/responsive';

const Tab = createBottomTabNavigator();

interface TabButtonProps {
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  icon: React.ReactNode;
  COLORS: any;
  inactiveColor: string;
  isTablet: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({
  label,
  isFocused,
  onPress,
  onLongPress,
  icon,
  COLORS,
  inactiveColor,
  isTablet,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      style={isTablet ? styles.tabItemContainerTablet : styles.tabItemContainer}
    >
      {icon}
      <Text
        style={[
          isTablet ? styles.tabLabelTablet : styles.tabLabel,
          {
            color: isFocused
              ? COLORS.primaryOrangeHex
              : inactiveColor,
            fontWeight: isFocused ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const CustomGlassTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { COLORS, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { showSidebar } = useResponsive();
  const { tabBarTranslateY, tabBarScale, tabBarOpacity, showTabBar } = useTabBarScroll();

  const [tabBarInnerWidth, setTabBarInnerWidth] = useState(0);
  const activeIndex = state.index;
  
  const bubbleTranslateX = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);

  const handleInnerLayout = (e: any) => {
    setTabBarInnerWidth(e.nativeEvent.layout.width);
  };

  const tabWidth = tabBarInnerWidth ? (tabBarInnerWidth - 12) / state.routes.length : 0;

  // Track page navigation changes when not dragging (for phone)
  useEffect(() => {
    if (!showSidebar && tabWidth > 0 && !isDragging.current) {
      Animated.spring(bubbleTranslateX, {
        toValue: activeIndex * tabWidth,
        damping: 18,
        stiffness: 140,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
    }
  }, [activeIndex, tabWidth, showSidebar]);

  const isDark = scheme === 'dark';
  const backingColor = isDark ? 'rgba(15, 17, 22, 0.72)' : 'rgba(255, 255, 255, 0.82)';
  const tabBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
  const glassTint = isDark ? 'dark' : 'light';
  const bubbleBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)';
  const bubbleBorder = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)';
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.45)';

  const getClampedX = (pageX: number) => {
    const relativeX = pageX - 22; // 16 container margin + 6 padding
    const halfBubble = tabWidth / 2;
    const targetX = relativeX - halfBubble;
    const maxTranslate = (tabBarInnerWidth - 12) - tabWidth;
    return Math.max(0, Math.min(targetX, maxTranslate));
  };

  const handleGesture = (pageX: number) => {
    const relativeX = pageX - 22; // 16 container margin + 6 padding
    const buttonsAreaW = tabBarInnerWidth - 12;
    const index = Math.floor((relativeX / buttonsAreaW) * state.routes.length);
    if (index >= 0 && index < state.routes.length) {
      const route = state.routes[index];
      if (state.index !== index) {
        navigation.navigate(route.name);
      }
    }
  };

  const handleTouchStart = (e: any) => {
    showTabBar();
    isDragging.current = true;
    
    // Fade in bubble quickly
    Animated.timing(bubbleOpacity, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();

    const pageX = e.nativeEvent.pageX;
    const targetX = getClampedX(pageX);
    bubbleTranslateX.setValue(targetX);
    handleGesture(pageX);
  };

  const handleTouchMove = (e: any) => {
    if (!isDragging.current) return;
    const pageX = e.nativeEvent.pageX;
    const targetX = getClampedX(pageX);
    
    // Move bubble strictly under user's finger in real-time
    bubbleTranslateX.setValue(targetX);
    handleGesture(pageX);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    
    // Smoothly snap to final tab index and fade out
    Animated.parallel([
      Animated.spring(bubbleTranslateX, {
        toValue: state.index * tabWidth,
        damping: 18,
        stiffness: 140,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 180,
        delay: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      onTouchStart={showSidebar ? undefined : handleTouchStart}
      onTouchMove={showSidebar ? undefined : handleTouchMove}
      onTouchEnd={showSidebar ? undefined : handleTouchEnd}
      onTouchCancel={showSidebar ? undefined : handleTouchEnd}
      style={[
        showSidebar ? styles.tabBarContainerTablet : styles.tabBarContainer,
        {
          borderColor: tabBorderColor,
          ...(!showSidebar && {
            bottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 22) : 16,
            transform: [
              { translateY: tabBarTranslateY },
              { scale: tabBarScale }
            ],
            opacity: tabBarOpacity,
          }),
          ...(showSidebar && {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
            paddingLeft: Math.max(insets.left, 8),
          })
        },
      ]}
    >
      {/* Semi-translucent background card to ensure text/icon readability */}
      <View style={[StyleSheet.absoluteFillObject, { 
        backgroundColor: backingColor, 
        borderTopRightRadius: showSidebar ? 24 : 34, 
        borderBottomRightRadius: showSidebar ? 24 : 34,
        borderTopLeftRadius: showSidebar ? 0 : 34,
        borderBottomLeftRadius: showSidebar ? 0 : 34
      }]} />

      <GlassBackground
        glassStyle="clear"
        isInteractive={true}
        intensity={35}
        tint={glassTint}
      />
      <View style={showSidebar ? styles.tabBarInnerTablet : styles.tabBarInner} onLayout={showSidebar ? undefined : handleInnerLayout}>
        {/* Sliding Bubble Indicator is only rendered on mobile phone (non-sidebar) mode */}
        {!showSidebar && tabWidth > 0 && (
          <Animated.View
            style={[
              styles.bubbleIndicator,
              {
                width: tabWidth - 6,
                transform: [{ translateX: bubbleTranslateX }],
                opacity: bubbleOpacity,
                backgroundColor: bubbleBg,
                borderColor: bubbleBorder,
                shadowColor: COLORS.primaryOrangeHex,
                height: Platform.OS === 'ios' ? 52 : 46,
                top: Platform.OS === 'ios' ? 7 : 7,
              },
            ]}
          />
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label =
            options.tabBarLabel !== undefined
              ? (options.tabBarLabel as string)
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const icon = options.tabBarIcon
            ? options.tabBarIcon({
                focused: isFocused,
                color: isFocused
                  ? COLORS.primaryOrangeHex
                  : inactiveColor,
                size: showSidebar ? 26 : 24,
              })
            : null;

          return (
            <TabButton
              key={route.key}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              icon={icon}
              COLORS={COLORS}
              inactiveColor={inactiveColor}
              isTablet={showSidebar}
            />
          );
        })}
      </View>
    </Animated.View>
  );
};

const TabNavigatorContent = () => {
  const userDetails = useStore((state: any) => state.userDetails);
  const username = userDetails[0]?.userUniqueUserName;
  const profilePic = userDetails[0]?.profilePic;
  const { COLORS, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { showSidebar, sidebarWidth } = useResponsive();

  const isIos = Platform.OS === 'ios';
  const isDark = scheme === 'dark';
  const showCustomTabBar = isIos || showSidebar;

  return (
    <Tab.Navigator
      tabBar={showCustomTabBar ? (props) => <CustomGlassTabBar {...props} /> : undefined}
      sceneContainerStyle={{
        paddingLeft: showSidebar ? sidebarWidth : 0,
        backgroundColor: COLORS.primaryBlackHex,
      }}
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarStyle: !showCustomTabBar
          ? {
              height: 60 + insets.bottom,
              backgroundColor: COLORS.primaryBlackHex,
              borderTopWidth: 0,
              elevation: 0,
            }
          : { display: 'none' },
        tabBarActiveTintColor: COLORS.primaryOrangeHex,
        tabBarInactiveTintColor: COLORS.primaryLightGreyHex,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialIcons
              name="home"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialIcons
              name="travel-explore"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Entypo
              name="medal"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Social"
        component={SocialScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <FontAwesome
              name="group"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileSummaryScreen}
        initialParams={{ username: username }}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={{ uri: profilePic }}
              style={[
                styles.profilePic,
                {
                  borderColor: focused
                    ? COLORS.primaryOrangeHex
                    : isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)',
                },
              ]}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const TabNavigator = () => {
  return (
    <TabBarScrollProvider>
      <TabNavigatorContent />
    </TabBarScrollProvider>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    height: Platform.OS === 'ios' ? 68 : 62,
    left: 16,
    right: 16,
    backgroundColor: 'transparent',
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  tabBarContainerTablet: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  tabBarInner: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    position: 'relative',
  },
  tabBarInnerTablet: {
    flexDirection: 'column',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    position: 'relative',
  },
  tabItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    zIndex: 1,
  },
  tabItemContainerTablet: {
    width: 88,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FONTFAMILY.poppins_medium,
    marginTop: 2,
  },
  tabLabelTablet: {
    fontSize: 10,
    fontFamily: FONTFAMILY.poppins_medium,
    marginTop: 4,
    textAlign: 'center',
  },
  profilePic: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  bubbleIndicator: {
    position: 'absolute',
    left: 9,
    borderRadius: 26,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 0,
  },
  bubbleIndicatorTablet: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 0,
  },
});

export default TabNavigator;