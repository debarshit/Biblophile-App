import React, {useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  ToastAndroid,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {FlatList} from 'react-native';
import {Dimensions} from 'react-native';
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
} from '../theme/theme';    //font poppings is not coming
import HeaderBar from '../components/HeaderBar';
import CoffeeCard from '../components/CoffeeCard';

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

const LibraryScreen = ({navigation}: any) => {
  //useStore variables
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const fetchGenres = useStore((state: any) => state.fetchGenres);  //this function should run on mount
  const GenreList = useStore((state: any) => state.GenreList);

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
  const [bookmarks, setBookmarks] = useState<any>([]);
  const [sortedCoffee, setSortedCoffee] = useState<any>(
    getBookList(genreIndex.genre),
  );
  const [externalBooks, setExternalBooks] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [booksLoading, setBooksLoading] = useState(true);

  const ListRef: any = useRef<FlatList>();
  const tabBarHeight = useBottomTabBarHeight();

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
    async function getBookmarks() {
        try {
            const response = await instance(requests.getBookmarks);
            const data = response.data;
            setBookmarks(data);
            setLoading(false);
          } catch (error) {
            console.error('Error fetching bookmarks:', error);
          }
    }
  
    getBookmarks();
  }, []);

  return (
    <SafeAreaView style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        {/* App Header */}
        <HeaderBar title="Home Screen"/>

        <Text style={styles.ScreenTitle}>
          Find the best{'\n'}book for you
        </Text>

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

        {/* genre Scroller */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreScrollViewStyle}>
          {genres.map((data: string, index) => (
            <View
              key={index.toString()}
              style={styles.genreScrollViewContainer}>
              <TouchableOpacity
                style={styles.genreScrollViewItem}
                onPress={() => {
                  setBooksLoading(true);
                  ListRef?.current?.scrollToOffset({
                    animated: true,
                    offset: 0,
                  });
                  setGenreIndex({index: index, genre: genres[index]});
                  setSortedCoffee(bookList);
                }}>
                <Text
                  style={[
                    styles.genreText,
                    genreIndex.index == index
                      ? {color: COLORS.primaryOrangeHex}
                      : {},
                  ]}>
                  {data}
                </Text>
                {genreIndex.index == index ? (
                  <View style={styles.Activegenre} />
                ) : (
                  <></>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Books Flatlist */}
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

      {/* External Books FlatList */}
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

        <Text style={styles.CoffeeBeansTitle}>Smart Bookmarks</Text>

        {/* Bookmarks Flatlist */}
        {loading ? (
        // Render shimmer effect while loading
          <View style={styles.shimmerFlex}>
            <ShimmerPlaceholder
            LinearGradient={LinearGradient}
              style={styles.ShimmerPlaceholder}
              shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
              visible={!loading}>
            </ShimmerPlaceholder>
            <ShimmerPlaceholder
            LinearGradient={LinearGradient}
              style={styles.ShimmerPlaceholder}
              shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
              visible={!loading}>
            </ShimmerPlaceholder>
            <ShimmerPlaceholder
            LinearGradient={LinearGradient}
              style={styles.ShimmerPlaceholder}
              shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
              visible={!loading}>
            </ShimmerPlaceholder>
          </View>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={bookmarks}
            contentContainerStyle={[
              styles.FlatListContainer,
              {marginBottom: tabBarHeight},
            ]}
            keyExtractor={item => item.BookmarkId}
            renderItem={({item}) => {
              return (
                <TouchableOpacity
                  onPress={() => {
                    navigation.push('Details', {
                      id: item.BookmarkId,
                      type: "Bookmark",
                    });
                  }}>
                  <CoffeeCard
                    id={item.BookmarkId}
                    name={item.BookmarkTitle}
                    photo={convertHttpToHttps(item.BookmarkPhoto)}
                    type="Bookmark"
                    price={item.BookmarkPrice}
                    averageRating={null}
                    ratingCount={null}
                    buttonPressHandler={CoffeeCardAddToCart}
                  />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </ScrollView>
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
  ScreenTitle: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    paddingLeft: SPACING.space_30,
  },
  InputContainerComponent: {
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
  genreScrollViewStyle: {
    paddingHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_20,
  },
  genreScrollViewContainer: {
    paddingHorizontal: SPACING.space_15,
  },
  genreScrollViewItem: {
    alignItems: 'center',
  },
  genreText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  Activegenre: {
    height: SPACING.space_10,
    width: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryOrangeHex,
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
});

export default LibraryScreen;
