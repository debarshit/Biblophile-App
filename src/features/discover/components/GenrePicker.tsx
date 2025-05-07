import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import CoffeeCard from '../../../components/CoffeeCard';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const getBookList = async (genre: any) => {
    try {
      const response = await instance(requests.getBooks+genre);
      const data = response.data;
      return data;
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
};

const GenrePicker = ({ genres, CoffeeCardAddToCart }) => {
    const [genreIndex, setGenreIndex] = useState({
        index: 0,
        genre: genres[0],
    });
    const [bookList, setBookList] = useState<any>(getBookList(genreIndex.genre));
    const [booksLoading, setBooksLoading] = useState(true);

    const navigation = useNavigation<any>();
    const ListRef: any = useRef<FlatList>();

    const convertHttpToHttps = (url) => {
        if (url && url.startsWith('http://')) {
          return url.replace('http://', 'https://');
        }
        return url;
    };

    useEffect(() => {
        async function fetchBookList() {
        try {
            const data = await getBookList(genreIndex.genre);
            setBookList(data);
            setBooksLoading(false);
        } catch (error) {
            console.error('Error fetching book list:', error);
        }
        }
    
        fetchBookList();
    }, [genreIndex]);

    return (
        <>
            {/* Genre Section */}
            <View style={styles.genresContainer}>
                <Text style={styles.sectionTitle}>What’s on Your Mind?</Text>

                {/* First Row */}
                <View style={styles.genreRow}>
                    {genres.slice(0, 3).map((data: string, index) => (
                        <TouchableOpacity
                        key={index.toString()}
                        style={[
                            styles.genreButton,
                            genreIndex.index === index && styles.selectedGenreButton,
                        ]}
                        onPress={() => {
                            setBooksLoading(true);
                            ListRef?.current?.scrollToOffset({
                            animated: true,
                            offset: 0,
                            });
                            setGenreIndex({index: index, genre: genres[index]});
                        }}>
                        <Text style={styles.genreButtonText}>{data}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Second Row */}
                <View style={styles.genreRow}>
                    {genres.slice(3, 6).map((data: string, index) => (
                        <TouchableOpacity
                        key={(index + 3).toString()}
                        style={[
                            styles.genreButton,
                            genreIndex.index === index + 3 && styles.selectedGenreButton,
                        ]}
                        onPress={() => {
                            setBooksLoading(true);
                            ListRef?.current?.scrollToOffset({
                            animated: true,
                            offset: 0,
                            });
                            setGenreIndex({index: index + 3, genre: genres[index + 3]});
                        }}>
                        <Text style={styles.genreButtonText}>{data}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Third Row */}
                <View style={styles.genreRow}>
                    {genres.slice(7, 10).map((data: string, index) => (
                        <TouchableOpacity
                        key={(index + 7).toString()}
                        style={[
                            styles.genreButton,
                            genreIndex.index === index + 7 && styles.selectedGenreButton,
                        ]}
                        onPress={() => {
                            setBooksLoading(true);
                            ListRef?.current?.scrollToOffset({
                            animated: true,
                            offset: 0,
                            });
                            setGenreIndex({index: index + 7, genre: genres[index + 7]});
                        }}>
                        <Text style={styles.genreButtonText}>{data}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Filtered Books by Genre */}
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
                    {...bookList.length === 0 && styles.hidden}
                    ref={ListRef}
                    horizontal
                    ListEmptyComponent={
                    <View style={styles.EmptyListContainer}>
                        <Text style={styles.genreText}>No Books found</Text>
                    </View>
                    }
                    showsHorizontalScrollIndicator={false}
                    data={bookList}
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
    )
};

export default GenrePicker;

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: FONTSIZE.size_18,
        fontFamily: FONTFAMILY.poppins_bold,
        color: 'white',
        textAlign: 'center',
        marginVertical: SPACING.space_20,
    },
        genresContainer: {
        marginBottom: SPACING.space_20,
        paddingHorizontal: SPACING.space_10,
        alignItems: 'center',
    },
    genreRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: SPACING.space_4,
    },
    genreButton: {
        backgroundColor: COLORS.primaryGreyHex,
        paddingVertical: SPACING.space_10,
        paddingHorizontal: SPACING.space_20,
        borderRadius: BORDERRADIUS.radius_10,
        marginHorizontal: SPACING.space_4,
    },
    genreButtonText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
        textAlign: 'center',
    },
    selectedGenreButton: {
        backgroundColor: COLORS.primaryOrangeHex,
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
    FlatListContainer: {
        gap: SPACING.space_20,
        paddingVertical: SPACING.space_20,
        paddingHorizontal: SPACING.space_30,
    },
    hidden: {
        display: 'none',
    },
    EmptyListContainer: {
        width: Dimensions.get('window').width - SPACING.space_30 * 2,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.space_36 * 3.6,
    },
    genreText: {
        fontFamily: FONTFAMILY.poppins_semibold,
        fontSize: FONTSIZE.size_16,
        color: COLORS.primaryLightGreyHex,
        marginBottom: SPACING.space_4,
    },
});