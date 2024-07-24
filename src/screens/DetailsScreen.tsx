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
import instance from '../services/axios';
import requests from '../services/requests';
import ImageBackgroundInfo from '../components/ImageBackgroundInfo';
import PaymentFooter from '../components/PaymentFooter';

const DetailsScreen = ({navigation, route}: any) => {
  const updateFavoriteList = useStore((state: any) => state.updateFavoriteList);
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const favoritesList = useStore((state: any) => state.FavoritesList);
  const userDetails = useStore((state: any) => state.userDetails);

  const [subscription, setSubscription] = useState(false);
  const [product, setProduct] = useState([]);

  //Array of buy and rent prices
  const prices: { size: string; price: string; currency: string }[] = 
  route.params.type === 'Book'
  ? [
      { size: 'Buy', price: product['ProductPrice'], currency: '₹' },
      { size: 'Rent', price: subscription === true ? 0 : Math.max(25, Math.min(35, Math.floor(product['ProductPrice'] * 0.1))), currency: '₹' },
    ]
  : route.params.type === 'Bookmark'
    ? [
        { size: 'QR', price: Math.ceil(product['ProductPrice']), currency: '₹' },
        { size: 'QR & NFC', price: Math.floor(product['ProductPrice'] * 1.3), currency: '₹' }, 
      ]
    : []; // Handle other cases or leave it as empty array if not handled

  const [actualPrice, setActualPrice] = useState(prices[0].price);
  const [price, setPrice] = useState(prices[0]);
  const [fullDesc, setFullDesc] = useState(false);
  const [favourite, setFavourite] = useState(false);

  const ToggleFavourite = (isFavourite, id) => {
    const book = {
      id: route.params.id,
      type: route.params.type,
      favourite: !favourite,
    };
    updateFavoriteList(route.params.type, route.params.id, book);
    setFavourite(!favourite);
  };

  const BackHandler = () => {
    navigation.pop();
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
    const isBookInFavorites = favoritesList.some((book: any) => book.id == route.params.id);
    setFavourite(isBookInFavorites);
  }, [favoritesList, route.params.id]);

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
        const response = await instance(`${requests.fetchProductDetails}${route.params.id}&type=${route.params.type}`);
        const data = response.data;
        setProduct(data);
        var newPrice = price;
        newPrice.price = data['ProductPrice'];
        setPrice(newPrice);
        setActualPrice(data['ProductPrice']);
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    }
  
    fetchProductDetails();
  }, [actualPrice]);

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <ImageBackgroundInfo
          EnableBackHandler={true}
          imagelink_portrait={product['ProductPoster']}
          type={route.params.type}
          id={route.params.id}
          favourite={favourite}
          name={product['ProductName']}
          genre={product['ProductGenres']}
          average_rating={product['ProductAverageRating']}
          ratings_count={product['ProductRatingCount']}
          author={product['ProductAuthor']}
          BackHandler={BackHandler}
          ToggleFavourite={ToggleFavourite}
        />

        <View style={styles.FooterInfoArea}>
          <Text style={styles.InfoTitle}>Description</Text>
          {fullDesc ? (
            <TouchableWithoutFeedback
              onPress={() => {
                setFullDesc(prev => !prev);
              }}>
              <Text style={styles.DescriptionText}>
                {product['ProductDescription']}
              </Text>
            </TouchableWithoutFeedback>
          ) : (
            <TouchableWithoutFeedback
              onPress={() => {
                setFullDesc(prev => !prev);
              }}>
              <Text numberOfLines={3} style={styles.DescriptionText}>
                {product['ProductDescription']}
              </Text>
            </TouchableWithoutFeedback>
          )}
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
                      route.params.type == 'Book'
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
        </View>
        <PaymentFooter
          price={price}
          buttonTitle="Add to Cart"
          buttonPressHandler={() => {
            addToCarthandler({
              id: route.params.id,
              name: product['ProductName'],
              photo: product['ProductPhoto'],
              type: route.params.type,
              price: price,
            });
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
    justifyContent: 'space-between',
  },
  FooterInfoArea: {
    padding: SPACING.space_20,
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
});

export default DetailsScreen;
