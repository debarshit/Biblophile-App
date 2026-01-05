import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useStore} from '../../../store/store';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import ImageBackgroundInfo from '../components/ImageBackgroundInfo';
import PaymentFooter from '../../payment/components/PaymentFooter';
import ProductReview from '../components/ProductReview';
import ReadTogetherLinks from '../components/ReadTogetherLinks';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCity } from '../../../contexts/CityContext';
import DescriptionTab from '../components/DescriptionTab';
import TabNavigator from '../components/TabNavigator';
import BuyOptionsModal from '../../bookshop/components/BuyOptionsModal';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import { useAnalytics } from '../../../utils/analytics';

const DetailsScreen = ({navigation, route}: any) => {
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const userDetails = useStore((state: any) => state.userDetails);
  const { selectedCity } = useCity();
  const analytics = useAnalytics();

  const [id, setId] = useState(route.params.id);
  const [type, setType] = useState(route.params.type);
  const [isGoogleBook, setIsGoogleBook] = useState(false); 

  const [subscription, setSubscription] = useState(false);
  const [product, setProduct] = useState<any>({});
  const [activeTab, setActiveTab] = useState('description');
  const [buyModalVisible, setBuyModalVisible] = useState(false);

  const getPrices = () => {
    if (type === 'Book' || type === 'ExternalBook' ) {
      const prices = [
        { size: 'Buy', price: product['ProductPrice'] || null, currency: '₹' }
      ];
  
      //display rent price only for Bengaluru and only for Books
      if (type === 'Book' && selectedCity == 'Bengaluru' && product['ProductRentPrice']) {
        const rentPrice = product['ProductRentPrice'];
        prices.push({
          size: 'Rent',
          price: subscription === true ? '0' : rentPrice,
          currency: '₹',
        });
      }
      return prices;
    }
    return [];
  };

  const [actualPrice, setActualPrice] = useState(0);  //used as a hook to fetch initial price after screen load
  const [prices, setPrices] = useState(getPrices());
  const [price, setPrice] = useState(prices[0] || { size: '', price: 0, currency: '₹' });
  const [fullDesc, setFullDesc] = useState(false);
  const [favourite, setFavourite] = useState(false);

  const { action, productId, productType } = route.params || {}; // Ensure params exist

  //handle the deep linked function
  const handleAction = (action) => {
    if (action === 'fetchProductDetails') {
        setId(productId);
        setType(productType);
    }
  };

  const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '');
  };

  const BackHandler = () => {
    if (navigation.canGoBack()) {
      navigation.pop();
    } else {
      navigation.navigate('Tab');
    }
  };

  const handleBuyOptions = () => {
    setBuyModalVisible(true);
  };

  const handleBuyOptionSelect = (option) => {
    if (option === "direct") {
      // Set the price to Buy price and add to cart
      const buyPrice = prices.find(item => item.size === "Buy");
      if (buyPrice) {
        setPrice(buyPrice);
        addToCarthandler({
          id: id,
          name: product['ProductName'],
          photo: convertHttpToHttps(product['ProductPhoto']),
          type: type,
          price: buyPrice,
        });
      }
    }
    // Amazon option is handled within the modal itself
  };

  const addToCarthandler = ({
    id,
    name,
    photo,
    type,
    price,
  }: any) => {
    addToCart({
      id,
      name,
      photo,
      type, 
      prices: [{...price, quantity: 1}],
    });
    calculateCartPrice();
    navigation.navigate('Cart');
  };

  useEffect(() => {
    async function fetchActivePlan() {
        try {
            const response = await instance(requests.fetchActivePlan, {
              headers: {
                Authorization: `Bearer ${userDetails[0].accessToken}`,
              },
            });
            const data = response.data.data;
            if (data[0].PlanId !== null) {
              setSubscription(true);
            }
          } catch (error) {
            console.error('Error fetching plans:', error);
          }
    }
  
    fetchActivePlan();
  }, []);

  useEffect(() => {
    const currentId = route.params?.id;
    const currentType = route.params?.type;

    if (!currentId || !currentType) return;

    setId(currentId);
    setType(currentType);

    async function fetchProductDetails() {
      try {
        // Handle deep link action if present
        if (action) {
          handleAction(action);
        }

        let response;
        if (currentType === 'ExternalBook') {
          response = await instance(`${requests.fetchExternalBookDetails(currentId)}`);
          setIsGoogleBook(true);
        } else {
          response = await instance(`${requests.fetchWorkDetails(currentId)}?type=${currentType}&userCity=${selectedCity}`);
          setIsGoogleBook(false);
        }

        const data = response.data.data;
        setProduct(data);
        
        const fetchedPrice = data.ProductPrice || data.saleInfo?.listPrice?.amount;
        setActualPrice(fetchedPrice);

        const updatedPrices = calculatePricesFromData(data, currentType);
        setPrices(updatedPrices);
        setPrice(updatedPrices[0] || { size: '', price: 0, currency: '₹' });

        analytics.track('view_item', {
          item_id: currentId,
          is_google_book: currentType === 'ExternalBook',
          item_name: data['ProductName'] || data['volumeInfo']?.title || '',
        });
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    }

    fetchProductDetails();
  }, [route.params?.id, route.params?.type, selectedCity, subscription]);

  const calculatePricesFromData = (productData, productType) => {
    if (productType === 'Book' || productType === 'ExternalBook') {
      const prices = [
        { size: 'Buy', price: productData['ProductPrice'] || null, currency: '₹' }
      ];
      // Display rent price only for Bengaluru and only for Books
      if (productType === 'Book' && selectedCity === 'Bengaluru' && productData['ProductRentPrice']) {
        const rentPrice = productData['ProductRentPrice'];
        prices.push({
          size: 'Rent',
          price: subscription === true ? '0' : rentPrice,
          currency: '₹',
        });
      }
      return prices;
    }
    return [];
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <DescriptionTab
            product={product}
            isGoogleBook={isGoogleBook}
            fullDesc={fullDesc}
            setFullDesc={setFullDesc}
            prices={prices}
            price={price}
            setPrice={setPrice}
            type={type}
            id={id}
            actualPrice={actualPrice}
            userDetails={userDetails}
            stripHtmlTags={stripHtmlTags}
          />
        );
      case 'reviews':
        return (
          <View style={styles.TabContent}>
            <Text style={styles.InfoTitle}>Reviews</Text>
            <ProductReview id={id} isGoogleBook={isGoogleBook} product={product} />
          </View>
        );
      case 'read-together':
        return (
          <View style={styles.TabContent}>
            <Text style={styles.InfoTitle}>Read Together</Text>
            <ReadTogetherLinks id={id} isGoogleBook={isGoogleBook} product={product} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <ImageBackgroundInfo
          EnableBackHandler={true}
          imagelink_portrait={isGoogleBook ? convertHttpToHttps(product['volumeInfo']?.imageLinks?.thumbnail) : convertHttpToHttps(product['ProductPhoto'])}
          type={type}
          id={id}
          isGoogleBook={isGoogleBook}
          favourite={favourite}
          name={isGoogleBook ? product['volumeInfo']?.title : product['ProductName']}
          genre={isGoogleBook ? product['volumeInfo']?.categories?.join(", ") : product['ProductGenres']}
          author={isGoogleBook ? product['volumeInfo']?.authors?.join(", ") : product['ProductAuthor']}
          BackHandler={BackHandler}
          product={product} //later remove all other params and just pass product
        />

        <View style={styles.FooterInfoArea}>
        <TabNavigator activeTab={activeTab} setActiveTab={setActiveTab} type={type} />
          {renderContent()}
        </View>
        {price && (
          <PaymentFooter
            price={price}
            buttonTitle={price.size === "Buy" ? "See options" : "Add to Cart"}
            buttonPressHandler={() => {
              if (price.size === "Buy") {
                handleBuyOptions();
              } else {
                addToCarthandler({
                  id: id,
                  name: product['ProductName'],
                  photo: convertHttpToHttps(product['ProductPhoto']),
                  type: type,
                  price: price,
                });
              }
            }}
          />
        )}
      </ScrollView>
      <BuyOptionsModal
        isVisible={buyModalVisible}
        onClose={() => setBuyModalVisible(false)}
        onOptionSelect={handleBuyOptionSelect}
        bookPrice={isGoogleBook ? product.saleInfo?.listPrice?.amount : product['ProductPrice']}
        showDirectOption={!isGoogleBook && product['ProductAvailability'] == '1' && product['ProductPrice'] != null}
        bookTitle={isGoogleBook ? product['volumeInfo']?.title : product['ProductName']}
      />
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
    justifyContent: 'space-between',
  },
  FooterInfoArea: {
    padding: SPACING.space_20,
  },
  hidden: { 
    display: "none" ,
  },
  TabContent: {
    flexGrow: 1,
    padding: SPACING.space_20,
  },
  InfoTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
});

export default DetailsScreen;