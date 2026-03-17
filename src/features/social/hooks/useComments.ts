import { useState, useCallback, useRef } from "react";
import { Alert, Animated, LayoutAnimation } from "react-native";
import instance from "../../../services/axios";
import requests from "../../../services/requests";

interface CurrentUser {
    userId: string | null;
    readingStatus: string | null;
    progressPercentage: number;
}

export interface Comment {
    commentId: number;
    commentText: string;
    progressPercentage: number;
    user_name: string;
    userId: string;
    like_count: number;
    createdAt: string;
    parent_comment_id?: number | null;
    replies: Comment[] | undefined;
    reply_count: number;
    liked_by_user: boolean;
}

const mergeUniqueById = (existing: Comment[], incoming: Comment[]) => {
    const existingIds = new Set(existing.map(item => item.commentId));
    return [...existing, ...incoming.filter(item => !existingIds.has(item.commentId))];
};

export const useComments = ({
    buddyReadId,
    accessToken,
    currentUser,
    rootCommentId,
    rootComment,
}: {
    buddyReadId: string;
    accessToken: string | null;
    currentUser: CurrentUser;
    rootCommentId?: number;
    rootComment?: Comment;
}) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingInitialData, setLoadingInitialData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadingComments, setLoadingComments] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState<Record<number, boolean>>({});
    const [commentPage, setCommentPage] = useState(1);
    const [replyPages, setReplyPages] = useState<Record<number, number>>({});
    const [hasMoreReplies, setHasMoreReplies] = useState<Record<number, boolean>>({});
    const [hasMoreCommentsState, setHasMoreCommentsState] = useState(false);
    const [selectedCommentForDeletion, setSelectedCommentForDeletion] = useState<number | null>(null);
    const [sort, setSort] = useState('created_at_asc');
    const animatedValues = useRef<Record<number, Animated.Value>>({}).current;

    const getAnimatedValue = (commentId: number) => {
        if (!animatedValues[commentId]) {
            animatedValues[commentId] = new Animated.Value(1);
        }
        return animatedValues[commentId];
    };

    const fetchComments = useCallback(async (currentSort: string = sort) => {
        setLoadingInitialData(true);
        setError(null);
        try {
            if (!accessToken) return;
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            if (rootCommentId && rootComment) {
                const res = await instance.get(
                    `${requests.fetchReplies(rootCommentId)}?page=1&order_by=${currentSort}&timezone=${userTimezone}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                const replies: Comment[] = res.data.data.replies || [];
                const hasMore = res.data.data.hasMoreReplies || false;

                setComments([{ ...rootComment, replies, reply_count: rootComment.reply_count }]);
                setHasMoreReplies({
                    [rootCommentId]: hasMore,
                    ...replies.reduce((acc, r) => {
                        if (r.reply_count > 0) acc[r.commentId] = true;
                        return acc;
                    }, {} as Record<number, boolean>),
                });
                setCommentPage(1);
            } else {
                const res = await instance.get(
                    `${requests.fetchComments(String(buddyReadId))}?page=1&order_by=${currentSort}&timezone=${userTimezone}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                const initialComments: Comment[] = res.data.data.comments || [];
                setComments(initialComments);
                setHasMoreCommentsState(res.data.data.hasMoreComments || false);
                setHasMoreReplies(
                    initialComments.reduce((acc, c) => {
                        if (c.reply_count > 0) acc[c.commentId] = true;
                        return acc;
                    }, {} as Record<number, boolean>)
                );
                setCommentPage(1);
            }
        } catch (err) {
            setError('Failed to fetch comments');
            console.error(err);
        } finally {
            setLoadingInitialData(false);
        }
    }, [buddyReadId, sort, rootCommentId, rootComment, accessToken]);

    const loadMoreComments = async () => {
        if (loadingComments || !hasMoreCommentsState || !accessToken || !currentUser.userId) return;
        setLoadingComments(true);
        const nextPage = commentPage + 1;
        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const res = await instance.get(
                `${requests.fetchComments(String(buddyReadId))}?page=${nextPage}&order_by=${sort}&timezone=${userTimezone}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (res.status === 200) {
                setComments(prev => mergeUniqueById(prev, res.data.data.comments || []));
                setHasMoreCommentsState(res.data.data.hasMoreComments || false);
                setCommentPage(nextPage);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingComments(false);
        }
    };

    const loadRepliesRecursively = (
        replies: Comment[],
        parentCommentId: number,
        newReplies: Comment[]
    ): Comment[] => replies.map(reply => {
        if (reply.commentId === parentCommentId) {
            return { ...reply, replies: mergeUniqueById(reply.replies || [], newReplies) };
        }
        if (reply.replies) {
            return { ...reply, replies: loadRepliesRecursively(reply.replies, parentCommentId, newReplies) };
        }
        return reply;
    });

    const loadReplies = async (parentCommentId: number) => {
        if (!accessToken || !currentUser.userId) return;
        setLoadingReplies(prev => ({ ...prev, [parentCommentId]: true }));
        const nextPage = replyPages[parentCommentId] || 1;
        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const res = await instance.get(
                `${requests.fetchReplies(parentCommentId)}?page=${nextPage}&order_by=${sort}&timezone=${userTimezone}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const newReplies = res.data.data.replies || [];
            const hasMore = res.data.data.hasMoreReplies ?? false;

            setReplyPages(prev => ({ ...prev, [parentCommentId]: hasMore ? nextPage + 1 : nextPage }));
            setHasMoreReplies(prev => ({ ...prev, [parentCommentId]: hasMore }));
            setComments(prev => prev.map(comment => {
                if (comment.commentId === parentCommentId) {
                    return { ...comment, replies: mergeUniqueById(comment.replies || [], newReplies) };
                }
                if (comment.replies) {
                    return { ...comment, replies: loadRepliesRecursively(comment.replies, parentCommentId, newReplies) };
                }
                return comment;
            }));
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } catch (err) {
            console.error(err);
            setHasMoreReplies(prev => ({ ...prev, [parentCommentId]: false }));
        } finally {
            setLoadingReplies(prev => ({ ...prev, [parentCommentId]: false }));
        }
    };

    const handleSortChange = useCallback((newSort: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSort(newSort);
        setCommentPage(1);
        setComments([]);
        fetchComments(newSort);
    }, [fetchComments]);

    const handleEllipsisClick = (commentId: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        setSelectedCommentForDeletion(prev => prev === commentId ? null : commentId);
    };

    const removeCommentRecursively = (list: Comment[], commentId: number): Comment[] =>
        list
            .filter(c => c.commentId !== commentId)
            .map(c => ({
                ...c,
                replies: c.replies ? removeCommentRecursively(c.replies, commentId) : c.replies,
            }));

    const handleDeleteComment = async (commentId: number) => {
        if (!accessToken || !currentUser.userId) return;
        Alert.alert('Delete Comment', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await instance.delete(requests.deleteComment(commentId), {
                            headers: { Authorization: `Bearer ${accessToken}` },
                        });
                        if (res.data.status === 'success') {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setComments(prev => removeCommentRecursively(prev, commentId));
                            // Alert.alert('Success', 'Comment deleted.');
                        } else {
                            Alert.alert('Error', res.data.data.message || 'Failed to delete.');
                        }
                    } catch (err) {
                        Alert.alert('Error', 'An error occurred.');
                    } finally {
                        setSelectedCommentForDeletion(null);
                    }
                },
            },
        ]);
    };

    const handleCommentSubmit = async (
        commentText: string,
        progressPercentage?: number,
        parentCommentId?: number | null
    ) => {
        if (!accessToken || !buddyReadId || !currentUser.userId || !commentText.trim()) return;
        const actualProgress = progressPercentage ?? currentUser.progressPercentage;
        try {
            const params = new URLSearchParams({
                comment_text: commentText,
                buddy_read_id: String(buddyReadId),
                progress_percentage: String(actualProgress),
                user_id: currentUser.userId,
            });
            if (parentCommentId != null) params.append('parent_comment_id', String(parentCommentId));

            const res = await instance.post(requests.submitComment(String(buddyReadId)), params, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.data.data.message === 'Comment added') {
                setCommentPage(1);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                fetchComments(sort);
            }
        } catch (err) {
            console.error('Failed to post comment', err);
        }
    };

    const findComment = (list: Comment[], id: number): Comment | undefined => {
        for (const c of list) {
            if (c.commentId === id) return c;
            if (Array.isArray(c.replies)) {
                const found = findComment(c.replies, id);
                if (found) return found;
            }
        }
        return undefined;
    };

    const toggleLike = async (commentId: number) => {
        if (!accessToken) return;

        const animatedValue = getAnimatedValue(commentId);
        Animated.sequence([
            Animated.timing(animatedValue, { toValue: 1.3, duration: 100, useNativeDriver: true }),
            Animated.timing(animatedValue, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        const updateLikes = (list: Comment[], increment: boolean): Comment[] =>
            list.map(c => {
                if (c.commentId === commentId) {
                    return {
                        ...c,
                        liked_by_user: increment,
                        like_count: increment ? c.like_count + 1 : c.like_count - 1,
                    };
                }
                if (Array.isArray(c.replies)) return { ...c, replies: updateLikes(c.replies, increment) };
                return c;
            });

        // Use recursive find instead of top-level find
        const targetComment = findComment(comments, commentId);
        const wasLiked = targetComment?.liked_by_user ?? false;

        setComments(prev => updateLikes(prev, !wasLiked));

        try {
            await instance.post(requests.toggleLike(commentId), {}, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
        } catch (err) {
            setComments(prev => updateLikes(prev, wasLiked)); // revert
        }
    };

    return {
        comments,
        loadingInitialData,
        error,
        loadingComments,
        loadingReplies,
        hasMoreCommentsState,
        hasMoreReplies,
        selectedCommentForDeletion,
        sort,
        getAnimatedValue,
        fetchComments,
        loadMoreComments,
        loadReplies,
        handleSortChange,
        handleEllipsisClick,
        handleDeleteComment,
        handleCommentSubmit,
        toggleLike,
    };
};