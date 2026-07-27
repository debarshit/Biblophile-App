import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { FONTFAMILY } from '../theme/theme';

interface UserDisplayProps {
  username: string; // The unique username for navigation (required)
  name?: string; // Display name
  avatarUrl?: string; // Profile picture URL
  size?: 'small' | 'medium' | 'large';
  layout?: 'row' | 'column' | 'avatar-only' | 'text-only';
  showUsername?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

const AVATAR_COLORS = [
  { bg: '#E0F2FE', text: '#0369A1' }, // sky blue
  { bg: '#FEE2E2', text: '#B91C1C' }, // red
  { bg: '#FEF3C7', text: '#B45309' }, // amber
  { bg: '#ECFDF5', text: '#047857' }, // emerald
  { bg: '#F3E8FF', text: '#6D28D9' }, // purple
  { bg: '#FCE7F3', text: '#BE185D' }, // pink
];

export const UserDisplay: React.FC<UserDisplayProps> = ({
  username,
  name,
  avatarUrl,
  size = 'medium',
  layout = 'row',
  showUsername = false,
  style,
  textStyle,
  children,
}) => {
  const navigation = useNavigation<any>();
  const { COLORS } = useTheme();

  const handlePress = () => {
    if (username) {
      navigation.push('ProfileSummary', { username });
    }
  };

  const displayName = name || username || 'User';

  const initials = useMemo(() => {
    if (!displayName) return '?';
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return displayName.charAt(0).toUpperCase();
  }, [displayName]);

  const avatarColor = useMemo(() => {
    const code = displayName.charCodeAt(0) ?? 0;
    return AVATAR_COLORS[code % AVATAR_COLORS.length];
  }, [displayName]);

  const dimensions = useMemo(() => {
    switch (size) {
      case 'small':
        return { avatar: 24, fontSizeName: 12, fontSizeUser: 10, gap: 6 };
      case 'large':
        return { avatar: 60, fontSizeName: 16, fontSizeUser: 13, gap: 12 };
      case 'medium':
      default:
        return { avatar: 40, fontSizeName: 14, fontSizeUser: 11, gap: 8 };
    }
  }, [size]);

  const renderedAvatar = () => {
    if (layout === 'text-only') return null;

    if (avatarUrl && avatarUrl.trim() !== '') {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: dimensions.avatar,
            height: dimensions.avatar,
            borderRadius: dimensions.avatar / 2,
          }}
        />
      );
    }

    return (
      <View
        style={[
          styles.avatarFallback,
          {
            width: dimensions.avatar,
            height: dimensions.avatar,
            borderRadius: dimensions.avatar / 2,
            backgroundColor: avatarColor.bg,
          },
        ]}
      >
        <Text style={[styles.avatarFallbackText, { color: avatarColor.text, fontSize: dimensions.fontSizeName - 1 }]}>
          {initials}
        </Text>
      </View>
    );
  };

  const renderedText = () => {
    if (layout === 'avatar-only') return null;

    return (
      <View style={layout === 'column' ? styles.textCol : styles.textRow}>
        <Text
          style={[
            styles.nameText,
            { color: COLORS.primaryWhiteHex, fontSize: dimensions.fontSizeName },
            textStyle,
          ]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        {showUsername && username && (
          <Text
            style={[
              styles.usernameText,
              { color: COLORS.secondaryLightGreyHex, fontSize: dimensions.fontSizeUser },
            ]}
            numberOfLines={1}
          >
            @{username}
          </Text>
        )}
        {children}
      </View>
    );
  };

  if (layout === 'text-only') {
    return (
      <Text
        style={[
          styles.nameText,
          { color: COLORS.primaryWhiteHex, fontSize: dimensions.fontSizeName },
          textStyle,
        ]}
        onPress={handlePress}
      >
        {displayName}
      </Text>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[
        layout === 'column' ? styles.containerCol : styles.containerRow,
        { gap: dimensions.gap },
        style,
      ]}
    >
      {renderedAvatar()}
      {renderedText()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  containerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontFamily: 'Poppins-Bold',
  },
  textRow: {
    justifyContent: 'center',
  },
  textCol: {
    alignItems: 'center',
    marginTop: 4,
  },
  nameText: {
    fontFamily: 'Poppins-SemiBold',
  },
  usernameText: {
    fontFamily: 'Poppins-Regular',
    marginTop: 1,
  },
});

export default UserDisplay;