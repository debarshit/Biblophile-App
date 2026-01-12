import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, ToastAndroid, ScrollView,
  Modal, ActivityIndicator
} from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import Toast from 'react-native-toast-message';
import { useAnalytics } from '../../../utils/analytics';
import CustomPicker, { PickerOption } from '../../../components/CustomPickerComponent';
import TagSelectorModal from './TagSelectorModal';
import { hmsToSeconds, secondsToHMS } from '../../../utils/timeConversion';

interface ReadingStatusModalProps {
  visible: boolean;
  onClose: () => void;
  id: string;
  isGoogleBook: boolean;
  onBookPromoted?: (internalBookId: string) => void;
  product: any;
  onUpdate: (data: any) => void;
  initialStatus?: string;
  initialProgressValue: number;
  initialProgressUnit?: 'pages' | 'percentage' | 'seconds';
  initialTags?: any[];
  userBookId?: number|null;
}

const ReadingStatusModal: React.FC<ReadingStatusModalProps> = ({
  visible, onClose, id, isGoogleBook, product, onUpdate, initialStatus = 'To be read',
  initialProgressValue, initialProgressUnit, initialTags = [], userBookId, onBookPromoted,
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [localProgressValue, setLocalProgressValue] = useState(initialProgressValue);
  const [localProgressUnit, setLocalProgressUnit] = useState<'pages' | 'percentage' | 'seconds'>(initialProgressUnit || 'pages');
  const [bookTags, setBookTags] = useState(initialTags);
  const [tagSelectorVisible, setTagSelectorVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [seconds, setSeconds] = useState('0');

  const userDetails = useStore((state: any) => state.userDetails);
  const analytics = useAnalytics();

  const isCompletedBook = initialStatus === 'Read' || initialStatus === 'Did not finish';
  
  // Check if book format is audiobook
  const isAudiobook = product?.Format?.toLowerCase() === 'audiobook';

  const statusOptions: PickerOption[] = [
    ...(status === 'Currently reading' || status === 'Paused'
      ? [{ label: 'Paused', value: 'Paused', icon: 'pause' }]
      : []),
    { label: 'Read', value: 'Read', icon: 'check-circle' },
    isCompletedBook 
      ? { label: 'Re-read', value: 'Re-read', icon: 'read-more' }
      : { label: 'Currently reading', value: 'Currently reading', icon: 'menu-book' },
    { label: 'To be read', value: 'To be read', icon: 'bookmark-border' },
    { label: 'Did not finish', value: 'Did not finish', icon: 'cancel' },
    { label: 'Remove', value: 'Remove', icon: 'delete' },
  ];

  useEffect(() => {
    if (visible) {
      setStatus(initialStatus);
      setLocalProgressValue(initialProgressValue);
      
      // Set progress unit based on format
      const progressUnit = isAudiobook ? 'seconds' : (initialProgressUnit || 'pages');
      setLocalProgressUnit(progressUnit);
      setBookTags(initialTags);
      
      if (progressUnit === 'seconds' && initialProgressValue != null) {
        const { h, m, s } = secondsToHMS(initialProgressValue);
        setHours(h.toString());
        setMinutes(m.toString());
        setSeconds(s.toString());
      }
      
      if (initialStatus === 'To be read' && userBookId) checkIfInQueue();
    }
  }, [visible, initialStatus, userBookId, isAudiobook]);

  const updateSecondsFromTime = (h: string, m: string, s: string) => {
    setLocalProgressValue(hmsToSeconds(h, m, s));
  };

  const checkIfInQueue = async () => {
    if (!userBookId) return;
    
    try {
      const { data } = await instance.get(requests.fetchReadingQueue, {
        headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
      });
      const queue = data.data.queue || [];
      setIsInQueue(queue.some((item: any) => item.userBookId === userBookId));
    } catch (error) {
      console.log('Error checking queue status:', error);
    }
  };

  const fetchBookTagsList = async () => {
    try {
      const { data } = await instance.get(requests.fetchBookTags(id), {
        headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
      });
      const tags = data.data.tags || [];
      setBookTags(tags);
      onUpdate({ status, localProgressValue, tags });
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

  const ensureBookExists = async (): Promise<string> => {
    if (!isGoogleBook) return id;

    const workPayload = {
      title: product.volumeInfo?.title || '',
      description: product.volumeInfo?.description || '',
      originalLanguage: 'en',
      authors: product.volumeInfo?.authors || [],
      genres: product.volumeInfo?.categories || [],
      edition: {
        isbn: product.volumeInfo?.industryIdentifiers?.find(
          (id) => id.type === 'ISBN_13'
        )?.identifier || null,
        format: 'paperback',
        pageCount: product.volumeInfo?.pageCount || null,
        language: 'en',
        publisher: null,
        publicationYear: null,
        cover: product.volumeInfo?.imageLinks?.thumbnail || null,
      },
    };

    const { data } = await instance.post(requests.createWork, workPayload);

    if (data.status !== 'success') {
      throw new Error('Failed to create book work');
    }

    return data.data.bookId;
  };

  const handleAddToQueue = async () => {
    setQueueLoading(true);
    try {
      if (isInQueue) {
        if (!userBookId) {
          showToast('Please save the book status first', 'error');
          return;
        }
        await instance.delete(requests.removeFromQueue(userBookId), {
          headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
        });
        setIsInQueue(false);
        showToast('Removed from reading queue');
        analytics.track('removed_from_reading_queue');
      } else {
        const bookId = await ensureBookExists();
        if (isGoogleBook) {
          onBookPromoted?.(bookId);
        }
        await instance.post(requests.addToQueue, { bookId }, {
          headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
        });
        setIsInQueue(true);
        showToast('Added to reading queue');
        analytics.track('added_to_reading_queue');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to update queue';
      showToast(errorMessage, 'error');
      console.error('Error updating queue:', error);
    } finally {
      setQueueLoading(false);
    }
  };

  const submitReadingStatus = async () => {
    if (!userDetails) {
      showToast('Login to update reading status', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const bookId = await ensureBookExists();
      if (isGoogleBook) {
        onBookPromoted?.(bookId);
      }

      const requestData: any = { bookId };
      
      if (status === 'Re-read') {
        requestData.status = 'Currently reading';
        requestData.progressValue = localProgressValue ?? 0;
        requestData.progressUnit = localProgressUnit;
        requestData.createNew = true;
      } else {
        requestData.status = status;
        if (userBookId) requestData.userBookId = userBookId;
        if (status === "Currently reading" || status === "Paused") {
          requestData.progressValue = localProgressValue ?? 0;
          requestData.progressUnit = localProgressUnit;
        }
      }

      const { data } = await instance.post(requests.submitReadingStatus, requestData, {
        headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
      });

      if (data.data.message === "Updated successfully") {
        const userBookId = data.data.userBookId;
        analytics.track('reading_status_updated');
        onUpdate({ userBookId, status, localProgressValue, tags: bookTags });
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

  const renderTimeInput = (label: string, value: string, onChangeText: (text: string) => void) => (
    <View style={styles.timeInputWrapper}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput
        style={styles.timeInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={COLORS.secondaryLightGreyHex}
      />
    </View>
  );

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
          
          <View style={styles.section}>
            <Text style={styles.label}>Reading Status</Text>
            <CustomPicker options={statusOptions} selectedValue={status} onValueChange={setStatus} />
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {(status === 'Currently reading' || status === 'Paused' || status === 'Re-read') && (
              <View style={styles.section}>
                <Text style={styles.label}>
                  {isAudiobook ? 'Current position' : 'Current page'}
                </Text>

                {isAudiobook ? (
                  <View style={styles.timeRow}>
                    {[
                      { label: 'H', value: hours, setter: setHours },
                      { label: 'M', value: minutes, setter: setMinutes },
                      { label: 'S', value: seconds, setter: setSeconds }
                    ].map(({ label, value, setter }) =>
                      renderTimeInput(label, value, (text) => {
                        setter(text);
                        updateSecondsFromTime(
                          label === 'H' ? text : hours,
                          label === 'M' ? text : minutes,
                          label === 'S' ? text : seconds
                        );
                      })
                    )}
                  </View>
                ) : (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter page number"
                    keyboardType="numeric"
                    value={localProgressValue?.toString() || ''}
                    onChangeText={(text) => setLocalProgressValue(parseInt(text) || 0)}
                  />
                )}
              </View>
            )}

            {status === 'To be read' && (
              <View style={styles.section}>
                <View style={styles.queueHeader}>
                  <View>
                    <Text style={styles.label}>Reading Queue</Text>
                    <Text style={styles.queueSubtext}>Pin this to your next 5 reads</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.queueButton, isInQueue && styles.queueButtonActive, queueLoading && styles.queueButtonDisabled]}
                  onPress={handleAddToQueue}
                  disabled={queueLoading}
                >
                  {queueLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
                  ) : (
                    <>
                      <AntDesign name={isInQueue ? "checkcircle" : "plus"} size={FONTSIZE.size_16} color={COLORS.primaryWhiteHex} />
                      <Text style={styles.queueButtonText}>{isInQueue ? 'In Reading Queue' : 'Add to Reading Queue'}</Text>
                    </>
                  )}
                </TouchableOpacity>
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
                    <View key={tag.tagId} style={[styles.chip, { backgroundColor: tag.tagColor || COLORS.primaryGreyHex }]}>
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

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={submitReadingStatus} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TagSelectorModal
        visible={tagSelectorVisible}
        close={() => setTagSelectorVisible(false)}
        bookId={id}
        isGoogleBook={isGoogleBook}
        product={product}
        refreshTags={fetchBookTagsList}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.secondaryBlackRGBA, justifyContent: 'flex-end' },
  content: { backgroundColor: COLORS.primaryGreyHex, borderTopLeftRadius: BORDERRADIUS.radius_25, borderTopRightRadius: BORDERRADIUS.radius_25, padding: SPACING.space_24, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.space_20 },
  title: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_20, color: COLORS.primaryWhiteHex },
  section: { marginBottom: SPACING.space_20 },
  label: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_14, color: COLORS.primaryWhiteHex, marginBottom: SPACING.space_10 },
  input: { backgroundColor: COLORS.primaryDarkGreyHex, color: COLORS.primaryWhiteHex, fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_16, padding: SPACING.space_12, borderRadius: BORDERRADIUS.radius_10, borderWidth: 1, borderColor: COLORS.secondaryDarkGreyHex },
  queueHeader: { marginBottom: SPACING.space_12 },
  queueSubtext: { fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_12, color: COLORS.secondaryLightGreyHex, marginTop: SPACING.space_4 },
  queueButton: { backgroundColor: COLORS.primaryDarkGreyHex, paddingVertical: SPACING.space_12, paddingHorizontal: SPACING.space_16, borderRadius: BORDERRADIUS.radius_10, borderWidth: 1.5, borderColor: COLORS.primaryOrangeHex, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.space_8 },
  queueButtonActive: { backgroundColor: COLORS.primaryOrangeHex, borderColor: COLORS.primaryOrangeHex },
  queueButtonDisabled: { opacity: 0.5 },
  queueButtonText: { fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryWhiteHex, fontSize: FONTSIZE.size_14 },
  tagsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.space_10 },
  manageText: { fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryOrangeHex, fontSize: FONTSIZE.size_14 },
  chip: { paddingHorizontal: SPACING.space_12, paddingVertical: SPACING.space_8, borderRadius: BORDERRADIUS.radius_15, marginRight: SPACING.space_8 },
  chipText: { fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryWhiteHex, fontSize: FONTSIZE.size_14 },
  addChip: { paddingHorizontal: SPACING.space_16, paddingVertical: SPACING.space_12, borderRadius: BORDERRADIUS.radius_10, backgroundColor: COLORS.primaryDarkGreyHex, borderWidth: 1, borderColor: COLORS.primaryOrangeHex, borderStyle: 'dashed', alignItems: 'center' },
  addText: { fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryOrangeHex, fontSize: FONTSIZE.size_14 },
  button: { backgroundColor: COLORS.primaryOrangeHex, padding: SPACING.space_16, borderRadius: BORDERRADIUS.radius_15, alignItems: 'center', marginTop: SPACING.space_10 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryWhiteHex, fontSize: FONTSIZE.size_16 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.space_8 },
  timeInputWrapper: { flex: 1, alignItems: 'center' },
  timeLabel: { color: COLORS.secondaryLightGreyHex, fontSize: FONTSIZE.size_10, marginBottom: SPACING.space_4 },
  timeInput: { width: '90%', height: 44, backgroundColor: COLORS.primaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_8, borderWidth: 1, borderColor: COLORS.secondaryDarkGreyHex, color: COLORS.primaryWhiteHex, textAlign: 'center', fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_regular },
});

export default ReadingStatusModal;