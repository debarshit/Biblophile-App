import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Alert,
  ToastAndroid,
  Platform,
} from 'react-native';
import {useStore} from '../../../store/store';
import {
  BORDERRADIUS,
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
import Toast from 'react-native-toast-message';

const DetailsScreen = ({navigation, route}: any) => {
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const userDetails = useStore((state: any) => state.userDetails);
  const { selectedCity }  = useStore();

  const [id, setId] = useState(route.params.id);
  const [type, setType] = useState(route.params.type);
  const [isGoogleBook, setIsGoogleBook] = useState(false); 

  const [subscription, setSubscription] = useState(false);
  const [product, setProduct] = useState([]);
  const [activeTab, setActiveTab] = useState('description');

  const getPrices = () => {
    if (type === 'Book') {
      if (product['ProductPrice']) {
        return [
          { size: 'Buy', price: product['ProductPrice'], currency: '₹' },
          {
            size: 'Rent',
            price: subscription === true ? 0 : product['ProductRentPrice'],
            currency: '₹',
          },
        ];
      }
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

  const convertHttpToHttps = (url) => {
    if (url && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
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

  interface BookRequest {
    userId: any;
    bookId: any;
}

  const submitBookRequest = async () => {
    if (userDetails) {
      try {
          let bookId = id;

          if (isGoogleBook) {
              const bookData = {
                  ISBN: product['volumeInfo']['industryIdentifiers'].find(id => id.type === 'ISBN_13')?.identifier || '',
                  Title: product['volumeInfo']['title'] || '',
                  Pages: product['volumeInfo']['pageCount'] || '',
                  Price: actualPrice || 0,
                  Description: product['volumeInfo']['description'] || '',
                  Authors: JSON.stringify(product['volumeInfo']['authors'] || []),
                  Genres: JSON.stringify(product['volumeInfo']['categories'] || []),
                  Image: product['volumeInfo']['imageLinks']['thumbnail'] || ''
              };

              const bookResponse = await instance.post(requests.addBook, bookData);

              if (bookResponse.data.message === "Book added/updated successfully") {
                  bookId = bookResponse.data.bookId;
              } else {
                  Alert.alert("Failed to add/update book");
                  return;
              }
          }

          const requestData: BookRequest = {
              userId: userDetails[0].userId,
              bookId: bookId,
          };

          const response = await instance.post(requests.submitBookRequest, requestData);

          if (response.data.message === "Updated") {
              if (Platform.OS == 'android') {
                  ToastAndroid.showWithGravity(
                    `Updated successfully!`,
                    ToastAndroid.SHORT,
                    ToastAndroid.CENTER,
                  );
                }
                else {
                  Toast.show({
                    type: 'info', 
                    text1: `Updated successfully!`,
                    visibilityTime: 2000, 
                    autoHide: true, 
                    position: 'bottom',
                    bottomOffset: 100, 
                  });
                }
          } else {
            Alert.alert(response.data.message);
              if (Platform.OS == 'android') {
                  ToastAndroid.showWithGravity(
                    `Updated successfully!`,
                    ToastAndroid.SHORT,
                    ToastAndroid.CENTER,
                  );
                }
                else {
                  Toast.show({
                    type: 'info', 
                    text1: `Updated successfully!`,
                    visibilityTime: 2000, 
                    autoHide: true, 
                    position: 'bottom',
                    bottomOffset: 100, 
                  });
              }
          }
      } catch (error) {
          console.error('Error submitting request:', error);
          Alert.alert("Uh oh! Please try again");
      }
  } else {
      Alert.alert("Login to update reading status");
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
            response = await instance(`${requests.fetchProductDetails}${id}&type=${type}&userCity=${selectedCity}`);
            setIsGoogleBook(false);
        }

        const data = response.data;
        setProduct(data);
        console.log(product);
        setActualPrice(data.ProductPrice || data.saleInfo?.listPrice?.amount);
        const updatedPrices = getPrices();
        setPrices(updatedPrices);
        setPrice(updatedPrices[0] || { size: '', price: 0, currency: '₹' });
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    }

    fetchProductDetails();
  }, [actualPrice, selectedCity]);

  const renderContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <View style={styles.TabContent}>
            <Text style={styles.InfoTitle}>Description</Text>
            {fullDesc ? (
              <TouchableWithoutFeedback onPress={() => setFullDesc(prev => !prev)}>
                <Text style={styles.DescriptionText}>
                  {stripHtmlTags(isGoogleBook ? product['volumeInfo']?.description : product['ProductDescription'])}
                </Text>
              </TouchableWithoutFeedback>
            ) : (
              <TouchableWithoutFeedback onPress={() => setFullDesc(prev => !prev)}>
                <Text numberOfLines={3} style={styles.DescriptionText}>
                  {stripHtmlTags(isGoogleBook ? product['volumeInfo']?.description : product['ProductDescription'])}
                </Text>
              </TouchableWithoutFeedback>
            )}
              <>
                <Text style={styles.InfoTitle}>Options</Text>
                {product['ProductAvailability'] === '1' ?
                <View style={styles.SizeOuterContainer}>
                  {prices.map((data: any, index) => (
                    data.price && <TouchableOpacity
                      key={index}
                      onPress={() => setPrice(data)}
                      style={[
                        styles.SizeBox,
                        { borderColor: data.size === price.size ? COLORS.primaryOrangeHex : COLORS.primaryDarkGreyHex },
                      ]}
                    >
                      <Text style={[styles.SizeText, { fontSize: type === 'Book' ? FONTSIZE.size_14 : FONTSIZE.size_16, color: data.size === price.size ? COLORS.primaryOrangeHex : COLORS.secondaryLightGreyHex }]}>
                        {data.size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View> : 
                <View>
                  <TouchableOpacity
                    onPress={() => submitBookRequest()}
                    style={[
                      styles.SizeBox,
                      { borderColor: COLORS.primaryOrangeHex },
                    ]}
                  >
                    <Text style={[styles.SizeText, { fontSize: FONTSIZE.size_14, color: COLORS.primaryOrangeHex }]}>
                      Request book
                    </Text>
                  </TouchableOpacity>
                </View>}
              </>
          </View>
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
    <View style={styles.ScreenContainer}>
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
          <View style={styles.TabBar}>
            <TouchableOpacity onPress={() => setActiveTab('description')} style={[styles.TabButton, activeTab === 'description' && styles.TabButtonActive]}>
              <Text style={[styles.TabLabel, activeTab === 'description' && styles.TabLabelActive]}>Description</Text>
            </TouchableOpacity>
            {type !== 'Bookmark' && (
              <>
                <TouchableOpacity onPress={() => setActiveTab('reviews')} style={[styles.TabButton, activeTab === 'reviews' && styles.TabButtonActive]}>
                  <Text style={[styles.TabLabel, activeTab === 'reviews' && styles.TabLabelActive]}>Reviews</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('read-together')} style={[styles.TabButton, activeTab === 'read-together' && styles.TabButtonActive]}>
                  <Text style={[styles.TabLabel, activeTab === 'read-together' && styles.TabLabelActive]}>Read Together</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          {renderContent()}
        </View>
        {price && (type !== "ExternalBook" && product['ProductAvailability'] === '1') && <PaymentFooter
          price={price}
          buttonTitle="Add to Cart"
          buttonPressHandler={() => {
            addToCarthandler({
              id: id,
              name: product['ProductName'],
              photo: convertHttpToHttps(product['ProductPhoto']),
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
    flexGrow: 1,
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
  TabBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: SPACING.space_8,
  },
  TabButton: {
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
  },
  TabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primaryOrangeHex,
  },
  TabLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  TabLabelActive: {
    color: COLORS.primaryOrangeHex,
  },
});

export default DetailsScreen;
