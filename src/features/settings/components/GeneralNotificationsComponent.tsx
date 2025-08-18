import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import Mascot from '../../../components/Mascot';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';

interface NotificationContent {
  title?: string;
  body?: string;
  actionUrl?: string;
  data?: any;
}

interface UserNotification {
  notificationId: number;
  type: string;
  content: NotificationContent;
  isRead: boolean;
  createdAt: string;
  expiresAt: string;
}

interface NotificationsComponentProps {
  onUnreadCountChange?: (count: number) => void;
  initialUnreadCount?: number;
}

const GeneralNotificationsComponent: React.FC<NotificationsComponentProps> = ({ 
  onUnreadCountChange, 
  initialUnreadCount = 0 
}) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<Set<number>>(new Set());
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const userDetails = useStore((state: any) => state.userDetails);

  const authHeaders = { 'Authorization': `Bearer ${userDetails[0].accessToken}` };

  const fetchNotifications = async (page: number = 1, refresh: boolean = false) => {
    try {
      const response = await instance.get(`${requests.fetchNotifications}?page=${page}&limit=20&includeRead=true`, { headers: authHeaders });
      
      if (response.status === 200) {
        const { notifications: newNotifications, pagination } = response.data.data;
        
        setNotifications(prev => refresh || page === 1 ? newNotifications : [...prev, ...newNotifications]);
        setCurrentPage(pagination.currentPage);
        setHasNextPage(pagination.hasNextPage);
        
        if (page === 1) onUnreadCountChange?.(newNotifications.filter((n: UserNotification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await instance.get(requests.getUnreadNotificationCount, { headers: authHeaders });
      if (response.status === 200) onUnreadCountChange?.(response.data.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      setLoading(true);
      if (initialUnreadCount === 0) {
        setNotifications([]);
      } else {
        await fetchNotifications(1, true);
      }
      setLoading(false);
    };
    initializeNotifications();
  }, [initialUnreadCount]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchNotifications(1, true), fetchUnreadCount()]);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!hasNextPage || loadingMore) return;
    setLoadingMore(true);
    await fetchNotifications(currentPage + 1);
    setLoadingMore(false);
  };

  const markAsRead = async (notificationId: number) => {
    if (markingAsRead.has(notificationId)) return;
    
    setMarkingAsRead(prev => new Set([...prev, notificationId]));
    
    try {
      const response = await instance.patch(`${requests.markNotificationAsRead(notificationId)}`, {}, { headers: authHeaders });

      if (response.status === 200) {
        setNotifications(prev => prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n));
        onUnreadCountChange?.(notifications.filter(n => !n.isRead && n.notificationId !== notificationId).length);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setMarkingAsRead(prev => {
        const updated = new Set(prev);
        updated.delete(notificationId);
        return updated;
      });
    }
  };

  const markAllAsRead = async () => {
    if (markingAllAsRead) return;
    setMarkingAllAsRead(true);
    
    try {
      const response = await instance.patch(requests.markAllNotificationsAsRead, {}, { headers: authHeaders });
      if (response.status === 200) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        onUnreadCountChange?.(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const diffInHours = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return diffInDays < 7 ? `${diffInDays}d ago` : new Date(dateString).toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => 
    ({ 'friend_request': '👥', 'like': '❤️', 'comment': '💬', 'follow': '👤', 'system': '🔔', 'achievement': '🏆' }[type] || '📢');

  const renderNotification = ({ item }: { item: UserNotification }) => {
    const isMarking = markingAsRead.has(item.notificationId);
    
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.isRead && styles.unreadNotification]}
        onPress={() => !item.isRead && markAsRead(item.notificationId)}
        disabled={isMarking}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
            <View style={styles.notificationText}>
              <Text style={styles.notificationTitle}>{item.content?.title || 'Notification'}</Text>
              <Text style={styles.notificationMessage}>{item.content?.body || ''}</Text>
            </View>
            <View style={styles.notificationMeta}>
              <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
              {!item.isRead && <View style={styles.unreadDot} />}
              {isMarking && <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    return unreadCount === 0 ? null : (
      <View style={styles.headerContainer}>
        <Text style={styles.unreadCountText}>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</Text>
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead} disabled={markingAllAsRead}>
          {markingAllAsRead ? (
            <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
          ) : (
            <Text style={styles.markAllButtonText}>Mark all as read</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Mascot emotion="sleeping" />
        <Text style={styles.emptyMessage}>No new notifications</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.notificationId.toString()}
        renderItem={renderNotification}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={loadingMore ? <View style={styles.footerLoader}><ActivityIndicator size="small" color={COLORS.primaryOrangeHex} /></View> : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primaryOrangeHex} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.space_16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryGreyHex, marginTop: SPACING.space_12 },
  emptyContainer: { marginTop: SPACING.space_32, marginBottom: SPACING.space_36 },
  emptyMessage: { fontSize: FONTSIZE.size_18, fontFamily: FONTFAMILY.poppins_semibold, textAlign: 'center', color: COLORS.primaryWhiteHex },
  listContainer: { paddingTop: SPACING.space_16 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.space_16, paddingHorizontal: SPACING.space_4 },
  unreadCountText: { fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryGreyHex },
  markAllButton: { paddingHorizontal: SPACING.space_12, paddingVertical: SPACING.space_4 },
  markAllButtonText: { fontSize: FONTSIZE.size_12, fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryOrangeHex },
  notificationCard: { backgroundColor: COLORS.primaryDarkGreyHex, borderRadius: SPACING.space_12, padding: SPACING.space_16, marginBottom: SPACING.space_12 },
  unreadNotification: { borderLeftWidth: 3, borderLeftColor: COLORS.primaryOrangeHex },
  notificationContent: { flex: 1 },
  notificationHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  notificationIcon: { fontSize: FONTSIZE.size_20, marginRight: SPACING.space_12, marginTop: 2 },
  notificationText: { flex: 1, marginRight: SPACING.space_8 },
  notificationTitle: { fontSize: FONTSIZE.size_16, fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryWhiteHex, marginBottom: 4 },
  notificationMessage: { fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_regular, color: COLORS.secondaryLightGreyHex, lineHeight: 20 },
  notificationMeta: { alignItems: 'flex-end' },
  timeAgo: { fontSize: FONTSIZE.size_12, fontFamily: FONTFAMILY.poppins_regular, color: COLORS.secondaryLightGreyHex, marginBottom: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primaryOrangeHex },
  footerLoader: { paddingVertical: SPACING.space_16, alignItems: 'center' },
});

export default GeneralNotificationsComponent;