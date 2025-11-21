import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  ActivityIndicator 
} from "react-native";
import { AntDesign } from '@expo/vector-icons';
import { useStore } from "../../../store/store";
import {
  COLORS,
  FONTSIZE,
  FONTFAMILY,
  SPACING,
  BORDERRADIUS,
} from "../../../theme/theme";
import requests from "../../../services/requests";
import instance from "../../../services/axios";

interface Tag {
  tagId: number;
  tagName: string;
  tagColor?: string;
}

interface TagSelectorModalProps {
  visible: boolean;
  close: () => void;
  bookId: string;
  refreshTags: () => void;
}

const TagSelectorModal: React.FC<TagSelectorModalProps> = ({ 
  visible, 
  close, 
  bookId, 
  refreshTags 
}) => {
  const token = useStore((state: any) => state.userDetails)[0]?.accessToken;
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [bookTags, setBookTags] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = async (endpoint: string, setter?: (data: any) => void) => {
    try {
      const res = await instance.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setter?.(res.data.data.tags || []);
      return res.data.data.tags || [];
    } catch (error) {
      console.log("Error:", error);
      return [];
    }
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      Promise.all([
        fetchData(requests.fetchUserTags, setAllTags),
        fetchData(requests.fetchBookTags(bookId)).then(tags => 
          setBookTags(tags.map((t: Tag) => t.tagId))
        )
      ]).finally(() => setLoading(false));
    }
  }, [visible]);

  const createNewTag = async () => {
    if (!newTagName.trim()) return;
    setCreating(true);
    try {
      await instance.post(
        requests.createTag,
        { newTagName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewTagName("");
      fetchData(requests.fetchUserTags, setAllTags);
    } catch (error) {
      console.log("Error creating tag:", error);
    } finally {
      setCreating(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      const currentTagIds = await fetchData(requests.fetchBookTags(bookId))
        .then(tags => tags.map((t: Tag) => t.tagId));

      const operations = [
        ...bookTags
          .filter(id => !currentTagIds.includes(id))
          .map(id => instance.post(requests.assignTagToBook(bookId, id), {}, 
            { headers: { Authorization: `Bearer ${token}` } })),
        ...currentTagIds
          .filter((id: number) => !bookTags.includes(id))
          .map((id: number) => instance.delete(requests.removeTagFromBook(bookId, id), 
            { headers: { Authorization: `Bearer ${token}` } }))
      ];

      await Promise.all(operations);
      refreshTags();
      close();
    } catch (error) {
      console.log("Error saving tags:", error);
    } finally {
      setSaving(false);
    }
  };

  const TagItem = ({ tag }: { tag: Tag }) => {
    const isSelected = bookTags.includes(tag.tagId);
    return (
      <TouchableOpacity
        style={[styles.tagItem, isSelected && styles.tagItemSelected]}
        onPress={() => setBookTags(prev => 
          prev.includes(tag.tagId) ? prev.filter(i => i !== tag.tagId) : [...prev, tag.tagId]
        )}
      >
        <View style={styles.tagItemLeft}>
          <View style={[styles.colorIndicator, { backgroundColor: tag.tagColor || COLORS.primaryOrangeHex }]} />
          <Text style={styles.tagText}>{tag.tagName}</Text>
        </View>
        {isSelected && <AntDesign name="check" size={FONTSIZE.size_18} color={COLORS.primaryWhiteHex} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Tags</Text>
            <TouchableOpacity onPress={close}>
              <AntDesign name="close" size={FONTSIZE.size_24} color={COLORS.secondaryLightGreyHex} />
            </TouchableOpacity>
          </View>

          <View style={styles.newTagContainer}>
            <TextInput
              style={styles.input}
              placeholder="Create new tag..."
              placeholderTextColor={COLORS.secondaryLightGreyHex}
              value={newTagName}
              onChangeText={setNewTagName}
            />
            <TouchableOpacity 
              style={styles.createBtn} 
              onPress={createNewTag}
              disabled={creating || !newTagName.trim()}
            >
              {creating ? (
                <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
              ) : (
                <AntDesign name="plus" size={FONTSIZE.size_18} color={COLORS.primaryWhiteHex} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Your Tags</Text>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
            </View>
          ) : allTags.length > 0 ? (
            <ScrollView style={styles.tagsList} showsVerticalScrollIndicator={false}>
              {allTags.map(tag => <TagItem key={tag.tagId} tag={tag} />)}
            </ScrollView>
          ) : (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyStateText}>No tags yet. Create your first tag above!</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={save} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
            ) : (
              <Text style={styles.saveBtnText}>Save Tags</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default TagSelectorModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.secondaryBlackRGBA,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: COLORS.primaryGreyHex,
    padding: SPACING.space_24,
    borderTopLeftRadius: BORDERRADIUS.radius_25,
    borderTopRightRadius: BORDERRADIUS.radius_25,
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
  newTagContainer: {
    flexDirection: "row",
    marginBottom: SPACING.space_20,
    gap: SPACING.space_10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    borderWidth: 1,
    borderColor: COLORS.secondaryDarkGreyHex,
  },
  createBtn: {
    backgroundColor: COLORS.primaryOrangeHex,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BORDERRADIUS.radius_10,
  },
  sectionLabel: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagsList: {
    maxHeight: 300,
    marginBottom: SPACING.space_20,
  },
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryDarkGreyHex,
    marginBottom: SPACING.space_8,
    borderWidth: 2,
    borderColor: COLORS.primaryDarkGreyHex,
  },
  tagItemSelected: {
    borderColor: COLORS.primaryOrangeHex,
    backgroundColor: COLORS.secondaryDarkGreyHex,
  },
  tagItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_12,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: BORDERRADIUS.radius_10,
  },
  tagText: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
  },
  centerContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.space_20,
  },
  emptyStateText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: COLORS.primaryOrangeHex,
    padding: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_15,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
  },
});