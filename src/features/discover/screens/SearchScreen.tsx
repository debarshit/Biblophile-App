import { Dimensions, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { AntDesign, Feather } from '@expo/vector-icons';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import CoffeeCard from '../../../components/CoffeeCard';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useNavigation } from '@react-navigation/native';

const SearchScreen = ({ CoffeeCardAddToCart }) => {
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [books, setBooks] = useState<any>([]);
    const [externalBooks, setExternalBooks] = useState<any>([]);
    const [loading, setLoading] = useState(true);
    const [booksLoading, setBooksLoading] = useState(true);

    const navigation = useNavigation<any>();
    const ListRef: any = useRef<FlatList>();

    const convertHttpToHttps = (url) => {
        if (url && url.startsWith('http://')) {
          return url.replace('http://', 'https://');
        }
        return url;
    };

    // Define a variable to store the timeout ID
    let searchTimeout: any = null;  

    const searchBooks = (search: string) => { 
    // Clear the previous timeout
    clearTimeout(searchTimeout);
    
    // Create a new timeout
    searchTimeout = setTimeout(async () => {
        if (search !== '') {
        setBooksLoading(true);
        try {
            const response = await instance(requests.searchBooks + search);
            const data = response.data;
            setBooks(data);

            const externalBooksResponse = await instance.get(requests.searchExternalBooks + search);
            const externalData = externalBooksResponse.data;
            setExternalBooks(externalData);

            setBooksLoading(false);
        } catch (error) {
            console.error('Error fetching books:', error);
        }
        }
    }, 500); // Waiting time in milliseconds
    };
    
    const resetSearchBooks = () => {
        setBooks([]);
        setExternalBooks([]);
        setSearchText('');
    };

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
          'keyboardDidShow',
          (e) => {
            setKeyboardVisible(true);
          }
        );
    
        const keyboardDidHideListener = Keyboard.addListener(
          'keyboardDidHide',
          () => {
            setKeyboardVisible(false);
        });
          
        return () => {
          keyboardDidShowListener.remove();
          keyboardDidHideListener.remove();
        };
    }, []);
      
    return (
        <View>
            {/* Search Input */}
            <View style={styles.InputContainerComponent}>
                <TouchableOpacity
                    onPress={() => {
                    searchBooks(searchText);
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
                    searchBooks(text);
                    }}
                    placeholderTextColor={COLORS.primaryLightGreyHex}
                    style={styles.TextInputContainer}
                />
                {searchText.length > 0 ? (
                    <TouchableOpacity
                    onPress={() => {
                        resetSearchBooks();
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

            {/* Searched Books Flatlist */}
            {searchText !== '' &&
            <>
                <Text style={styles.CoffeeBeansTitle}>Available for Buying</Text>
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
                    {...books.length === 0 && styles.hidden}
                    ref={ListRef}
                    horizontal
                    ListEmptyComponent={
                    <View style={styles.EmptyListContainer}>
                        <Text style={styles.genreText}>No Books found</Text>
                    </View>
                    }
                    showsHorizontalScrollIndicator={false}
                    data={books}
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
            </>
            }

        {/* Searched External Books FlatList */}
        {searchText !== '' &&
          <>
          <Text style={styles.CoffeeBeansTitle}>More Books</Text>

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
              ref={ListRef}
              horizontal
              ListEmptyComponent={
                <View style={styles.EmptyListContainer}>
                  <Text style={styles.genreText}>No Books found</Text>
                </View>
              }
              showsHorizontalScrollIndicator={false}
              data={externalBooks}
              contentContainerStyle={styles.FlatListContainer}
              keyExtractor={item => item.GoogleBookId}
              renderItem={({item}) => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      navigation.push('Details', {
                        id: item.GoogleBookId,
                        type: "ExternalBook",
                      });
                    }}>
                    <CoffeeCard
                      id={item.GoogleBookId}
                      name={item.BookName}
                      photo={convertHttpToHttps(item.BookPhoto)}
                      type="ExternalBook"
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
          </>
        }
        </View>
    )
};

export default SearchScreen;

const styles = StyleSheet.create({
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
    CoffeeBeansTitle: {
        fontSize: FONTSIZE.size_18,
        marginLeft: SPACING.space_30,
        marginTop: SPACING.space_20,
        fontFamily: FONTFAMILY.poppins_medium,
        color: COLORS.secondaryLightGreyHex,
    },
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
      genreText: {
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
});