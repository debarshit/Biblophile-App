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
import Svg, { G, Path } from 'react-native-svg';

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

const PerkLineArt = ({ variant, color }: { variant: 'giveaway' | 'arc'; color: string }) => (
  <Svg
    width={132}
    height={132}
    viewBox="0 0 132 132"
    fill="none"
    style={perkArtStyles.art}
    pointerEvents="none"
  >
    {variant === 'giveaway' ? (
      <G transform="scale(1.03125) translate(63,-65)" fill={color}>
        <Path d="M-49.1,157.8c6.5,0,11.8,5.3,11.8,11.8c0,6.5-5.3,11.8-11.8,11.8s-11.8-5.3-11.8-11.8C-60.9,163.1-55.7,157.8-49.1,157.8z M62.9,168.7l-22.2-22.2l0,0c-1.3-1.3-3.3-2.2-5.2-2.2c-2.1,0-3.8,0.9-5.2,2.2l-14.2,14.2c-0.9-0.6-1.8-0.9-2.8-1.2 c-6.2-1.5-12.7-2.4-19.4-2.8v-16.3l0,0L4.5,130l-25.1-25.1l-25.1,8.4l8.4,8.4l-4.1,4.1l25.1,25.1v5.9c-9,0.9-16.1,7.7-17.6,16.5 c0,0-0.1,1.2-0.1,1.5c0,3.7,3,6.6,6.6,6.6h16.3c0,0,0,0,0.1,0c0,0,0,0,0.1,0h24.4c1.8,0.1,3.7-0.6,5.2-1.9c0.1-0.1,0.4-0.4,0.4-0.4 l16.7-16.7l16.8,16.8c3,3,7.5,3,10.5,0C65.7,176.3,65.7,171.5,62.9,168.7z M-37.3,125.9l16.7-16.7L0.2,130l-7.4,7.4 c-1-1-2.5-1.9-4.1-1.9c-2.8,0-5.2,2.4-5.2,5.2v6.2L-37.3,125.9z" />
      </G>
    ) : (
      <G transform="scale(0.266)" fill={color}>
        <Path d="M248,96c35.544,0,78.12,7.792,78.544,7.864l23.208,4.288L333.928,90.64C332.656,89.224,302.032,56,248,56 c-54.032,0-84.656,33.224-85.936,34.64l-15.824,17.52l23.208-4.288C169.88,103.792,212.456,96,248,96z M248,72 c19.744,0,35.984,5.2,48.184,11.232C281.68,81.504,264.296,80,248,80c-16.376,0-33.832,1.52-48.376,3.248 C211.8,77.216,228.088,72,248,72z" />
        <Path d="M256,464h16v32h-16z" />
        <Path d="M452,400c-1.352,0-2.68,0.08-4,0.2v-60.232C448,324.544,435.456,312,420.032,312c-3.752,0-7.4,0.736-10.848,2.184 L383.496,325c-5.632-2.336-11.304-4.272-16.928-5.52L304,305.584V296h88V112c0-28.328-21.144-51.808-48.472-55.496 c-3.032-23.984-20.44-43.976-44.4-49.968C281.776,2.192,263.904,0,246.032,0h-7.04c-10.296,0-20.72,0.744-30.968,2.192 C148.72,10.672,104,62.24,104,122.152V296h88v9.584l-62.56,13.896c-5.624,1.248-11.296,3.184-16.928,5.52l-25.688-10.816 C83.368,312.736,79.72,312,75.968,312C60.544,312,48,324.544,48,339.968V400.2c-1.32-0.12-2.648-0.2-4-0.2 c-24.256,0-44,19.744-44,44v52h16v-52c0-15.44,12.56-28,28-28s28,12.56,28,28v52h16v-52c0-17.056-9.776-31.84-24-39.144v-64.888 c0-6.6,5.368-11.968,11.968-11.968c1.608,0,3.168,0.312,4.648,0.936L224,389.312V496h16V392h16v56h16v-58.688l143.384-60.376 c1.472-0.624,3.04-0.936,4.648-0.936c6.6,0,11.968,5.368,11.968,11.968v64.888c-14.224,7.296-24,22.088-24,39.144v52h16v-52 c0-15.44,12.56-28,28-28s28,12.56,28,28v52h16v-52C496,419.744,476.256,400,452,400z M120,280V122.152 c0-51.992,38.816-96.76,90.28-104.112c9.504-1.352,19.168-2.04,28.712-2.04h7.04c16.568,0,33.136,2.04,49.224,6.056 C314.528,26.88,328,44.128,328,64v8h8c22.056,0,40,17.944,40,40v168h-64.712C331.296,262.392,344,236.68,344,208v-88h-16v2.608 C317.248,126.672,288.192,136,248,136c-40.192,0-69.248-9.328-80-13.392V120h-16v88c0,28.68,12.704,54.392,32.712,72H120z M168,208v-68.368C182.672,144.6,210.76,152,248,152s65.328-7.4,80-12.368V208c0,44.112-35.888,80-80,80S168,252.112,168,208z M288,295.16V312c0,17.648-14.352,32-32,32h-16c-17.648,0-32-14.352-32-32v-16.84c12.192,5.616,25.712,8.84,40,8.84 C262.288,304,275.808,300.776,288,295.16z M155.136,338.856c-0.56,1.128-0.968,2.32-1.44,3.488l-18.432-7.76l24.76-5.504 L155.136,338.856z M218.888,369.8l-50.48-21.256c0.336-0.848,0.624-1.712,1.04-2.528l10.704-21.408L193,321.752 c3.832,18.504,18.36,33.128,36.8,37.136L218.888,369.8z M235.312,376L248,363.312L260.688,376H235.312z M277.112,369.8 L266.2,358.888c18.44-4.008,32.968-18.624,36.8-37.136l12.848,2.856l10.704,21.408c0.408,0.816,0.704,1.68,1.04,2.528 L277.112,369.8z M342.304,342.344c-0.472-1.168-0.872-2.352-1.44-3.488l-4.888-9.776l24.76,5.504L342.304,342.344z" />
      </G>
    )}
  </Svg>
);
const perkArtStyles = StyleSheet.create({
  art: {
    position: 'absolute',
    right: -31,
    bottom: -19,
  },
});

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

        {/* Spotlight Section */}
        <Spotlights spotlights={spotlights} />

        {/* Giveaways & ARCs entry point */}
        <View style={styles.readerPerksRow}>
          <TouchableOpacity
            style={styles.perkCard}
            onPress={() => navigation.navigate('Giveaways')}
            activeOpacity={0.85}
          >
            <PerkLineArt variant="giveaway" color="rgba(209,120,66,0.30)" />
            <Text style={styles.perkTitle}>Giveaways</Text>
            <Text style={styles.perkSubtitle}>Win free books</Text>
            <View style={styles.perkArrow}>
              <Text style={styles.perkArrowText}>Enter →</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.perkCard, styles.perkCardARC]}
            onPress={() => navigation.navigate('AdvanceReadingCopies')}
            activeOpacity={0.85}
          >
            <PerkLineArt variant="arc" color="rgba(103,139,244,0.32)" />
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
    minHeight: 190,
    overflow: 'hidden',
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