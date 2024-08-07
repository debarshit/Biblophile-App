import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import {useStore} from '../store/store';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import instance from '../services/axios';
import requests from '../services/requests';
import ImageBackgroundInfo from '../components/ImageBackgroundInfo';
import PaymentFooter from '../components/PaymentFooter';
import ProductReview from '../components/ProductReview';
import BookEmotions from '../components/BookEmotions';

const DetailsScreen = ({navigation, route}: any) => {
  const updateFavoriteList = useStore((state: any) => state.updateFavoriteList);
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const favoritesList = useStore((state: any) => state.FavoritesList);
  const userDetails = useStore((state: any) => state.userDetails);

  const [id, setId] = useState(route.params.id);
  const [type, setType] = useState(route.params.type);
  const [isGoogleBook, setIsGoogleBook] = useState(false); 

  const [subscription, setSubscription] = useState(false);
  const [product, setProduct] = useState([]);
  const [index, setIndex] = useState(0);  // Tab index
  const [routes, setRoutes] = useState([
    { key: 'description', title: 'Description' },
    ...(type !== 'Bookmark' ? [
      { key: 'reviews', title: 'Reviews' },
      { key: 'emotions', title: 'Emotions' }
    ] : [])
  ]);

  const getPrices = () => {
    if (type === 'Book') {
      return [
        { size: 'Buy', price: product['ProductPrice'], currency: '₹' },
        {
          size: 'Rent',
          price: subscription === true ? 0 : Math.max(25, Math.min(35, Math.floor(product['ProductPrice'] * 0.1))),
          currency: '₹',
        },
      ];
    } else if (type === 'Bookmark') {
      return [
        { size: 'QR', price: Math.ceil(product['ProductPrice']), currency: '₹' },
        { size: 'QR & NFC', price: Math.floor(product['ProductPrice'] * 1.3), currency: '₹' },
      ];
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

  const ToggleFavourite = (isFavourite, id) => {
    const book = {
      id: id,
      type: type,
      favourite: !favourite,
    };
    updateFavoriteList(type, id, book);
    setFavourite(!favourite);
  };

  const BackHandler = () => {
    if (navigation.canGoBack()) {
      navigation.pop();
    } else {
      navigation.navigate('Tab');
    }
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
    const isBookInFavorites = favoritesList.some((book: any) => book.id == id);
    setFavourite(isBookInFavorites);
  }, [favoritesList, id]);

  useEffect(() => {
    async function fetchActivePlan() {
        try {
            const response = await instance(requests.fetchActivePlan+userDetails[0].userId);
            const data = response.data;
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
    async function fetchProductDetails() {
      try {
        if (action) {
          handleAction(action);
        }
        let response;
        if (type === 'ExternalBook') {
            response = await instance(`${requests.fetchExternalBookDetails}${id}`);
            setIsGoogleBook(true);
        } else {
            response = await instance(`${requests.fetchProductDetails}${id}&type=${type}`);
            setIsGoogleBook(false);
        }

        const data = response.data;
        setProduct(data);
        console.log(product);
        setActualPrice(data.ProductPrice || data.saleInfo?.listPrice?.amount || 0);
        const updatedPrices = getPrices();
        setPrices(updatedPrices);
        setPrice(updatedPrices[0] || { size: '', price: 0, currency: '₹' });
        setRoutes([
          { key: 'description', title: 'Description' },
          ...(type !== 'Bookmark' ? [
            { key: 'reviews', title: 'Reviews' },
            { key: 'emotions', title: 'Emotions' }
          ] : [])
        ]);
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    }

    fetchProductDetails();
  }, [actualPrice]);

  const renderScene = SceneMap({
    description: () => (
      <View style={[styles.TabContent, index !== 0 && styles.hidden]}>
        <Text style={styles.InfoTitle}>Description</Text>
          {fullDesc ? (
            <TouchableWithoutFeedback
              onPress={() => {
                setFullDesc(prev => !prev);
              }}>
              <Text style={styles.DescriptionText}>
                {isGoogleBook ? product['volumeInfo']?.description : product['ProductDescription']}
              </Text>
            </TouchableWithoutFeedback>
          ) : (
            <TouchableWithoutFeedback
              onPress={() => {
                setFullDesc(prev => !prev);
              }}>
              <Text numberOfLines={3} style={styles.DescriptionText}>
                {isGoogleBook ? product['volumeInfo']?.description : product['ProductDescription']}
              </Text>
            </TouchableWithoutFeedback>
          )}
          { type !== "ExternalBook" &&
          <>
            <Text style={styles.InfoTitle}>Options</Text>
            <View style={styles.SizeOuterContainer}>
              {prices.map((data: any) => (
                <TouchableOpacity
                  key={data.size}
                  onPress={() => {
                    setPrice(data);
                  }}
                  style={[
                    styles.SizeBox,
                    {
                      borderColor:
                        data.size == price.size
                          ? COLORS.primaryOrangeHex
                          : COLORS.primaryDarkGreyHex,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.SizeText,
                      {
                        fontSize:
                        type == 'Book'
                            ? FONTSIZE.size_14
                            : FONTSIZE.size_16,
                        color:
                          data.size == price.size
                            ? COLORS.primaryOrangeHex
                            : COLORS.secondaryLightGreyHex,
                      },
                    ]}>
                    {data.size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
          }
      </View>
    ),
    reviews: () => (
      <View style={[styles.TabContent, index !== 1 && styles.hidden]}>
        <Text style={styles.InfoTitle}>Reviews</Text>
        <ProductReview id={id} isGoogleBook={isGoogleBook} product={product}/>
      </View>
    ),
    emotions: () => (
      <View style={[styles.TabContent, index !== 2 && styles.hidden]}>
        <Text style={styles.InfoTitle}>Emotions</Text>
        <BookEmotions id={id} isGoogleBook={isGoogleBook} product={product}/>
      </View>
    ),
  });

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: COLORS.primaryOrangeHex }}
      style={{ backgroundColor: COLORS.primaryBlackHex }}
      renderLabel={({ route, focused, color }) => (
        <Text style={[styles.TabLabel, focused && styles.TabLabelFocused]}>
          {route.title}
        </Text>
      )}
    />
  );

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <ImageBackgroundInfo
          EnableBackHandler={true}
          imagelink_portrait={isGoogleBook ? product['volumeInfo']?.imageLinks?.thumbnail : product['ProductPhoto']}
          type={type}
          id={id}
          isGoogleBook={isGoogleBook}
          favourite={favourite}
          name={isGoogleBook ? product['volumeInfo']?.title : product['ProductName']}
          genre={isGoogleBook ? product['volumeInfo']?.categories?.join(", ") : product['ProductGenres']}
          author={isGoogleBook ? product['volumeInfo']?.authors?.join(", ") : product['ProductAuthor']}
          BackHandler={BackHandler}
          ToggleFavourite={ToggleFavourite}
          product={product} //later remove all other params and just pass product
        />

        <View style={styles.FooterInfoArea}>
        <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            renderTabBar={renderTabBar}
            onIndexChange={setIndex}
            initialLayout={{ width: 100 }}
            style={styles.TabView}
          />
        </View>
        {price && type !== "ExternalBook" && <PaymentFooter
          price={price}
          buttonTitle="Add to Cart"
          buttonPressHandler={() => {
            addToCarthandler({
              id: id,
              name: product['ProductName'],
              photo: product['ProductPhoto'],
              type: type,
              price: price,
            });
          }}
        />}
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
    justifyContent: 'space-between',
  },
  FooterInfoArea: {
    padding: SPACING.space_20,
  },
  hidden: { 
    display: "none" ,
  },
  TabContent: {
    padding: SPACING.space_20,
  },
  TabLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  TabLabelFocused: {
    color: COLORS.primaryOrangeHex,
  },
  InfoTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  DescriptionText: {
    letterSpacing: 0.5,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_30,
  },
  SizeOuterContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.space_20,
  },
  SizeBox: {
    flex: 1,
    backgroundColor: COLORS.primaryDarkGreyHex,
    alignItems: 'center',
    justifyContent: 'center',
    height: SPACING.space_24 * 2,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 2,
  },
  SizeText: {
    fontFamily: FONTFAMILY.poppins_medium,
  },
  TabView: {
    flex: 1,
  },
});

export default DetailsScreen;
