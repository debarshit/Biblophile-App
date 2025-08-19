import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../../../theme/theme';
import BuddyReadCard from '../components/BuddyReadCard';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface BuddyRead {
  buddyReadId: number;
  book_title: string;
  book_photo: string;
  users: any[];
  endDate: string;
  host: any;
}

interface PaginatedResponse {
  data: BuddyRead[];
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    totalItems: number;
  };
}

type TabType = 'my' | 'active';
type SearchType = 'book' | 'member' | 'all';

// Consolidated state interface
interface TabState {
  data: BuddyRead[];
  page: number;
  hasNextPage: boolean;
  loading: boolean;
  refreshing: boolean;
}

const BuddyReadsIndex = () => {
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Consolidated state for both tabs
  const [tabState, setTabState] = useState<Record<TabType, TabState>>({
    my: { data: [], page: 1, hasNextPage: false, loading: false, refreshing: false },
    active: { data: [], page: 1, hasNextPage: false, loading: false, refreshing: false },
  });

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;
  const navigation = useNavigation<any>();

  // Generic fetch function for both tabs
  const fetchBuddyReads = useCallback(async (
    tab: TabType, 
    page = 1, 
    isRefresh = false
  ) => {
    const endpoint = tab === 'my' ? requests.fetchMyBuddyReads : requests.fetchBuddyReads;
    const headers = tab === 'my' ? { Authorization: `Bearer ${accessToken}` } : {};

    try {
      // Update loading state
      setTabState(prev => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          [isRefresh ? 'refreshing' : 'loading']: true
        }
      }));

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery, search_type: searchType }),
      });

      const response = await instance.get(`${endpoint}?${params}`, { headers });
      const result: PaginatedResponse = response.data.data;
      
      setTabState(prev => ({
        ...prev,
        [tab]: {
          data: page === 1 || isRefresh 
            ? result.data 
            : [...prev[tab].data, ...result.data],
          page,
          hasNextPage: result.pagination.hasNextPage,
          loading: false,
          refreshing: false,
        }
      }));

      if (page === 1) setInitialLoading(false);

    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Failed to fetch ${tab === 'my' ? 'your' : 'active'} buddy reads.`,
      });
      
      setTabState(prev => ({
        ...prev,
        [tab]: { ...prev[tab], loading: false, refreshing: false }
      }));
      
      if (page === 1) setInitialLoading(false);
    }
  }, [accessToken, searchQuery, searchType]);

  // Effect to fetch data when tab, search, or searchType changes
  useEffect(() => {
    fetchBuddyReads(activeTab, 1, true);
  }, [activeTab, searchQuery, searchType, fetchBuddyReads]);

  // Memoized current tab state
  const currentState = useMemo(() => tabState[activeTab], [tabState, activeTab]);

  // Event handlers
  const handleLoadMore = useCallback(() => {
    if (currentState.hasNextPage && !currentState.loading) {
      fetchBuddyReads(activeTab, currentState.page + 1);
    }
  }, [activeTab, currentState.hasNextPage, currentState.loading, currentState.page, fetchBuddyReads]);

  const handleRefresh = useCallback(() => {
    fetchBuddyReads(activeTab, 1, true);
  }, [activeTab, fetchBuddyReads]);

  const handleSearchToggle = useCallback(() => {
    setShowSearchFilters(prev => !prev);
  }, []);

  const clearSearch = useCallback(() => setSearchQuery(''), []);

  // Render functions
  const renderBuddyReadItem = useCallback(({ item }: { item: BuddyRead }) => (
    <BuddyReadCard
      buddyRead={item}
      onPress={(id) => navigation.navigate('BuddyReadsDetails', { buddyReadId: id })}
    />
  ), [navigation]);

  const renderLoadingFooter = useCallback(() => {
    if (!currentState.loading || !currentState.hasNextPage) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }, [currentState.loading, currentState.hasNextPage]);

  const renderEmptyState = useCallback(() => {
    if (currentState.loading) return null;
    
    const config = {
      my: {
        icon: 'book-outline' as const,
        title: 'No Buddy Reads Yet',
        subtitle: 'Join a buddy read to start reading together!'
      },
      active: {
        icon: 'people-outline' as const,
        title: 'No Active Buddy Reads',
        subtitle: 'Check back later for new reading groups.'
      }
    };

    const { icon, title, subtitle } = config[activeTab];

    return (
      <View style={styles.emptyState}>
        <Ionicons name={icon} size={64} color={COLORS.primaryLightGreyHex} />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
      </View>
    );
  }, [activeTab, currentState.loading]);

  // Search filter chips data
  const searchFilters: { type: SearchType; label: string }[] = [
    { type: 'all', label: 'All' },
    { type: 'book', label: 'Books' },
    { type: 'member', label: 'Members' },
  ];

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
          <Text style={styles.loadingText}>Loading Buddy Reads...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buddy Reads</Text>
        <TouchableOpacity style={styles.searchToggle} onPress={handleSearchToggle}>
          <Ionicons name="search" size={24} color={COLORS.primaryWhiteHex} />
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      {showSearchFilters && (
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={COLORS.primaryLightGreyHex} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search buddy reads..."
              placeholderTextColor={COLORS.primaryLightGreyHex}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close" size={20} color={COLORS.primaryLightGreyHex} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.searchFilters}>
            {searchFilters.map(({ type, label }) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterChip, searchType === type && styles.activeFilterChip]}
                onPress={() => setSearchType(type)}
              >
                <Text style={[styles.filterText, searchType === type && styles.activeFilterText]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'my' as TabType, label: 'My Reads' },
          { key: 'active' as TabType, label: 'Discover' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.activeTab]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <FlatList
        data={currentState.data}
        renderItem={renderBuddyReadItem}
        keyExtractor={(item) => `${activeTab}-${item.buddyReadId}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderLoadingFooter}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={currentState.refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primaryOrangeHex]}
            tintColor={COLORS.primaryOrangeHex}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.space_12,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
    paddingTop: SPACING.space_20,
    paddingBottom: SPACING.space_16,
  },
  headerTitle: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  searchToggle: {
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    backgroundColor: COLORS.primaryDarkGreyHex,
  },
  searchSection: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: SPACING.space_16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    marginBottom: SPACING.space_12,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.space_12,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
  },
  searchFilters: {
    flexDirection: 'row',
    gap: SPACING.space_8,
  },
  filterChip: {
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderColor: COLORS.primaryOrangeHex,
  },
  filterText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  activeFilterText: {
    color: COLORS.primaryWhiteHex,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_4,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.space_12,
    alignItems: 'center',
    borderRadius: BORDERRADIUS.radius_10,
  },
  activeTab: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  tabText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
  },
  activeTabText: {
    color: COLORS.primaryWhiteHex,
  },
  listContainer: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: SPACING.space_30,
    gap: SPACING.space_16,
  },
  loadingFooter: {
    paddingVertical: SPACING.space_20,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.space_36 * 2,
  },
  emptyTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_20,
    marginBottom: SPACING.space_8,
  },
  emptySubtitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.space_30,
  },
});

export default BuddyReadsIndex;