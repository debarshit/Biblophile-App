import React, {useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  ToastAndroid,
  Keyboard,
  Animated,
  FlatList,
  Dimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import SpotlightBooks from '../components/SpotlightBooks';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import instance from '../services/axios';
import requests from '../services/requests';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import { AntDesign, Feather } from '@expo/vector-icons';
import {useStore} from '../store/store';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import CoffeeCard from '../components/CoffeeCard';
import FloatingIcon from '../components/FloatingIcon';

interface Spotlight {
  Id: string;
  Photo: string;
  Name: string;
}

const getGenresFromData = (data: any) => {
  const genres = ['All', ...new Set(data.map((item: any) => item.genre))];
  return genres;
};

const getBookList = async (genre: any) => {
  try {
    const response = await instance(requests.getBooks+genre);
    const data = response.data;
    return data;
  } catch (error) {
    console.error('Error fetching genres:', error);
  }
};

const HomeScreen = ({navigation}: any) => {
  //useStore variables
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const fetchGenres = useStore((state: any) => state.fetchGenres);  //this function should run on mount
  const GenreList = useStore((state: any) => state.GenreList);
  const CartList = useStore((state: any) => state.CartList);

  //useState variables
  const [genres, setGenres] = useState(
    getGenresFromData(GenreList),  
  );
  const [searchText, setSearchText] = useState('');
  const [genreIndex, setGenreIndex] = useState({
    index: 0,
    genre: genres[0],
  });
  const [bookList, setBookList] = useState<any>(getBookList(genreIndex.genre));
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [sortedCoffee, setSortedCoffee] = useState<any>(
    getBookList(genreIndex.genre),
  );
  const [externalBooks, setExternalBooks] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [booksLoading, setBooksLoading] = useState(true);

  const ListRef: any = useRef<FlatList>();
  const tabBarHeight = useBottomTabBarHeight();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);
  const scrollOffset = useRef(new Animated.Value(0)).current;

  // Define a variable to store the timeout ID
  let searchTimeout: any = null;  

  const searchCoffee = (search: string) => { 
    // Clear the previous timeout
    clearTimeout(searchTimeout);
    
    // Create a new timeout
    searchTimeout = setTimeout(async () => {
      if (search !== '') {
        setBooksLoading(true);
        try {
          const response = await instance(requests.searchBooks + search);
          const data = response.data;
          setSortedCoffee(data);

          const externalBooksResponse = await instance.get(requests.searchExternalBooks + search);
          const externalData = externalBooksResponse.data;
          setExternalBooks(externalData);

          setBooksLoading(false);
        } catch (error) {
          console.error('Error fetching books:', error);
        }
      }
    }, 500); // Waiting time in milliseconds
  };

  const resetSearchCoffee = () => {
    ListRef?.current?.scrollToOffset({
      animated: true,
      offset: 0,
    });
    setGenreIndex({index: 0, genre: genres[0]});
    setSortedCoffee(bookList);
    setExternalBooks([]);
    setSearchText('');
  };

  const CoffeeCardAddToCart = ({
    id,
    name,
    genre,
    photo,
    poster,
    type,
    prices,
    actualPrice,
    averageRating,
    ratingCount,
    description,
    author,                    
  }: any) => {
    addToCart({
      id,
      name,
      genre,
      photo,
      poster,
      type,
      prices,
      actualPrice,
      averageRating,
      ratingCount,
      description,
      author, 
    });
    calculateCartPrice();
    if (Platform.OS == 'android') {
      ToastAndroid.showWithGravity(
        `${name} is Added to Cart`,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );
    }
    else {
      Toast.show({
        type: 'info', // You can set type as 'success', 'error', 'info', or 'none'
        text1: `${name} is Added to Cart`, // Main message
        visibilityTime: 2000, // Duration in milliseconds
        autoHide: true, // Auto hide the toast after visibilityTime
        position: 'bottom', // Set position to bottom
        bottomOffset: 100, // Adjust the offset as needed
      });
    }
  };

  const convertHttpToHttps = (url) => {
    if (url && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);

        // Scroll the ScrollView up
        scrollViewRef.current?.scrollTo({
          y: 50,
          animated: true,
        });
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);

        // Scroll back to the top
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: true,
        });
      });
      
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    // Fetch genres when component mounts
    fetchGenres();
  }, []);

  useEffect(() => {
    // Update genres state when GenreList changes
    setGenres(['All', ...GenreList.map((genre: any) => genre.genre)]);
  }, [GenreList]);

  useEffect(() => {
    async function fetchBookList() {
      try {
        const data = await getBookList(genreIndex.genre);
        setBookList(data);
        setSortedCoffee(data);
        setBooksLoading(false);
      } catch (error) {
        console.error('Error fetching book list:', error);
      }
    }
  
    fetchBookList();
  }, [genreIndex]);

  useEffect(() => {
    async function getSpotlights() {
        try {
            const response = await instance(requests.getSpotlight);
            const data = response.data;
            setSpotlights(data);
            setLoading(false);
          } catch (error) {
            console.error('Error fetching spotlights:', error);
          }
    }
  
    getSpotlights();
  }, []);

  return (
    <SafeAreaView style={styles.ScreenContainer}>

      <StatusBar backgroundColor={COLORS.primaryBlackHex} />

      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}
        contentOffset={{ x: 0, y: scrollOffset }}
        scrollEventThrottle={16}>
        {/* App Header */}
        {!keyboardVisible && <HeaderBar title="Home Screen"/>}

        {/* Search Input */}
        <View style={styles.InputContainerComponent}>
          <TouchableOpacity
            onPress={() => {
              searchCoffee(searchText);
            }}>
            <Feather
              style={styles.InputIcon}
              name="search"
              size={FONTSIZE.size_18}
              color={
                searchText.length > 0
                  ? COLORS.primaryOrangeHex
                  : COLORS.primaryLightGreyHex
              }
            />
          </TouchableOpacity>
          <TextInput
            placeholder="Find Your Book..."
            value={searchText}
            onChangeText={text => {
              setSearchText(text);
              searchCoffee(text);
            }}
            placeholderTextColor={COLORS.primaryLightGreyHex}
            style={styles.TextInputContainer}
          />
          {searchText.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                resetSearchCoffee();
              }}>
              <AntDesign
                style={styles.InputIcon}
                name="close"
                size={FONTSIZE.size_16}
                color={COLORS.primaryLightGreyHex}
              />
            </TouchableOpacity>
          ) : (
            <></>
          )}
        </View>

        {/* Searched Books Flatlist */}
        {searchText !== '' &&
          <>
            {booksLoading ? (
              // Render shimmer effect while loading
              <View style={styles.shimmerFlex}>
                <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                  style={styles.ShimmerPlaceholder}
                  shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
                  visible={!booksLoading}>
                </ShimmerPlaceholder>
                <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                  style={styles.ShimmerPlaceholder}
                  shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
                  visible={!setBooksLoading}>
                </ShimmerPlaceholder>
                <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                  style={styles.ShimmerPlaceholder}
                  shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
                  visible={!booksLoading}>
                </ShimmerPlaceholder>
              </View>
            ) : (

              <FlatList
                {...sortedCoffee.length === 0 && styles.hidden}
                ref={ListRef}
                horizontal
                ListEmptyComponent={
                  <View style={styles.EmptyListContainer}>
                    <Text style={styles.genreText}>No Books found</Text>
                  </View>
                }
                showsHorizontalScrollIndicator={false}
                data={sortedCoffee}
                contentContainerStyle={styles.FlatListContainer}
                keyExtractor={item => item.BookId}
                renderItem={({item}) => {
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        navigation.push('Details', {
                          id: item.BookId,
                          type: "Book",
                        });
                      }}>
                      <CoffeeCard
                        id={item.BookId}
                        name={item.BookName}
                        photo={convertHttpToHttps(item.BookPhoto)}
                        type="Book"
                        price={item.BookPrice}
                        averageRating={item.BookAverageRating}
                        ratingCount={item.BookRatingCount}
                        buttonPressHandler={CoffeeCardAddToCart}
                      />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </>
        }

        {/* Searched External Books FlatList */}
        {searchText !== '' &&
          <>
          <Text style={styles.CoffeeBeansTitle}>External Books</Text>

          {booksLoading ? (
            // Render shimmer effect while loading
            <View style={styles.shimmerFlex}>
              <ShimmerPlaceholder
              LinearGradient={LinearGradient}
                style={styles.ShimmerPlaceholder}
                shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
                visible={!booksLoading}>
              </ShimmerPlaceholder>
              <ShimmerPlaceholder
              LinearGradient={LinearGradient}
                style={styles.ShimmerPlaceholder}
                shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
                visible={!setBooksLoading}>
              </ShimmerPlaceholder>
              <ShimmerPlaceholder
              LinearGradient={LinearGradient}
                style={styles.ShimmerPlaceholder}
                shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
                visible={!booksLoading}>
              </ShimmerPlaceholder>
            </View>
          ) : (

            <FlatList
              ref={ListRef}
              horizontal
              ListEmptyComponent={
                <View style={styles.EmptyListContainer}>
                  <Text style={styles.genreText}>No Books found</Text>
                </View>
              }
              showsHorizontalScrollIndicator={false}
              data={externalBooks}
              contentContainerStyle={styles.FlatListContainer}
              keyExtractor={item => item.GoogleBookId}
              renderItem={({item}) => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      navigation.push('Details', {
                        id: item.GoogleBookId,
                        type: "ExternalBook",
                      });
                    }}>
                    <CoffeeCard
                      id={item.GoogleBookId}
                      name={item.BookName}
                      photo={convertHttpToHttps(item.BookPhoto)}
                      type="ExternalBook"
                      price={item.BookPrice}
                      averageRating={item.BookAverageRating}
                      ratingCount={item.BookRatingCount}
                      buttonPressHandler={CoffeeCardAddToCart}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          )}
          </>
        }
        {
          !keyboardVisible && (
            <>
            {/* Genre Section */}
            <View style={styles.genresContainer}>
                <Text style={styles.sectionTitle}>What’s on Your Mind?</Text>

                {/* First Row */}
                <View style={styles.genreRow}>
                    {genres.slice(0, 3).map((data: string, index) => (
                      <TouchableOpacity
                        key={index.toString()}
                        style={[
                          styles.genreButton,
                          genreIndex.index === index && styles.selectedGenreButton,
                        ]}
                        onPress={() => {
                          setBooksLoading(true);
                          ListRef?.current?.scrollToOffset({
                            animated: true,
                            offset: 0,
                          });
                          setGenreIndex({index: index, genre: genres[index]});
                          setSortedCoffee(bookList);
                        }}>
                        <Text style={styles.genreButtonText}>{data}</Text>
                      </TouchableOpacity>
                    ))}
                </View>

                {/* Second Row */}
                <View style={styles.genreRow}>
                    {genres.slice(3, 6).map((data: string, index) => (
                      <TouchableOpacity
                        key={(index + 3).toString()}
                        style={[
                          styles.genreButton,
                          genreIndex.index === index + 3 && styles.selectedGenreButton,
                        ]}
                        onPress={() => {
                          setBooksLoading(true);
                          ListRef?.current?.scrollToOffset({
                            animated: true,
                            offset: 0,
                          });
                          setGenreIndex({index: index + 3, genre: genres[index + 3]});
                          setSortedCoffee(bookList);
                        }}>
                        <Text style={styles.genreButtonText}>{data}</Text>
                      </TouchableOpacity>
                    ))}
                </View>

                {/* Third Row */}
                <View style={styles.genreRow}>
                    {genres.slice(7, 10).map((data: string, index) => (
                      <TouchableOpacity
                        key={(index + 7).toString()}
                        style={[
                          styles.genreButton,
                          genreIndex.index === index + 7 && styles.selectedGenreButton,
                        ]}
                        onPress={() => {
                          setBooksLoading(true);
                          ListRef?.current?.scrollToOffset({
                            animated: true,
                            offset: 0,
                          });
                          setGenreIndex({index: index + 7, genre: genres[index + 7]});
                          setSortedCoffee(bookList);
                        }}>
                        <Text style={styles.genreButtonText}>{data}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>

              {/* Filtered Books by Genre */}
              {booksLoading ? (
                // Render shimmer effect while loading
                <View style={styles.shimmerFlex}>
                  <ShimmerPlaceholder
                  LinearGradient={LinearGradient}
                    style={styles.ShimmerPlaceholder}
                    shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
                    visible={!booksLoading}>
                  </ShimmerPlaceholder>
                  <ShimmerPlaceholder
                  LinearGradient={LinearGradient}
                    style={styles.ShimmerPlaceholder}
                    shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
                    visible={!setBooksLoading}>
                  </ShimmerPlaceholder>
                  <ShimmerPlaceholder
                  LinearGradient={LinearGradient}
                    style={styles.ShimmerPlaceholder}
                    shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
                    visible={!booksLoading}>
                  </ShimmerPlaceholder>
                </View>
              ) : (

                <FlatList
                  {...sortedCoffee.length === 0 && styles.hidden}
                  ref={ListRef}
                  horizontal
                  ListEmptyComponent={
                    <View style={styles.EmptyListContainer}>
                      <Text style={styles.genreText}>No Books found</Text>
                    </View>
                  }
                  showsHorizontalScrollIndicator={false}
                  data={sortedCoffee}
                  contentContainerStyle={styles.FlatListContainer}
                  keyExtractor={item => item.BookId}
                  renderItem={({item}) => {
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          navigation.push('Details', {
                            id: item.BookId,
                            type: "Book",
                          });
                        }}>
                        <CoffeeCard
                          id={item.BookId}
                          name={item.BookName}
                          photo={convertHttpToHttps(item.BookPhoto)}
                          type="Book"
                          price={item.BookPrice}
                          averageRating={item.BookAverageRating}
                          ratingCount={item.BookRatingCount}
                          buttonPressHandler={CoffeeCardAddToCart}
                        />
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
              {/* Spotlight Section */}
              <Text style={styles.sectionTitle}>In Spotlight</Text>
              <SpotlightBooks spotlights={spotlights} />

              {/* load infinite genres and books */}
            </>
          )
        }
      </Animated.ScrollView>
      {CartList.length > 0 && <FloatingIcon />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ShimmerPlaceholder: {
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
  hidden: {
    display: 'none',
  },
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  ScrollViewFlex: {
    flexGrow: 1,
  },
  InputContainerComponent: {
    marginTop: 80,
    flexDirection: 'row',
    margin: SPACING.space_30,
    borderRadius: BORDERRADIUS.radius_20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    alignItems: 'center',
  },
  InputIcon: {
    marginHorizontal: SPACING.space_20,
  },
  TextInputContainer: {
    flex: 1,
    height: SPACING.space_20 * 3,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  genreText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  FlatListContainer: {
    gap: SPACING.space_20,
    paddingVertical: SPACING.space_20,
    paddingHorizontal: SPACING.space_30,
  },
  EmptyListContainer: {
    width: Dimensions.get('window').width - SPACING.space_30 * 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_36 * 3.6,
  },
  CoffeeBeansTitle: {
    fontSize: FONTSIZE.size_18,
    marginLeft: SPACING.space_30,
    marginTop: SPACING.space_20,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.secondaryLightGreyHex,
  },
  sectionTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
    color: 'white',
    textAlign: 'center',
    marginVertical: SPACING.space_20,
  },
  genresContainer: {
    marginBottom: SPACING.space_20,
    paddingHorizontal: SPACING.space_10,
    alignItems: 'center',
  },
  genreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: SPACING.space_4,
  },
  genreButton: {
    backgroundColor: COLORS.primaryGreyHex,
    paddingVertical: SPACING.space_10,
    paddingHorizontal: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_10,
    marginHorizontal: SPACING.space_4,
  },
  genreButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    textAlign: 'center',
  },
  selectedGenreButton: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  welcomeMascot: {
    opacity: 0.5,
    marginTop: SPACING.space_32,
    marginBottom: SPACING.space_36,
    bottom: 40,
  },
  welcomeMessage: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    textAlign: 'center',
    color: COLORS.primaryWhiteHex,
  },
});

export default HomeScreen;