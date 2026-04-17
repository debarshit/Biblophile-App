import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  Modal,
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
import ReadingHistoryModal from './ReadingHistoryModal';
import { useTheme } from '../../../contexts/ThemeContext';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';

interface BookshelfCardProps {
  id: string;
  userBookId?: number;
  isPageOwner: boolean;
  photo: string;
  status: string;
  startDate?: string;
  endDate?: string;
  progressUnit?: 'pages' | 'percentage' | 'seconds';
  progressValue: number|null;
  onUpdate: () => void;
  navigation: any;
}

const BookshelfCard: React.FC<BookshelfCardProps> = ({
  id,
  userBookId,
  isPageOwner = true,
  photo,
  status,
  startDate,
  endDate,
  progressUnit,
  progressValue,
  onUpdate,
  navigation
}) => {
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [showPrivacyOptions, setShowPrivacyOptions] = useState(false);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;

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

  const updateBookPrivacy = async (visibility: string) => {
    try {
      await instance.put(
        requests.updateBookPrivacy,
        {
          userBookId,
          visibility,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (err) {
      console.log("Failed to update book privacy", err);
    }
  };

  const handleModalUpdate = () => {
    setStatusModalVisible(false);
    setSelectedInstance(null);
    onUpdate();
  };

  const handleEditInstance = (instance: any) => {
    setSelectedInstance(instance);
    setStatusModalVisible(true);
  };

  const handleCloseStatusModal = () => {
    setStatusModalVisible(false);
    setSelectedInstance(null);
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

            {isPageOwner && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowPrivacyOptions(true)}
              >
                <Text style={{ color: "white", fontSize: 16 }}>⋮</Text>
              </TouchableOpacity>
            )}
            
            {/* Progress indicator for currently reading - now clickable to open modal */}
            {isPageOwner && status === 'Currently reading' && (
              <TouchableOpacity
                style={styles.progressContainer}
                onPress={() => setStatusModalVisible(true)}
              >
                <Text style={styles.progressText}>{`${progressUnit} ${progressValue}`}</Text>
              </TouchableOpacity>
            )}
          </ImageBackground>
        </TouchableOpacity>

        {/* Book Status Modal */}
        <BookStatusModal
          visible={statusModalVisible}
          onClose={() => setStatusModalVisible(false)}
          bookId={id}
          initialStatus={selectedInstance?.status || status}
          initialProgressUnit={selectedInstance?.progressUnit || progressUnit}
          initialProgressValue={selectedInstance?.progressValue || progressValue}
          initialStartDate={selectedInstance?.startDate || startDate}
          initialEndDate={selectedInstance?.endDate || endDate}
          userBookId={selectedInstance?.userBookId}
          onUpdate={handleModalUpdate}
          onViewHistory={() => {
            setStatusModalVisible(false);
            setTimeout(() => setShowHistoryModal(true), 300);
          }}
        />
        <ReadingHistoryModal
          visible={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          bookId={id}
          onEditInstance={handleEditInstance}
        />
      </LinearGradient>
        <Modal
          visible={showPrivacyOptions}
          transparent
          animationType="fade"
        >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPrivacyOptions(false)}
        >
          <View style={styles.modalContent}>
            
            <Text style={styles.modalTitle}>Book Privacy</Text>

            {[
              { label: "🔒 Only Me", value: "only_me" },
              { label: "👥 Friends", value: "friends" },
              { label: "👤 Followers", value: "followers" },
              { label: "🌍 Everyone", value: "everyone" },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  updateBookPrivacy(option.value);
                  setShowPrivacyOptions(false);
                }}
              >
                <Text style={styles.modalText}>{option.label}</Text>
              </TouchableOpacity>
            ))}

          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default BookshelfCard;

const createStyles = (COLORS) => StyleSheet.create({
  cardWrapper: {
    width: '100%',
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
    aspectRatio: 0.66,
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
  menuButton: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_20,
    borderTopLeftRadius: BORDERRADIUS.radius_20,
    borderTopRightRadius: BORDERRADIUS.radius_20,
  },
  modalTitle: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    marginBottom: SPACING.space_12,
  },
  modalOption: {
    paddingVertical: SPACING.space_12,
  },
  modalText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
  },
});