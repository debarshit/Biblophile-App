import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { BORDERRADIUS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { BookCoverFrameModal, RawImageInfo } from './BookCoverFrameModal';

export interface CoverSelection {
  mode: 'auto' | 'file' | 'url' | 'none';
  url: string | null;
  fileUri: string | null;
  fileType?: string;
  fileName?: string;
}

interface CoverImagePickerProps {
  isbn?: string;
  title?: string;
  author?: string;
  initialCoverUrl?: string;
  onCoverChange: (selection: CoverSelection) => void;
}

export const CoverImagePicker: React.FC<CoverImagePickerProps> = ({
  isbn = '',
  title = '',
  author = '',
  initialCoverUrl = '',
  onCoverChange,
}) => {
  const { COLORS, scheme } = useTheme();
  const isLight = scheme === 'light';
  const styles = useMemo(() => createStyles(COLORS, isLight), [COLORS, isLight]);

  const [loading, setLoading] = useState(false);
  const [autoCover, setAutoCover] = useState<{
    found: boolean;
    previewUrl: string | null;
    source: string | null;
  }>({
    found: !!initialCoverUrl,
    previewUrl: initialCoverUrl || null,
    source: null,
  });

  const [userDismissedAuto, setUserDismissedAuto] = useState(false);
  const [selectedFileUri, setSelectedFileUri] = useState<string | null>(null);
  const [showFramingModal, setShowFramingModal] = useState(false);
  const [rawImageForFraming, setRawImageForFraming] = useState<RawImageInfo | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced auto-fetch cover preview
  useEffect(() => {
    const cleanIsbn = isbn.replace(/[- ]/g, '').trim();
    const hasValidIsbn = cleanIsbn.length === 10 || cleanIsbn.length === 13;
    const hasValidTitle = title.trim().length >= 3;

    if (!hasValidIsbn && !hasValidTitle) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const endpoint = requests.previewBookCover({
          isbn: hasValidIsbn ? cleanIsbn : undefined,
          title: hasValidTitle ? title.trim() : undefined,
          author: author.trim() ? author.trim() : undefined,
        });

        const response = await instance.get(endpoint);
        const data = response.data?.data;

        if (data && data.found && data.previewUrl) {
          setAutoCover({
            found: true,
            previewUrl: data.previewUrl,
            source: data.source,
          });

          // If user hasn't already picked a custom photo, use auto cover
          if (!userDismissedAuto && !selectedFileUri && !manualUrl) {
            onCoverChange({
              mode: 'auto',
              url: data.previewUrl,
              fileUri: null,
            });
          }
        } else {
          setAutoCover({
            found: false,
            previewUrl: null,
            source: null,
          });
        }
      } catch {
        setAutoCover({
          found: false,
          previewUrl: null,
          source: null,
        });
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [isbn, title, author]);

  const openFramingWithAsset = (asset: ImagePicker.ImagePickerAsset, defaultName: string) => {
    const fileName = asset.fileName || defaultName;
    const mimeType = asset.mimeType || 'image/jpeg';

    if (asset.width && asset.height && asset.width > 0 && asset.height > 0) {
      setRawImageForFraming({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileName,
        mimeType,
      });
      setShowFramingModal(true);
    } else {
      Image.getSize(
        asset.uri,
        (w, h) => {
          setRawImageForFraming({
            uri: asset.uri,
            width: w,
            height: h,
            fileName,
            mimeType,
          });
          setShowFramingModal(true);
        },
        () => {
          setRawImageForFraming({
            uri: asset.uri,
            width: 600,
            height: 900,
            fileName,
            mimeType,
          });
          setShowFramingModal(true);
        }
      );
    }
  };

  // Pick image from Gallery
  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo gallery access to upload a book cover.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Frame through our 2:3 book frame guide
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      openFramingWithAsset(result.assets[0], 'gallery_cover.jpg');
    }
  };

  // Capture photo with Camera
  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow camera access to take a photo of the book cover.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Frame through our 2:3 book frame guide
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      openFramingWithAsset(result.assets[0], 'camera_cover.jpg');
    }
  };

  const handleFramingConfirm = (croppedUri: string, fileName?: string) => {
    setShowFramingModal(false);
    setSelectedFileUri(croppedUri);
    setUserDismissedAuto(true);
    setIsUrlMode(false);
    onCoverChange({
      mode: 'file',
      url: null,
      fileUri: croppedUri,
      fileType: 'image/jpeg',
      fileName: fileName || 'cover.jpg',
    });
  };

  const handleFramingCancel = () => {
    setShowFramingModal(false);
  };

  // Revert back to auto cover
  const handleRevertToAuto = () => {
    setSelectedFileUri(null);
    setRawImageForFraming(null);
    setManualUrl('');
    setUserDismissedAuto(false);
    setIsUrlMode(false);
    if (autoCover.found && autoCover.previewUrl) {
      onCoverChange({
        mode: 'auto',
        url: autoCover.previewUrl,
        fileUri: null,
      });
    } else {
      onCoverChange({
        mode: 'none',
        url: null,
        fileUri: null,
      });
    }
  };

  // Handle manual URL submission
  const handleManualUrlChange = (text: string) => {
    setManualUrl(text);
    setUserDismissedAuto(true);
    setSelectedFileUri(null);
    onCoverChange({
      mode: text.trim() ? 'url' : 'none',
      url: text.trim() || null,
      fileUri: null,
    });
  };

  return (
    <View style={styles.Container}>
      <View style={styles.HeaderRow}>
        <Text style={styles.Label}>Book Cover Image</Text>
        {loading && (
          <View style={styles.LoadingRow}>
            <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
            <Text style={styles.LoadingText}>Searching cover...</Text>
          </View>
        )}
      </View>

      {/* CASE 1: Auto Cover Found and not dismissed */}
      {autoCover.found && !userDismissedAuto && autoCover.previewUrl && (
        <View style={styles.AutoCard}>
          <Image
            source={{ uri: autoCover.previewUrl }}
            style={styles.CoverThumbnail}
            resizeMode="cover"
          />
          <View style={styles.AutoCardContent}>
            <View style={styles.Badge}>
              <Ionicons name="checkmark-circle" size={14} color={isLight ? '#059669' : '#10B981'} />
              <Text style={styles.BadgeText}>Automatic cover found</Text>
            </View>
            <Text style={styles.SourceText}>
              Source: {autoCover.source === 'open_library' ? 'Open Library' : 'Google Books'}
            </Text>

            <TouchableOpacity
              style={styles.ChangeBtn}
              onPress={() => setUserDismissedAuto(true)}
            >
              <MaterialIcons name="edit" size={16} color={COLORS.primaryWhiteHex} />
              <Text style={styles.ChangeBtnText}>Change / Upload Custom Cover</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* CASE 2: No Auto Cover Found OR user chose to customize (STRICT: ZERO BROKEN BOXES) */}
      {(!autoCover.found || userDismissedAuto) && (
        <View style={styles.CustomSection}>
          {/* Custom Image Picked Preview */}
          {selectedFileUri ? (
            <View style={styles.CustomPickedRow}>
              <Image
                source={{ uri: selectedFileUri }}
                style={styles.CoverThumbnail}
                resizeMode="cover"
              />
              <View style={styles.CustomPickedActions}>
                <View style={styles.CustomBadge}>
                  <Text style={styles.CustomBadgeText}>Custom Photo Selected</Text>
                </View>

                <View style={styles.ButtonGroup}>
                  {rawImageForFraming && (
                    <TouchableOpacity
                      style={styles.ActionBtn}
                      onPress={() => setShowFramingModal(true)}
                    >
                      <MaterialIcons name="crop" size={16} color={COLORS.primaryWhiteHex} />
                      <Text style={styles.ActionBtnText}>Adjust Frame</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.ActionBtn}
                    onPress={handlePickFromGallery}
                  >
                    <MaterialIcons name="photo-library" size={16} color={COLORS.primaryWhiteHex} />
                    <Text style={styles.ActionBtnText}>Choose Another</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.ActionBtn, styles.RemoveBtn]}
                    onPress={() => {
                      setSelectedFileUri(null);
                      setRawImageForFraming(null);
                      onCoverChange({ mode: 'none', url: null, fileUri: null });
                    }}
                  >
                    <MaterialIcons name="delete" size={16} color={isLight ? '#DC2626' : '#EF4444'} />
                    <Text style={[styles.ActionBtnText, { color: isLight ? '#DC2626' : '#EF4444' }]}>Remove</Text>
                  </TouchableOpacity>
                </View>

                {autoCover.found && (
                  <TouchableOpacity onPress={handleRevertToAuto} style={styles.RevertBtn}>
                    <Text style={styles.RevertBtnText}>↩ Revert to automatic cover</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : isUrlMode ? (
            /* Paste URL Mode */
            <View style={styles.UrlModeContainer}>
              <Text style={styles.SubLabel}>Paste Direct Image Link</Text>
              <TextInput
                value={manualUrl}
                onChangeText={handleManualUrlChange}
                placeholder="https://example.com/cover.jpg"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                style={styles.UrlInput}
                keyboardType="url"
                autoCapitalize="none"
              />
              <View style={styles.UrlFooterRow}>
                <TouchableOpacity onPress={() => setIsUrlMode(false)}>
                  <Text style={styles.LinkText}>← Back to camera / gallery upload</Text>
                </TouchableOpacity>
                {autoCover.found && (
                  <TouchableOpacity onPress={handleRevertToAuto}>
                    <Text style={styles.RevertBtnText}>Revert to auto</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            /* Actions: Camera / Gallery / Link */
            <View style={styles.ActionOptionsContainer}>
              <Text style={styles.ActionPromptText}>
                Select an option to add a cover:
              </Text>

              <View style={styles.ActionRow}>
                <TouchableOpacity
                  style={styles.OptionCard}
                  onPress={handlePickFromGallery}
                >
                  <MaterialIcons name="photo-library" size={26} color={COLORS.primaryOrangeHex} />
                  <Text style={styles.OptionCardText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.OptionCard}
                  onPress={handleTakePhoto}
                >
                  <MaterialIcons name="camera-alt" size={26} color={COLORS.primaryOrangeHex} />
                  <Text style={styles.OptionCardText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.OptionCard}
                  onPress={() => setIsUrlMode(true)}
                >
                  <MaterialIcons name="link" size={26} color={COLORS.primaryOrangeHex} />
                  <Text style={styles.OptionCardText}>Link</Text>
                </TouchableOpacity>
              </View>

              {autoCover.found && (
                <TouchableOpacity onPress={handleRevertToAuto} style={styles.RevertRow}>
                  <Text style={styles.RevertBtnText}>↩ Revert to automatic cover</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Book Cover 2:3 Aspect Ratio Framing Modal */}
      <BookCoverFrameModal
        visible={showFramingModal}
        image={rawImageForFraming}
        onCancel={handleFramingCancel}
        onConfirm={handleFramingConfirm}
      />
    </View>
  );
};

const createStyles = (COLORS: any, isLight: boolean) =>
  StyleSheet.create({
    Container: {
      marginVertical: SPACING.space_12,
    },
    HeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.space_8,
    },
    Label: {
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_14,
    },
    SubLabel: {
      color: COLORS.secondaryLightGreyHex,
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
      marginBottom: SPACING.space_8,
    },
    LoadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_8,
    },
    LoadingText: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
    },
    AutoCard: {
      flexDirection: 'row',
      backgroundColor: isLight ? '#FFFFFF' : COLORS.primaryGreyHex,
      borderRadius: BORDERRADIUS.radius_10,
      padding: SPACING.space_12,
      borderWidth: 1,
      borderColor: isLight ? `${COLORS.primaryOrangeHex}60` : `${COLORS.primaryOrangeHex}50`,
      alignItems: 'center',
      gap: SPACING.space_12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isLight ? 0.05 : 0.2,
      shadowRadius: 2,
      elevation: isLight ? 1 : 2,
    },
    CoverThumbnail: {
      width: 80,
      height: 120,
      borderRadius: BORDERRADIUS.radius_8,
      backgroundColor: isLight ? COLORS.secondaryDarkGreyHex : '#1f242d',
    },
    AutoCardContent: {
      flex: 1,
      gap: SPACING.space_4,
    },
    Badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isLight ? '#D1FAE5' : '#064E3B',
      paddingHorizontal: SPACING.space_8,
      paddingVertical: SPACING.space_4,
      borderRadius: BORDERRADIUS.radius_10,
      alignSelf: 'flex-start',
      gap: SPACING.space_4,
    },
    BadgeText: {
      color: isLight ? '#065F46' : '#34D399',
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_10,
    },
    SourceText: {
      color: COLORS.secondaryLightGreyHex,
      fontFamily: FONTFAMILY.poppins_regular,
      fontSize: FONTSIZE.size_12,
    },
    ChangeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_8,
      backgroundColor: isLight ? COLORS.primaryDarkGreyHex : '#262B33',
      paddingVertical: SPACING.space_8,
      paddingHorizontal: SPACING.space_12,
      borderRadius: BORDERRADIUS.radius_8,
      alignSelf: 'flex-start',
      marginTop: SPACING.space_4,
      borderWidth: 1,
      borderColor: isLight ? COLORS.secondaryDarkGreyHex : '#323842',
    },
    ChangeBtnText: {
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
    },
    CustomSection: {
      backgroundColor: isLight ? COLORS.primaryDarkGreyHex : COLORS.primaryGreyHex,
      borderRadius: BORDERRADIUS.radius_10,
      padding: SPACING.space_12,
      borderWidth: 1,
      borderColor: isLight ? COLORS.secondaryDarkGreyHex : '#262B33',
    },
    CustomPickedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_12,
    },
    CustomPickedActions: {
      flex: 1,
      gap: SPACING.space_8,
    },
    CustomBadge: {
      backgroundColor: `${COLORS.primaryOrangeHex}20`,
      paddingHorizontal: SPACING.space_8,
      paddingVertical: SPACING.space_4,
      borderRadius: BORDERRADIUS.radius_8,
      alignSelf: 'flex-start',
    },
    CustomBadgeText: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_12,
    },
    ButtonGroup: {
      flexDirection: 'row',
      gap: SPACING.space_8,
      flexWrap: 'wrap',
    },
    ActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.space_4,
      backgroundColor: isLight ? '#FFFFFF' : '#262B33',
      paddingVertical: SPACING.space_8,
      paddingHorizontal: SPACING.space_10,
      borderRadius: BORDERRADIUS.radius_8,
      borderWidth: 1,
      borderColor: isLight ? COLORS.secondaryDarkGreyHex : '#323842',
    },
    RemoveBtn: {
      backgroundColor: isLight ? '#FEE2E2' : '#451a1a',
      borderColor: isLight ? '#FECACA' : '#7f1d1d',
    },
    ActionBtnText: {
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
    },
    RevertBtn: {
      marginTop: SPACING.space_4,
    },
    RevertBtnText: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
    },
    UrlModeContainer: {
      gap: SPACING.space_8,
    },
    UrlInput: {
      backgroundColor: isLight ? '#FFFFFF' : '#1E232B',
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_regular,
      paddingHorizontal: SPACING.space_12,
      paddingVertical: SPACING.space_10,
      borderRadius: BORDERRADIUS.radius_8,
      fontSize: FONTSIZE.size_14,
      borderWidth: 1,
      borderColor: isLight ? COLORS.secondaryDarkGreyHex : 'transparent',
    },
    UrlFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: SPACING.space_4,
    },
    LinkText: {
      color: COLORS.primaryOrangeHex,
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
    },
    ActionOptionsContainer: {
      alignItems: 'center',
      paddingVertical: SPACING.space_4,
    },
    ActionPromptText: {
      color: COLORS.secondaryLightGreyHex,
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
      marginBottom: SPACING.space_12,
      textAlign: 'center',
    },
    ActionRow: {
      flexDirection: 'row',
      gap: SPACING.space_12,
      justifyContent: 'center',
      width: '100%',
    },
    OptionCard: {
      flex: 1,
      backgroundColor: isLight ? '#FFFFFF' : '#262B33',
      borderRadius: BORDERRADIUS.radius_10,
      paddingVertical: SPACING.space_16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.space_8,
      borderWidth: 1,
      borderColor: isLight ? COLORS.secondaryDarkGreyHex : '#323842',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isLight ? 0.06 : 0.2,
      shadowRadius: 2,
      elevation: isLight ? 1 : 2,
    },
    OptionCardText: {
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_12,
    },
    RevertRow: {
      marginTop: SPACING.space_12,
    },
  });