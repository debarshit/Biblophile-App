import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';

import {
  BORDERRADIUS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import requests from '../../../services/requests';
import instance from '../../../services/axios';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';

interface AIItem {
  title: string;
  author: string;
  reason: string;
}

// --- Skeleton Pulse Card ---
const SkeletonCard = ({ COLORS }: { COLORS: any }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: 200,
          borderRadius: BORDERRADIUS.radius_15,
          backgroundColor: COLORS.secondaryDarkGreyHex,
          padding: SPACING.space_16,
          marginRight: SPACING.space_15,
          minHeight: 170,
          opacity,
        },
      ]}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: COLORS.primaryGreyHex,
          marginBottom: SPACING.space_12,
        }}
      />
      <View
        style={{
          height: 14,
          borderRadius: 7,
          backgroundColor: COLORS.primaryGreyHex,
          marginBottom: SPACING.space_8,
          width: '85%',
        }}
      />
      <View
        style={{
          height: 12,
          borderRadius: 6,
          backgroundColor: COLORS.primaryGreyHex,
          marginBottom: SPACING.space_12,
          width: '55%',
        }}
      />
      <View
        style={{
          height: 10,
          borderRadius: 5,
          backgroundColor: COLORS.primaryGreyHex,
          marginBottom: SPACING.space_4,
          width: '100%',
        }}
      />
      <View
        style={{
          height: 10,
          borderRadius: 5,
          backgroundColor: COLORS.primaryGreyHex,
          marginBottom: SPACING.space_4,
          width: '90%',
        }}
      />
      <View
        style={{
          height: 10,
          borderRadius: 5,
          backgroundColor: COLORS.primaryGreyHex,
          width: '70%',
        }}
      />
    </Animated.View>
  );
};

// --- Individual AI Book Card ---
const AIBookCard = ({
  item,
  onPress,
  COLORS,
}: {
  item: AIItem;
  onPress: () => void;
  COLORS: any;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: 200,
        borderRadius: BORDERRADIUS.radius_15,
        backgroundColor: COLORS.secondaryDarkGreyHex,
        padding: SPACING.space_16,
        marginRight: SPACING.space_15,
        borderWidth: 1,
        borderColor: 'rgba(209,120,66,0.18)',
      }}
    >
      {/* Sparkle icon */}
      <Text style={{ fontSize: 20, marginBottom: SPACING.space_10 }}>✨</Text>

      {/* Title */}
      <Text
        numberOfLines={2}
        style={{
          fontFamily: FONTFAMILY.poppins_semibold,
          fontSize: FONTSIZE.size_14,
          color: COLORS.primaryWhiteHex,
          marginBottom: SPACING.space_4,
          lineHeight: 20,
        }}
      >
        {item.title}
      </Text>

      {/* Author */}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: FONTFAMILY.poppins_regular,
          fontSize: FONTSIZE.size_12,
          color: COLORS.primaryLightGreyHex,
          marginBottom: SPACING.space_10,
        }}
      >
        {item.author}
      </Text>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.07)',
          marginBottom: SPACING.space_10,
        }}
      />

      {/* AI Reason */}
      <Text
        numberOfLines={3}
        style={{
          fontFamily: FONTFAMILY.poppins_light,
          fontSize: FONTSIZE.size_12,
          color: COLORS.secondaryLightGreyHex,
          fontStyle: 'italic',
          lineHeight: 18,
        }}
      >
        {item.reason}
      </Text>
    </TouchableOpacity>
  );
};

// --- Main Component ---
const AIRecommendationsSection = () => {
  const [items, setItems] = useState<AIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const navigation = useNavigation<any>();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  // Badge pulse for "Updated 48h"
  const badgeOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeOpacity, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
        Animated.timing(badgeOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [badgeOpacity]);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const response = await instance.get(requests.fetchAIRecommendations);
        const data = response.data?.data?.items;
        if (data && data.length > 0) {
          setItems(data);
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error('Error fetching AI recommendations:', error);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, []);

  // Hide section entirely if there's no data
  if (!loading && (hasError || items.length === 0)) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Premium Gemini-styled header */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <Text style={styles.sparkleIcon}>✨</Text>
            <View>
              <Text style={styles.headerTitle}>AI Picks for You</Text>
              <Text style={styles.headerSubtitle}>
                Curated by Gemini, tailored to your taste
              </Text>
            </View>
          </View>

          {/* "Updated 48h" badge */}
          <Animated.View style={[styles.updatedBadge, { opacity: badgeOpacity }]}>
            <Text style={styles.updatedBadgeText}>Updated 48h</Text>
          </Animated.View>
        </View>

        {/* Subtle glow line */}
        <View style={styles.glowLine} />
      </View>

      {/* Cards */}
      {loading ? (
        <View style={styles.skeletonRow}>
          {[1, 2, 3].map((key) => (
            <SkeletonCard key={key} COLORS={COLORS} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item.title}-${index}`}
          renderItem={({ item }) => (
            <AIBookCard
              item={item}
              COLORS={COLORS}
              onPress={() => navigation.navigate('SearchScreen')}
            />
          )}
          contentContainerStyle={styles.flatListContainer}
        />
      )}
    </View>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      marginVertical: SPACING.space_20,
    },
    headerWrapper: {
      marginHorizontal: SPACING.space_30,
      marginBottom: SPACING.space_18,
    },
    headerInner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_10,
      flex: 1,
    },
    sparkleIcon: {
      fontSize: 26,
    },
    headerTitle: {
      fontFamily: FONTFAMILY.poppins_bold,
      fontSize: FONTSIZE.size_20,
      color: COLORS.primaryWhiteHex,
      letterSpacing: 0.3,
    },
    headerSubtitle: {
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      color: COLORS.primaryLightGreyHex,
      marginTop: 1,
    },
    updatedBadge: {
      backgroundColor: 'rgba(209,120,66,0.18)',
      borderRadius: BORDERRADIUS.radius_10,
      paddingHorizontal: SPACING.space_8,
      paddingVertical: SPACING.space_4,
      borderWidth: 1,
      borderColor: 'rgba(209,120,66,0.35)',
    },
    updatedBadgeText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_10,
      color: COLORS.primaryOrangeHex,
    },
    glowLine: {
      marginTop: SPACING.space_12,
      height: 1,
      borderRadius: 1,
      backgroundColor: 'rgba(209,120,66,0.25)',
    },
    flatListContainer: {
      paddingLeft: SPACING.space_30,
      paddingRight: SPACING.space_15,
    },
    skeletonRow: {
      flexDirection: 'row',
      paddingLeft: SPACING.space_30,
      paddingRight: SPACING.space_15,
    },
  });

export default AIRecommendationsSection;