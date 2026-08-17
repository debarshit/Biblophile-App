import React, { createContext, useContext, useRef, useCallback } from 'react';
import { Animated, NativeSyntheticEvent, NativeScrollEvent, Easing, Platform } from 'react-native';

interface TabBarScrollContextType {
  tabBarTranslateY: Animated.Value;
  tabBarScale: Animated.Value;
  tabBarOpacity: Animated.Value;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  showTabBar: () => void;
  hideTabBar: () => void;
}

const TabBarScrollContext = createContext<TabBarScrollContextType | null>(null);

export const TabBarScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;
  const tabBarScale = useRef(new Animated.Value(1)).current;
  const tabBarOpacity = useRef(new Animated.Value(1)).current;
  const isVisibleRef = useRef(true);
  const lastScrollY = useRef(0);

  const showTabBar = useCallback(() => {
    if (Platform.OS !== 'ios') return;
    if (isVisibleRef.current) return;
    isVisibleRef.current = true;
    Animated.parallel([
      Animated.timing(tabBarTranslateY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(tabBarScale, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(tabBarOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [tabBarTranslateY, tabBarScale, tabBarOpacity]);

  const hideTabBar = useCallback(() => {
    if (Platform.OS !== 'ios') return;
    if (!isVisibleRef.current) return;
    isVisibleRef.current = false;
    Animated.parallel([
      Animated.timing(tabBarTranslateY, {
        toValue: 10,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(tabBarScale, {
        toValue: 0.85,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(tabBarOpacity, {
        toValue: 0.6,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [tabBarTranslateY, tabBarScale, tabBarOpacity]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (Platform.OS !== 'ios') return;
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;

      const contentHeight = event.nativeEvent.contentSize.height;
      const layoutHeight = event.nativeEvent.layoutMeasurement.height;

      if (currentY <= 15) {
        showTabBar();
      } else if (currentY + layoutHeight >= contentHeight - 15) {
        showTabBar();
      } else if (diff > 8 && currentY > 50) {
        hideTabBar();
      } else if (diff < -8) {
        showTabBar();
      }

      lastScrollY.current = currentY;
    },
    [showTabBar, hideTabBar]
  );

  return (
    <TabBarScrollContext.Provider
      value={{
        tabBarTranslateY,
        tabBarScale,
        tabBarOpacity,
        onScroll,
        showTabBar,
        hideTabBar,
      }}
    >
      {children}
    </TabBarScrollContext.Provider>
  );
};

export const useTabBarScroll = () => {
  const context = useContext(TabBarScrollContext);
  const fallbackAnimY = useRef(new Animated.Value(0)).current;
  const fallbackAnimScale = useRef(new Animated.Value(1)).current;
  const fallbackAnimOpacity = useRef(new Animated.Value(1)).current;

  if (!context) {
    return {
      tabBarTranslateY: fallbackAnimY,
      tabBarScale: fallbackAnimScale,
      tabBarOpacity: fallbackAnimOpacity,
      onScroll: () => {},
      showTabBar: () => {},
      hideTabBar: () => {},
    };
  }
  return context;
};