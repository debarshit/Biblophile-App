import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Feather } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

// Components
import Spotlights from '../components/Spotlights';
import HeaderBar from '../../../components/HeaderBar';
import FloatingIcon from '../../bookshop/components/FloatingIcon';
import GenrePicker from '../components/GenrePicker';

// Services and utilities
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import SeasonalRecommendations from '../components/SeasonalRecommendations';
import BookGiveaway from '../components/BookGiveaway';
import HotRecommendations from '../components/HotRecommendations';
import CulturalRecommendations from '../components/CulturalRecommendations';
import MerchShopBanner from '../../../components/MerchShopBanner';

const DiscoverScreen = ({ navigation }) => {
  // Global state from store
  const { addToCart, calculateCartPrice, fetchGenres, GenreList, CartList } = useStore((state) => ({
    addToCart: state.addToCart,
    calculateCartPrice: state.calculateCartPrice,
    fetchGenres: state.fetchGenres,
    GenreList: state.GenreList,
    CartList: state.CartList,
  }));

  // Local state
  const [spotlights, setSpotlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const tabBarHeight = useBottomTabBarHeight();

  // Add to cart handler
  const handleAddToCart = (bookData) => {
    addToCart(bookData);
    calculateCartPrice();
    
    const message = `${bookData.name} is Added to Cart`;
    
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        message,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );
    } else {
      Toast.show({
        type: 'info',
        text1: message,
        visibilityTime: 2000,
        autoHide: true,
        position: 'bottom',
        bottomOffset: 100,
      });
    }
  };

  // Fetch genres and spotlights on component mount
  useEffect(() => {
    fetchGenres();
    
    const getSpotlights = async () => {
      try {
        const response = await instance(requests.getSpotlight);
        const responseData = response.data;
        setSpotlights(responseData.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching spotlights:', error);
        setLoading(false);
      }
    };
    
    getSpotlights();
  }, []);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollViewFlex,
          { paddingBottom: tabBarHeight }
        ]}
        scrollEventThrottle={16}
      >
        {/* App Header */}
        <HeaderBar title="" />

        {/* Search Input */}
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('SearchScreen', {
              CoffeeCardAddToCart: handleAddToCart,
            });
          }}
        >
          <View style={styles.inputContainerComponent}>
            <Feather
              style={styles.inputIcon}
              name="search"
              size={FONTSIZE.size_18}
              color={COLORS.primaryLightGreyHex}
            />
            <TextInput
              editable={false}
              pointerEvents="none"
              placeholder="Find Your Book..."
              placeholderTextColor={COLORS.primaryLightGreyHex}
              style={styles.textInputContainer}
            />
          </View>
        </TouchableOpacity>

        {/* Book giveaway */}
        {/* <BookGiveaway /> */}

        {/* Spotlight Section */}
        <Spotlights spotlights={spotlights} />

        {/* Seasonal reccos */}
        <SeasonalRecommendations />

        {/* Genre Section */}
        <GenrePicker 
          genres={GenreList.length > 0 ? ['All', ...new Set(GenreList.map(item => item.genre))] : ['All']} 
          CoffeeCardAddToCart={handleAddToCart} 
        />

        {/* Checkout Bookmarks shop */}
        <MerchShopBanner />

        {/* Indian voices */}
        <CulturalRecommendations />

        {/* New releases/Trending/Must reads */}
        <HotRecommendations />

      </Animated.ScrollView>
      
      {CartList.length > 0 && <FloatingIcon />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  scrollViewFlex: {
    flexGrow: 1,
  },
  inputContainerComponent: {
    flexDirection: 'row',
    margin: SPACING.space_30,
    borderRadius: BORDERRADIUS.radius_20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    alignItems: 'center',
  },
  inputIcon: {
    marginHorizontal: SPACING.space_20,
  },
  textInputContainer: {
    flex: 1,
    height: SPACING.space_20 * 3,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
});

export default DiscoverScreen;