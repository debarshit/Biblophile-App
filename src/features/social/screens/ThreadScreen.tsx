import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import BuddyReadCommentsSection, { BuddyReadCommentsSectionRef } from '../components/BuddyReadCommentsSection';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import { useCallback, useMemo, useRef, useState } from 'react';
import { CommentInputForm, CommentInputFormRef } from '../components/CommentInputForm';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';

export default function ThreadScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { rootComment, buddyReadId, currentUser, isHost, accessToken } = route.params;
    const commentsSectionRef = useRef<BuddyReadCommentsSectionRef>(null);
    const commentInputRef = useRef<CommentInputFormRef>(null);
    const [replyContext, setReplyContext] = useState<{
        commentId: number | null;
        username?: string;
        pageNumber?: number;
      } | null>(null);
    const { COLORS } = useTheme();
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);

    const handleReplyPress = useCallback((commentId: number, username: string, pageNumber: number) => {
        setReplyContext({ commentId, username, pageNumber });
        setTimeout(() => {
            commentInputRef.current?.focus();
        }, 50);
      }, []);

      const handleCommentSubmit = useCallback(async (commentText: string, progressPercentage?: number) => {
          if (commentsSectionRef.current) {
              await commentsSectionRef.current.submitComment(
                  commentText,
                  progressPercentage,
                  replyContext?.commentId ?? null
              );
              setReplyContext(null);
          }
        }, [replyContext]);

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
            <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.primaryWhiteHex} />
                    <Text style={styles.backText}>Back to thread</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Thread</Text>
            </View>

            {/* Root comment context pill */}
            <View style={styles.contextBanner}>
                <Text style={styles.contextText}>
                    Viewing replies to{' '}
                    <Text style={{ color: COLORS.primaryOrangeHex }}>
                        @{rootComment.user_name}
                    </Text>
                    's comment at {rootComment.progressPercentage}%
                </Text>
            </View>

            {/* Reuse the comments section, but pass the single root comment */}
            <BuddyReadCommentsSection
                ref={commentsSectionRef}
                buddyReadId={buddyReadId}
                currentUser={currentUser}
                isHost={isHost}
                accessToken={accessToken}
                onReplyPress={handleReplyPress}
                replyContextId={null}
                onContinueThread={(deeperComment) => {
                    // Push another ThreadScreen for even deeper nesting
                    navigation.push('ThreadScreen', {
                        rootComment: deeperComment,
                        buddyReadId,
                        currentUser,
                        isHost,
                        accessToken,
                    });
                }}
                rootCommentId={rootComment.commentId}
                rootComment={rootComment} 
            />
            </ScrollView>
            <CommentInputForm
                ref={commentInputRef}
                onSubmit={handleCommentSubmit}
                isLoading={false}
                showPageInput
                initialPageNumber={replyContext?.pageNumber ?? currentUser.progressPercentage}
                placeholder={
                    replyContext
                        ? `Replying to ${replyContext.username}`
                        : 'Share your thoughts...'
                }
                replyContext={replyContext}
                onCancelReply={() => setReplyContext(null)}
            />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (COLORS) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primaryBlackHex,
    },
    scrollViewContainer: {
        paddingHorizontal: SPACING.space_15,
    },
    contentContainer: {
        paddingBottom: SPACING.space_10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.space_20,
        paddingVertical: SPACING.space_15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.primaryGreyHex,
        backgroundColor: COLORS.primaryDarkGreyHex,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.space_8,
    },
    backText: {
        color: COLORS.primaryWhiteHex,
        fontFamily: FONTFAMILY.poppins_medium,
        fontSize: FONTSIZE.size_14,
    },
    title: {
        color: COLORS.primaryWhiteHex,
        fontFamily: FONTFAMILY.poppins_semibold,
        fontSize: FONTSIZE.size_18,
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: -1,  // sits behind the back button so it doesn't block taps
    },
    contextBanner: {
        marginHorizontal: SPACING.space_20,
        marginVertical: SPACING.space_12,
        paddingHorizontal: SPACING.space_15,
        paddingVertical: SPACING.space_10,
        backgroundColor: COLORS.primaryDarkGreyHex,
        borderRadius: BORDERRADIUS.radius_8,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primaryOrangeHex,
    },
    contextText: {
        color: COLORS.secondaryLightGreyHex,
        fontFamily: FONTFAMILY.poppins_regular,
        fontSize: FONTSIZE.size_12,
    },
});