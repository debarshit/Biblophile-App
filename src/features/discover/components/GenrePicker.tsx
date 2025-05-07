import React, { useEffect, useRef, useState, memo } from 'react';
import { 
  Dimensions, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';

// Components
import CoffeeCard from '../../../components/CoffeeCard';

// Services and utilities
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { 
  BORDERRADIUS, 
  COLORS, 
  FONTFAMILY, 
  FONTSIZE, 
  SPACING 
} from '../../../theme/theme';

const MAX_GENRES_PER_ROW = 3;

// Function to get books by genre
const getBookList = async (genre) => {
  try {
    const response = await instance(requests.getBooks + genre);
    return response.data;
  } catch (error) {
    console.error('Error fetching books by genre:', error);
    return [];
  }
};

const GenrePicker = ({ genres = ['All'], CoffeeCardAddToCart }) => {
  const [genreIndex, setGenreIndex] = useState({
    index: 0,
    genre: genres[0],
  });
  const [bookList, setBookList] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);

  const navigation = useNavigation<any>();
  const listRef = useRef(null);

  // Convert HTTP URLs to HTTPS for security
  const convertToHttps = (url) => {
    return url && url.startsWith('http://') ? url.replace('http://', 'https://') : url;
  };

  // Fetch books when genre changes
  useEffect(() => {
    const fetchBookList = async () => {
      setBooksLoading(true);
      try {
        const data = await getBookList(genreIndex.genre);
        setBookList(data || []);
      } catch (error) {
        console.error('Error fetching book list:', error);
      } finally {
        setBooksLoading(false);
      }
    };

    fetchBookList();
  }, [genreIndex]);

  // Render genre buttons in rows
  const renderGenreRows = () => {
    const rows = [];
    
    for (let i = 0; i < genres.length; i += MAX_GENRES_PER_ROW) {
      const rowGenres = genres.slice(i, i + MAX_GENRES_PER_ROW);
      
      rows.push(
        <View key={`row-${i}`} style={styles.genreRow}>
          {rowGenres.map((genre, index) => {
            const actualIndex = i + index;
            return (
              <TouchableOpacity
                key={`genre-${actualIndex}`}
                style={[
                  styles.genreButton,
                  genreIndex.index === actualIndex && styles.selectedGenreButton,
                ]}
                onPress={() => handleGenrePress(actualIndex, genre)}
              >
                <Text style={styles.genreButtonText}>{genre}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    
    return rows;
  };

  // Handle genre button press
  const handleGenrePress = (index, genre) => {
    setBooksLoading(true);
    if (listRef.current) {
      listRef.current.scrollToOffset({
        animated: true,
        offset: 0,
      });
    }
    setGenreIndex({ index, genre });
  };

  // Navigate to book details
  const navigateToDetails = (id) => {
    navigation.navigate('Details', {
      id,
      type: "Book",
    });
  };

  // Render book item
  const renderBookItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigateToDetails(item.BookId)}>
      <CoffeeCard
        id={item.BookId}
        name={item.BookName}
        photo={convertToHttps(item.BookPhoto)}
        type="Book"
        price={item.BookPrice}
        averageRating={item.BookAverageRating}
        ratingCount={item.BookRatingCount}
        buttonPressHandler={CoffeeCardAddToCart}
      />
    </TouchableOpacity>
  );

  return (
    <>
      {/* Genre Section */}
      <View style={styles.genresContainer}>
        <Text style={styles.sectionTitle}>What's on Your Mind?</Text>
        {renderGenreRows()}
      </View>

      {/* Book List Section */}
      {booksLoading ? (
        // Shimmer loading effect
        <View style={styles.shimmerFlex}>
          {[1, 2, 3].map((key) => (
            <ShimmerPlaceholder
              key={`shimmer-${key}`}
              LinearGradient={LinearGradient}
              style={styles.shimmerPlaceholder}
              shimmerColors={[
                COLORS.primaryDarkGreyHex, 
                COLORS.primaryBlackHex, 
                COLORS.primaryDarkGreyHex
              ]}
              visible={false}
            />
          ))}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={bookList}
          keyExtractor={item => item.BookId || `book-${Math.random()}`}
          renderItem={renderBookItem}
          contentContainerStyle={styles.flatListContainer}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyText}>No Books Found</Text>
            </View>
          }
        />
      )}
    </>
  );
};

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
  shimmerPlaceholder: {
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
  flatListContainer: {
    gap: SPACING.space_20,
    paddingVertical: SPACING.space_20,
    paddingHorizontal: SPACING.space_30,
  },
  emptyListContainer: {
    width: Dimensions.get('window').width - SPACING.space_30 * 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_36 * 3.6,
  },
  emptyText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
});

// Use memo to prevent unnecessary re-renders
export default memo(GenrePicker);