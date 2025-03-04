import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme'
import requests from '../../../services/requests';
import instance from '../../../services/axios';

const GenreScreen = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const convertHttpToHttps = (url) => {
    if (url && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  const fetchBooks = async (page: number) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      // const response = await instance.get(`${requests.getBooks}${genre}&limit=10&offset=${(page - 1) * 10}`);
      const response = await instance.get(`${requests.getBooks}${'All'}&limit=10&offset=${(page - 1) * 10}`);
      const data = response.data;
      console.log(data);
      
      if (data?.length < 10) setHasMore(false);
      setBooks((prevBooks) => [...prevBooks, ...data]);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    fetchBooks(page);
  }, [page]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.bookCard}>
      <TouchableOpacity>
        <Image
          source={{uri: convertHttpToHttps(item.BookPhoto)}}
          style={styles.bookImage}
        />
      </TouchableOpacity>
      <Text style={styles.bookTitle}>{item?.BookName || 'Book Title'}</Text>
      <Text style={styles.bookAuthor}>{item?.BookAuthor || 'Book Author'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Genre Screen</Text>

      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.BookId || index.toString()}
        numColumns={2}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} /> : null}
        contentContainerStyle={styles.bookContainer}
      />
    </View>
  );
}

export default GenreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
    padding: SPACING.space_16,
  },
  title: {
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_bold,
    textAlign: 'center',
    marginBottom: SPACING.space_16,
  },
  bookContainer: {
    paddingBottom: SPACING.space_16,
  },
  bookCard: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    width: '45%', // Adjust based on your needs (this is for 2 items per row)
    marginBottom: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_8,
    alignItems: 'center',
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bookImage: {
    width: '100%',
    height: 150,
    borderRadius: BORDERRADIUS.radius_8,
    marginBottom: SPACING.space_8,
  },
  bookTitle: {
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    textAlign: 'center',
    marginBottom: SPACING.space_4,
  },
  bookAuthor: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_light,
    textAlign: 'center',
  },
});
