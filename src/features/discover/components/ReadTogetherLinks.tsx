import React, { useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import axios from "../../../services/axios";
import requests from "../../../services/requests";
import { useNavigation } from '@react-navigation/native';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

interface ReadTogetherProps {
    id: string;
    isGoogleBook: boolean;
    product: any;
}

const ReadTogetherLinks: React.FC<ReadTogetherProps> = ({ id, isGoogleBook, product }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigation = useNavigation();

  const fetchBookId = async (): Promise<string | null> => {
    setIsLoading(true);

    try {
      let fetchedBookId = id;

      if (isGoogleBook) {
        const bookData = {
          ISBN: product.volumeInfo?.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier || '',
          Title: product.volumeInfo?.title || '',
          Pages: product.volumeInfo?.pageCount || '',
          Price: product.saleInfo?.listPrice?.amount || 0,
          Description: product.volumeInfo?.description || '',
          Authors: JSON.stringify(product.volumeInfo?.authors || []),
          Genres: JSON.stringify(product.volumeInfo?.categories || []),
          Image: product.volumeInfo?.imageLinks?.thumbnail || '',
        };
        const bookResponse = await axios.post(requests.addBook, bookData);

        if (bookResponse.data.message === "Book added/updated successfully") {
          fetchedBookId = bookResponse.data.bookId;
          return fetchedBookId;
        } else {
          console.log("Failed to add/update book.");
        }
      }

      return fetchedBookId;
    } catch (error) {
      console.error('Error submitting book', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = async (path: string) => {
    const currentBookId = await fetchBookId();

    // Check if bookId is available before navigating
    if (currentBookId) {
      navigation.navigate('Social', { uri: `${path}?bookId=${currentBookId}` });
    } else {
      console.error("Book ID is not available yet.");
    }
  };

  const handleLearnMorePress = () => {
    Linking.openURL("https://biblophile.freshdesk.com/support/solutions/articles/1060000111956");
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
        <TouchableOpacity
            onPress={() => handleButtonClick("https://biblophile.com/social/buddy-reads/create")}>
            <Text style={styles.button}>
            Create a Buddy Read
            </Text>
        </TouchableOpacity>
        <TouchableOpacity
            onPress={() => handleButtonClick("https://biblophile.com/social/readalong/create")}>
            <Text style={styles.button}>
            Create a Readalong
            </Text>
        </TouchableOpacity>
        <View style={styles.learnMoreContainer}>
            <Text style={styles.learnMoreText}>
                Not sure which option to choose? 
                <TouchableOpacity onPress={handleLearnMorePress}>
                    <Text style={styles.learnMoreLink}> Learn more about Buddy Reads vs Readalongs</Text>
                </TouchableOpacity>
            </Text>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: SPACING.space_16,
    padding: SPACING.space_20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
  },
  button: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  learnMoreContainer: {
    marginTop: SPACING.space_16,
  },
  learnMoreText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
  },
  learnMoreLink: {
    color: COLORS.secondaryLightGreyHex,
    textDecorationLine: 'underline',
  }
});

export default ReadTogetherLinks;
