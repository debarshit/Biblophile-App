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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import GradientBGIcon from '../../../components/GradientBGIcon';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';

interface Edition {
  bookId: number;
  isbn: string | null;
  format: string;
  pageCount: number | null;
  language: string;
  cover: string | null;
  publisher: string | null;
  publicationYear: number | null;
}

interface EditionsData {
  title: string;
  editions: Edition[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNextPage: boolean;
  };
}

const EditionsScreen = ({ navigation, route }: any) => {
  const { workId, title, currentBookId } = route.params;
  const [editionsData, setEditionsData] = useState<EditionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchEditions();
  }, [offset]);

  const fetchEditions = async () => {
    setLoading(true);
    try {
      const response = await instance.get(
        `${requests.fetchWorkEditions(workId)}?limit=${limit}&offset=${offset}`
      );
      setEditionsData(response.data.data);
    } catch (error) {
      console.error('Error fetching editions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleEditionPress = (edition: Edition) => {
    navigation.navigate('Details', {
      id: edition.bookId.toString(),
      type: 'Book',
    });
  };

  const handleAddEdition = () => {
    navigation.navigate('AddEdition', {
      workId,
      title: editionsData?.title || title,
    });
  };

  const handleNextPage = () => {
    if (editionsData?.pagination.hasNextPage) {
      setOffset(offset + limit);
    }
  };

  const handlePrevPage = () => {
    if (offset > 0) {
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

  const currentEdition = editionsData?.editions.find(
    (e) => String(e.bookId) === String(currentBookId)
  );
  const otherEditions = editionsData?.editions.filter(
    (e) => String(e.bookId) !== String(currentBookId)
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress}>
            <GradientBGIcon
              name="left"
              color={COLORS.primaryLightGreyHex}
              size={FONTSIZE.size_16}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddEdition} style={styles.addButton}>
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
            />
            <View style={styles.divider} />
          </View>
        )}

        {/* Other Editions */}
        <View style={styles.section}>
          {currentEdition && (
            <Text style={styles.sectionLabel}>OTHER AVAILABLE EDITIONS</Text>
          )}
          {(currentEdition ? otherEditions : editionsData?.editions)?.map((edition) => (
            <EditionCard
              key={edition.bookId}
              edition={edition}
              title={editionsData?.title || ''}
              onPress={() => handleEditionPress(edition)}
            />
          ))}
          {otherEditions?.length === 0 && currentEdition && (
            <Text style={styles.noEditionsText}>No other editions available.</Text>
          )}
        </View>

        {/* Pagination */}
        {editionsData && editionsData.pagination.total > editionsData.pagination.limit && (
          <View style={styles.pagination}>
            <TouchableOpacity
              onPress={handlePrevPage}
              disabled={offset === 0}
              style={[
                styles.paginationButton,
                offset === 0 && styles.paginationButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.paginationButtonText,
                  offset === 0 && styles.paginationButtonTextDisabled,
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNextPage}
              disabled={!editionsData.pagination.hasNextPage}
              style={[
                styles.paginationButton,
                !editionsData.pagination.hasNextPage && styles.paginationButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.paginationButtonText,
                  !editionsData.pagination.hasNextPage &&
                    styles.paginationButtonTextDisabled,
                ]}
              >
                Next
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const EditionCard = ({
  edition,
  title,
  onPress,
  isCurrent,
}: {
  edition: Edition;
  title: string;
  onPress: () => void;
  isCurrent?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.editionCard, isCurrent && styles.editionCardCurrent]}
  >
    {/* Book Cover */}
    <Image
      source={{ uri: convertHttpToHttps(edition.cover) || 'https://via.placeholder.com/100x150' }}
      style={styles.editionCover}
    />

    {/* Content */}
    <View style={styles.editionContent}>
      <View style={styles.editionHeader}>
        <Text style={styles.editionFormat}>
          {edition.format.charAt(0).toUpperCase() + edition.format.slice(1)} Edition
        </Text>
        {isCurrent && <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>SELECTED</Text>
        </View>}
      </View>

      {/* Details */}
      <View style={styles.editionDetails}>
        {edition.language && (
          <Text style={styles.editionDetailText}>
            Language: <Text style={styles.editionDetailValue}>{edition.language}</Text>
          </Text>
        )}
        {edition.pageCount && (
          <Text style={styles.editionDetailText}>
            Pages: <Text style={styles.editionDetailValue}>{edition.pageCount}</Text>
          </Text>
        )}
        {edition.publicationYear && (
          <Text style={styles.editionDetailText}>
            Year: <Text style={styles.editionDetailValue}>{edition.publicationYear}</Text>
          </Text>
        )}
      </View>

      {/* Publisher & ISBN */}
      {(edition.publisher || edition.isbn) && (
        <View style={styles.editionMeta}>
          {edition.publisher && (
            <Text style={styles.editionMetaText}>
              Publisher: <Text style={styles.editionMetaValue}>{edition.publisher}</Text>
            </Text>
          )}
          {edition.isbn && (
            <Text style={styles.editionMetaText}>
              ISBN: <Text style={styles.editionMetaValue}>{edition.isbn}</Text>
            </Text>
          )}
        </View>
      )}
    </View>

    <AntDesign
      name="right"
      size={FONTSIZE.size_16}
      color={COLORS.secondaryLightGreyHex}
      style={styles.chevron}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: SPACING.space_30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.space_20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    gap: SPACING.space_8,
  },
  addButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  titleSection: {
    paddingHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_30,
  },
  mainTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_28,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  bookTitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_18,
    color: COLORS.secondaryLightGreyHex,
  },
  bookTitleHighlight: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  countText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    marginTop: SPACING.space_8,
  },
  section: {
    paddingHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_24,
  },
  sectionLabel: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    letterSpacing: 1,
    marginBottom: SPACING.space_16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.primaryGreyHex,
    marginTop: SPACING.space_24,
    opacity: 0.3,
  },
  editionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  editionCardCurrent: {
    borderColor: COLORS.primaryOrangeHex,
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  editionCover: {
    width: 80,
    height: 120,
    borderRadius: BORDERRADIUS.radius_8,
    marginRight: SPACING.space_16,
  },
  editionContent: {
    flex: 1,
  },
  editionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  editionFormat: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    flex: 1,
  },
  currentBadge: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
  },
  currentBadgeText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
  },
  editionDetails: {
    marginBottom: SPACING.space_8,
  },
  editionDetailText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  editionDetailValue: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  editionMeta: {
    marginTop: SPACING.space_8,
  },
  editionMetaText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_2,
  },
  editionMetaValue: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  chevron: {
    marginLeft: SPACING.space_8,
  },
  noEditionsText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
    marginVertical: SPACING.space_30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.space_16,
    paddingHorizontal: SPACING.space_20,
    marginTop: SPACING.space_20,
  },
  paginationButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    flex: 1,
    maxWidth: 150,
  },
  paginationButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
  },
  paginationButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
  },
  paginationButtonTextDisabled: {
    color: COLORS.secondaryLightGreyHex,
  },
});

export default EditionsScreen;