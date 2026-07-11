import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  Dimensions, 
  FlatList, 
  Keyboard, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Image
} from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';

// Components
import CoffeeCard from '../../../components/CoffeeCard';

// Services and utilities
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { 
  BORDERRADIUS, 
  COLORS, 
  FONTFAMILY, 
  FONTSIZE, 
  SPACING 
} from '../../../theme/theme';
import { useCity } from '../../../contexts/CityContext';
import SeasonalRecommendations from '../components/SeasonalRecommendations';
import HeaderBar from '../../../components/HeaderBar';
import { useTheme } from '../../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import SimilarUsers from '../../social/components/SimilarUsers';

// Debounce search for better performance
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

interface UserSearchResult {
  userId: number;
  name: string;
  userName: string;
  userProfilePic?: string;
  followersCount?: number;
  booksRead?: number;
}

const SearchScreen = ({ route }) => {
  // Get add to cart handler from route params
  const { CoffeeCardAddToCart } = route.params || {};
  
  // State variables
  const [activeTab, setActiveTab] = useState<'books' | 'people'>('books');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Books Search State
  const [externalBooks, setExternalBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  
  // People Search State
  const [peopleResults, setPeopleResults] = useState<UserSearchResult[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState('');
  
  const navigation = useNavigation<any>();
  const externalBooksListRef = useRef(null);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const { selectedCity } = useCity();

  // Convert HTTP URLs to HTTPS for security
  const convertToHttps = (url) => {
    return url && url.startsWith('http://') ? url.replace('http://', 'https://') : url;
  };

  // Search books function
  const performSearch = async (query) => {
    if (!query) {
      setExternalBooks([]);
      return;
    }
    
    setBooksLoading(true);
    
    try {
      // Fetch internal+external books
      const externalSearchResponse = await instance.get(`${requests.searchExternalBooks}${query}&userCity=${selectedCity}`);
      const externalResponse = externalSearchResponse.data;
      setExternalBooks(externalResponse.data || []);
    } catch (error) {
      console.error('Error searching books:', error);
    } finally {
      setBooksLoading(false);
    }
  };

  // Search people function
  const performPeopleSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setPeopleResults([]);
      return;
    }
    
    setPeopleLoading(true);
    setPeopleError('');
    
    try {
      const response = await instance.get(requests.searchUsers(query));
      const data = response.data?.data?.users;
      setPeopleResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setPeopleError('Failed to search readers. Please try again.');
    } finally {
      setPeopleLoading(false);
    }
  };
  
  // Debounce searches to prevent too many API calls
  const debouncedBookSearch = useDebounce(performSearch, 500);
  const debouncedPeopleSearch = useDebounce(performPeopleSearch, 500);
  
  // Handle search text change
  const handleSearchChange = (text) => {
    setSearchText(text);
    if (activeTab === 'books') {
      debouncedBookSearch(text);
    } else {
      debouncedPeopleSearch(text);
    }
  };
  
  // Reset search results and search text
  const resetSearch = () => {
    setSearchText('');
    setExternalBooks([]);
    setPeopleResults([]);
    setPeopleError('');
  };

  const handleTabChange = (tab: 'books' | 'people') => {
    setActiveTab(tab);
    setSearchText('');
    setExternalBooks([]);
    setPeopleResults([]);
    setPeopleError('');
  };

  // Navigate to book details
  const navigateToDetails = (id, type) => {
    navigation.navigate('Details', { id, type });
  };

  // Set up keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Render book item
  const renderBookItem = ({ item }) => {
    const id = item.BookId ? item.BookId : item.GoogleBookId;
    const bookType = item.BookId ? 'Book' : 'ExternalBook';
    
    return (
      <TouchableOpacity onPress={() => navigateToDetails(id, bookType)}>
        <CoffeeCard
          id={id}
          name={item.BookName}
          photo={convertToHttps(item.BookPhoto)}
          type={bookType}
          price={item.BookPrice}
          rentPrice={item.RentPrice}
          averageRating={item.BookAverageRating}
          ratingCount={item.BookRatingCount}
          buttonPressHandler={CoffeeCardAddToCart}
        />
      </TouchableOpacity>
    );
  };

  // Render loading shimmer for books
  const renderShimmer = () => (
    <View style={styles.shimmerFlex}>
      {[1, 2, 3].map((key) => (
        <ShimmerPlaceholder
          key={`shimmer-${key}`}
          LinearGradient={LinearGradient}
          style={styles.shimmerPlaceholder}
          shimmerColors={[
            COLORS.primaryDarkGreyHex, 
            COLORS.primaryBlackHex, 
            COLORS.primaryDarkGreyHex
          ]}
          visible={false}
        />
      ))}
    </View>
  );

  // Render loading shimmer for people
  const renderPeopleShimmer = () => (
    <View style={{ paddingHorizontal: SPACING.space_30 }}>
      {[1, 2, 3].map((key) => (
        <View key={`people-shimmer-${key}`} style={styles.peopleShimmerRow}>
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={styles.avatarShimmer}
            shimmerColors={[
              COLORS.primaryDarkGreyHex, 
              COLORS.primaryBlackHex, 
              COLORS.primaryDarkGreyHex
            ]}
            visible={false}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <ShimmerPlaceholder
              LinearGradient={LinearGradient}
              style={styles.nameShimmer}
              shimmerColors={[
                COLORS.primaryDarkGreyHex, 
                COLORS.primaryBlackHex, 
                COLORS.primaryDarkGreyHex
              ]}
              visible={false}
            />
            <ShimmerPlaceholder
              LinearGradient={LinearGradient}
              style={styles.usernameShimmer}
              shimmerColors={[
                COLORS.primaryDarkGreyHex, 
                COLORS.primaryBlackHex, 
                COLORS.primaryDarkGreyHex
              ]}
              visible={false}
            />
          </View>
        </View>
      ))}
    </View>
  );

  // Render empty list component for books
  const renderEmptyList = () => (
    <View style={styles.emptyListContainer}>
      <Text style={styles.emptyText}>No Books Found</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <HeaderBar 
          showBackButton 
          title={activeTab === 'books' ? 'Search books' : 'Find Readers'} 
        />
        
        {/* Search Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => activeTab === 'books' ? performSearch(searchText) : performPeopleSearch(searchText)}>
            <Feather
              style={styles.inputIcon}
              name="search"
              size={FONTSIZE.size_18}
              color={searchText ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
            />
          </TouchableOpacity>
          
          <TextInput
            placeholder={activeTab === 'books' ? "Find Your Book..." : "Search readers by name or username..."}
            value={searchText}
            onChangeText={handleSearchChange}
            placeholderTextColor={COLORS.primaryLightGreyHex}
            style={styles.textInput}
            autoFocus
          />
          
          {searchText ? (
            <TouchableOpacity onPress={resetSearch}>
              <AntDesign
                style={styles.inputIcon}
                name="close"
                size={FONTSIZE.size_16}
                color={COLORS.primaryLightGreyHex}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabToggleBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'books' && styles.tabButtonActive]}
            onPress={() => handleTabChange('books')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'books' && styles.tabButtonTextActive]}>
              Books
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'people' && styles.tabButtonActive]}
            onPress={() => handleTabChange('people')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'people' && styles.tabButtonTextActive]}>
              People
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {activeTab === 'books' ? (
          // Books Tab content
          searchText ? (
            <>
              <Text style={styles.sectionTitle}>Search Results</Text>
              
              {booksLoading ? renderShimmer() : (
                <FlatList
                  ref={externalBooksListRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={externalBooks}
                  keyExtractor={item => item.BookId ? `local-${item.BookId}` : `external-${item.GoogleBookId}`}
                  renderItem={renderBookItem}
                  contentContainerStyle={styles.flatListContainer}
                  ListEmptyComponent={renderEmptyList}
                />
              )}
            </>
          ) : (
            <SeasonalRecommendations /> 
          )
        ) : (
          // People Tab content
          searchText.trim().length >= 2 ? (
            <View style={styles.peopleResultsContainer}>
              <Text style={styles.sectionTitle}>Readers Found</Text>
              
              {peopleLoading ? (
                renderPeopleShimmer()
              ) : peopleError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{peopleError}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={() => performPeopleSearch(searchText)}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : peopleResults.length === 0 ? (
                <View style={styles.peopleEmptyContainer}>
                  <Feather name="search" size={36} color={COLORS.primaryLightGreyHex} />
                  <Text style={styles.peopleEmptyTitle}>No readers found</Text>
                  <Text style={styles.peopleEmptySubtitle}>We couldn't find anyone matching "{searchText}"</Text>
                </View>
              ) : (
                <View style={styles.peopleList}>
                  {peopleResults.map((item, index) => {
                    const picUri = item.userProfilePic ? convertHttpToHttps(item.userProfilePic) : null;
                    const isLast = index === peopleResults.length - 1;
                    return (
                      <TouchableOpacity 
                        key={item.userId}
                        style={[
                          styles.userRow,
                          !isLast && { borderBottomWidth: 0.5, borderBottomColor: COLORS.primaryGreyHex }
                        ]}
                        onPress={() => navigation.push('ProfileSummary', { username: item.userName })}
                        activeOpacity={0.8}
                      >
                        {picUri ? (
                          <Image source={{ uri: picUri }} style={styles.userAvatar} />
                        ) : (
                          <View style={styles.userAvatarFallback}>
                            <Feather name="user" size={20} color={COLORS.secondaryLightGreyHex} />
                          </View>
                        )}
                        <View style={styles.userInfo}>
                          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.userUsername} numberOfLines={1}>@{item.userName}</Text>
                          {item.booksRead && item.booksRead > 0 ? (
                            <View style={styles.booksReadRow}>
                              <Feather name="book" size={10} color={COLORS.primaryOrangeHex} style={{ marginRight: 4 }} />
                              <Text style={styles.booksReadText}>{item.booksRead} book{item.booksRead > 1 ? 's' : ''} read</Text>
                            </View>
                          ) : null}
                        </View>
                        <Feather name="chevron-right" size={18} color={COLORS.primaryLightGreyHex} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ) : (
            // Search Prompt
            <>
            <View style={styles.searchPromptContainer}>
              <Feather name="users" size={48} color={COLORS.primaryLightGreyHex} style={{ marginBottom: SPACING.space_15 }} />
              <Text style={styles.promptTitle}>Search for readers</Text>
              <Text style={styles.promptSubtitle}>Find friends, reading twins, and book lovers</Text>
            </View>
            {/* <SimilarUsers /> */}
            </>
          )
        )}
        
        {activeTab === 'books' && (
          <Text style={styles.AddBookText}>
            Can't find what you're looking for?{` `}
            <Text style={{color: COLORS.primaryOrangeHex}} onPress={() => navigation.navigate('AddWork')}>
              Add Book.
            </Text>
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  inputContainer: {
    flexDirection: 'row',
    margin: SPACING.space_30,
    marginBottom: SPACING.space_15,
    borderRadius: BORDERRADIUS.radius_20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    alignItems: 'center',
  },
  inputIcon: {
    marginHorizontal: SPACING.space_20,
  },
  textInput: {
    flex: 1,
    height: SPACING.space_20 * 3,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  
  // Tab Switcher Styles
  tabToggleBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.space_30,
    marginBottom: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_15,
    backgroundColor: COLORS.primaryGreyHex,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    borderRadius: BORDERRADIUS.radius_15,
    paddingVertical: SPACING.space_8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  tabButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
  },
  tabButtonTextActive: {
    color: COLORS.primaryWhiteHex,
  },

  sectionTitle: {
    fontSize: FONTSIZE.size_18,
    marginLeft: SPACING.space_30,
    marginTop: SPACING.space_20,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.secondaryLightGreyHex,
  },
  shimmerPlaceholder: {
    width: 150, 
    height: 200, 
    borderRadius: 10,
    marginHorizontal: 10, 
    marginTop: 10,
    marginBottom: 40,
    marginLeft: 20, 
  },
  shimmerFlex: {
    flexDirection: 'row',
  },
  flatListContainer: {
    gap: SPACING.space_20,
    paddingVertical: SPACING.space_20,
    paddingHorizontal: SPACING.space_30,
  },
  emptyListContainer: {
    width: Dimensions.get('window').width - SPACING.space_30 * 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_36 * 3.6,
  },
  emptyText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  AddBookText: {
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_12,
    alignSelf: 'center',
    marginTop: SPACING.space_20,
  },
  // People Search Styles
  searchPromptContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_36 * 2,
    paddingHorizontal: SPACING.space_30,
  },
  promptTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: 6,
  },
  promptSubtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
  peopleResultsContainer: {
    flex: 1,
  },
  peopleList: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    marginHorizontal: SPACING.space_30,
    borderRadius: BORDERRADIUS.radius_20,
    marginTop: SPACING.space_15,
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryGreyHex,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.space_12,
  },
  userName: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  userUsername: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginBottom: 2,
  },
  booksReadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  booksReadText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.secondaryLightGreyHex,
  },
  peopleEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_36 * 1.5,
    paddingHorizontal: SPACING.space_30,
  },
  peopleEmptyTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_12,
    marginBottom: 4,
  },
  peopleEmptySubtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_36,
  },
  errorText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_12,
  },
  retryButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_8,
    paddingHorizontal: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_8,
  },
  retryText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },

  // Shimmer for People
  peopleShimmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.space_12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  avatarShimmer: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  nameShimmer: {
    height: 12,
    width: 120,
    borderRadius: 4,
    marginBottom: 6,
  },
  usernameShimmer: {
    height: 10,
    width: 80,
    borderRadius: 4,
  },
});

export default SearchScreen;