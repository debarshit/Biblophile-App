import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
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
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';

interface BookshelfScreenProps {
  userData:{
    userId: string;
    isPageOwner: boolean;
  };
}

const TAGS_PER_PAGE = 5;

const BookshelfComponent: React.FC<BookshelfScreenProps> = ({ userData }) => {
  const [userBooks, setUserBooks] = useState([]);
  const [userTags, setUserTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMoreTags, setLoadingMoreTags] = useState(false);
  const [tagOffset, setTagOffset] = useState(0);
  const [hasMoreTags, setHasMoreTags] = useState(true);
  const navigation:any = useNavigation();

  const fetchTags = async (offset: number = 0, append: boolean = false) => {
    if (offset === 0) {
      setLoading(true);
    } else {
      setLoadingMoreTags(true);
    }

    try {
      const response = await instance.get(requests.fetchUserBookshelfTags, {
        params: {
          limit: TAGS_PER_PAGE,
          offset: offset,
        },
      });
      const newTags = response.data.data.tags || [];
      
      if (append) {
        setUserTags(prev => [...prev, ...newTags]);
      } else {
        setUserTags(newTags);
      }

      // If we got fewer tags than requested, there are no more to load
      setHasMoreTags(newTags.length === TAGS_PER_PAGE);
      setTagOffset(offset + newTags.length);
    } catch (e) {
      console.error("Failed to fetch tags", e);
    } finally {
      if (offset === 0) {
        setLoading(false);
      } else {
        setLoadingMoreTags(false);
      }
    }
  };

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
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserBooks(),
        fetchTags(0, false)
      ]);
      setLoading(false);
    };
    
    loadInitialData();
  }, []);

   const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    // Check if user has scrolled to bottom
    const isCloseToBottom = 
      layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && hasMoreTags && !loadingMoreTags) {
      fetchTags(tagOffset, true);
    }
  };

  const Separator = () => (
    <View style={styles.separator}>
      <Text style={styles.separatorText}>Your Tags</Text>
    </View>
  );

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

  const renderTagCard = (tag) => {
    const bookImages = tag.books
      .map(img => convertHttpToHttps(img))
      .slice(0, 5);

    return (
      <View style={styles.sectionContainer} key={tag.tagId}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("BookListScreen", {
              tagId: tag.tagId,
              tagName: tag.tagName,
              userData,
            })
          }
          style={styles.card}
        >
          <View style={styles.imageContainer}>
            {bookImages.length > 0 ? (
              <>
                <Image source={{ uri: bookImages[0] }} style={styles.coverImage} />
                <View style={styles.collageImages}>
                  {bookImages.slice(1).map((img, i) => (
                    <Image key={i} source={{ uri: img }} style={styles.collageImage} />
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyTagCover}>
                <Text style={styles.emptyTagText}>No Books</Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.statusText}>{tag.tagName}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewFlex}
        onScroll={handleScroll}
        scrollEventThrottle={400}
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
            
            {userTags.length > 0 && <Separator />}
            {userTags.map((tag) => renderTagCard(tag))}

            {loadingMoreTags && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
                <Text style={styles.loadingMoreText}>Loading more tags...</Text>
              </View>
            )}
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
  separator: {
    paddingVertical: SPACING.space_20,
    borderTopWidth: 1,
    borderColor: COLORS.secondaryLightGreyHex,
    paddingHorizontal: SPACING.space_20,
  },
  separatorText: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
  },
  emptyTagCover: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTagText: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.space_20,
    gap: SPACING.space_8,
  },
  loadingMoreText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
  },
});

export default BookshelfComponent;