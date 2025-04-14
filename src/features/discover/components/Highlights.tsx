import React, { useEffect, useState, useRef } from 'react';
import { FlatList, TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SPACING } from '../../../theme/theme';

const Highlights = ({ highlights }) => {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const listLength = highlights.length;
  const navigation = useNavigation<any>();

  const convertHttpToHttps = (url) => {
    if (url && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  //to autoscroll the list
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
      flatListRef.current.scrollToIndex({ index: currentIndex, animated: true });
    }
  }, [currentIndex]);

  return (
    <View style={styles.carouselContainer}>
      {highlights.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={highlights}
          horizontal
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.carouselItem}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('Details', {
                    id: item.Id,
                    type: "Book",
                  });
              }}>
                <Image source={{ uri: convertHttpToHttps(item.Photo) }} style={styles.carouselImage} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
          showsHorizontalScrollIndicator={false}
          snapToInterval={250}
          decelerationRate="fast"
          initialScrollIndex={0}
          contentContainerStyle={styles.carouselContent}
        />
      ) : (
        null
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselItem: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.space_10,
  },
  carouselImage: {
    width: 200,
    height: 300,
    borderRadius: 10,
  },
  carouselContent: {
    paddingVertical: 10,
  },
});

export default Highlights;