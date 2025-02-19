import React, {useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ToastAndroid,
  Animated,
  FlatList,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import Toast from 'react-native-toast-message';
import SpotlightBooks from '../components/SpotlightBooks';
import instance from '../services/axios';
import requests from '../services/requests';
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
import Banner from '../components/Banner';
import Mascot from '../components/Mascot';
import FloatingIcon from '../components/FloatingIcon';

interface Spotlight {
  Id: string;
  Photo: string;
  Name: string;
}

const HomeScreen = ({navigation}: any) => {
  //useStore variables
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const CartList = useStore((state: any) => state.CartList);

  //useState variables
  const [bannerOpacity, setBannerOpacity] = useState(1);
  const [bookList, setBookList] = useState<any>([]);
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [booksLoading, setBooksLoading] = useState(true);

  const ListRef: any = useRef<FlatList>();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);
  const scrollOffset = useRef(new Animated.Value(0)).current;

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
    Linking.openURL('https://shop.biblophile.com').catch((err) =>
      console.error('An error occurred while opening the URL', err)
    );
  };

  useEffect(() => {
    async function fetchBookList() {
      try {
        const response = await instance(requests.getBooks+'All');
        const data = response.data;
        setBookList(data);
        setBooksLoading(false);
      } catch (error) {
        console.error('Error fetching book list:', error);
      }
    }
  
    fetchBookList();
  }, []);

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
        <HeaderBar title="Home Screen"/>

        <Banner />
 
        {/* Spotlight Section */}
        <Text style={styles.spotlightTitle}>In Spotlight</Text>
        <SpotlightBooks spotlights={spotlights} />

        {/* Checkout bookshop */}
        <View style={styles.bookshopSection}>
          <View style={styles.headerContainer}>
            <Text style={styles.bookshopText}>Bookshop</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Shop')}>
              <Text style={styles.seeMoreText}>See More</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            {...bookList.length === 0 && styles.hidden}
            ref={ListRef}
            horizontal
            ListEmptyComponent={
              <View style={styles.EmptyListContainer}>
                <Text style={styles.infoText}>No Books found</Text>
              </View>
            }
            showsHorizontalScrollIndicator={false}
            data={bookList}
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
        </View>

        {/* Checkout merch shop */}
        <View style={styles.merchShopSection}>
          <TouchableOpacity onPress={openShopLink} style={styles.bannerContainer}>
            <Image
              source={{ uri: 'https://ik.imagekit.io/umjnzfgqh/shop/common_assets/banners/banner-large.png' }}
              style={styles.bannerImage}
            />
            <Text style={styles.merchShopTitle}>Check Out Our Exclusive Merch!</Text>
            <Text style={styles.merchShopDescription}>Browse our latest merchandise, only for book lovers like you.</Text>
            <View style={styles.buttonContainer}>
              <Text style={styles.shopButton}>Visit Our Shop</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* biblo jan and made with love in India */}
        <View style={styles.welcomeMascot}>
          <Mascot emotion="pendingBooks"/>
          <Text style={styles.welcomeMessage}>From India, with love for readers</Text>
        </View>

      </Animated.ScrollView>
      {CartList.length > 0 && <FloatingIcon />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  infoText: {
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
  spotlightTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
    color: 'white',
    textAlign: 'center',
    marginVertical: SPACING.space_20,
    marginTop: 100,
  },
  bookshopSection: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    marginTop: SPACING.space_24,
    marginBottom: SPACING.space_24,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: SPACING.space_10,
  },
  bookshopText: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryLightGreyHex,
  },
  seeMoreText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryOrangeHex,
    paddingRight: SPACING.space_10,
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
