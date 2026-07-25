import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../../../../theme/theme';
import { AntDesign, Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';
import { useAnalytics } from '../../../../utils/analytics';
import { useStore } from '../../../../store/store';

export interface ArcCampaign {
  id: number;
  title: string;
  description: string;
  quantityLimit: number;
  startDate: string;
  endDate: string;
  startDateFormatted?: string;
  endDateFormatted?: string;
  bookId: number;
  bookName: string;
  bookPhoto: string;
  bookDescription: string;
}

export interface UserApplication {
  applicationId: number;
  campaignId: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewStatus: 'pending' | 'submitted' | 'overdue';
  reviewDueDate: string | null;
  title: string;
  bookName: string;
  bookPhoto: string;
  bookId: string;
  workId: string;
}

interface FeedbackMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: 'reader' | 'author';
  message: string;
  createdAt: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  arc: ArcCampaign | null;
  // optional: if we already know the user has an application (from the list screen)
  userApplication?: UserApplication | null;
  navigation?: any;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getDaysLeft = (endDate: string) => {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

type ModalView = 'detail' | 'apply' | 'chat';

const REVIEWER_EXPECTATIONS = [
  'Read the book before its publication date',
  'Share an honest review on Biblophile',
  'Submit your review before the due date',
  'Provide private feedback to the author',
];

export default function ArcModal({ visible, onClose, arc, userApplication, navigation }: Props) {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const analytics = useAnalytics();
  const userDetails = useStore((state: any) => state.userDetails);
  const userId = userDetails[0]?.userId;
  const accessToken = userDetails[0].accessToken;

  const [view, setView] = useState<ModalView>('detail');
  const [applying, setApplying] = useState(false);
  const [applicationFeedback, setApplicationFeedback] = useState('');

  // Chat state
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const activeAppId = userApplication?.applicationId;

  useEffect(() => {
    if (view === 'chat' && activeAppId) {
      fetchMessages();
    }
  }, [view, activeAppId]);

  const fetchMessages = async () => {
    if (!activeAppId) return;
    try {
      setChatLoading(true);
      const res = await instance.get(requests.getArcFeedbackMessages(activeAppId));
      setMessages(res.data.data || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load messages', position: 'bottom' });
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeAppId) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      const res = await instance.post(requests.sendArcFeedbackMessage(activeAppId), {
        message: text,
      });
      const added: FeedbackMessage = res.data.data;
      console.log(added);
      setMessages(prev => [...prev, added]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to send message', position: 'bottom' });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
  if (!arc?.id) return;
    instance.post(requests.trackArcEvent(arc.id), { eventType: 'impression' }, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    }).catch(err => console.error("Error logging impression:", err));

    instance.post(requests.trackArcEvent(arc.id), { eventType: 'arc_pageview' }, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    }).catch(err => console.error("Error logging pageview:", err));
  }, [arc?.id, accessToken]);

  if (!arc) return null;

  const daysLeft = getDaysLeft(arc.endDate);

  const handleApply = async () => {
    try {
      setApplying(true);
      await instance.post(requests.applyForArc(arc.id), {
        feedback: applicationFeedback,
      });
      analytics.track('arc_applied', { arc_id: arc.id, title: arc.title });
      Toast.show({ type: 'success', text1: 'Application sent! ✉️', text2: 'You\'ll hear back soon.', position: 'bottom' });
      setView('detail');
      setApplicationFeedback('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Application failed. Please try again.';
      Toast.show({ type: 'error', text1: msg, position: 'bottom' });
    } finally {
      setApplying(false);
    }
  };

  const handleShare = () => {
    const url = `https://biblophile.com/advance-reading-copies/${arc.id}`;
    Share.share({
      title: arc.title,
      message: `Check out this ARC opportunity 📖\n\n${arc.title}\n${url}`,
    });
    analytics.track('arc_shared', { arc_id: arc.id });
  };

  const handleClose = () => {
    setView('detail');
    setApplicationFeedback('');
    setNewMessage('');
    setMessages([]);
    onClose();
  };

  const handleViewBook = () => {
    if (!arc?.bookId || !navigation) return;
    handleClose();
    navigation.navigate('Details', {
      id: String(arc.bookId),
      type: 'Book',
      arcId: arc.id,
    });
  };

  const renderMessage = ({ item }: { item: FeedbackMessage }) => {
    const isMe = item.senderId === userId || item.senderRole === 'reader';
    return (
      <View style={[styles.msgBubble, isMe ? styles.msgMe : styles.msgThem]}>
        {!isMe && (
          <Text style={styles.msgSender}>{item.senderName}</Text>
        )}
        <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.message}</Text>
        <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
          {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kavWrapper}
        >
          <View style={styles.modalContainer}>

            {/* ─── CHAT VIEW ─── */}
            {view === 'chat' ? (
              <>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setView('detail')} style={styles.iconBtn}>
                    <AntDesign name="arrowleft" size={18} color={COLORS.primaryWhiteHex} />
                  </TouchableOpacity>
                  <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Private Notes</Text>
                    <Text style={styles.headerSub}>{arc.bookName}</Text>
                  </View>
                  <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
                    <AntDesign name="close" size={18} color={COLORS.primaryWhiteHex} />
                  </TouchableOpacity>
                </View>

                {chatLoading ? (
                  <View style={styles.chatLoading}>
                    <ActivityIndicator color={COLORS.primaryOrangeHex} />
                  </View>
                ) : (
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={m => String(m.id)}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesList}
                    ListEmptyComponent={
                      <View style={styles.emptyChat}>
                        <MaterialCommunityIcons name="chat-outline" size={40} color={COLORS.primaryLightGreyHex} />
                        <Text style={styles.emptyChatText}>
                          No messages yet. Start the conversation with the author!
                        </Text>
                      </View>
                    }
                    onLayout={() => messages.length > 0 && flatListRef.current?.scrollToEnd({ animated: false })}
                  />
                )}

                {/* Input bar */}
                <View style={styles.chatInputRow}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Share private feedback…"
                    placeholderTextColor={COLORS.primaryLightGreyHex}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={1000}
                    onFocus={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300)}
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
                    onPress={sendMessage}
                    disabled={!newMessage.trim() || sending}
                  >
                    {sending
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Ionicons name="send" size={18} color="#fff" />
                    }
                  </TouchableOpacity>
                </View>
              </>
            ) : view === 'apply' ? (
              /* ─── APPLY VIEW ─── */
              <>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setView('detail')} style={styles.iconBtn}>
                    <AntDesign name="arrowleft" size={18} color={COLORS.primaryWhiteHex} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Request ARC Copy</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
                    <AntDesign name="close" size={18} color={COLORS.primaryWhiteHex} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  contentContainerStyle={styles.applyScrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.applySubtitle}>
                    Tell the author why you'd love to read{' '}
                    <Text style={styles.highlight}>{arc.bookName}</Text> before anyone else.
                    A thoughtful pitch increases your chances of approval.
                  </Text>

                  <Text style={styles.fieldLabel}>Your Pitch (optional)</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="e.g. I read in this genre regularly, have a blog with 2k followers, and always submit reviews on time…"
                    placeholderTextColor={COLORS.primaryLightGreyHex}
                    multiline
                    numberOfLines={5}
                    value={applicationFeedback}
                    onChangeText={setApplicationFeedback}
                    maxLength={500}
                  />
                  <Text style={styles.charCount}>{applicationFeedback.length}/500</Text>

                  <TouchableOpacity
                    style={[styles.primaryBtn, applying && styles.btnDisabled]}
                    onPress={handleApply}
                    disabled={applying}
                  >
                    {applying
                      ? <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
                      : <Text style={styles.primaryBtnText}>Send Application</Text>
                    }
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : (
              /* ─── DETAIL VIEW ─── */
              <>
                {/* Cover image */}
                <View style={styles.imageContainer}>
                  {arc.bookPhoto ? (
                    <Image source={{ uri: arc.bookPhoto }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                      <Ionicons name="book-outline" size={48} color={COLORS.primaryLightGreyHex} />
                    </View>
                  )}
                  <View style={[styles.daysBadge, daysLeft <= 3 && styles.daysBadgeUrgent]}>
                    <Text style={styles.daysBadgeText}>
                      {daysLeft === 0 ? 'Ends today!' : `${daysLeft}d left`}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <AntDesign name="share-alt" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeFloating} onPress={handleClose}>
                    <AntDesign name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* Meta tags */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaTag}>
                      <Text style={styles.metaTagText}>📖 ARC</Text>
                    </View>
                    <View style={styles.metaTag}>
                      <Text style={styles.metaTagText}>👥 {arc.quantityLimit} reviewer slots</Text>
                    </View>
                  </View>

                  <Text style={styles.title}>{arc.title}</Text>
                  <TouchableOpacity onPress={handleViewBook} activeOpacity={0.7}>
                    <Text style={[styles.bookName, navigation && styles.bookNameLink]}>{arc.bookName}</Text>
                  </TouchableOpacity>

                  <View style={styles.datesRow}>
                    <Feather name="calendar" size={13} color={COLORS.primaryOrangeHex} />
                    <Text style={styles.dateText}>
                      {formatDate(arc.startDate)} — {formatDate(arc.endDate)}
                    </Text>
                  </View>

                  {arc.description ? (
                    <Text style={styles.description}>{arc.description}</Text>
                  ) : null}

                  {/* Reviewer expectations */}
                  <View style={styles.expectBox}>
                    <Text style={styles.expectTitle}>What's expected of you</Text>
                    {REVIEWER_EXPECTATIONS.map((exp, i) => (
                      <View key={i} style={styles.expectRow}>
                        <Text style={styles.expectArrow}>→</Text>
                        <Text style={styles.expectText}>{exp}</Text>
                      </View>
                    ))}
                  </View>

                  {/* CTAs */}
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => setView('apply')}>
                    <Text style={styles.primaryBtnText}>📋 Request ARC Copy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare}>
                    <AntDesign name="share-alt" size={14} color={COLORS.primaryOrangeHex} />
                    <Text style={styles.secondaryBtnText}>Share</Text>
                  </TouchableOpacity>

                  {/* Private notes — only if user has an approved application */}
                  {userApplication && userApplication.status === 'approved' && (
                    <TouchableOpacity
                      style={styles.chatBtn}
                      onPress={() => setView('chat')}
                    >
                      <MaterialCommunityIcons name="chat-outline" size={16} color={COLORS.primaryOrangeHex} />
                      <Text style={styles.chatBtnText}>Private Notes with Author</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    kavWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: '92%',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.space_16,
      paddingTop: SPACING.space_20,
      paddingBottom: SPACING.space_16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: FONTSIZE.size_18,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
    },
    headerSub: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
    },
    iconBtn: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: SPACING.space_8,
    },
    // Image
    imageContainer: { position: 'relative' },
    image: { width: '100%', height: 220 },
    imagePlaceholder: {
      backgroundColor: COLORS.secondaryDarkGreyHex,
      justifyContent: 'center',
      alignItems: 'center',
    },
    daysBadge: {
      position: 'absolute', bottom: 12, left: 12,
      backgroundColor: 'rgba(209,120,66,0.9)',
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    },
    daysBadgeUrgent: { backgroundColor: 'rgba(220,53,53,0.9)' },
    daysBadgeText: { color: '#fff', fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_12 },
    shareBtn: {
      position: 'absolute', top: 12, right: 52,
      backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: 10,
    },
    closeFloating: {
      position: 'absolute', top: 12, right: 12,
      backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: 10,
    },
    // Content
    scrollContent: { padding: SPACING.space_20, paddingBottom: SPACING.space_36 },
    metaRow: { flexDirection: 'row', gap: SPACING.space_8, marginBottom: SPACING.space_10 },
    metaTag: {
      backgroundColor: 'rgba(209,120,66,0.15)', borderRadius: 20,
      paddingHorizontal: SPACING.space_10, paddingVertical: 4,
      borderWidth: 1, borderColor: 'rgba(209,120,66,0.3)',
    },
    metaTagText: { fontSize: FONTSIZE.size_12, fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryOrangeHex },
    title: { fontSize: FONTSIZE.size_20, fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryWhiteHex, marginBottom: SPACING.space_4 },
    bookName: { fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_regular, color: COLORS.secondaryLightGreyHex, marginBottom: SPACING.space_10 },
    bookNameLink: { color: COLORS.primaryOrangeHex, textDecorationLine: 'underline' },
    datesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.space_12 },
    dateText: { fontSize: FONTSIZE.size_12, fontFamily: FONTFAMILY.poppins_regular, color: COLORS.primaryOrangeHex },
    description: { fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_regular, color: COLORS.secondaryLightGreyHex, lineHeight: 22, marginBottom: SPACING.space_16 },
    expectBox: { backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_15, padding: SPACING.space_16, marginBottom: SPACING.space_20 },
    expectTitle: { fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryWhiteHex, marginBottom: SPACING.space_10 },
    expectRow: { flexDirection: 'row', gap: SPACING.space_8, marginBottom: SPACING.space_8 },
    expectArrow: { color: COLORS.primaryOrangeHex, fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_14 },
    expectText: { flex: 1, fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_regular, color: COLORS.secondaryLightGreyHex, lineHeight: 22 },
    // Buttons
    primaryBtn: { backgroundColor: COLORS.primaryOrangeHex, borderRadius: BORDERRADIUS.radius_25, paddingVertical: SPACING.space_16, alignItems: 'center', marginBottom: SPACING.space_12 },
    btnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: COLORS.primaryWhiteHex, fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_16 },
    secondaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.space_8,
      borderWidth: 1, borderColor: COLORS.primaryOrangeHex, borderRadius: BORDERRADIUS.radius_25,
      paddingVertical: SPACING.space_12, marginBottom: SPACING.space_12,
    },
    secondaryBtnText: { color: COLORS.primaryOrangeHex, fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_14 },
    chatBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.space_8,
      backgroundColor: 'rgba(209,120,66,0.1)', borderWidth: 1, borderColor: 'rgba(209,120,66,0.3)',
      borderRadius: BORDERRADIUS.radius_25, paddingVertical: SPACING.space_12,
    },
    chatBtnText: { color: COLORS.primaryOrangeHex, fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_14 },
    // Apply view
    applyScrollContent: { padding: SPACING.space_20, paddingBottom: SPACING.space_36 },
    applySubtitle: { fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_regular, color: COLORS.secondaryLightGreyHex, lineHeight: 22, marginBottom: SPACING.space_20 },
    highlight: { color: COLORS.primaryOrangeHex, fontFamily: FONTFAMILY.poppins_semibold },
    fieldLabel: { fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryWhiteHex, marginBottom: SPACING.space_8 },
    textArea: {
      backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_15,
      paddingHorizontal: SPACING.space_16, paddingTop: SPACING.space_12,
      color: COLORS.primaryWhiteHex, fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_14,
      height: 130, textAlignVertical: 'top', marginBottom: SPACING.space_4,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    charCount: { fontSize: FONTSIZE.size_12, fontFamily: FONTFAMILY.poppins_regular, color: COLORS.primaryLightGreyHex, textAlign: 'right', marginBottom: SPACING.space_20 },
    input: {
      backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_15,
      paddingHorizontal: SPACING.space_16, height: 52, color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_14, marginBottom: SPACING.space_20,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    // Chat view
    chatLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.space_36 },
    messagesList: { padding: SPACING.space_16, gap: SPACING.space_8, flexGrow: 1 },
    emptyChat: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.space_36, gap: SPACING.space_12 },
    emptyChatText: { fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_regular, color: COLORS.primaryLightGreyHex, textAlign: 'center', maxWidth: 260 },
    msgBubble: { maxWidth: '80%', borderRadius: 18, padding: SPACING.space_12, marginBottom: SPACING.space_4 },
    msgMe: { alignSelf: 'flex-end', backgroundColor: COLORS.primaryOrangeHex, borderBottomRightRadius: 4 },
    msgThem: { alignSelf: 'flex-start', backgroundColor: COLORS.secondaryDarkGreyHex, borderBottomLeftRadius: 4 },
    msgSender: { fontSize: FONTSIZE.size_10, fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryOrangeHex, marginBottom: 2 },
    msgText: { fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_regular, color: COLORS.secondaryLightGreyHex, lineHeight: 20 },
    msgTextMe: { color: '#fff' },
    msgTime: { fontSize: FONTSIZE.size_10, fontFamily: FONTFAMILY.poppins_regular, color: 'rgba(174,174,174,0.7)', marginTop: 4, textAlign: 'right' },
    msgTimeMe: { color: 'rgba(255,255,255,0.6)' },
    chatInputRow: {
      flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.space_10,
      paddingHorizontal: SPACING.space_12, paddingVertical: SPACING.space_10,
      borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
      backgroundColor: COLORS.primaryDarkGreyHex,
    },
    chatInput: {
      flex: 1, backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: 20,
      paddingHorizontal: SPACING.space_16, paddingVertical: SPACING.space_10,
      color: COLORS.primaryWhiteHex, fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_14,
      maxHeight: 100, minHeight: 44,
    },
    sendBtn: { backgroundColor: COLORS.primaryOrangeHex, borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    sendBtnDisabled: { opacity: 0.4 },
  });