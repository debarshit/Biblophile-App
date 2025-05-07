import React, {useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  ToastAndroid,
  Animated,
  FlatList,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Spotlights from '../components/Spotlights';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import {useStore} from '../../../store/store';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';
import FloatingIcon from '../../bookshop/components/FloatingIcon';
import GenrePicker from '../components/GenrePicker';

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

const DiscoverScreen = ({navigation}: any) => {
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
  const [genreIndex, setGenreIndex] = useState({
    index: 0,
    genre: genres[0],
  });
  const [bookList, setBookList] = useState<any>(getBookList(genreIndex.genre));
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [sortedCoffee, setSortedCoffee] = useState<any>(
    getBookList(genreIndex.genre),
  );
  const [loading, setLoading] = useState(true);

  const ListRef: any = useRef<FlatList>();
  const tabBarHeight = useBottomTabBarHeight();

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}
        scrollEventThrottle={16}
      >
        {/* App Header */}
        <HeaderBar title=""/>

        {/* Search Input */}
        <TouchableOpacity
            onPress={() => {
              navigation.navigate('SearchScreen', {
                CoffeeCardAddToCart: CoffeeCardAddToCart,
              })
            }}>
        <View style={styles.InputContainerComponent}>
            <Feather
              style={styles.InputIcon}
              name="search"
              size={FONTSIZE.size_18}
              color={COLORS.primaryLightGreyHex}
            />
          <TextInput
            editable={false}
            placeholder="Find Your Book..."
            placeholderTextColor={COLORS.primaryLightGreyHex}
            style={styles.TextInputContainer}
          />
        </View>
        </TouchableOpacity>

        {/* Genre Section */}
        <GenrePicker genres={genres} CoffeeCardAddToCart={CoffeeCardAddToCart}/>
        {/* Spotlight Section */}
        <Spotlights spotlights={spotlights} />

      </Animated.ScrollView>
      {CartList.length > 0 && <FloatingIcon />}
    </SafeAreaView>
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

export default DiscoverScreen;