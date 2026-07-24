import React, { useEffect, useMemo, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
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
import PersonalisedRecommendations from '../components/PersonalisedRecommendations';
import SimilarToYourReads from '../components/SimilarToYourReads';
import AIRecommendationsSection from '../components/AIRecommendationsSection';
import MerchShopBanner from '../../../components/MerchShopBanner';
import FilteredRecommendationsModal from '../components/FilteredRecommendationsModal';
import { useAnalytics } from '../../../utils/analytics';
import { useTheme } from '../../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const DiscoverScreen = ({ navigation }) => {
  // Global state from store
  const addToCart = useStore((state) => state.addToCart);
  const calculateCartPrice = useStore((state) => state.calculateCartPrice);
  const fetchGenres = useStore((state) => state.fetchGenres);
  const GenreList = useStore((state) => state.GenreList);
  const CartList = useStore((state) => state.CartList);

  // Local state
  const [spotlights, setSpotlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [reviewTags, setReviewTags] = useState({});

  const analytics = useAnalytics();
  const tabBarHeight = useBottomTabBarHeight();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

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

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data } = await instance.get(requests.fetchReviewTags);
        setReviewTags(data.data || {});
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    };
    fetchTags();
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
        <HeaderBar showLogo showNotifications />

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
              placeholder="Find Your Book, friends..."
              placeholderTextColor={COLORS.primaryLightGreyHex}
              style={styles.textInputContainer}
            />
          </View>
        </TouchableOpacity>

        {/* Book giveaway */}
        {/* <BookGiveaway /> */}

        {/* Spotlight Section */}
        <Spotlights spotlights={spotlights} />

        {/* Giveaways & ARCs entry point */}
        <View style={styles.readerPerksRow}>
          <TouchableOpacity
            style={styles.perkCard}
            onPress={() => navigation.navigate('Giveaways')}
            activeOpacity={0.85}
          >
            <Text style={styles.perkEmoji}>🎁</Text>
            <Text style={styles.perkTitle}>Giveaways</Text>
            <Text style={styles.perkSubtitle}>Win free books — no review needed</Text>
            <View style={styles.perkArrow}>
              <Text style={styles.perkArrowText}>Enter →</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.perkCard, styles.perkCardARC]}
            onPress={() => navigation.navigate('AdvanceReadingCopies')}
            activeOpacity={0.85}
          >
            <Text style={styles.perkEmoji}>📖</Text>
            <Text style={styles.perkTitle}>ARCs</Text>
            <Text style={styles.perkSubtitle}>Read before anyone else</Text>
            <View style={styles.perkArrow}>
              <Text style={styles.perkArrowText}>Apply →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Filtered Recommendations */}
        <View
          style={{
            marginHorizontal: SPACING.space_20,
            backgroundColor: COLORS.primaryDarkGreyHex,
            borderRadius: BORDERRADIUS.radius_20,
            padding: SPACING.space_20,
            marginBottom: SPACING.space_20,
          }}
        >
          <Text style={[styles.headerTitle, { marginHorizontal: 0, marginTop: 0 }]}>
            Let us help you discover your next read
          </Text>
          <Text
          style={{
            color: COLORS.primaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
            marginTop: SPACING.space_8,
          }}
        >
          Choose your favorite moods or styles to personalize suggestions
        </Text>
          <TouchableOpacity
            onPress={() => {
              analytics.track('discover_filter_opened');
              setIsFilterModalVisible(true);
            }}
            style={{
              backgroundColor: COLORS.primaryOrangeHex,
              paddingVertical: SPACING.space_12,
              borderRadius: BORDERRADIUS.radius_15,
              alignItems: "center",
              marginTop: SPACING.space_12,
            }}
          >
            <Text
              style={{
                color: COLORS.primaryWhiteHex,
                fontFamily: FONTFAMILY.poppins_medium,
                fontSize: FONTSIZE.size_14,
              }}
            >
              🔍 Filter Recommendations
            </Text>
          </TouchableOpacity>
        </View>

        {/* Personalised Recommendations — social circle picks */}
        <PersonalisedRecommendations />

        {/* Similar to Your Reads — taste-based picks */}
        <SimilarToYourReads />

        {/* Seasonal reccos */}
        <SeasonalRecommendations />

        {/* Genre Section */}
        <GenrePicker 
          genres={GenreList.length > 0 ? ['All', ...new Set(GenreList.map(item => item.genre))] : ['All']} 
          CoffeeCardAddToCart={handleAddToCart} 
        />

        {/* Checkout Bookmarks shop */}
        {/* <MerchShopBanner /> */}

        {/* Indian voices */}
        {/* <CulturalRecommendations /> */}

        {/* AI Picks — Gemini curated */}
        {/* <AIRecommendationsSection /> */}

        {/* New releases/Trending/Must reads */}
        {/* <HotRecommendations /> */}

      </Animated.ScrollView>
      
      {CartList.length > 0 && <FloatingIcon />}

      <FilteredRecommendationsModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        tags={reviewTags}
      />
    </SafeAreaView>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
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
  headerTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    marginHorizontal: SPACING.space_30,
    marginTop: SPACING.space_30,
    marginBottom: SPACING.space_15,
    color: COLORS.primaryWhiteHex,
  },
  readerPerksRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.space_20,
    gap: SPACING.space_12,
    marginTop: SPACING.space_20,
    marginBottom: SPACING.space_8,
  },
  perkCard: {
    flex: 1,
    backgroundColor: 'rgba(209,120,66,0.12)',
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_16,
    borderWidth: 1,
    borderColor: 'rgba(209,120,66,0.3)',
  },
  perkCardARC: {
    backgroundColor: 'rgba(53,99,220,0.1)',
    borderColor: 'rgba(53,99,220,0.3)',
  },
  perkEmoji: {
    fontSize: 28,
    marginBottom: SPACING.space_8,
  },
  perkTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  perkSubtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    lineHeight: 18,
    marginBottom: SPACING.space_12,
  },
  perkArrow: {
    alignSelf: 'flex-start',
  },
  perkArrowText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
  },
});

export default DiscoverScreen;