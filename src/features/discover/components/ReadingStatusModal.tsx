import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  ToastAndroid, 
  ScrollView,
  Modal 
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import Toast from 'react-native-toast-message';
import { useAnalytics } from '../../../utils/analytics';
import CustomPicker, { PickerOption } from '../../../components/CustomPickerComponent';
import TagSelectorModal from './TagSelectorModal';

interface ReadingStatusModalProps {
  visible: boolean;
  onClose: () => void;
  id: string;
  isGoogleBook: boolean;
  product: any;
  onUpdate: (data: any) => void;
  initialStatus?: string;
  initialPage?: string;
  initialTags?: any[];

}

const ReadingStatusModal: React.FC<ReadingStatusModalProps> = ({
  visible,
  onClose,
  id,
  isGoogleBook,
  product,
  onUpdate,
  initialStatus = 'To be read',
  initialPage = '',
  initialTags = [],
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [bookTags, setBookTags] = useState(initialTags);
  const [tagSelectorVisible, setTagSelectorVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const userDetails = useStore((state: any) => state.userDetails);
  const analytics = useAnalytics();

  const statusOptions: PickerOption[] = [
    ...(status === 'Currently reading' || status === 'Paused'
            ? [{ label: 'Paused', value: 'Paused', icon: 'pause' }]
            : []),
    { label: 'Read', value: 'Read', icon: 'check-circle' },
    { label: 'Currently reading', value: 'Currently reading', icon: 'menu-book' },
    { label: 'To be read', value: 'To be read', icon: 'bookmark-border' },
    { label: 'Did not finish', value: 'Did not finish', icon: 'cancel' },
    { label: 'Remove', value: 'Remove', icon: 'delete' },
  ];

  // Sync with parent's initial values when modal opens
  useEffect(() => {
    if (visible) {
      setStatus(initialStatus);
      setCurrentPage(initialPage);
      setBookTags(initialTags);
    }
  }, [visible]);

  const fetchBookTagsList = async () => {
    try {
      const res = await instance.get(requests.fetchBookTags(id), {
        headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
      });
      const tags = res.data.data.tags || [];
      setBookTags(tags);
      onUpdate({ status, currentPage, tags });
    } catch (err) {
      console.log("Error fetching book tags:", err);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(message, ToastAndroid.SHORT, ToastAndroid.CENTER);
    } else {
      Toast.show({ type, text1: message, visibilityTime: 2000, position: 'bottom', bottomOffset: 100 });
    }
  };

  const submitReadingStatus = async () => {
    if (!userDetails) {
      showToast('Login to update reading status', 'error');
      return;
    }

    try {
      setLoading(true);
      
      let bookId = id;
      if (isGoogleBook) {
        const bookData = {
          ISBN: product.volumeInfo?.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier || '',
          Title: product.volumeInfo?.title || '',
          Pages: product.volumeInfo?.pageCount || 0,
          Price: product.saleInfo?.listPrice?.amount || 0,
          Description: product.volumeInfo?.description || '',
          Authors: product.volumeInfo?.authors || [],
          Genres: product.volumeInfo?.categories || [],
          Image: product.volumeInfo?.imageLinks?.thumbnail || '',
        };

        const response = await instance.post(requests.addBook, bookData);
        if (response.data.status === "success") {
          bookId = response.data.data.bookId;
        } else throw new Error("Failed to add/update book");
      }

      const requestData: any = { bookId, status };
      
      if (status === "Currently reading" || status === "Paused") {
        requestData.currentPage = (currentPage && !isNaN(Number(currentPage)) && currentPage.trim()) ? currentPage : '0';
      }

      const response = await instance.post(requests.submitReadingStatus, requestData, {
        headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
      });

      if (response.data.data.message === "Updated") {
        analytics.track('reading_status_updated');
        onUpdate({ status, currentPage, tags: bookTags });
        showToast('Updated successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error submitting status:', error);
      showToast('Uh oh! Please try again', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Update Reading Info</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={FONTSIZE.size_24} color={COLORS.secondaryLightGreyHex} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.label}>Reading Status</Text>
              <CustomPicker
                options={statusOptions}
                selectedValue={status}
                onValueChange={setStatus}
              />
            </View>

            {(status === 'Currently reading' || status === 'Paused') && (
              <View style={styles.section}>
                <Text style={styles.label}>Current Page</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter page number"
                  placeholderTextColor={COLORS.secondaryLightGreyHex}
                  keyboardType="numeric"
                  value={String(currentPage)}
                  onChangeText={setCurrentPage}
                />
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.tagsHeader}>
                <Text style={styles.label}>Tags</Text>
                <TouchableOpacity onPress={() => setTagSelectorVisible(true)}>
                  <Text style={styles.manageText}>Manage Tags</Text>
                </TouchableOpacity>
              </View>
              
              {bookTags.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {bookTags.map((tag: any) => (
                    <View 
                      key={tag.tagId} 
                      style={[styles.chip, { backgroundColor: tag.tagColor || COLORS.primaryGreyHex }]}
                    >
                      <Text style={styles.chipText}>{tag.tagName}</Text>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <TouchableOpacity style={styles.addChip} onPress={() => setTagSelectorVisible(true)}>
                  <Text style={styles.addText}>+ Add your first tag</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={[styles.button, loading && { opacity: 0.5 }]} onPress={submitReadingStatus} disabled={loading}>
            <Text style={styles.buttonText}> {loading ? "Saving..." : "Save Changes"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TagSelectorModal
        visible={tagSelectorVisible}
        close={() => setTagSelectorVisible(false)}
        bookId={id}
        refreshTags={fetchBookTagsList}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.secondaryBlackRGBA,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.primaryGreyHex,
    borderTopLeftRadius: BORDERRADIUS.radius_25,
    borderTopRightRadius: BORDERRADIUS.radius_25,
    padding: SPACING.space_24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_20,
  },
  title: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
  section: {
    marginBottom: SPACING.space_20,
  },
  label: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  input: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: COLORS.secondaryDarkGreyHex,
  },
  tagsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_10,
  },
  manageText: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_14,
  },
  chip: {
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_15,
    marginRight: SPACING.space_8,
  },
  chipText: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
  },
  addChip: {
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addText: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_14,
  },
  button: {
    backgroundColor: COLORS.primaryOrangeHex,
    padding: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_15,
    alignItems: 'center',
    marginTop: SPACING.space_10,
  },
  buttonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
  },
});

export default ReadingStatusModal;