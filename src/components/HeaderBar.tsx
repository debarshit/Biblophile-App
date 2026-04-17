import React, { useEffect, useMemo, useState } from 'react';
import {StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import { useStore } from '../store/store';
import Ionicons from '@expo/vector-icons/Ionicons';
import GradientBGIcon from './GradientBGIcon';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderBarProps {
  title?: string;
  showBackButton?: boolean;
  showLogo?: boolean;
  showNotifications?: boolean;
  showUsername?: boolean;
  rightComponent?: React.ReactNode;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  showBackButton,
  showLogo = false,
  showNotifications = false,
  showUsername = false,
  rightComponent,
}) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const navigation = useNavigation<any>();  
  const userDetails = useStore((state: any) => state.userDetails);
  const unreadNotificationCount = useStore(
    (state) => state.unreadNotificationCount
  );

  const fetchUnreadNotificationCount = useStore(
    (state) => state.fetchUnreadNotificationCount
  );

  const BackHandler = () => {
    if (navigation.canGoBack()) {
      navigation.pop();
    } else {
      navigation.navigate('Tab');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (showNotifications) {
        fetchUnreadNotificationCount();
      }
    }, [])
  );

  return (
    <View style={styles.HeaderContainer}>
      {showBackButton ? (
        <TouchableOpacity onPress={BackHandler} style={{ marginTop: -20 }}>
          <GradientBGIcon
            name="left"
            color={COLORS.primaryLightGreyHex}
            size={FONTSIZE.size_16}
          />
        </TouchableOpacity>
      ) : showLogo ? (
        <Image
          source={{
            uri: "https://ik.imagekit.io/umjnzfgqh/biblophile/common_assets/logos/Biblophile%20logo%20-%20white.png",
          }}
          style={styles.Image}
        />
      ) : (
        <View style={{ width: SPACING.space_36 }} /> // placeholder to balance layout
      )}

      {title ? (
        <Text style={styles.HeaderText}>{title}</Text>
      ) : showUsername && userDetails?.[0]?.userName ? (
        <Text style={styles.HeaderText}>{userDetails[0].userName}</Text>
      ) : (
        <View />
      )}

      {rightComponent ? (
        rightComponent
      ) : showNotifications ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={{ position: 'relative' }}
        >
          <Ionicons name="notifications" size={24} color={COLORS.primaryWhiteHex} />

          {unreadNotificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}
    </View>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  HeaderContainer: {
    padding: SPACING.space_30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  HeaderText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  Image: {
    height: SPACING.space_36,
    width: SPACING.space_36,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },

  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default HeaderBar;