import React, {useEffect, useRef, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ToastAndroid,
} from 'react-native';    //replace with a toast message compatible with both android & ios, add safeview for topmost view 
import {FlatList} from 'react-native';
import {Dimensions} from 'react-native';
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


const getGenresFromData = (data: any) => {  //optimise this function as it only has to fetch bookGenres
  let temp: any = {};
  for (let i = 0; i < data.length; i++) {
    if (temp[data[i].genre] == undefined) {
      temp[data[i].genre] = 1;
    } else {
      temp[data[i].genre]++;
    }
  }
  let genres = Object.keys(temp);
  genres.unshift('All');
  return genres;
};

const getBookList = async (genre: string) => {
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
  const CoffeeList = useStore((state: any) => state.CoffeeList);
  const BeanList = useStore((state: any) => state.BeanList);
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
  const [bookList, setBookList] = useState(getBookList(genreIndex.genre));
  const [sortedCoffee, setSortedCoffee] = useState(
    getBookList(genreIndex.genre),
  );

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
        try {
          const response = await instance(requests.searchBooks + search);
          const data = response.data;
          setSortedCoffee(data);
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

  const CoffeCardAddToCart = ({
    id,
    name,
    genre,
    imagelink_square,
    type,
    prices,
  }: any) => {
    addToCart({
      id,
      name,
      genre,
      imagelink_square,
      type,
      prices,
    });
    calculateCartPrice();
    ToastAndroid.showWithGravity(
      `${name} is Added to Cart`,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
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
    // Fetch book list when genreIndex changes
    async function fetchBookList() {
      try {
        const response = await instance(requests.getBooks + genreIndex.genre);
        const data = response.data;
        setBookList(data);
        setSortedCoffee(data);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    }

    fetchBookList();
  }, [genreIndex]);

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        {/* App Header */}
        <HeaderBar />

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
          {genres.map((data, index) => (
            <View
              key={index.toString()}
              style={styles.genreScrollViewContainer}>
              <TouchableOpacity
                style={styles.genreScrollViewItem}
                onPress={() => {
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

        {/* Coffee Flatlist */}

        <FlatList
          ref={ListRef}
          horizontal
          ListEmptyComponent={
            <View style={styles.EmptyListContainer}>
              <Text style={styles.genreText}>No Books Available</Text>
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
                    price: item.BookPrice,
                    name: item.BookName,
                    genre: item.BookGenre,
                    poster: item.BookPoster,
                    photo: item.BookPhoto,
                    averageRating: item.BookAverageRating,
                    ratingCount: item.BookRatingCount,
                    description: item.BookDescription,
                  });
                }}>
                <CoffeeCard
                  id={item.BookId}
                  type="Book"
                  genre={item.BookGenre}
                  imagelink_square={item.BookPhoto}
                  name={item.BookName}
                  average_rating={item.BookAverageRating}
                  price={item.BookPrice}
                  buttonPressHandler={CoffeCardAddToCart}
                />
              </TouchableOpacity>
            );
          }}
        />

        <Text style={styles.CoffeeBeansTitle}>Pick of the week</Text>

        {/* Beans Flatlist */}

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={bookList}
          contentContainerStyle={[
            styles.FlatListContainer,
            {marginBottom: tabBarHeight},
          ]}
          keyExtractor={item => item.id}
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
                  genre={item.BookGenre}
                  type={"Book"}
                  imagelink_square={item.BookPhoto}
                  name={item.BookName}
                  average_rating={item.BookAverageRating}
                  price={item.BookPrice}
                  buttonPressHandler={CoffeCardAddToCart}
                />
              </TouchableOpacity>
            );
          }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default HomeScreen;
