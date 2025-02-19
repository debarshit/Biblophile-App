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
  Image,
  Linking,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {FlatList} from 'react-native';
import {Dimensions} from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import instance from '../../services/axios';
import requests from '../../services/requests';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import { AntDesign, Feather } from '@expo/vector-icons';
import {useStore} from '../../store/store';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../theme/theme';
import HeaderBar from '../../components/HeaderBar';
import CoffeeCard from '../../components/CoffeeCard';
import FloatingIcon from '../../components/FloatingIcon';

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
  const [sortedCoffee, setSortedCoffee] = useState<any>(
    getBookList(genreIndex.genre),
  );
  const [booksLoading, setBooksLoading] = useState(true);

  const tabBarHeight = useBottomTabBarHeight();

  const ListRef: any = useRef<FlatList>();

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

  const openShopLink = () => {
    Linking.openURL('https://shop.biblophile.com/shop/1/Bookmarks').catch((err) =>
      console.error('An error occurred while opening the URL', err)
    );
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

        <Text style={styles.CoffeeBeansTitle}>Smart Bookmarks</Text>

        {/* Checkout Bookmarks shop */}
        <View style={[styles.merchShopSection, { marginBottom: tabBarHeight+SPACING.space_2 }]}>
          <TouchableOpacity onPress={openShopLink} style={styles.bannerContainer}>
            <Image
              source={{ uri: 'https://ik.imagekit.io/umjnzfgqh/shop/common_assets/banners/banner-large.png' }}
              style={styles.bannerImage}
            />
            <Text style={styles.merchShopTitle}>Check Out Our Smart bookmarks!</Text>
            <Text style={styles.merchShopDescription}>Browse our latest bookmarks, only for book lovers like you.</Text>
            <View style={styles.buttonContainer}>
              <Text style={styles.shopButton}>Visit Our Shop</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
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
  merchShopSection: {
    marginVertical: SPACING.space_24,
    marginHorizontal: SPACING.space_4,
    padding: SPACING.space_4,
  },
  bannerContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_15,
    shadowColor: COLORS.primaryBlackHex,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  bannerImage: {
    width: '100%',
    aspectRatio: 4.5,
    borderRadius: BORDERRADIUS.radius_15,
    marginBottom: SPACING.space_4,
  },
  merchShopTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_2,
  },
  merchShopDescription: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  shopButton: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    color: COLORS.primaryWhiteHex,
    paddingVertical: SPACING.space_2,
    paddingHorizontal: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    textAlign: 'center',
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
  },
});

export default LibraryScreen;
