import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { AntDesign, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import { shareToplatform, SHARE_PLATFORMS, ShareContent, SharePlatform } from '../utils/share';
import InstagramStoryTemplate from './InstagramStoryTemplate';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  content: ShareContent;
  imageUri?: string; // For Instagram Stories
}

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  content,
  imageUri,
}) => {
  const storyRef = useRef<View>(null);
  const handleShare = async (platform: SharePlatform) => {
    try {
      await shareToplatform({
        platform,
        content: {
          ...content,
          image: imageUri || content.image,
        },
      });
      onClose();
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleNativeShare = async () => {
    try {
      await shareToplatform({
        platform: 'native',
        content: {
          ...content,
          image: imageUri || content.image,
        },
      });
      onClose();
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'instagram':
        return <AntDesign name="instagram" size={24} color={COLORS.primaryWhiteHex} />;
      case 'twitter':
        return <AntDesign name="twitter" size={24} color={COLORS.primaryWhiteHex} />;
      case 'facebook':
        return <AntDesign name="facebook-square" size={24} color={COLORS.primaryWhiteHex} />;
      case 'whatsapp':
        return <FontAwesome5 name="whatsapp" size={24} color={COLORS.primaryWhiteHex} />;
      case 'threads':
        return <MaterialCommunityIcons name="at" size={24} color={COLORS.primaryWhiteHex} />;
      case 'cloud':
        return <AntDesign name="cloud" size={24} color={COLORS.primaryWhiteHex} />;
      default:
        return <AntDesign name="sharealt" size={24} color={COLORS.primaryWhiteHex} />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <TouchableOpacity activeOpacity={1}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Share to</Text>
              <TouchableOpacity onPress={onClose}>
                <AntDesign name="close" size={24} color={COLORS.primaryLightGreyHex} />
              </TouchableOpacity>
            </View>

            {/* Share Options */}
            <ScrollView style={styles.optionsContainer}>
              <View style={styles.optionsGrid}>
                {SHARE_PLATFORMS.map((platform) => (
                  <TouchableOpacity
                    key={platform.id}
                    style={styles.optionButton}
                    onPress={() => handleShare(platform.id)}
                  >
                    <View style={styles.iconContainer}>
                      {getIconComponent(platform.icon)}
                    </View>
                    <Text style={styles.optionText}>{platform.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* More Options / Native Share */}
              <TouchableOpacity
                style={styles.moreOptionsButton}
                onPress={handleNativeShare}
              >
                <AntDesign name="ellipsis1" size={20} color={COLORS.primaryWhiteHex} />
                <Text style={styles.moreOptionsText}>More options</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {/* Hidden Instagram Story Template for view-shot */}
    <View style={{ position: 'absolute', left: -9999, top: 0 }}>
      <InstagramStoryTemplate
        ref={storyRef}
        image={imageUri || content.image}
        title={content.title}
        message={content.message}
      />
    </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.primaryGreyHex,
    borderTopLeftRadius: BORDERRADIUS.radius_25,
    borderTopRightRadius: BORDERRADIUS.radius_25,
    paddingBottom: SPACING.space_30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.space_20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryDarkGreyHex,
  },
  title: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  optionsContainer: {
    maxHeight: 450,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.space_20,
    gap: SPACING.space_16,
  },
  optionButton: {
    width: '30%',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryDarkGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  optionText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
  },
  moreOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.space_20,
    marginTop: SPACING.space_12,
    padding: SPACING.space_16,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    gap: SPACING.space_8,
  },
  moreOptionsText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
});

export default ShareModal;