import React, { useState, useEffect } from 'react';
import {
  Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView, Animated, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import instance from '../../../services/axios';
import { useStore } from '../../../store/store';
import requests from '../../../services/requests';

interface ReadingInstance {
  userBookId: number;
  status: string;
  currentPage: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface ReadingHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle?: string;
  onEditInstance: (instance: ReadingInstance) => void;
}

const ReadingHistoryModal: React.FC<ReadingHistoryModalProps> = ({
  visible, onClose, bookId, bookTitle, onEditInstance,
}) => {
  const [instances, setInstances] = useState<ReadingInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails?.[0].accessToken;


  useEffect(() => {
    if (visible) {
      fetchReadingHistory(true);
      Animated.timing(fadeAnimation, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      fadeAnimation.setValue(0);
      setOffset(0);
      setInstances([]);
    }
  }, [visible]);

  const fetchReadingHistory = async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    const currentOffset = reset ? 0 : offset;

    try {
      const response = await instance.get(
        `${requests.fetchReadingStatus(bookId)}?fetchAll=true&limit=${limit}&offset=${currentOffset}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      const data = response.data;
      
      if (data.status === 'success') {
        const newInstances = data.data.instances || [];
        setInstances(reset ? newInstances : [...instances, ...newInstances]);
        setHasMore(newInstances.length === limit);
        setOffset(currentOffset + limit);
      } else {
        setError(data.message || 'Failed to load reading history');
      }
    } catch (err) {
      setError('Failed to load reading history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnimation, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      onClose();
    });
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Currently reading': return 'menu-book';
      case 'Read': return 'check-circle';
      case 'To be read': return 'bookmark-border';
      case 'Paused': return 'pause-circle';
      case 'Did not finish': return 'cancel';
      default: return 'book';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Currently reading': return COLORS.primaryOrangeHex;
      case 'Read': return '#4CAF50';
      case 'To be read': return '#2196F3';
      case 'Paused': return '#FF9800';
      case 'Did not finish': return COLORS.primaryRedHex;
      default: return COLORS.secondaryLightGreyHex;
    }
  };

  const renderInstanceCard = (instance: ReadingInstance, index: number) => (
    <View key={instance.userBookId} style={styles.instanceCard}>
      <View style={styles.instanceHeader}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(instance.status) }]} />
          <MaterialIcons 
            name={getStatusIcon(instance.status) as keyof typeof MaterialIcons.glyphMap} 
            size={18} 
            color={getStatusColor(instance.status)} 
          />
          <Text style={styles.statusText}>{instance.status}</Text>
        </View>
        <Text style={styles.readNumber}>Read #{instances.length - index}</Text>
      </View>

      <View style={styles.instanceDetails}>
        {instance.currentPage && (
          <View style={styles.detailRow}>
            <MaterialIcons name="bookmark" size={16} color={COLORS.secondaryLightGreyHex} />
            <Text style={styles.detailText}>Page {instance.currentPage}</Text>
          </View>
        )}

        {instance.startDate && (
          <View style={styles.detailRow}>
            <MaterialIcons name="event" size={16} color={COLORS.secondaryLightGreyHex} />
            <Text style={styles.detailText}>
              Started: {formatDate(instance.startDate)}
            </Text>
          </View>
        )}

        {instance.endDate && (
          <View style={styles.detailRow}>
            <MaterialIcons name="event-available" size={16} color={COLORS.secondaryLightGreyHex} />
            <Text style={styles.detailText}>
              Finished: {formatDate(instance.endDate)}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <MaterialIcons name="history" size={16} color={COLORS.secondaryLightGreyHex} />
          <Text style={styles.detailText}>
            Created: {formatDate(instance.createdAt)}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => {
          handleClose();
          setTimeout(() => onEditInstance(instance), 300);
        }}
      >
        <MaterialIcons name="edit" size={18} color={COLORS.primaryWhiteHex} />
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, {
          opacity: fadeAnimation,
          transform: [{ scale: fadeAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
        }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerIcon}>
              <MaterialIcons name="history" size={24} color={COLORS.primaryOrangeHex} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.modalTitle}>Reading History</Text>
              {bookTitle && <Text style={styles.bookTitle}>{bookTitle}</Text>}
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={COLORS.secondaryLightGreyHex} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
              if (isCloseToBottom && hasMore && !loading) {
                fetchReadingHistory();
              }
            }}
            scrollEventThrottle={400}
          >
            {loading && instances.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
                <Text style={styles.loadingText}>Loading history...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color={COLORS.primaryRedHex} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => fetchReadingHistory(true)}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : instances.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="book" size={64} color={COLORS.secondaryLightGreyHex} />
                <Text style={styles.emptyText}>No reading history found</Text>
                <Text style={styles.emptySubtext}>Start tracking your reading journey!</Text>
              </View>
            ) : (
              <>
                {instances.map((instance, index) => renderInstanceCard(instance, index))}
                {loading && (
                  <View style={styles.loadMoreContainer}>
                    <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {instances.length} reading {instances.length === 1 ? 'instance' : 'instances'}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ReadingHistoryModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.space_20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondaryDarkGreyHex,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: SPACING.space_12,
  },
  modalTitle: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  bookTitle: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginTop: SPACING.space_4,
  },
  closeButton: {
    padding: SPACING.space_4,
  },
  scrollView: {
    padding: SPACING.space_20,
  },
  instanceCard: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_16,
    borderWidth: 1,
    borderColor: COLORS.primaryBlackHex,
  },
  instanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    gap: SPACING.space_8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  readNumber: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
  },
  instanceDetails: {
    gap: SPACING.space_8,
    marginBottom: SPACING.space_12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_8,
  },
  detailText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    gap: SPACING.space_8,
  },
  editButtonText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_24 * 2,
  },
  loadingText: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    marginTop: SPACING.space_12,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_24 * 2,
  },
  errorText: {
    color: COLORS.primaryRedHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    marginTop: SPACING.space_12,
    marginBottom: SPACING.space_16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
  },
  retryButtonText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_24 * 2,
  },
  emptyText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    marginTop: SPACING.space_16,
  },
  emptySubtext: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    marginTop: SPACING.space_8,
  },
  loadMoreContainer: {
    paddingVertical: SPACING.space_16,
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondaryDarkGreyHex,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
  },
});