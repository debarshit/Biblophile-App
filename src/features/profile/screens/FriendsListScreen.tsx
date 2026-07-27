import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import UserDisplay from '../../../components/UserDisplay';

interface Friend {
  userId: number;
  userName: string;
  name: string;
  userProfilePic: string;
}

const ITEMS_PER_PAGE = 15;

const FriendsListScreen = ({ navigation, route }: any) => {
  const { pageOwnerId, profileName } = route.params;
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFriends = async (page: number = 0, isLoadMore: boolean = false) => {
    if (isLoadMore && !hasMoreData) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const offset = page * ITEMS_PER_PAGE;
      const response = await instance.get(requests.fetchFriendsList(pageOwnerId), {
        params: {
          limit: ITEMS_PER_PAGE,
          offset: offset,
        },
      });

      if (response.status === 200) {
        const fetchedFriends = response.data.data?.friends || [];
        const totalCount = response.data.data?.totalCount || 0;

        if (isLoadMore) {
          setFriends((prev) => [...prev, ...fetchedFriends]);
        } else {
          setFriends(fetchedFriends);
        }

        setHasMoreData(friends.length + fetchedFriends.length < totalCount && fetchedFriends.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Failed to fetch friends list:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFriends(0, false);
    setCurrentPage(0);
  }, [pageOwnerId]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMoreData && friends.length > 0) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchFriends(nextPage, true);
    }
  }, [loadingMore, hasMoreData, friends, currentPage]);

  const handleRefresh = () => {
    setCurrentPage(0);
    fetchFriends(0, false);
  };

  // Filter friends based on search query locally
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.userName.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendRow}>
      <UserDisplay
        username={item.userName}
        name={item.name}
        avatarUrl={item.userProfilePic}
        size="medium"
        showUsername={true}
        style={{ flex: 1 }}
      />
      <Feather name="chevron-right" size={18} color={COLORS.secondaryLightGreyHex} />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={22} color={COLORS.primaryWhiteHex} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {profileName ? `${profileName}'s Friends` : 'Friends'}
        </Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Feather name="search" size={16} color={COLORS.secondaryLightGreyHex} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          placeholderTextColor={COLORS.secondaryLightGreyHex}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={16} color={COLORS.secondaryLightGreyHex} />
          </TouchableOpacity>
        )}
      </View>

      {/* Friends List */}
      {loading && currentPage === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
        </View>
      ) : filteredFriends.length === 0 ? (
        <View style={styles.centerContainer}>
          <Feather name="users" size={48} color={COLORS.secondaryLightGreyHex} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No friends match search query' : 'No friends found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.userId.toString()}
          renderItem={renderFriendItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={loading && currentPage === 0}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.space_16,
      paddingVertical: SPACING.space_12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.primaryDarkGreyHex,
    },
    backButton: {
      padding: SPACING.space_4,
    },
    headerTitle: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    headerRightPlaceholder: {
      width: 26,
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primaryDarkGreyHex,
      margin: SPACING.space_16,
      paddingHorizontal: SPACING.space_12,
      paddingVertical: SPACING.space_8,
      borderRadius: BORDERRADIUS.radius_10,
    },
    searchIcon: {
      marginRight: SPACING.space_8,
    },
    searchInput: {
      flex: 1,
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.primaryWhiteHex,
      padding: 0,
    },
    listContent: {
      paddingHorizontal: SPACING.space_16,
      paddingBottom: SPACING.space_24,
    },
    friendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.space_12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.primaryDarkGreyHex,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.space_32,
    },
    emptyText: {
      color: COLORS.secondaryLightGreyHex,
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_medium,
      textAlign: 'center',
    },
    footerLoader: {
      paddingVertical: SPACING.space_16,
      alignItems: 'center',
    },
  });

export default FriendsListScreen;