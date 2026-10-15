import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';

export interface RawImageInfo {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
  mimeType?: string;
}

interface BookCoverFrameModalProps {
  visible: boolean;
  image: RawImageInfo | null;
  onCancel: () => void;
  onConfirm: (croppedUri: string, fileName?: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 2:3 book ratio frame dimensions
const FRAME_WIDTH = Math.min(Math.round(SCREEN_WIDTH - 64), 280);
const FRAME_HEIGHT = Math.round(FRAME_WIDTH * 1.5);

export const BookCoverFrameModal: React.FC<BookCoverFrameModalProps> = ({
  visible,
  image,
  onCancel,
  onConfirm,
}) => {
  const [currentImage, setCurrentImage] = useState<RawImageInfo | null>(image);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [processing, setProcessing] = useState(false);

  // Sync state when image prop changes
  useEffect(() => {
    if (image) {
      setCurrentImage(image);
      setPan({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [image]);

  const imgW = currentImage?.width && currentImage.width > 0 ? currentImage.width : 600;
  const imgH = currentImage?.height && currentImage.height > 0 ? currentImage.height : 900;

  // Base scale required to completely cover the 2:3 frame
  const scaleX = FRAME_WIDTH / imgW;
  const scaleY = FRAME_HEIGHT / imgH;
  const baseScale = Math.max(scaleX, scaleY);

  const displayWidth = imgW * baseScale * zoom;
  const displayHeight = imgH * baseScale * zoom;

  // Maximum pan allowable to prevent empty gaps
  const maxPanX = Math.max(0, (displayWidth - FRAME_WIDTH) / 2);
  const maxPanY = Math.max(0, (displayHeight - FRAME_HEIGHT) / 2);

  // Keep refs for PanResponder
  const panRef = useRef(pan);
  panRef.current = pan;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const maxPanXRef = useRef(maxPanX);
  maxPanXRef.current = maxPanX;
  const maxPanYRef = useRef(maxPanY);
  maxPanYRef.current = maxPanY;

  const panStartRef = useRef({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef(1);

  // Re-clamp pan whenever zoom/maxPan changes
  useEffect(() => {
    setPan((prev) => ({
      x: Math.max(-maxPanX, Math.min(maxPanX, prev.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, prev.y)),
    }));
  }, [maxPanX, maxPanY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          panStartRef.current = { x: panRef.current.x, y: panRef.current.y };
          if (evt.nativeEvent.touches.length === 2) {
            const [t1, t2] = evt.nativeEvent.touches;
            const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
            initialPinchDistRef.current = dist;
            initialPinchZoomRef.current = zoomRef.current;
          } else {
            initialPinchDistRef.current = null;
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          // Pinch to zoom with 2 fingers
          if (evt.nativeEvent.touches.length === 2 && initialPinchDistRef.current) {
            const [t1, t2] = evt.nativeEvent.touches;
            const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
            const ratio = dist / initialPinchDistRef.current;
            const nextZoom = Math.min(3.0, Math.max(1.0, initialPinchZoomRef.current * ratio));
            setZoom(Number(nextZoom.toFixed(2)));
            return;
          }

          // Single finger drag
          const nextX = panStartRef.current.x + gestureState.dx;
          const nextY = panStartRef.current.y + gestureState.dy;

          const clampedX = Math.max(-maxPanXRef.current, Math.min(maxPanXRef.current, nextX));
          const clampedY = Math.max(-maxPanYRef.current, Math.min(maxPanYRef.current, nextY));

          setPan({ x: clampedX, y: clampedY });
        },
        onPanResponderRelease: () => {
          initialPinchDistRef.current = null;
        },
      }),
    []
  );

  // Rotate image by 90 degrees clockwise
  const handleRotate = async () => {
    if (!currentImage) return;
    setProcessing(true);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        currentImage.uri,
        [{ rotate: 90 }],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCurrentImage({
        uri: manipResult.uri,
        width: currentImage.height,
        height: currentImage.width,
        fileName: currentImage.fileName,
        mimeType: 'image/jpeg',
      });
      setPan({ x: 0, y: 0 });
      setZoom(1);
    } catch {
      Alert.alert('Error', 'Failed to rotate image.');
    } finally {
      setProcessing(false);
    }
  };

  // Zoom helpers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3.0, Number((prev + 0.2).toFixed(1))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(1.0, Number((prev - 0.2).toFixed(1))));
  };

  const handleReset = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // Crop and confirm
  const handleConfirm = async () => {
    if (!currentImage) return;
    setProcessing(true);
    try {
      const S = displayWidth / currentImage.width;
      const xOffsetOnDisplay = (displayWidth - FRAME_WIDTH) / 2 - pan.x;
      const yOffsetOnDisplay = (displayHeight - FRAME_HEIGHT) / 2 - pan.y;

      const originX = Math.max(0, Math.round(xOffsetOnDisplay / S));
      const originY = Math.max(0, Math.round(yOffsetOnDisplay / S));
      const cropWidth = Math.min(currentImage.width - originX, Math.round(FRAME_WIDTH / S));
      const cropHeight = Math.min(currentImage.height - originY, Math.round(FRAME_HEIGHT / S));

      const manipResult = await ImageManipulator.manipulateAsync(
        currentImage.uri,
        [
          {
            crop: {
              originX,
              originY,
              width: cropWidth,
              height: cropHeight,
            },
          },
          {
            resize: {
              width: 800,
            },
          },
        ],
        { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG }
      );

      onConfirm(manipResult.uri, currentImage.fileName);
    } catch {
      Alert.alert('Error', 'Failed to crop image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!visible || !currentImage) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <SafeAreaView style={styles.ModalContainer}>
        {/* Header Bar */}
        <View style={styles.HeaderBar}>
          <TouchableOpacity onPress={onCancel} style={styles.HeaderBtn} disabled={processing}>
            <Ionicons name="close" size={24} color={COLORS.primaryWhiteHex} />
          </TouchableOpacity>

          <View style={styles.HeaderCenter}>
            <Text style={styles.HeaderTitle}>Frame Book Cover</Text>
            <Text style={styles.HeaderSubtitle}>2:3 Standard Book Ratio</Text>
          </View>

          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.DoneBtn, processing && styles.DoneBtnDisabled]}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.DoneBtnText}>Done</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Viewfinder Viewport Area */}
        <View style={styles.ViewportContainer}>
          <View
            style={[styles.FrameViewport, { width: FRAME_WIDTH, height: FRAME_HEIGHT }]}
            {...panResponder.panHandlers}
          >
            {/* The Image inside viewport */}
            <Image
              source={{ uri: currentImage.uri }}
              style={{
                width: displayWidth,
                height: displayHeight,
                position: 'absolute',
                left: (FRAME_WIDTH - displayWidth) / 2 + pan.x,
                top: (FRAME_HEIGHT - displayHeight) / 2 + pan.y,
              }}
              resizeMode="cover"
            />

            {/* Viewfinder Framing Guidelines (pointerEvents none) */}
            <View style={styles.OverlayGuide} pointerEvents="none">
              {/* Subtle Rule-of-Thirds Grid */}
              <View style={styles.GridRow}>
                <View style={styles.GridCell} />
                <View style={[styles.GridCell, styles.GridCellBorderH]} />
                <View style={styles.GridCell} />
              </View>
              <View style={[styles.GridRow, styles.GridRowBorderV]}>
                <View style={styles.GridCell} />
                <View style={[styles.GridCell, styles.GridCellBorderH]} />
                <View style={styles.GridCell} />
              </View>
              <View style={styles.GridRow}>
                <View style={styles.GridCell} />
                <View style={[styles.GridCell, styles.GridCellBorderH]} />
                <View style={styles.GridCell} />
              </View>

              {/* Viewfinder Corner Brackets */}
              <View style={[styles.Corner, styles.CornerTopLeft]} />
              <View style={[styles.Corner, styles.CornerTopRight]} />
              <View style={[styles.Corner, styles.CornerBottomLeft]} />
              <View style={[styles.Corner, styles.CornerBottomRight]} />

              {/* Aspect Ratio Badge */}
              <View style={styles.RatioBadge}>
                <Text style={styles.RatioBadgeText}>2:3 BOOK FRAME</Text>
              </View>
            </View>
          </View>

          <Text style={styles.InstructionText}>
            Drag to align cover inside the box • Pinch or tap + / - to zoom
          </Text>
        </View>

        {/* Controls Toolbar */}
        <View style={styles.ToolbarContainer}>
          <View style={styles.ToolbarRow}>
            {/* Zoom Controls */}
            <View style={styles.ZoomGroup}>
              <TouchableOpacity
                onPress={handleZoomOut}
                style={[styles.ToolBtn, zoom <= 1.0 && styles.ToolBtnDisabled]}
                disabled={zoom <= 1.0 || processing}
              >
                <MaterialIcons name="remove" size={20} color={COLORS.primaryWhiteHex} />
              </TouchableOpacity>

              <Text style={styles.ZoomText}>{zoom.toFixed(1)}x</Text>

              <TouchableOpacity
                onPress={handleZoomIn}
                style={[styles.ToolBtn, zoom >= 3.0 && styles.ToolBtnDisabled]}
                disabled={zoom >= 3.0 || processing}
              >
                <MaterialIcons name="add" size={20} color={COLORS.primaryWhiteHex} />
              </TouchableOpacity>
            </View>

            {/* Rotate Button */}
            <TouchableOpacity
              onPress={handleRotate}
              style={styles.ActionToolBtn}
              disabled={processing}
            >
              <MaterialIcons name="rotate-right" size={20} color={COLORS.primaryOrangeHex} />
              <Text style={styles.ActionToolText}>Rotate</Text>
            </TouchableOpacity>

            {/* Reset / Center Button */}
            <TouchableOpacity
              onPress={handleReset}
              style={styles.ActionToolBtn}
              disabled={processing}
            >
              <MaterialIcons name="filter-center-focus" size={20} color={COLORS.primaryWhiteHex} />
              <Text style={styles.ActionToolText}>Center</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  ModalContainer: {
    flex: 1,
    backgroundColor: '#0C0F14',
    justifyContent: 'space-between',
  },
  HeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E232B',
  },
  HeaderBtn: {
    padding: SPACING.space_8,
  },
  HeaderCenter: {
    alignItems: 'center',
  },
  HeaderTitle: {
    color: '#FFFFFF',
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
  },
  HeaderSubtitle: {
    color: '#AEAEAE',
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
  },
  DoneBtn: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  DoneBtnDisabled: {
    opacity: 0.6,
  },
  DoneBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
  },
  ViewportContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_10,
  },
  FrameViewport: {
    borderRadius: BORDERRADIUS.radius_10,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  OverlayGuide: {
    ...StyleSheet.absoluteFillObject,
  },
  GridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  GridRowBorderV: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  GridCell: {
    flex: 1,
  },
  GridCellBorderH: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  Corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: COLORS.primaryOrangeHex,
  },
  CornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  CornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  CornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  CornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  RatioBadge: {
    position: 'absolute',
    bottom: SPACING.space_8,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: SPACING.space_10,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: 'rgba(209, 120, 66, 0.4)',
  },
  RatioBadgeText: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_10,
    letterSpacing: 0.5,
  },
  InstructionText: {
    color: '#AEAEAE',
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    marginTop: SPACING.space_16,
    textAlign: 'center',
    paddingHorizontal: SPACING.space_20,
  },
  ToolbarContainer: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: SPACING.space_20,
    paddingTop: SPACING.space_12,
    borderTopWidth: 1,
    borderTopColor: '#1E232B',
  },
  ToolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  ZoomGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262E',
    borderRadius: BORDERRADIUS.radius_20,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    gap: SPACING.space_4,
  },
  ToolBtn: {
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_15,
  },
  ToolBtnDisabled: {
    opacity: 0.3,
  },
  ZoomText: {
    color: '#FFFFFF',
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    minWidth: 36,
    textAlign: 'center',
  },
  ActionToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262E',
    paddingVertical: SPACING.space_8,
    paddingHorizontal: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_20,
    gap: SPACING.space_4,
  },
  ActionToolText: {
    color: '#FFFFFF',
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
  },
});