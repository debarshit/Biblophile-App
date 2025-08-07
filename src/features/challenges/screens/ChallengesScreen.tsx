import React, {useEffect, useState, useCallback} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';
import ChallengeCard from '../components/ChallengeCard';
import CreateChallengeForm from '../components/CreateChallengeForm';

const ChallengeScreen = ({navigation}: any) => {
  // Consolidated state
  const [state, setState] = useState({
    activeTab: 'my',
    challenges: [],
    categories: [],
    keywords: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    modalVisible: false,
    showFilters: false,
    searchQuery: '',
    hostSearch: '',
    selectedCategory: '',
    selectedKeywords: [],
  });

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;

  // Helper to update state
  const updateState = (updates: any) => setState(prev => ({ ...prev, ...updates }));

  // Fetch filter data
  const fetchFilterData = useCallback(async () => {
    try {
      const [categoriesResponse, keywordsResponse] = await Promise.all([
        instance.get(requests.fetchCategories),
        instance.get(requests.fetchKeywords),
      ]);
      updateState({
        categories: categoriesResponse.data.data || [],
        keywords: keywordsResponse.data.data || []
      });
    } catch (err) {
      console.error('Failed to fetch filter data:', err);
    }
  }, []);

  // Fetch challenges with filters and pagination
  const fetchChallenges = useCallback(async (pageNum = 1, reset = false) => {
    if (state.loading && !reset) return;
    
    updateState({ loading: true });
    
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        ...(state.searchQuery && { title: state.searchQuery }),
        ...(state.selectedCategory && { category: state.selectedCategory }),
        ...(state.selectedKeywords.length && { keywords: state.selectedKeywords.join(',') }),
        ...(state.hostSearch && { host: state.hostSearch }),
        ...(state.activeTab === 'my' && { userChallengesOnly: 'true' }),
      });

      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const response = await instance.get(`${requests.fetchChallenges}?${params}`, { headers });
      
      let newChallenges = response.data.data?.challenges || response.data.data || [];
      
      // Filter by date based on active tab
      const now = new Date();
      if (state.activeTab === 'past') {
        newChallenges = newChallenges.filter(c => new Date(c.endDate) < now);
      } else {
        newChallenges = newChallenges.filter(c => new Date(c.endDate) >= now);
      }

      updateState({
        challenges: reset || pageNum === 1 ? newChallenges : [...state.challenges, ...newChallenges],
        hasMore: newChallenges.length === 10,
        loading: false,
        refreshing: false,
      });
    } catch (err) {
      updateState({ loading: false, refreshing: false });
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch challenges.' });
    }
  }, [state.searchQuery, state.selectedCategory, state.selectedKeywords, state.hostSearch, state.activeTab, accessToken, state.loading, state.challenges]);

  // Effects
  useEffect(() => { fetchFilterData(); }, [fetchFilterData]);
  
  useEffect(() => {
    updateState({ page: 1, challenges: [], hasMore: true });
    fetchChallenges(1, true);
  }, [state.activeTab, state.searchQuery, state.selectedCategory, state.selectedKeywords, state.hostSearch]);

  // Handlers
  const handleTabPress = (tab: string) => updateState({ activeTab: tab });
  
  const handleLoadMore = () => {
    if (state.hasMore && !state.loading) {
      const nextPage = state.page + 1;
      updateState({ page: nextPage });
      fetchChallenges(nextPage);
    }
  };

  const handleRefresh = () => {
    updateState({ refreshing: true, page: 1 });
    fetchChallenges(1, true);
  };

  const clearFilters = () => updateState({
    searchQuery: '',
    hostSearch: '',
    selectedCategory: '',
    selectedKeywords: []
  });

  const toggleKeyword = (keywordName: string) => {
    updateState({
      selectedKeywords: state.selectedKeywords.includes(keywordName)
        ? state.selectedKeywords.filter(k => k !== keywordName)
        : [...state.selectedKeywords, keywordName]
    });
  };

  const getActiveFiltersCount = () => 
    [state.selectedCategory, state.searchQuery, state.hostSearch].filter(Boolean).length + state.selectedKeywords.length;

  // Render components
  const TabButton = ({ tab, label }: { tab: string; label: string }) => {
    const isActive = state.activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => handleTabPress(tab)}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ items, selected, onSelect, activeStyle, textStyle }: any) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {items.map((item: any) => {
        const isSelected = selected === item.categoryName || selected.includes?.(item.keywordName);
        return (
          <TouchableOpacity
            key={item.categoryId || item.keywordId}
            style={[styles.filterChip, isSelected && activeStyle]}
            onPress={() => onSelect(item.categoryName || item.keywordName)}
          >
            <Text style={[styles.filterChipText, isSelected && textStyle]}>
              {item.categoryName || item.keywordName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderEmptyState = () => {
    if (state.loading && state.page === 1) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
          <Text style={styles.loadingText}>Loading challenges...</Text>
        </View>
      );
    }

    const messages = {
      my: "You haven't joined any challenges yet.",
      past: "No past challenges to display.",
      all: "Try adjusting your filters or create a new challenge."
    };

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No challenges found</Text>
        <Text style={styles.emptySubtitle}>{messages[state.activeTab as keyof typeof messages]}</Text>
        {state.activeTab !== 'my' && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => updateState({ modalVisible: true })}
          >
            <Text style={styles.createButtonText} onPress={() => updateState({ modalVisible: true })}>+ Create Your First Challenge</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFooter = () => 
    state.loading && state.page > 1 ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
        <Text style={styles.loadingText}>Loading more challenges...</Text>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView>
        <HeaderBar title="" />
        
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.screenTitle}>Reading Challenges</Text>
          <Text style={styles.screenSubtitle}>
            Discover, join, and create reading challenges with the community
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TabButton tab="my" label="My Challenges" />
          <TabButton tab="all" label="All Challenges" />
          <TabButton tab="past" label="Past Challenges" />
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search challenges by title..."
              placeholderTextColor={COLORS.secondaryLightGreyHex}
              value={state.searchQuery}
              onChangeText={(text) => updateState({ searchQuery: text })}
            />
            <TouchableOpacity
              style={[styles.filterButton, (getActiveFiltersCount() > 0 || state.showFilters) && styles.activeFilterButton]}
              onPress={() => updateState({ showFilters: true })}
            >
              <Text style={[styles.filterButtonText, (getActiveFiltersCount() > 0 || state.showFilters) && styles.activeFilterButtonText]}>
                🔍
              </Text>
              {getActiveFiltersCount() > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search by host name..."
            placeholderTextColor={COLORS.secondaryLightGreyHex}
            value={state.hostSearch}
            onChangeText={(text) => updateState({ hostSearch: text })}
          />
        </View>

        {/* Results Count */}
        {state.challenges.length > 0 && (
          <View style={styles.resultsCount}>
            <Text style={styles.resultsText}>
              Showing {state.challenges.length} challenge{state.challenges.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Challenges List */}
        <FlatList
          data={state.challenges}
          renderItem={({ item }) => <ChallengeCard challenge={item} />}
          keyExtractor={(item, index) => `${item.challengeId}-${index}`}
          contentContainerStyle={styles.challengesList}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primaryOrangeHex]}
              tintColor={COLORS.primaryOrangeHex}
            />
          }
        />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => updateState({ modalVisible: true })}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Create Challenge Modal */}
      <CreateChallengeForm
        modalVisible={state.modalVisible}
        setModalVisible={(visible: boolean) => updateState({ modalVisible: visible })}
        fetchChallenges={() => fetchChallenges(1, true)}
      />

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={state.showFilters}
        onRequestClose={() => updateState({ showFilters: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={() => updateState({ showFilters: false })}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Category</Text>
                <FilterButton
                  items={[{ categoryName: 'All Categories', categoryId: 'all' }, ...state.categories]}
                  selected={state.selectedCategory}
                  onSelect={(category: string) => updateState({ selectedCategory: category === 'All Categories' ? '' : category })}
                  activeStyle={styles.activeCategoryButton}
                  textStyle={styles.activeCategoryButtonText}
                />
              </View>

              {/* Keywords Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Keywords</Text>
                <View style={styles.keywordsContainer}>
                  {state.keywords.map((keyword: any) => (
                    <TouchableOpacity
                      key={keyword.keywordId}
                      style={[styles.keywordButton, state.selectedKeywords.includes(keyword.keywordName) && styles.activeKeywordButton]}
                      onPress={() => toggleKeyword(keyword.keywordName)}
                    >
                      <Text style={[styles.keywordButtonText, state.selectedKeywords.includes(keyword.keywordName) && styles.activeKeywordButtonText]}>
                        {keyword.keywordName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Clear Filters */}
              {getActiveFiltersCount() > 0 && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  headerSection: {
    paddingHorizontal: SPACING.space_30,
    paddingVertical: SPACING.space_20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
  },
  screenTitle: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  screenSubtitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_16,
    gap: SPACING.space_8,
  },
  tabButton: {
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  tabText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.secondaryLightGreyHex,
  },
  activeTabText: {
    color: COLORS.primaryWhiteHex,
  },
  searchSection: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: SPACING.space_16,
    gap: SPACING.space_12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.space_12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  filterButton: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeFilterButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderColor: COLORS.primaryOrangeHex,
  },
  filterButtonText: {
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  activeFilterButtonText: {
    color: COLORS.primaryBlackHex,
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.primaryRedHex,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  resultsCount: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: SPACING.space_8,
  },
  resultsText: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
  },
  challengesList: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: SPACING.space_36,
    gap: SPACING.space_16,
  },
  footerLoader: {
    paddingVertical: SPACING.space_20,
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  loadingText: {
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_36,
    gap: SPACING.space_16,
  },
  emptyTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.secondaryLightGreyHex,
  },
  emptySubtitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
    paddingHorizontal: SPACING.space_20,
  },
  createButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    marginTop: SPACING.space_8,
  },
  createButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryBlackHex,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    backgroundColor: COLORS.primaryOrangeHex,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: COLORS.primaryWhiteHex,
    fontSize: 32,
    fontFamily: FONTFAMILY.poppins_bold,
    marginBottom: 4,
  },
  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: COLORS.primaryBlackHex,
    borderTopLeftRadius: BORDERRADIUS.radius_20,
    borderTopRightRadius: BORDERRADIUS.radius_20,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
  },
  filterTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.primaryWhiteHex,
  },
  filterContent: {
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_16,
  },
  filterSection: {
    marginBottom: SPACING.space_24,
  },
  filterLabel: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_12,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: COLORS.primaryGreyHex,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    marginRight: SPACING.space_8,
  },
  filterChipText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  activeCategoryButton: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  activeCategoryButtonText: {
    color: COLORS.primaryBlackHex,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_8,
  },
  keywordButton: {
    backgroundColor: COLORS.primaryGreyHex,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
  },
  activeKeywordButton: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  keywordButtonText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  activeKeywordButtonText: {
    color: COLORS.primaryBlackHex,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.space_8,
  },
  clearFiltersText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
});

export default ChallengeScreen;