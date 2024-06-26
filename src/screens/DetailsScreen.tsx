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

  //Array of buy and rent prices
  const prices: { size: string; price: string; currency: string }[] = 
  route.params.type === 'Book'
  ? [
      { size: 'Buy', price: route.params.price, currency: '₹' },
      { size: 'Rent', price: subscription === true ? 0 : Math.max(25, Math.min(35, Math.floor(route.params.price * 0.1))), currency: '₹' },
    ]
  : route.params.type === 'Bookmark'
    ? [
        { size: 'QR', price: Math.ceil(route.params.price), currency: '₹' },
        { size: 'QR & NFC', price: Math.floor(route.params.price * 1.3), currency: '₹' }, 
      ]
    : []; // Handle other cases or leave it as empty array if not handled

  const [actualPrice, setActualPrice] = useState(prices[0].price);  //to be passed across pages to maintain the actual price post various operations
  const [price, setPrice] = useState(prices[0]);
  const [fullDesc, setFullDesc] = useState(false);
  const [favourite, setFavourite] = useState(false);

  const ToggleFavourite = (isFavourite, id) => {
    const book = {
      id: route.params.id,
      type: route.params.type,
      price: route.params.price,
      name: route.params.name,
      genre: route.params.genre,
      poster: route.params.poster,
      photo: route.params.photo,
      averageRating: route.params.averageRating,
      ratingCount: route.params.ratingCount,
      description: route.params.description,
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
    genre,
    photo,
    poster,
    type,
    price,
    actualPrice,
    averageRating,
    ratingCount,
    description, 
  }: any) => {
    addToCart({
      id,
      name,
      genre,
      photo,
      poster,
      type,
      averageRating,
      ratingCount,
      description, 
      prices: [{...price, quantity: 1}],
      actualPrice: actualPrice,
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

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <ImageBackgroundInfo
          EnableBackHandler={true}
          imagelink_portrait={route.params.poster}
          type={route.params.type}
          id={route.params.id}
          favourite={favourite}
          name={route.params.name}
          genre={route.params.genre}
          // special_ingredient={ItemOfIndex.special_ingredient}
          // ingredients={ItemOfIndex.ingredients}
          average_rating={route.params.averageRating}
          ratings_count={route.params.ratingCount}
          // roasted={ItemOfIndex.roasted}
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
                {route.params.description}
              </Text>
            </TouchableWithoutFeedback>
          ) : (
            <TouchableWithoutFeedback
              onPress={() => {
                setFullDesc(prev => !prev);
              }}>
              <Text numberOfLines={3} style={styles.DescriptionText}>
                {route.params.description}
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
              name: route.params.name,
              genre: route.params.genre,
              photo: route.params.photo,
              poster: route.params.poster,
              type: route.params.type,
              price: price,
              actualPrice: actualPrice,
              averageRating: route.params.averageRating,
              ratingCount: route.params.ratingCount,
              description: route.params.description,
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
