import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Alert, Share } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import GradientBGIcon from '../../../components/GradientBGIcon';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import ReadingStatusModal from './ReadingStatusModal';
import { useStore } from '../../../store/store';
import ReadingHistoryModal from '../../reading/components/ReadingHistoryModal';
import MissingBookInfoModal from './MissingBookInfoModal';
import { useNavigation } from '@react-navigation/native';

interface ImageBackgroundInfoProps {
  EnableBackHandler: boolean;
  imagelink_portrait: string;
  id: string;
  favourite: boolean;
  name: string;
  type: string;
  author: string;
  genre: string;
  BackHandler?: () => void;
  product: any;
  isGoogleBook: boolean;
  onBookPromoted?: (internalBookId: string) => void;

}

// Extracted chip component for reusability
const Chip: React.FC<{ text: string; style?: any }> = ({ text, style }) => (
  <View style={[styles.chip, style]}>
    <Text style={styles.chipText}>{text}</Text>
  </View>
);

const ImageBackgroundInfo: React.FC<ImageBackgroundInfoProps> = ({
  EnableBackHandler,
  imagelink_portrait,
  id,
  name,
  type,
  author,
  genre,
  BackHandler,
  product,
  isGoogleBook,
  onBookPromoted,
}) => {
  const [bookData, setBookData] = useState({ averageRating: null, ratingsCount: null, topEmotions: [] });
  const [readingStatus, setReadingStatus] = useState({ userBookId: null, status: '', progressUnit: '', progressValue: 0, tags: [] });
  const [modalVisible, setModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const userDetails = useStore((state: any) => state.userDetails);
  const navigation = useNavigation<any>();

  const getBookId = async () => {
    if (type !== 'ExternalBook') return id;
    
    const isbn = product.volumeInfo?.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier;
    if (!isbn) return id;
    
    try {
      const response = await instance.get(requests.fetchBookId(isbn));
      return response.data.data.bookId || id;
    } catch {
      return id;
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const bookId = await getBookId();
        if (bookId !== id && isGoogleBook) {
          onBookPromoted?.(bookId);
        }
        
        // Parallel API calls
        const promises = [
          instance.get(requests.fetchAverageRating(bookId)),
          instance.get(requests.fetchAverageEmotions(bookId))
        ];

        if (userDetails) {
          const headers = { Authorization: `Bearer ${userDetails[0].accessToken}` };
          promises.push(
            instance.get(requests.fetchReadingStatus(bookId), { headers }),
            instance.get(requests.fetchBookTags(bookId), { headers })
          );
        }

        const [ratingRes, emotionsRes, statusRes, tagsRes] = await Promise.all(promises);
        
        setBookData({
          averageRating: ratingRes.data.data.averageRating,
          ratingsCount: ratingRes.data.data.totalRatings,
          topEmotions: emotionsRes.data.data.topEmotions || []
        });

        if (statusRes && tagsRes) {
          setReadingStatus({
            userBookId: statusRes.data.data.userBookId,
            status: statusRes.data.data.status || 'To be read',
            progressUnit: statusRes.data.data.progressUnit || '',
            progressValue: statusRes.data.data.progressValue,
            tags: tagsRes.data.data.tags || []
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchAllData();
  }, [id, type, product]);

  const handleShare = async () => {
    try {
      await Share.share({ message: `Checkout this book at https://biblophile.com/books/${type}/${id}/${name}` });
    } catch {
      Alert.alert('Error', 'Failed to share.');
    }
  };

  const handleEditInstance = (instance: any) => {
    // Update the reading status with the selected instance
    setReadingStatus({
      userBookId: instance.userBookId,
      status: instance.status,
      progressUnit: instance.progressUnit?.toString() || '',
      progressValue: instance.progressValue,
      tags: readingStatus.tags // Keep existing tags
    });
    // Open the status modal to edit
    setModalVisible(true);
  };

  const renderRating = () => {
    if (!bookData.averageRating) {
      return <Text style={styles.noRatingsText}>No ratings yet</Text>;
    }
    return (
      <>
        <AntDesign name="star" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_18} />
        <Text style={styles.ratingText}>{bookData.averageRating}</Text>
        <Text style={styles.ratingCountText}>({Number(bookData.ratingsCount).toLocaleString()})</Text>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {EnableBackHandler && (
          <TouchableOpacity onPress={BackHandler}>
            <GradientBGIcon name="left" color={COLORS.primaryLightGreyHex} size={FONTSIZE.size_16} />
          </TouchableOpacity>
        )}
         <View style={styles.headerRight}>
          {!isGoogleBook && <TouchableOpacity onPress={() => setShowReportModal(true)} style={styles.reportButton}>
            <GradientBGIcon name="warning" color={COLORS.primaryLightGreyHex} size={FONTSIZE.size_16} />
          </TouchableOpacity>}
          <TouchableOpacity onPress={handleShare}>
            <GradientBGIcon name="sharealt" color={COLORS.primaryLightGreyHex} size={FONTSIZE.size_16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Book Info Card */}
      <View style={styles.bookCard}>
        <Image source={{ uri: imagelink_portrait }} style={styles.bookCover} />

        <View style={styles.bookInfoRight}>
          {bookData.topEmotions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Mood</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {bookData.topEmotions.map((emotion: any, i) => (
                  <Chip key={i} text={emotion.emotion} style={styles.emotionChip} />
                ))}
              </ScrollView>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScrollView}>
            <Text style={styles.genreText}>{genre}</Text>
          </ScrollView>

          <Text style={styles.authorText}>{author}</Text>
          <View style={styles.ratingContainer}>{renderRating()}</View>
          
          {!isGoogleBook && <View style={[styles.section, {flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.space_8}]}>
            <Text style={styles.sectionLabel}>{product.Format}</Text>
            <TouchableOpacity 
              style={styles.editionsButton}
              onPress={() => navigation.navigate('Editions', { workId: product.WorkId, title: name, currentBookId: id })}
            >
              <MaterialIcons name="library-books" size={FONTSIZE.size_14} color={COLORS.primaryOrangeHex} />
              <Text style={styles.editionsText}>
                {product.OtherEditionsCount} other edition{product.OtherEditionsCount > 1 ? 's' : ''}
              </Text>
              <AntDesign name="right" size={FONTSIZE.size_12} color={COLORS.primaryOrangeHex} />
            </TouchableOpacity>
          </View>}
        </View>
      </View>

      {/* Book Title */}
      <Text style={styles.bookTitle}>{name}</Text>

      {/* User's Reading Info Card */}
      {type !== 'Bookmark' && (
        <View style={styles.readingInfoCard}>
          <View style={styles.readingInfoHeader}>
            <Text style={styles.readingInfoTitle}>My Reading Info</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={() => setHistoryModalVisible(true)} 
                style={styles.historyButton}
              >
                <MaterialIcons name="history" size={FONTSIZE.size_16} color={COLORS.primaryOrangeHex} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.editButton}>
                <AntDesign name="edit" size={FONTSIZE.size_14} color={COLORS.primaryWhiteHex} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statusDisplay}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{readingStatus.userBookId ? readingStatus.status : 'Set status'}</Text>
            </View>
            {readingStatus.status === 'Currently reading' && readingStatus.progressValue != null && (
              <Text style={styles.pageInfo}>{`${readingStatus.progressValue} ${readingStatus.progressUnit}`}</Text>
            )}
          </View>

          {readingStatus.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionLabel}>Tags</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {readingStatus.tags.map((tag: any) => (
                  <Chip key={tag.tagId} text={tag.tagName} style={{ backgroundColor: tag.tagColor || COLORS.primaryGreyHex }} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <ReadingStatusModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        id={id}
        isGoogleBook={isGoogleBook}
        onBookPromoted={onBookPromoted}
        product={product}
        onUpdate={setReadingStatus}
        initialStatus={readingStatus.status}
        initialProgressUnit={readingStatus.progressUnit as 'pages' | 'percentage' | 'seconds'}
        initialProgressValue={readingStatus.progressValue}
        initialTags={readingStatus.tags}
        userBookId={readingStatus.userBookId}
      />

      <ReadingHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        bookId={id}
        bookTitle={name}
        onEditInstance={handleEditInstance}
      />
      <MissingBookInfoModal
        modalVisible={showReportModal}
        setModalVisible={setShowReportModal}
        accessToken={userDetails[0].accessToken}
        workId={product?.WorkId}
        bookId={id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBlackHex },
  header: { padding: SPACING.space_20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookCard: { marginHorizontal: SPACING.space_20, marginBottom: SPACING.space_20, padding: SPACING.space_20, backgroundColor: COLORS.primaryGreyHex, borderRadius: BORDERRADIUS.radius_20, flexDirection: 'row' },
  bookCover: { width: 110, height: 165, borderRadius: BORDERRADIUS.radius_10, marginRight: SPACING.space_16, borderWidth: 1, borderColor: COLORS.primaryLightGreyHex },
  bookInfoRight: { flex: 1, justifyContent: 'space-between' },
  section: { marginBottom: SPACING.space_8 },
  sectionLabel: { fontFamily: FONTFAMILY.poppins_medium, fontSize: FONTSIZE.size_10, color: COLORS.secondaryLightGreyHex, marginBottom: SPACING.space_4, textTransform: 'uppercase', letterSpacing: 0.5 },
  chip: { paddingHorizontal: SPACING.space_12, paddingVertical: SPACING.space_8, borderRadius: BORDERRADIUS.radius_15, marginRight: SPACING.space_8 },
  chipText: { fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryWhiteHex, fontSize: FONTSIZE.size_12 },
  emotionChip: { backgroundColor: COLORS.primaryDarkGreyHex, paddingHorizontal: SPACING.space_10, paddingVertical: SPACING.space_4 },
  genreScrollView: { marginBottom: SPACING.space_12, maxHeight: FONTSIZE.size_16 + SPACING.space_8 },
  genreText: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_14, color: COLORS.primaryWhiteHex },
  authorText: { fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_14, color: COLORS.secondaryLightGreyHex },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_16, color: COLORS.primaryWhiteHex, marginLeft: SPACING.space_4 },
  ratingCountText: { fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_12, color: COLORS.secondaryLightGreyHex, marginLeft: SPACING.space_4 },
  noRatingsText: { fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_12, color: COLORS.secondaryLightGreyHex },
  bookTitle: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_24, color: COLORS.primaryWhiteHex, marginBottom: SPACING.space_20, paddingHorizontal: SPACING.space_20, textAlign: 'center' },
  readingInfoCard: { marginHorizontal: SPACING.space_20, padding: SPACING.space_16, backgroundColor: COLORS.primaryGreyHex, borderRadius: BORDERRADIUS.radius_15, borderWidth: 1, borderColor: COLORS.primaryDarkGreyHex },
  readingInfoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.space_12 },
  readingInfoTitle: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_16, color: COLORS.primaryWhiteHex },
  editButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryDarkGreyHex, paddingHorizontal: SPACING.space_12, paddingVertical: SPACING.space_8, borderRadius: BORDERRADIUS.radius_10, gap: SPACING.space_4 },
  editButtonText: { fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryWhiteHex, fontSize: FONTSIZE.size_14 },
  statusDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.space_12 },
  statusBadge: { backgroundColor: COLORS.primaryOrangeHex, paddingHorizontal: SPACING.space_12, paddingVertical: SPACING.space_8, borderRadius: BORDERRADIUS.radius_10 },
  statusText: { fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryWhiteHex, fontSize: FONTSIZE.size_14 },
  pageInfo: { fontFamily: FONTFAMILY.poppins_regular, color: COLORS.secondaryLightGreyHex, fontSize: FONTSIZE.size_14, marginLeft: SPACING.space_12 },
  tagsSection: { paddingTop: SPACING.space_12, borderTopWidth: 1, borderTopColor: COLORS.primaryDarkGreyHex },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.space_8 },
  historyButton: { padding: SPACING.space_8, backgroundColor: COLORS.primaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_10 },
  headerRight: { flexDirection: 'row', gap: SPACING.space_12 },
  reportButton: { opacity: 0.7 },
  editionsButton: { flexDirection: 'row', gap: SPACING.space_4 },
  editionsText: { fontFamily: FONTFAMILY.poppins_medium, fontSize: FONTSIZE.size_10, color: COLORS.primaryOrangeHex },
});

export default ImageBackgroundInfo;