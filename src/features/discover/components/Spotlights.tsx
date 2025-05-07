import React, { useEffect, useState, useRef } from 'react';
import { FlatList, TouchableOpacity, Image, View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

const Spotlights = ({ spotlights }) => {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const listLength = spotlights.length;
  const navigation = useNavigation<any>();

  const convertHttpToHttps = (url) => {
    if (url && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  // Auto-scroll the list
  useEffect(() => {
    if (listLength > 0) {
      const intervalId = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % listLength);
      }, 3000);

      return () => clearInterval(intervalId);
    }
  }, [listLength]);

  useEffect(() => {
    if (flatListRef.current && currentIndex !== null) {
      flatListRef.current.scrollToIndex({ 
        index: currentIndex, 
        animated: true,
        viewPosition: 0.5
      });
    }
  }, [currentIndex]);

  return (
    <>
      <Text style={styles.spotlightTitle}>In Spotlight</Text>
      <View style={styles.carouselContainer}>
        {spotlights.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={spotlights}
            horizontal
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.carouselItem}
                onPress={() => {
                  navigation.navigate('Details', {
                    id: item.Id,
                    type: "Book",
                  });
                }}
              >
                <View style={styles.bookCard}>
                  <Image 
                    source={{ uri: convertHttpToHttps(item.Photo) }} 
                    style={styles.bookCover} 
                  />
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {item.Name || "A Very Long Book Name"}
                    </Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>
                      {item.Authors || "Author name"}
                    </Text>
                    <Text style={styles.bookGenre} numberOfLines={1}>
                      {item.Genres || "Book Genre"}
                    </Text>
                    <Text style={styles.knowMoreText}>Know more</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            snapToInterval={320}
            decelerationRate="fast"
            initialScrollIndex={0}
            contentContainerStyle={styles.carouselContent}
            onScrollToIndexFailed={info => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ 
                  index: info.index, 
                  animated: true 
                });
              });
            }}
          />
        ) : null}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  spotlightTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_bold,
    color: 'white',
    textAlign: 'center',
    marginVertical: SPACING.space_20,
  },
  carouselContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.space_10,
  },
  carouselItem: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.space_10,
    width: 320,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%'
  },
  bookCover: {
    width: 120,
    height: 150,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  bookInfo: {
    flex: 1,
    padding: SPACING.space_10,
    justifyContent: 'space-between',
  },
  bookTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookAuthor: {
    color: 'white',
    fontSize: 14,
    marginBottom: 2,
  },
  bookGenre: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 8,
  },
  knowMoreText: {
    alignSelf: 'flex-start',
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_14,
  },
  carouselContent: {
    paddingVertical: SPACING.space_10,
  },
});

export default Spotlights;
