import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  ToastAndroid,
  KeyboardAvoidingView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {FlatList} from 'react-native';
import {Dimensions} from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { AntDesign, Feather } from '@expo/vector-icons';
import {useStore} from '../../../store/store';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';
import CoffeeCard from '../../../components/CoffeeCard';
import FloatingIcon from '../components/FloatingIcon';
import MerchShopBanner from '../../../components/MerchShopBanner';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import CityPlacesSection from '../components/CityPlacesSection';
import CityEventCard from '../components/CityEventCard';
import { useTheme } from '../../../contexts/ThemeContext';
import CityPlaceModal from '../components/CityPlaceModal';
import EventModal from '../components/CityEventModal';
import { useRoute } from '@react-navigation/native';

const getGenresFromData = (data: any) => {
  const genres = ['All', ...new Set(data.map((item: any) => item.genre))];
  return genres;
};

const getBookList = async (genre: any) => {
  try {
    const response = await instance(requests.getBooks+genre);
    const data = response.data.data;
    return data;
  } catch (error) {
    console.error('Error fetching genres:', error);
  }
};

const LibraryScreen = ({navigation}: any) => {
  //useStore variables
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const fetchGenres = useStore((state: any) => state.fetchGenres);  //this function should run on mount
  const GenreList = useStore((state: any) => state.GenreList);
  const CartList = useStore((state: any) => state.CartList);
  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const route = useRoute<any>();
  const { type, id } = route.params || {};

  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  //useState variables
  const [genres, setGenres] = useState(
    getGenresFromData(GenreList),  
  );
  const [searchText, setSearchText] = useState('');
  const [genreIndex, setGenreIndex] = useState({
    index: 0,
    genre: genres[0],
  });
  const [bookList, setBookList] = useState<any>([]);
  const [sortedCoffee, setSortedCoffee] = useState<any>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [cityPlaces, setCityPlaces] = useState([]);
  const [cityEvents, setCityEvents] = useState([]);
  const [cityDataLoading, setCityDataLoading] = useState(true);
  const [deepLinkModal, setDeepLinkModal] = useState<{
    type: 'place' | 'event' | null;
    id: string | null;
  }>({
    type: null,
    id: null,
  });
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail.trim()) return;

    try {
      setNewsletterLoading(true);

      await instance.post(
        'https://biblophile.com/blog/wp-admin/admin-ajax.php?action=tnp&na=s',
        {
          ne: newsletterEmail,
          nl: ['1', '5'],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      Toast.show({
        type: 'success',
        text1: 'Subscribed successfully',
        position: 'bottom',
      });

      setNewsletterEmail('');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
        position: 'bottom',
      });
    } finally {
      setNewsletterLoading(false);
    }
  };

  const ListRef = useRef<FlatList<any>>(null);

  // Define a variable to store the timeout ID
  let searchTimeout: any = null;  

  const searchCoffee = (search: string) => { 
    // Clear the previous timeout
    clearTimeout(searchTimeout);
    
    // Create a new timeout
    searchTimeout = setTimeout(async () => {
      if (search !== '') {
        setBooksLoading(true);
        try {
          const localSearchResponse = await instance(requests.searchBooks + search);
          const localResponse = localSearchResponse.data;
          const data = localResponse.data;
          setSortedCoffee(data);
          setBooksLoading(false);
        } catch (error) {
          console.error('Error fetching books:', error);
        }
      }
    }, 500); // Waiting time in milliseconds
  };

  const resetSearchCoffee = () => {
    ListRef?.current?.scrollToOffset({
      animated: true,
      offset: 0,
    });
    setGenreIndex({index: 0, genre: genres[0]});
    setSortedCoffee(bookList);
    setSearchText('');
  };

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

  // Fetch city data
  useEffect(() => {
    if (!accessToken) return;

    async function fetchCityData() {
      try {
        setCityDataLoading(true);
        const headers = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};

        const [placesRes, eventsRes] = await Promise.all([
          instance.get(requests.getCityPlaces('1')),
          instance.get(requests.getCityEvents('1'), { headers })
        ]);
        setCityPlaces(placesRes.data.data.items || []);
        setCityEvents(eventsRes.data.data.items || []);
      } catch (error) {
        console.warn('Error fetching city data:', error);
      } finally {
        setCityDataLoading(false);
      }
    }

    fetchCityData();
  }, [accessToken]);

  // Group events by type
  const eventGroups = {
    bookFairs: cityEvents.filter(e => ["book_fair", "expo", "lit_fest"].includes(e.type)),
    launches: cityEvents.filter(e => ["book_launch", "author_talk", "panel_discussion"].includes(e.type)),
    meetups: cityEvents.filter(e => ["reading_circle", "meetup"].includes(e.type)),
    workshops: cityEvents.filter(e => e.type === "workshop"),
  };

  useEffect(() => {
    // Fetch genres when component mounts
    fetchGenres();
  }, [accessToken]);

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
        setBooksLoading(false);
      } catch (error) {
        console.error('Error fetching book list:', error);
      }
    }
  
    fetchBookList();
  }, [genreIndex]);

  const selectedPlaceFromLink = useMemo(() => {
    if (deepLinkModal.type !== 'place') return null;
    return cityPlaces.find(p => String(p.id) === String(deepLinkModal.id));
  }, [deepLinkModal, cityPlaces]);

  const selectedEventFromLink = useMemo(() => {
    if (deepLinkModal.type !== 'event') return null;
    return cityEvents.find(e => String(e.id) === String(deepLinkModal.id));
  }, [deepLinkModal, cityEvents]);

  useEffect(() => {
    if (!type || !id) return;

    if (type === 'places') {
      setDeepLinkModal({
        type: 'place',
        id,
      });
    }

    if (type === 'events') {
      setDeepLinkModal({
        type: 'event',
        id,
      });
    }
  }, [type, id]);

  useEffect(() => {
    if (!cityDataLoading && type && id) {
      setDeepLinkModal({
        type: type === 'places' ? 'place' : 'event',
        id,
      });
    }
  }, [cityDataLoading, type, id]);

  return (
    <SafeAreaView style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 20}
        style={styles.KeyboardView}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.ScrollViewFlex}>
        {/* App Header */}
        <HeaderBar showBackButton={true} title=""/>

        <Text style={styles.ScreenTitle}>
          Find the best{'\n'}book for you
        </Text>

        {/* Search Input */}
        <View style={styles.InputContainerComponent}>
          <TouchableOpacity
            onPress={() => {
              searchCoffee(searchText);
            }}>
            <Feather
              style={styles.InputIcon}
              name="search"
              size={FONTSIZE.size_18}
              color={
                searchText.length > 0
                  ? COLORS.primaryOrangeHex
                  : COLORS.primaryLightGreyHex
              }
            />
          </TouchableOpacity>
          <TextInput
            placeholder="Find Your Book..."
            value={searchText}
            onChangeText={text => {
              setSearchText(text);
              searchCoffee(text);
            }}
            placeholderTextColor={COLORS.primaryLightGreyHex}
            style={styles.TextInputContainer}
          />
          {searchText.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                resetSearchCoffee();
              }}>
              <AntDesign
                style={styles.InputIcon}
                name="close"
                size={FONTSIZE.size_16}
                color={COLORS.primaryLightGreyHex}
              />
            </TouchableOpacity>
          ) : (
            <></>
          )}
        </View>

        {/* genre Scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreScrollViewStyle}>
          {genres.map((data: string, index) => (
            <View
              key={index.toString()}
              style={styles.genreScrollViewContainer}>
              <TouchableOpacity
                style={styles.genreScrollViewItem}
                onPress={() => {
                  setBooksLoading(true);
                  ListRef?.current?.scrollToOffset({
                    animated: true,
                    offset: 0,
                  });
                  setGenreIndex({index: index, genre: genres[index]});
                  setSortedCoffee(bookList);
                }}>
                <Text
                  style={[
                    styles.genreText,
                    genreIndex.index == index
                      ? {color: COLORS.primaryOrangeHex}
                      : {},
                  ]}>
                  {data}
                </Text>
                {genreIndex.index == index ? (
                  <View style={styles.Activegenre} />
                ) : (
                  <></>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Books Flatlist */}
        {booksLoading ? (
        // Render shimmer effect while loading
          <View style={styles.shimmerFlex}>
            <ShimmerPlaceholder
            LinearGradient={LinearGradient}
              style={styles.ShimmerPlaceholder}
              shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
              visible={!booksLoading}>
            </ShimmerPlaceholder>
            <ShimmerPlaceholder
            LinearGradient={LinearGradient}
              style={styles.ShimmerPlaceholder}
              shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
              visible={!setBooksLoading}>
            </ShimmerPlaceholder>
            <ShimmerPlaceholder
            LinearGradient={LinearGradient}
              style={styles.ShimmerPlaceholder}
              shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
              visible={!booksLoading}>
            </ShimmerPlaceholder>
          </View>
        ) : (

          <FlatList
            {...sortedCoffee.length === 0 && styles.hidden}
            ref={ListRef}
            horizontal
            ListEmptyComponent={
              <View style={styles.EmptyListContainer}>
                <Text style={styles.genreText}>No Books found</Text>
              </View>
            }
            showsHorizontalScrollIndicator={false}
            data={sortedCoffee}
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
        )}

        {/* Cafes & Reading Spots */}
        {!cityDataLoading && cityPlaces.length > 0 && (
          <CityPlacesSection
            cityPlaces={cityPlaces}
            onSelectPlace={(place) => {
              setDeepLinkModal({
                type: 'place',
                id: place.id,
              });
            }}
          />
        )}

        {/* City Events Section */}
        {!cityDataLoading && Object.entries(eventGroups).map(([key, events]) => {
          if (events.length === 0) return null;

          const titles: Record<string, string> = {
            bookFairs: "Book Fairs, Expos & Lit Fests",
            launches: "Book Launches & Author Talks",
            meetups: "Reading Circles & Meetups",
            workshops: "Workshops",
          };

          return (
            <View key={key} style={styles.eventSection}>
              <Text style={styles.eventSectionTitle}>
                {titles[key] || key}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.eventScrollContainer}
              >
                {events.map(event => (
                  <View key={event.id} style={styles.eventCardWrapper}>
                    <CityEventCard
                      event={event}
                      accessToken={accessToken}
                      onPress={(event) => {
                        setDeepLinkModal({
                          type: 'event',
                          id: event.id,
                        });
                      }}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          );
        })}

        {/* Bangalore Events Newsletter CTA */}
        <View style={styles.newsletterContainer}>
          <Text style={styles.newsletterTitle}>
            Never miss a bookish event in Bangalore
          </Text>

          <Text style={styles.newsletterSubtitle}>
            Get curated reading meetups, book fairs & literary events weekly.
          </Text>

          <TextInput
            placeholder="Enter your email"
            placeholderTextColor={COLORS.primaryLightGreyHex}
            value={newsletterEmail}
            onChangeText={setNewsletterEmail}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({animated: true});
              }, 250);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.newsletterInput}
          />

          <TouchableOpacity
            style={styles.newsletterButton}
            onPress={handleNewsletterSubscribe}
          >
            <Text style={styles.newsletterButtonText}>
              Get Bangalore Updates
            </Text>
          </TouchableOpacity>
        </View>

        {/* Checkout Bookmarks shop */}
        {/* <Text style={styles.CoffeeBeansTitle}>Smart Bookmarks</Text>
        <MerchShopBanner /> */}

      </ScrollView>
      </KeyboardAvoidingView>
      <CityPlaceModal
        visible={!!selectedPlaceFromLink}
        place={selectedPlaceFromLink}
        onClose={() => setDeepLinkModal({ type: null, id: null })}
      />
      <EventModal
        visible={!!selectedEventFromLink}
        event={selectedEventFromLink}
        onClose={() => setDeepLinkModal({ type: null, id: null })}
      />
      {CartList.length > 0 && <FloatingIcon />}
    </SafeAreaView>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  ShimmerPlaceholder: {
    width: 150, 
    height: 200, 
    borderRadius: 10,
    marginHorizontal: 10, 
    marginTop: 10,
    marginBottom: 40,
    marginLeft: 20, 
  },
  shimmerFlex: {
    flexDirection: 'row',
  },
  hidden: {
    display: 'none',
  },
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  KeyboardView: {
    flex: 1,
  },
  ScrollViewFlex: {
    flexGrow: 1,
    paddingBottom: SPACING.space_36 * 2,
  },
  ScreenTitle: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    paddingLeft: SPACING.space_30,
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
  genreScrollViewStyle: {
    paddingHorizontal: SPACING.space_20,
  },
  genreScrollViewContainer: {
    paddingHorizontal: SPACING.space_15,
  },
  genreScrollViewItem: {
    alignItems: 'center',
  },
  genreText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  Activegenre: {
    height: SPACING.space_10,
    width: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryOrangeHex,
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
    eventSection: {
    marginTop: SPACING.space_24,
    paddingHorizontal: SPACING.space_20,
  },
  eventSectionTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_12,
  },
  eventScrollContainer: {
    gap: SPACING.space_16,
    paddingRight: SPACING.space_20,
  },
  eventCardWrapper: {
    width: Dimensions.get('window').width * 0.85,
  },
  CoffeeBeansTitle: {
    fontSize: FONTSIZE.size_18,
    marginLeft: SPACING.space_30,
    marginTop: SPACING.space_20,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.secondaryLightGreyHex,
  },
  newsletterContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    marginHorizontal: SPACING.space_20,
    marginTop: SPACING.space_32,
    marginBottom: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_25,
    padding: SPACING.space_24,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
  },
  newsletterTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginBottom: SPACING.space_8,
  },

  newsletterSubtitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
    marginBottom: SPACING.space_20,
    lineHeight: 22,
  },
  newsletterInput: {
    height: 52,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: SPACING.space_20,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
    backgroundColor: 'transparent',
  },
  newsletterButton: {
    height: 50,
    borderRadius: 999,
    backgroundColor: COLORS.primaryOrangeHex,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsletterButtonText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
  },
});

export default LibraryScreen;