import React, { useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import BookStatusModal from './BookStatusModal';

const { width } = Dimensions.get('window');
const CONTAINER_PADDING = SPACING.space_16;
const CARD_MARGIN = SPACING.space_8;
const AVAILABLE_WIDTH = width - (CONTAINER_PADDING * 2);
const CARD_WIDTH = (AVAILABLE_WIDTH - CARD_MARGIN) / 2;
const IMAGE_HEIGHT = CARD_WIDTH * 1.4; // Book aspect ratio

interface BookshelfCardProps {
  id: string;
  isPageOwner: boolean;
  photo: string;
  status: string;
  startDate?: string;
  endDate?: string;
  currentPage?: number;
  onUpdate: () => void;
  navigation: any;
}

const BookshelfCard: React.FC<BookshelfCardProps> = ({
  id,
  isPageOwner = true,
  photo,
  status,
  startDate,
  endDate,
  currentPage,
  onUpdate,
  navigation
}) => {
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Read':
        return '#4CAF50';
      case 'Currently reading':
        return COLORS.primaryOrangeHex;
      case 'Paused':
        return '#FFC107';
      case 'To be read':
        return '#2196F3';
      case 'Did not finish':
        return COLORS.primaryRedHex;
      default:
        return COLORS.secondaryLightGreyHex;
    }
  };

  const handleModalUpdate = () => {
    setStatusModalVisible(false);
    onUpdate();
  };

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardContainer}
        colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}>
        
        {/* Book Cover */}
        <TouchableOpacity
          onPress={() => {
            navigation.push('Details', {
              id: id,
              type: "Book",
            });
          }}
          style={styles.imageContainer}
          activeOpacity={0.8}>
          <ImageBackground
            source={{ uri: photo }}
            style={styles.bookImage}
            resizeMode="cover">
            {/* Status Badge */}
            {isPageOwner ? (
              <TouchableOpacity
                onPress={() => setStatusModalVisible(true)}
                style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}
              >
                <Text style={styles.statusText}>
                  {status === 'Currently reading' ? 'Reading' :
                    status === 'To be read' ? 'Want to Read' : status}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                <Text style={styles.statusText}>
                  {status}
                </Text>
              </View>
            )}
            
            {/* Progress indicator for currently reading - now clickable to open modal */}
            {isPageOwner && status === 'Currently reading' && (
              <TouchableOpacity
                style={styles.progressContainer}
                onPress={() => setStatusModalVisible(true)}
              >
                <Text style={styles.progressText}>Page {currentPage}</Text>
              </TouchableOpacity>
            )}
          </ImageBackground>
        </TouchableOpacity>

        {/* Book Status Modal */}
        <BookStatusModal
          visible={statusModalVisible}
          onClose={() => setStatusModalVisible(false)}
          bookId={id}
          initialStatus={status}
          initialPage={currentPage}
          initialStartDate={startDate}
          initialEndDate={endDate}
          onUpdate={handleModalUpdate}
        />
      </LinearGradient>
    </View>
  );
};

export default BookshelfCard;

const styles = StyleSheet.create({
  cardWrapper: {
    width: CARD_WIDTH,
  },
  cardContainer: {
    borderRadius: BORDERRADIUS.radius_15,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  bookImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
    justifyContent: 'space-between',
  },
  statusBadge: {
    position: 'absolute',
    top: SPACING.space_8,
    right: SPACING.space_8,
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
    maxWidth: '80%',
  },
  statusText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
    position: 'absolute',
    bottom: SPACING.space_8,
    left: SPACING.space_8,
  },
  progressText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
  },
});