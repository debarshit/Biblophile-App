import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from "../../../theme/theme";
import instance from "../../../services/axios";
import requests from "../../../services/requests";

interface FilteredDiscoveryModalProps {
  visible: boolean;
  onClose: () => void;
  tags: Record<string, { tagId: number; tagName: string }[]>;
}

interface Book {
  id: number;
  name: string;
  author: string;
  imagelink_square: string;
  rating: number;
  category: string;
}

const EMOTIONS = [
  { emotionId: 1, emotion: "Joy" },
  { emotionId: 2, emotion: "Sadness" },
  { emotionId: 3, emotion: "Fear" },
  { emotionId: 4, emotion: "Anger" },
  { emotionId: 5, emotion: "Surprise" },
  { emotionId: 6, emotion: "Anticipation" },
  { emotionId: 7, emotion: "Nostalgia" },
  { emotionId: 8, emotion: "Empathy" },
];

const FilteredRecommendationsModal: React.FC<FilteredDiscoveryModalProps> = ({
  visible,
  onClose,
  tags,
}) => {
  const [selectedMoods, setSelectedMoods] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [matchMode, setMatchMode] = useState<"any" | "all">("any");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDiscover = async () => {
    setLoading(true);
    try {
      const { data } = await instance.get(requests.getFilteredRecommendations, {
        params: {
          moods: selectedMoods.join(","),
          tags: selectedTags.join(","),
          match: matchMode,
        },
      });
      setBooks(data.data.items || []);
    } catch (error) {
      console.error("Error fetching filtered recommendations:", error);
    }
    setLoading(false);
  };

  const toggleSelect = (list: number[], setList: any, id: number) => {
    setList((prev: number[]) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Discover Your Next Read</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Moods Section */}
            <Text style={styles.sectionTitle}>I'm in the mood for...</Text>
            <View style={styles.flexWrap}>
              {EMOTIONS.map((e) => (
                <TouchableOpacity
                  key={e.emotionId}
                  style={[
                    styles.chip,
                    selectedMoods.includes(e.emotionId) && styles.chipSelected,
                  ]}
                  onPress={() =>
                    toggleSelect(selectedMoods, setSelectedMoods, e.emotionId)
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedMoods.includes(e.emotionId) && styles.chipTextSelected,
                    ]}
                  >
                    {e.emotion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Match Mode */}
            <View style={styles.matchModeContainer}>
              <TouchableOpacity onPress={() => setMatchMode("any")}>
                <Text
                  style={[
                    styles.matchModeText,
                    matchMode === "any" && styles.matchModeSelected,
                  ]}
                >
                  Match ANY
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMatchMode("all")}>
                <Text
                  style={[
                    styles.matchModeText,
                    matchMode === "all" && styles.matchModeSelected,
                  ]}
                >
                  Match ALL
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tags Section */}
            <Text style={[styles.sectionTitle, { marginTop: SPACING.space_24 }]}>
              Filter by book qualities
            </Text>

            {Object.entries(tags).map(([category, list]) => (
              <View key={category} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>
                  {category.replace(/([A-Z])/g, " $1")}
                </Text>
                <View style={styles.flexWrap}>
                  {list.map((tag) => (
                    <TouchableOpacity
                      key={tag.tagId}
                      style={[
                        styles.chip,
                        selectedTags.includes(tag.tagId) && styles.chipSelected,
                      ]}
                      onPress={() =>
                        toggleSelect(selectedTags, setSelectedTags, tag.tagId)
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedTags.includes(tag.tagId) && styles.chipTextSelected,
                        ]}
                      >
                        {tag.tagName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Discover Button */}
            <TouchableOpacity
              style={styles.discoverButton}
              onPress={handleDiscover}
              disabled={loading}
            >
              <Text style={styles.discoverButtonText}>
                {loading ? "Loading..." : "Show Books"}
              </Text>
            </TouchableOpacity>

            {/* Results */}
            <View style={styles.resultsContainer}>
              {loading ? (
                <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
              ) : books.length > 0 ? (
                <View style={styles.bookGrid}>
                  {books.map((b) => (
                    <View key={b.id} style={styles.bookCard}>
                      <Image
                        source={{ uri: b.imagelink_square }}
                        style={styles.bookImage}
                      />
                      <Text numberOfLines={1} style={styles.bookTitle}>
                        {b.name}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noResultsText}>
                  No results yet — try adjusting filters.
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default FilteredRecommendationsModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackRGBA,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    width: "90%",
    height: "90%",
    padding: SPACING.space_20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.space_12,
  },
  title: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
  },
  closeText: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_20,
  },
  sectionTitle: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    marginBottom: SPACING.space_10,
  },
  flexWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.space_8,
  },
  chip: {
    borderRadius: BORDERRADIUS.radius_15,
    backgroundColor: COLORS.primaryGreyHex,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  chipText: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
  },
  chipTextSelected: {
    color: COLORS.primaryWhiteHex,
  },
  matchModeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: SPACING.space_16,
  },
  matchModeText: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
  },
  matchModeSelected: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  categoryContainer: {
    marginBottom: SPACING.space_20,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
  },
  categoryTitle: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    marginBottom: SPACING.space_8,
  },
  discoverButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingVertical: SPACING.space_12,
    marginTop: SPACING.space_8,
    alignItems: "center",
  },
  discoverButtonText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
  },
  resultsContainer: {
    marginTop: SPACING.space_16,
  },
  bookGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: SPACING.space_12,
  },
  bookCard: {
    width: "47%",
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_8,
    alignItems: "center",
  },
  bookImage: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_8,
  },
  bookTitle: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    textAlign: "center",
  },
  noResultsText: {
    color: COLORS.secondaryLightGreyHex,
    textAlign: "center",
    marginTop: SPACING.space_20,
  },
});