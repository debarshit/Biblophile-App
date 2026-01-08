import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Dimensions, 
  FlatList, 
  Keyboard, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
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

const SearchScreen = ({ route }) => {
  // Get add to cart handler from route params
  const { CoffeeCardAddToCart } = route.params || {};
  
  // State variables
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [externalBooks, setExternalBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  
  const navigation = useNavigation<any>();
  const localBooksListRef = useRef(null);
  const externalBooksListRef = useRef(null);

  const { selectedCity } = useCity();

  // Convert HTTP URLs to HTTPS for security
  const convertToHttps = (url) => {
    return url && url.startsWith('http://') ? url.replace('http://', 'https://') : url;
  };

  // Search books function (will be debounced)
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
  
  // Debounce search to prevent too many API calls
  const debouncedSearch = useDebounce(performSearch, 500);
  
  // Handle search text change
  const handleSearchChange = (text) => {
    setSearchText(text);
    debouncedSearch(text);
  };
  
  // Reset search results and search text
  const resetSearch = () => {
    setExternalBooks([]);
    setSearchText('');
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
  const renderBookItem = (type) => ({ item }) => {
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

  // Render loading shimmer
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

  // Render empty list component
  const renderEmptyList = () => (
    <View style={styles.emptyListContainer}>
      <Text style={styles.emptyText}>No Books Found</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <HeaderBar showBackButton title='Search books' />
        {/* Search Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => performSearch(searchText)}>
            <Feather
              style={styles.inputIcon}
              name="search"
              size={FONTSIZE.size_18}
              color={searchText ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
            />
          </TouchableOpacity>
          
          <TextInput
            placeholder="Find Your Book..."
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

        {/* Search Results */}
        {searchText ? (
          <>
            {/* External Books */}
            <Text style={styles.sectionTitle}>Search Results</Text>
            
            {booksLoading ? renderShimmer() : (
              <FlatList
                ref={externalBooksListRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                data={externalBooks}
                keyExtractor={item => item.BookId ? `local-${item.BookId}` : `external-${item.GoogleBookId}`}
                renderItem={renderBookItem('external')}
                contentContainerStyle={styles.flatListContainer}
                ListEmptyComponent={renderEmptyList}
              />
            )}
          </>
        ) : (
        <SeasonalRecommendations /> 
        )}
        <Text style={styles.AddBookText}>
          Can't find what you're looking for?{` `}
          <Text style={{color: COLORS.primaryOrangeHex}} onPress={() => navigation.navigate('AddWork')}>
            Add Book.
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  inputContainer: {
    flexDirection: 'row',
    margin: SPACING.space_30,
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
  },
});

export default SearchScreen;