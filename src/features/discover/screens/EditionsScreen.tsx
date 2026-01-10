import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import GradientBGIcon from '../../../components/GradientBGIcon';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import { useStore } from '../../../store/store';
import { secondsToHMS, hmsToSeconds } from '../../../utils/timeConversion';

interface Edition {
  bookId: number;
  isbn: string | null;
  format: string;
  progressValue?: number | null;
  progressUnit?: string;
  language: string;
  cover: string | null;
  publisher: string | null;
  publicationYear: number | null;
}

interface EditionsData {
  title: string;
  editions: Edition[];
  pagination: { total: number; limit: number; offset: number; hasNextPage: boolean };
}

const formatProgress = (value: number, unit: string, total: number | null) => {
  if (unit === 'pages') return `Page ${value}${total ? ` of ${total}` : ''}`;
  if (unit === 'seconds') {
    const { h, m, s } = secondsToHMS(value);
    const time = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    if (total) {
      const { h: th, m: tm, s: ts } = secondsToHMS(total);
      return `${time} / ${th}:${tm.toString().padStart(2, '0')}:${ts.toString().padStart(2, '0')}`;
    }
    return time;
  }
  return `${value}%`;
};

const EditionsScreen = ({ navigation, route }: any) => {
  const { workId, title, currentBookId, switchMode, userBookId } = route.params;
  const [editionsData, setEditionsData] = useState<EditionsData | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState<Edition | null>(null);
  const [adjustedProgress, setAdjustedProgress] = useState<string>('');
  const [timeProgress, setTimeProgress] = useState({ hours: '', minutes: '', seconds: '' });
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const userDetails = useStore((state: any) => state.userDetails);

  useEffect(() => {
    const fetchEditions = async () => {
      setLoading(true);
      try {
        const response = await instance.get(`${requests.fetchWorkEditions(workId)}?limit=${limit}&offset=${offset}`);
        setEditionsData(response.data.data);
      } catch (error) {
        console.error('Error fetching editions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEditions();
  }, [offset]);

  const handleEditionPress = async (edition: Edition) => {
    if (switchMode && userBookId) {
      try {
        const response = await instance.post(
          requests.previewEditionSwitch,
          { userBookId, newBookId: edition.bookId },
          { headers: { Authorization: `Bearer ${userDetails[0].accessToken}` } }
        );

        const preview = response.data.data;
        setPreviewData(preview);
        setSelectedEdition(edition);
        
        if (preview.suggestedProgress.progressUnit === 'seconds') {
          const { h, m, s } = secondsToHMS(preview.suggestedProgress.progressValue);
          setTimeProgress({ hours: h.toString(), minutes: m.toString(), seconds: s.toString() });
        } else {
          setAdjustedProgress(preview.suggestedProgress.progressValue.toString());
        }
        setShowConfirmModal(true);
      } catch (error) {
        Alert.alert('Error', 'Failed to calculate suggested position.');
      }
    } else {
      navigation.navigate('Details', { id: edition.bookId.toString(), type: 'Book' });
    }
  };

  const handleConfirmSwitch = async () => {
    if (!selectedEdition || !previewData) return;
    
    let finalProgressValue = previewData.suggestedProgress.progressValue;
    if (previewData.suggestedProgress.progressUnit === 'seconds') {
      const totalSeconds = hmsToSeconds(
        timeProgress.hours || '0',
        timeProgress.minutes || '0',
        timeProgress.seconds || '0'
      );
      if (totalSeconds > 0) finalProgressValue = totalSeconds;
    } else {
      finalProgressValue = parseInt(adjustedProgress) || previewData.suggestedProgress.progressValue;
    }

    try {
      const response = await instance.post(
        requests.confirmEditionSwitch,
        { userBookId, newBookId: selectedEdition.bookId, progressValue: finalProgressValue },
        { headers: { Authorization: `Bearer ${userDetails[0].accessToken}` } }
      );

      const { oldEdition, newEdition, suggestedProgress } = response.data.data;
      const message = 
        `Old: ${oldEdition.format} - ${formatProgress(oldEdition.progressValue, oldEdition.progressUnit, oldEdition.total)}\n` +
        `New: ${newEdition.format} - ${formatProgress(suggestedProgress.progressValue, suggestedProgress.progressUnit, newEdition.total)}\n\n` +
        `Progress: ${(suggestedProgress.canonicalProgress * 100).toFixed(1)}%`;

      Alert.alert('Edition Switched! 📚', message, [{
        text: 'Continue Reading',
        onPress: () => navigation.navigate('Details', { id: selectedEdition.bookId.toString(), type: 'Book' })
      }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to switch edition.');
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handlePagination = (isNext: boolean) => {
    if (isNext && editionsData?.pagination.hasNextPage) {
      setOffset(offset + limit);
    } else if (!isNext && offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  if (loading && !editionsData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={COLORS.primaryBlackHex} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
        </View>
      </SafeAreaView>
    );
  }

  const currentEdition = editionsData?.editions.find(e => String(e.bookId) === String(currentBookId));
  const otherEditions = editionsData?.editions.filter(e => String(e.bookId) !== String(currentBookId));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <GradientBGIcon name="left" color={COLORS.primaryLightGreyHex} size={FONTSIZE.size_16} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('AddEdition', { workId, title: editionsData?.title || title })} 
            style={styles.addButton}
          >
            <AntDesign name="plus" size={FONTSIZE.size_16} color={COLORS.primaryWhiteHex} />
            <Text style={styles.addButtonText}>Add Edition</Text>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>All Editions</Text>
          <Text style={styles.bookTitle}>
            of <Text style={styles.bookTitleHighlight}>{editionsData?.title}</Text>
          </Text>
          <Text style={styles.countText}>
            Showing {editionsData?.editions.length} of {editionsData?.pagination.total} editions
          </Text>
        </View>

        {/* Current Edition */}
        {currentEdition && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CURRENT EDITION</Text>
            <EditionCard
              edition={currentEdition}
              title={editionsData?.title || ''}
              onPress={() => handleEditionPress(currentEdition)}
              isCurrent
              switchMode
            />
            <View style={styles.divider} />
          </View>
        )}

        {/* Other Editions */}
        <View style={styles.section}>
          {currentEdition && <Text style={styles.sectionLabel}>OTHER AVAILABLE EDITIONS</Text>}
          {(currentEdition ? otherEditions : editionsData?.editions)?.map((edition) => (
            <EditionCard
              key={edition.bookId}
              edition={edition}
              title={editionsData?.title || ''}
              onPress={() => handleEditionPress(edition)}
              switchMode
            />
          ))}
          {otherEditions?.length === 0 && currentEdition && (
            <Text style={styles.noEditionsText}>No other editions available.</Text>
          )}
        </View>

        {/* Pagination */}
        {editionsData && editionsData.pagination.total > editionsData.pagination.limit && (
          <View style={styles.pagination}>
            {['Previous', 'Next'].map((label, idx) => {
              const isNext = idx === 1;
              const disabled = isNext ? !editionsData.pagination.hasNextPage : offset === 0;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => handlePagination(isNext)}
                  disabled={disabled}
                  style={[styles.paginationButton, disabled && styles.paginationButtonDisabled]}
                >
                  <Text style={[styles.paginationButtonText, disabled && styles.paginationButtonTextDisabled]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Confirm Edition Switch</Text>
            
            {previewData && (
              <>
                <View style={styles.progressComparison}>
                  <View style={styles.progressBlock}>
                    <Text style={styles.progressLabel}>Current Progress</Text>
                    <Text style={styles.progressValue}>
                      {formatProgress(previewData.oldEdition.progressValue, previewData.oldEdition.progressUnit, previewData.oldEdition.total)}
                    </Text>
                    <Text style={styles.formatText}>{previewData.oldEdition.format}</Text>
                  </View>

                  <MaterialIcons name="arrow-forward" size={24} color={COLORS.primaryOrangeHex} />

                  <View style={styles.progressBlock}>
                    <Text style={styles.progressLabel}>Suggested Position</Text>
                    {previewData.suggestedProgress.progressUnit === 'seconds' ? (
                      <View style={styles.timeInputRow}>
                        {['hours', 'minutes', 'seconds'].map((field, idx) => (
                          <React.Fragment key={field}>
                            {idx > 0 && <Text style={styles.timeSeparator}>:</Text>}
                            <TextInput
                              style={styles.timeInput}
                              value={timeProgress[field as keyof typeof timeProgress]}
                              onChangeText={(v) => setTimeProgress({ ...timeProgress, [field]: v })}
                              keyboardType="numeric"
                              placeholder={field === 'hours' ? 'hh' : 'mm'}
                            />
                          </React.Fragment>
                        ))}
                      </View>
                    ) : (
                      <TextInput
                        style={styles.progressInput}
                        value={adjustedProgress}
                        onChangeText={setAdjustedProgress}
                        keyboardType="numeric"
                      />
                    )}
                    <Text style={styles.formatText}>{previewData.newEdition.format}</Text>
                    <Text style={styles.unitText}>
                      {previewData.suggestedProgress.progressUnit === 'seconds' 
                        ? `(hh:mm:ss)${previewData.newEdition.total ? ` / Total: ${formatProgress(0, 'seconds', previewData.newEdition.total).split(' / ')[1]}` : ''}`
                        : previewData.suggestedProgress.progressUnit === 'pages'
                        ? `Total: ${previewData.newEdition.total} pages`
                        : `${previewData.suggestedProgress.progressUnit}`}
                    </Text>
                  </View>
                </View>

                <Text style={styles.canonicalProgress}>
                  Overall Progress: {(previewData.suggestedProgress.canonicalProgress * 100).toFixed(1)}%
                </Text>
              </>
            )}

            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmSwitch}>
                <Text style={styles.confirmButtonText}>Confirm Switch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const EditionCard = ({ edition, title, onPress, isCurrent, switchMode }: {
  edition: Edition;
  title: string;
  onPress: () => void;
  isCurrent?: boolean;
  switchMode?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.editionCard, isCurrent && styles.editionCardCurrent]}
    disabled={isCurrent && switchMode}
  >
    <Image
      source={{ uri: convertHttpToHttps(edition.cover) || 'https://via.placeholder.com/100x150' }}
      style={styles.editionCover}
    />

    <View style={styles.editionContent}>
      <View style={styles.editionHeader}>
        <Text style={styles.editionFormat}>
          {edition.format.charAt(0).toUpperCase() + edition.format.slice(1)} Edition
        </Text>
        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>SELECTED</Text>
          </View>
        )}
      </View>

      <View style={styles.editionDetails}>
        {[
          { label: 'Language', value: edition.language },
          { label: edition.progressUnit, value: edition.progressValue },
          { label: 'Year', value: edition.publicationYear }
        ].map(({ label, value }) => value && (
          <Text key={label} style={styles.editionDetailText}>
            {label}: <Text style={styles.editionDetailValue}>{value}</Text>
          </Text>
        ))}
      </View>

      {(edition.publisher || edition.isbn) && (
        <View style={styles.editionMeta}>
          {[
            { label: 'Publisher', value: edition.publisher },
            { label: 'ISBN', value: edition.isbn }
          ].map(({ label, value }) => value && (
            <Text key={label} style={styles.editionMetaText}>
              {label}: <Text style={styles.editionMetaValue}>{value}</Text>
            </Text>
          ))}
        </View>
      )}
    </View>

    <AntDesign name="right" size={FONTSIZE.size_16} color={COLORS.secondaryLightGreyHex} style={styles.chevron} />

    {switchMode && !isCurrent && (
      <View style={styles.switchBadge}>
        <Text style={styles.switchBadgeText}>TAP TO SWITCH</Text>
      </View>
    )}
    
    {isCurrent && switchMode && (
      <View style={styles.currentReadingBadge}>
        <Text style={styles.currentReadingBadgeText}>CURRENTLY READING</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBlackHex },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: SPACING.space_30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.space_20 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryOrangeHex, paddingHorizontal: SPACING.space_16, paddingVertical: SPACING.space_12, borderRadius: BORDERRADIUS.radius_10, gap: SPACING.space_8 },
  addButtonText: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_14, color: COLORS.primaryWhiteHex },
  titleSection: { paddingHorizontal: SPACING.space_20, marginBottom: SPACING.space_30 },
  mainTitle: { fontFamily: FONTFAMILY.poppins_bold, fontSize: FONTSIZE.size_28, color: COLORS.primaryWhiteHex, marginBottom: SPACING.space_8 },
  bookTitle: { fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_18, color: COLORS.secondaryLightGreyHex },
  bookTitleHighlight: { fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryOrangeHex },
  countText: { fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_12, color: COLORS.secondaryLightGreyHex, marginTop: SPACING.space_8 },
  section: { paddingHorizontal: SPACING.space_20, marginBottom: SPACING.space_24 },
  sectionLabel: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_12, color: COLORS.secondaryLightGreyHex, letterSpacing: 1, marginBottom: SPACING.space_16 },
  divider: { height: 1, backgroundColor: COLORS.primaryGreyHex, marginTop: SPACING.space_24, opacity: 0.3 },
  editionCard: { flexDirection: 'row', backgroundColor: COLORS.primaryGreyHex, borderRadius: BORDERRADIUS.radius_15, padding: SPACING.space_16, marginBottom: SPACING.space_12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  editionCardCurrent: { borderColor: COLORS.primaryOrangeHex, shadowColor: COLORS.primaryOrangeHex, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  editionCover: { width: 80, height: 120, borderRadius: BORDERRADIUS.radius_8, marginRight: SPACING.space_16 },
  editionContent: { flex: 1 },
  editionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.space_8 },
  editionFormat: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_16, color: COLORS.primaryWhiteHex, flex: 1 },
  currentBadge: { backgroundColor: COLORS.primaryOrangeHex, paddingHorizontal: SPACING.space_8, paddingVertical: SPACING.space_4, borderRadius: BORDERRADIUS.radius_8 },
  currentBadgeText: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_10, color: COLORS.primaryWhiteHex },
  editionDetails: { marginBottom: SPACING.space_8 },
  editionDetailText: { fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_12, color: COLORS.secondaryLightGreyHex, marginBottom: SPACING.space_4 },
  editionDetailValue: { fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryWhiteHex },
  editionMeta: { marginTop: SPACING.space_8 },
  editionMetaText: { fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_10, color: COLORS.secondaryLightGreyHex, marginBottom: SPACING.space_2 },
  editionMetaValue: { fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryWhiteHex },
  chevron: { marginLeft: SPACING.space_8 },
  noEditionsText: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_18, color: COLORS.secondaryLightGreyHex, textAlign: 'center', marginVertical: SPACING.space_30 },
  pagination: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.space_16, paddingHorizontal: SPACING.space_20, marginTop: SPACING.space_20 },
  paginationButton: { backgroundColor: COLORS.primaryOrangeHex, paddingHorizontal: SPACING.space_24, paddingVertical: SPACING.space_12, borderRadius: BORDERRADIUS.radius_10, flex: 1, maxWidth: 150 },
  paginationButtonDisabled: { backgroundColor: COLORS.primaryGreyHex },
  paginationButtonText: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_14, color: COLORS.primaryWhiteHex, textAlign: 'center' },
  paginationButtonTextDisabled: { color: COLORS.secondaryLightGreyHex },
  switchBadge: { position: 'absolute', top: SPACING.space_12, right: SPACING.space_12, backgroundColor: COLORS.primaryOrangeHex, paddingHorizontal: SPACING.space_8, paddingVertical: SPACING.space_4, borderRadius: BORDERRADIUS.radius_8 },
  switchBadgeText: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_10, color: COLORS.primaryWhiteHex },
  currentReadingBadge: { position: 'absolute', top: SPACING.space_12, right: SPACING.space_12, backgroundColor: COLORS.primaryGreyHex, paddingHorizontal: SPACING.space_8, paddingVertical: SPACING.space_4, borderRadius: BORDERRADIUS.radius_8 },
  currentReadingBadgeText: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_10, color: COLORS.secondaryLightGreyHex },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center', padding: SPACING.space_20 },
  confirmModal: { width: '100%', maxWidth: 400, backgroundColor: COLORS.primaryGreyHex, borderRadius: BORDERRADIUS.radius_20, padding: SPACING.space_24, shadowColor: COLORS.primaryOrangeHex, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 },
  confirmTitle: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_20, color: COLORS.primaryWhiteHex, textAlign: 'center', marginBottom: SPACING.space_24 },
  progressComparison: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.space_20, gap: SPACING.space_12 },
  progressBlock: { flex: 1, backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_15, padding: SPACING.space_16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBlackHex, minWidth: 140 },
  progressLabel: { fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_12, color: COLORS.secondaryLightGreyHex, marginBottom: SPACING.space_8, textAlign: 'center' },
  progressValue: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_18, color: COLORS.primaryOrangeHex, marginBottom: SPACING.space_8, textAlign: 'center' },
  progressInput: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_18, color: COLORS.primaryOrangeHex, backgroundColor: COLORS.primaryBlackHex, borderRadius: BORDERRADIUS.radius_8, paddingHorizontal: SPACING.space_12, paddingVertical: SPACING.space_8, borderWidth: 1, borderColor: COLORS.primaryOrangeHex, textAlign: 'center', marginBottom: SPACING.space_8, minWidth: 80 },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.space_8, flexWrap: 'nowrap' },
  timeInput: { width: 30, backgroundColor: COLORS.primaryBlackHex, color: COLORS.primaryOrangeHex, borderRadius: BORDERRADIUS.radius_8, paddingVertical: SPACING.space_4, textAlign: 'center', fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_14, borderWidth: 1, borderColor: COLORS.primaryOrangeHex },
  timeSeparator: { color: COLORS.primaryWhiteHex, fontSize: FONTSIZE.size_16, fontFamily: FONTFAMILY.poppins_semibold, marginHorizontal: 2 },
  formatText: { fontFamily: FONTFAMILY.poppins_medium, fontSize: FONTSIZE.size_14, color: COLORS.primaryWhiteHex, marginBottom: SPACING.space_4, textTransform: 'capitalize' },
  unitText: { fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_10, color: COLORS.secondaryLightGreyHex, textAlign: 'center', flexWrap: 'wrap', maxWidth: '100%' },
  canonicalProgress: { fontFamily: FONTFAMILY.poppins_medium, fontSize: FONTSIZE.size_14, color: COLORS.primaryWhiteHex, textAlign: 'center', backgroundColor: COLORS.primaryBlackHex, paddingVertical: SPACING.space_12, paddingHorizontal: SPACING.space_16, borderRadius: BORDERRADIUS.radius_10, marginBottom: SPACING.space_24, borderLeftWidth: 3, borderLeftColor: COLORS.primaryOrangeHex },
  confirmButtons: { flexDirection: 'row', gap: SPACING.space_12 },
  cancelButton: { flex: 1, backgroundColor: COLORS.secondaryDarkGreyHex, paddingVertical: SPACING.space_12, borderRadius: BORDERRADIUS.radius_10, borderWidth: 1, borderColor: COLORS.primaryRedHex, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_14, color: COLORS.primaryRedHex },
  confirmButton: { flex: 1, backgroundColor: COLORS.primaryOrangeHex, paddingVertical: SPACING.space_12, borderRadius: BORDERRADIUS.radius_10, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primaryOrangeHex, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  confirmButtonText: { fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_14, color: COLORS.primaryWhiteHex },
});

export default EditionsScreen;