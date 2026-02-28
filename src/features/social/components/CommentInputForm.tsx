import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    Pressable,
    Text,
    ActivityIndicator,
    Keyboard,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDERRADIUS, COLORS, FONTSIZE, SPACING } from '../../../theme/theme';

export interface CommentInputFormRef {
    focus: () => void;
}

interface CommentInputFormProps {
    onSubmit: (text: string, pageNumber: number) => void;
    isLoading: boolean;
    showPageInput?: boolean;
    initialPageNumber?: number;
    placeholder?: string;
    replyContext?: {
    commentId: number | null;
    username?: string;
    pageNumber?: number;
  } | null;
  onCancelReply?: () => void;
}

export const CommentInputForm = forwardRef<CommentInputFormRef, CommentInputFormProps>(({
    onSubmit,
    isLoading,
    showPageInput = false,
    initialPageNumber = 1,
    placeholder = "Share your thoughts...",
    replyContext = null,
    onCancelReply = () => {},
}, ref) => {
    const [commentText, setCommentText] = useState('');
    const [pageNumber, setPageNumber] = useState(initialPageNumber.toString());
    const [isFocused, setIsFocused] = useState(false);
    const textInputRef = useRef<TextInput>(null);

    useEffect(() => {
        setPageNumber(initialPageNumber.toString());
    }, [initialPageNumber]);

    useImperativeHandle(ref, () => ({
        focus: () => {
            textInputRef.current?.focus();
        },
    }));

    const handleSubmit = () => {
        const trimmedText = commentText.trim();
        const parsedPage = parseInt(pageNumber, 10);

        if (!trimmedText || isNaN(parsedPage) || parsedPage < 0) {
            return;
        }

        onSubmit(trimmedText, parsedPage);
        setCommentText('');
        Keyboard.dismiss();
        textInputRef.current?.blur();
    };

    const canSubmit = commentText.trim().length > 0 && 
                      pageNumber !== '' && 
                      !isNaN(parseInt(pageNumber, 10)) &&
                      parseInt(pageNumber, 10) >= 0 &&
                      !isLoading;

    return (
        <View style={styles.container}>
            {/* Main Input Area */}
            <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
                {replyContext && (
  <View style={styles.replyBanner}>
    <Text style={styles.replyText}>
      Replying to <Text style={styles.replyUser}>@{replyContext.username}</Text>
    </Text>

    <Pressable onPress={onCancelReply}>
      <Ionicons name="close" size={18} color={COLORS.secondaryLightGreyHex} />
    </Pressable>
  </View>
)}
                {/* Text Input */}
                <View style={styles.textInputContainer}>
                    <TextInput
                        ref={textInputRef}
                        style={[styles.textInput, isFocused && styles.textInputExpanded]}
                        value={commentText}
                        onChangeText={setCommentText}
                        placeholder={placeholder}
                        placeholderTextColor={COLORS.secondaryLightGreyHex}
                        multiline
                        maxLength={500}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        editable={!isLoading}
                    />
                </View>

                {/* Actions Row */}
                <View style={styles.actionsRow}>
                    {/* Page Input (when focused or has content) */}
                    {showPageInput && (isFocused || commentText.length > 0) && (
                        <View style={styles.pageInputContainer}>
                            <Ionicons 
                                name="book-outline" 
                                size={16} 
                                color={COLORS.secondaryLightGreyHex} 
                            />
                            <Text style={styles.pageLabel}>At</Text>
                            <TextInput
                                style={styles.pageInput}
                                value={pageNumber}
                                onChangeText={setPageNumber}
                                keyboardType="number-pad"
                                maxLength={5}
                                editable={!isLoading}
                                placeholderTextColor={COLORS.secondaryLightGreyHex}
                            />
                            <Text style={styles.pageLabel}>%</Text>
                        </View>
                    )}

                    {/* Character Counter (when focused) */}
                    {isFocused && (
                        <Text style={styles.characterCounter}>
                            {commentText.length}/500
                        </Text>
                    )}

                    {/* Spacer */}
                    <View style={styles.spacer} />

                    {/* Submit Button */}
                    {(isFocused || commentText.length > 0) && (
                        <Pressable
                            onPress={handleSubmit}
                            disabled={!canSubmit}
                            style={[
                                styles.submitButton,
                                canSubmit && styles.submitButtonActive,
                                !canSubmit && styles.submitButtonDisabled
                            ]}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
                            ) : (
                                <>
                                    <Ionicons 
                                        name="send" 
                                        size={18} 
                                        color={canSubmit ? COLORS.primaryWhiteHex : COLORS.secondaryLightGreyHex} 
                                    />
                                    <Text style={[
                                        styles.submitButtonText,
                                        canSubmit && styles.submitButtonTextActive
                                    ]}>
                                        Post
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.primaryDarkGreyHex,
        borderTopWidth: 1,
        borderTopColor: '#2d3748',
        paddingTop: SPACING.space_10,
        paddingBottom: SPACING.space_10,
        paddingHorizontal: SPACING.space_16,
    },
    inputWrapper: {
        backgroundColor: '#2d3748',
        borderRadius: BORDERRADIUS.radius_10,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    inputWrapperFocused: {
        borderColor: COLORS.primaryOrangeHex,
        backgroundColor: '#1a2332',
    },
    textInputContainer: {
        paddingHorizontal: SPACING.space_12,
        paddingTop: SPACING.space_12,
    },
    replyBanner: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#1f2933',
  paddingHorizontal: SPACING.space_12,
  paddingVertical: SPACING.space_8,
  borderTopLeftRadius: BORDERRADIUS.radius_10,
  borderTopRightRadius: BORDERRADIUS.radius_10,
},

replyText: {
  color: COLORS.secondaryLightGreyHex,
  fontSize: FONTSIZE.size_12,
},

replyUser: {
  color: COLORS.primaryOrangeHex,
  fontWeight: '600',
},
    textInput: {
        fontSize: FONTSIZE.size_14,
        color: COLORS.primaryWhiteHex,
        minHeight: 40,
        maxHeight: 120,
        lineHeight: 20,
    },
    textInputExpanded: {
        minHeight: 60,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.space_12,
        paddingVertical: SPACING.space_10,
        paddingTop: SPACING.space_8,
        gap: SPACING.space_8,
    },
    pageInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#374151',
        paddingHorizontal: SPACING.space_10,
        paddingVertical: SPACING.space_4,
        borderRadius: BORDERRADIUS.radius_8,
        gap: SPACING.space_4,
    },
    pageLabel: {
        fontSize: FONTSIZE.size_12,
        color: COLORS.secondaryLightGreyHex,
        fontWeight: '500',
    },
    pageInput: {
        fontSize: FONTSIZE.size_14,
        color: COLORS.primaryWhiteHex,
        fontWeight: '600',
        minWidth: 40,
        textAlign: 'center',
        padding: 0,
    },
    characterCounter: {
        fontSize: FONTSIZE.size_12,
        color: COLORS.secondaryLightGreyHex,
    },
    spacer: {
        flex: 1,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.space_16,
        paddingVertical: SPACING.space_8,
        borderRadius: BORDERRADIUS.radius_20,
        gap: SPACING.space_4,
        backgroundColor: '#4b5563',
    },
    submitButtonActive: {
        backgroundColor: COLORS.primaryOrangeHex,
    },
    submitButtonDisabled: {
        backgroundColor: '#374151',
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: FONTSIZE.size_14,
        fontWeight: '600',
        color: COLORS.secondaryLightGreyHex,
    },
    submitButtonTextActive: {
        color: COLORS.primaryWhiteHex,
    },
});