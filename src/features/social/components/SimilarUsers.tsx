import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimilarUser {
  userId: number;
  userName: string;
  userEmail: string;
  userProfilePic?: string;
  matchScore?: number;
  sharedWorks?: number;
}

// ─── User Row Component ──────────────────────────────────────────────────────

interface UserRowProps {
  user: SimilarUser;
  COLORS: any;
  styles: any;
  onPress: () => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, COLORS, styles, onPress }) => {
  const picUri = user.userProfilePic ? convertHttpToHttps(user.userProfilePic) : null;
  const hasScore = user.matchScore !== undefined && user.matchScore > 0;
  const pct = hasScore ? Math.round(user.matchScore! * 100) : null;

  return (
    <TouchableOpacity style={styles.rowItem} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      {picUri ? (
        <Image source={{ uri: picUri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Feather name="user" size={20} color={COLORS.secondaryLightGreyHex} />
        </View>
      )}

      {/* Info elements */}
      <View style={styles.infoContainer}>
        <Text style={styles.username} numberOfLines={1}>@{user.userName}</Text>
        {user.sharedWorks !== undefined && user.sharedWorks > 0 ? (
          <Text style={styles.metaText}>📚 {user.sharedWorks} books in common</Text>
        ) : (
          <Text style={styles.metaText} numberOfLines={1}>{user.userEmail}</Text>
        )}
      </View>

      {/* Optional Badge Indicator */}
      {pct && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pct}% match</Text>
        </View>
      )}
      
      <Feather name="chevron-right" size={16} color={COLORS.secondaryLightGreyHex} style={styles.arrow} />
    </TouchableOpacity>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SimilarUsers: React.FC = () => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const navigation = useNavigation<any>();

  const [usersList, setUsersList] = useState<SimilarUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchSimilarUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await instance.get(requests.fetchSimilarUsers);
      setUsersList(res.data.data ?? []);
    } catch (err) {
      setError('Could not update recommendations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSimilarUsers();
  }, [fetchSimilarUsers]);

  const handleRefresh = useCallback(() => fetchSimilarUsers(true), [fetchSimilarUsers]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSimilarUsers()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (usersList.length === 0) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[COLORS.primaryOrangeHex]}
          tintColor={COLORS.primaryOrangeHex}
        />
      }
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.title}>Discover Similar Readers</Text>
      </View>

      <View style={styles.listWrapper}>
        {usersList.map(user => (
          <UserRow
            key={user.userId}
            user={user}
            COLORS={COLORS}
            styles={styles}
            onPress={() => navigation.push('ProfileSummary', { username: user.userName })}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default SimilarUsers;

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
    },
    scrollContent: {
      paddingHorizontal: SPACING.space_16,
      paddingTop: SPACING.space_12,
      paddingBottom: SPACING.space_24,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 180,
    },
    sectionHeader: {
      marginBottom: SPACING.space_12,
    },
    title: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
    },
    listWrapper: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_15,
      overflow: 'hidden',
    },
    rowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.space_12,
      paddingHorizontal: SPACING.space_16,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.primaryGreyHex,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: SPACING.space_12,
    },
    avatarFallback: {
      backgroundColor: COLORS.primaryGreyHex,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    username: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      marginBottom: 2,
    },
    metaText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
    },
    badge: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      paddingHorizontal: SPACING.space_8,
      paddingVertical: 4,
      borderRadius: BORDERRADIUS.radius_4,
      marginRight: SPACING.space_4,
    },
    badgeText: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryOrangeHex,
    },
    arrow: {
      marginLeft: SPACING.space_4,
    },
    errorText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.secondaryLightGreyHex,
      marginBottom: SPACING.space_12,
    },
    retryBtn: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: BORDERRADIUS.radius_8,
    },
    retryText: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
  });