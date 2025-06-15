import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import Mascot from '../../../components/Mascot';
import { useNavigation } from '@react-navigation/native';

interface BookshelfScreenProps {
  userData:{
    userId: string;
    isPageOwner: boolean;
  };
}
const BookshelfComponent: React.FC<BookshelfScreenProps> = ({ userData }) => {
  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation:any = useNavigation();

  const fetchUserBooks = async () => {
    setLoading(true);
    try {
      const response = await instance.get(requests.fetchUserBooks, {
        params: {
          userId: userData.userId,
        },
      });

      setUserBooks(response.data.data.userBooks);
    } catch (error) {
      console.error('Failed to fetch user books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBooks();
  }, []);

  const convertHttpToHttps = (url) => {
    if (url && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  const renderBooksByStatus = (status) => {
    const books = userBooks.filter((book) => book.Status === status);
    if (books.length === 0) return null;

    const bookImages = books
    .map((book) => convertHttpToHttps(book.BookPhoto))
    .filter((image) => image !== null) as string[];

    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('BookListScreen', {
              status: status,
              userData: userData,
            });
          }}
          style={styles.card}
        >
          {/* Full cover image for the top portion */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: bookImages[0] }} style={styles.coverImage} />
            {/* Collage images */}
            <View style={styles.collageImages}>
              {bookImages.slice(1, 5).map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={[
                    styles.collageImage,
                    {
                      top: index % 2 === 0 ? SPACING.space_16 : SPACING.space_18,
                      left: index % 3 === 0 ? SPACING.space_8 : SPACING.space_10,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Status footer */}
          <View style={styles.footer}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewFlex}
      >

        {userBooks.length === 0 && <Mascot emotion="sleeping"/>}

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <>
            {renderBooksByStatus('Currently reading')}
            {renderBooksByStatus('Read')}
            {renderBooksByStatus('Paused')}
            {renderBooksByStatus('To be read')}
            {renderBooksByStatus('Did not finish')}
          </>
        )}
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  scrollViewFlex: {
    paddingBottom: SPACING.space_30,
  },
  sectionContainer: {
    marginBottom: SPACING.space_20,
  },
  card: {
    margin: SPACING.space_8,
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
    shadowColor: COLORS.primaryBlackHex,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderTopLeftRadius: BORDERRADIUS.radius_20,
    borderTopRightRadius: BORDERRADIUS.radius_20,
  },
  collageImages: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collageImage: {
    width: 50,
    height: 75, // 1.5x 50px
    resizeMode: 'cover',
    borderRadius: BORDERRADIUS.radius_8,
    margin: SPACING.space_2,
    borderWidth: 2,
    borderColor: COLORS.primaryDarkGreyHex,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.space_4,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderBottomLeftRadius: BORDERRADIUS.radius_20,
    borderBottomRightRadius: BORDERRADIUS.radius_20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
    paddingLeft: SPACING.space_20,
    marginBottom: SPACING.space_12,
  },
  bookshelfContainer: {
    paddingLeft: SPACING.space_20,
    gap: SPACING.space_20,
  },
  statusText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    textAlign: 'center',
  },
  loadingText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginTop: SPACING.space_36,
  },
});

export default BookshelfComponent;
