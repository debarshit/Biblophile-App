import React from 'react';
import { View, StyleSheet, useWindowDimensions, Dimensions } from 'react-native';

/**
 * Synchronous check to determine if the current device is a tablet based on screen dimensions.
 * Using 500 dp threshold to cover smaller 7-inch Android tablets.
 */
export const isTabletDevice = (): boolean => {
  const { width, height } = Dimensions.get('window');
  return Math.min(width, height) >= 500;
};

/**
 * Reactive hook to get device size and tablet-optimized dimensions.
 * Combines a 500 dp dimension threshold with landscape orientation checking.
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 500;
  const isLandscape = width > height;
  const showSidebar = isTablet && isLandscape;

  // Set sidebar width to 100 to comfortably fit labels like "Challenges" on a single line
  const sidebarWidth = showSidebar ? 100 : 0;
  const contentMaxWidth = showSidebar ? 850 : undefined;
  
  return {
    isTablet,
    isLandscape,
    showSidebar,
    sidebarWidth,
    contentMaxWidth,
    width,
    height,
  };
};

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: any;
}

/**
 * Layout helper wrapper to automatically center and limit content width on tablet.
 * Active only when the left sidebar navigation rail is active.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ children, style }) => {
  const { showSidebar } = useResponsive();

  return (
    <View style={[
      styles.container,
      showSidebar && styles.tabletContainer,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabletContainer: {
    maxWidth: 850,
    alignSelf: 'center',
  },
});
