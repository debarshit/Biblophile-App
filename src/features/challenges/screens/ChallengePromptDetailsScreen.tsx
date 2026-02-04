import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import Toast from 'react-native-toast-message';
import BookPicker from '../../../components/BookPicker';
import { useNavigation } from '@react-navigation/native';

interface Prompt {
    promptId: string;
    challengeId: string;
    promptDescription: string;
    promptType: string;
    promptValue: string;
    Progress: string;
    Completed: boolean;
    bookRecommendations?: string | null;
}

const ChallengePromptDetailsScreen = ({ route }) => {
    const { promptId } = route.params;
    const [promptData, setPromptdata] = useState<Prompt | null>(null);
    const [progress, setProgress] = useState<string>('');
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
    const [selectedUserBookId, setSelectedUserBookId] = useState<string | null>(null);
    const [linkedBooks, setLinkedBooks] = useState<any[]>([]);
    const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(false);
    const [userPromptId, setUserPromptId] = useState<number | null>(null);
    const [showBookPicker, setShowBookPicker] = useState<boolean>(false);
    const [bookToRemove, setBookToRemove] = useState<any>(null);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState<boolean>(false);
    const [showAddConfirm, setShowAddConfirm] = useState<boolean>(false);
    const [pendingBook, setPendingBook] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0]?.accessToken;
    const navigation = useNavigation<any>();

    const hasQuantifiableTarget = promptData?.promptValue !== null;
    const progressPercentage = hasQuantifiableTarget 
        ? Math.min((Number(progress) / Number(promptData?.promptValue || 1)) * 100, 100) : isCompleted ? 100 : 0;

    const fetchPromptDetails = async () => {
        try {
          setIsLoading(true);
          const response = await instance(`${requests.fetchPromptDetails(promptId)}`, {
              headers: { Authorization: `Bearer ${accessToken}` }
          });
          const promptData = response.data.data;
          setPromptdata(promptData);
          setProgress(promptData.Progress || '');
          setIsCompleted(promptData.Completed || false);
          if (promptData.userPromptId) {
            setUserPromptId(promptData.userPromptId);
            await fetchLinkedBooks(promptData.userPromptId);
        }
        } catch (error) {
          setError('Failed to fetch prompt details');
          Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch challenge details.' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLinkedBooks = async (userPromptId: number) => {
        try {
            setIsLoadingBooks(true);
            const response = await instance.get(
                requests.fetchPromptBooks(userPromptId),
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setLinkedBooks(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch linked books:', error);
        } finally {
            setIsLoadingBooks(false);
        }
    };

    const handleAddBook = async () => {
        if (!pendingBook || !userPromptId) return;
        
        try {
            await instance.post(
                requests.addBookToPrompt,
                {
                    userPromptId: userPromptId,
                    userBookId: parseInt(pendingBook.userBookId)
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Book linked successfully!'
            });
            
            await fetchLinkedBooks(userPromptId);
            setShowBookPicker(false);
            setPendingBook(null);
            setShowAddConfirm(false);
            setSelectedBookId(null);
            setSelectedUserBookId(null);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.response?.data?.message || 'Failed to link book'
            });
        }
    };

    const handleRemoveBook = async () => {
        if (!bookToRemove || !userPromptId) return;
        
        try {
            await instance.delete(requests.removeBookFromPrompt, {
                data: {
                    userPromptId: userPromptId,
                    userBookId: bookToRemove.userBookId
                },
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Book unlinked successfully!'
            });
            
            await fetchLinkedBooks(userPromptId);
            setBookToRemove(null);
            setShowRemoveConfirm(false);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.response?.data?.message || 'Failed to unlink book'
            });
        }
    };
    
    useEffect(() => { fetchPromptDetails(); }, [promptId]);

    useEffect(() => {
        if (selectedUserBookId && !showAddConfirm) {
            setPendingBook({
                bookId: selectedBookId,
                userBookId: selectedUserBookId
            });
            setShowAddConfirm(true);
        }
    }, [selectedUserBookId, selectedBookId]);

    const handleCompleteChallenge = async () => {
        if (!promptData) return;
        try {
            const payload: any = hasQuantifiableTarget ? { progress } : { isCompleted: isCompleted ? 1 : 0 };
            const response = await instance.patch(requests.updatePromptProgress(promptId), payload, {
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }
            });
            if (response.data.message === 'Prompt progress and challenge progress updated successfully.') {
                setIsCompleted(true);
                Toast.show({ type: 'success', text1: 'Success', text2: 'Challenge updated successfully!' });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update challenge' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update challenge progress' });
        }
    };

    const handleProgressChange = (value: string) => {
        if (!promptData) return;
        if (Number(value) > Number(promptData.promptValue)) {
            setError('Progress cannot exceed the target value.');
        } else {
            setError('');
            setProgress(value);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
                <Text style={styles.loadingText}>Loading challenge details...</Text>
            </View>
        );
    }

    if (!promptData) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.noPromptText}>No prompt details available</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
             <KeyboardAvoidingView
                      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 20}
                      style={{ flex: 1, justifyContent: 'flex-end' }}
                    >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>← </Text>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                
                <Text style={styles.title}>Challenge Details</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Challenge</Text>
                    <Text style={styles.description}>{promptData.promptDescription}</Text>
                    
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{promptData.promptType}</Text>
                    </View>

                    {hasQuantifiableTarget ? (
                        <View style={styles.section}>
                            <Text style={styles.label}>Your Progress</Text>
                            <View style={styles.progressBar}>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                                </View>
                                <Text style={styles.percentText}>{progressPercentage.toFixed(0)}%</Text>
                            </View>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    value={progress}
                                    onChangeText={handleProgressChange}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={COLORS.primaryLightGreyHex}
                                />
                                <Text style={styles.divider}>/</Text>
                                <View style={styles.targetBox}>
                                    <Text style={styles.targetText}>{promptData.promptValue}</Text>
                                </View>
                            </View>
                            {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}
                        </View>
                    ) : (
                        <View style={styles.section}>
                            <Text style={styles.label}>Mark as Complete</Text>
                            <TouchableOpacity
    style={styles.checkboxCard}
    activeOpacity={0.8}
    onPress={() => setIsCompleted(!isCompleted)}
>
    <View>
        <Text style={styles.checkboxLabel}>Status</Text>

        <View style={styles.statusRow}>
            <Text style={styles.checkboxStatus}>
                {isCompleted ? 'Completed' : 'Not Completed'}
            </Text>

            <BouncyCheckbox
                size={20}
                fillColor={COLORS.primaryOrangeHex}
                unFillColor={COLORS.secondaryDarkGreyHex}
                isChecked={isCompleted}
                onPress={() => setIsCompleted(!isCompleted)}
                iconStyle={styles.checkboxIcon}
                innerIconStyle={styles.checkboxInnerIcon}
            />
        </View>
    </View>
</TouchableOpacity>
                        </View>
                    )}
                </View>

                {promptData.bookRecommendations && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Book Recommendations</Text>
                        {promptData.bookRecommendations.split(',').map((book, i) => (
                            <View key={i} style={styles.bookItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.bookText}>{book.trim()}</Text>
                            </View>
                        ))}
                        <Text style={styles.note}>💡 Feel free to choose your own books too</Text>
                    </View>
                )}
                <View style={styles.card}>
    <Text style={styles.cardTitle}>Linked Books</Text>
    
    {isLoadingBooks ? (
        <ActivityIndicator size="small" color={COLORS.primaryOrangeHex} />
    ) : linkedBooks.length > 0 ? (
        <View>
            {linkedBooks.map((book, index) => (
                <View key={index} style={styles.linkedBookItem}>
                    <View style={styles.linkedBookInfo}>
                        <Text style={styles.linkedBookId}>Book ID: {book.userBookId}</Text>
                        <Text style={styles.linkedBookDate}>
                            Added: {new Date(book.addedAt).toLocaleDateString()}
                        </Text>
                        {book.isCompleted ? (
                            <Text style={styles.completedBadge}>✓ Completed</Text>
                        ) : null}
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setBookToRemove(book);
                            setShowRemoveConfirm(true);
                        }}
                        style={styles.removeButton}
                    >
                        <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    ) : (
        <Text style={styles.noLinkedBooks}>No books linked yet</Text>
    )}
    
    {!showBookPicker ? (
        <TouchableOpacity
            onPress={() => setShowBookPicker(true)}
            style={styles.linkBookButton}
        >
            <Text style={styles.linkBookButtonText}>+ Link a Book</Text>
        </TouchableOpacity>
    ) : (
        <View>
            <BookPicker
                title="Search and select a book"
                onSelect={({ bookId, userBookId }) => {
                    if (userBookId) {
                        setSelectedBookId(bookId);
                        setSelectedUserBookId(userBookId);
                    } else {
                        Toast.show({
                            type: 'error',
                            text1: 'Error',
                            text2: 'Please select a book from your library'
                        });
                    }
                }}
                selectedBookId={selectedBookId || undefined}
            />
            <TouchableOpacity
                onPress={() => {
                    setShowBookPicker(false);
                    setSelectedBookId(null);
                    setSelectedUserBookId(null);
                    setPendingBook(null);
                }}
                style={styles.cancelButton}
            >
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    )}
</View>
            </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleCompleteChallenge} style={styles.button}>
                    <Text style={styles.buttonText}>Update Progress</Text>
                </TouchableOpacity>
            </View>

             { /*Add Confirmation Modal */}
{showAddConfirm && pendingBook && (
    <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Link Book</Text>
            <Text style={styles.modalMessage}>
                Link this book (ID: {pendingBook.userBookId}) to this prompt?
            </Text>
            <View style={styles.modalButtons}>
                <TouchableOpacity
                    onPress={() => {
                        setShowAddConfirm(false);
                        setPendingBook(null);
                        setSelectedBookId(null);
                        setSelectedUserBookId(null);
                    }}
                    style={[styles.modalButton, styles.modalButtonCancel]}
                >
                    <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleAddBook}
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                >
                    <Text style={styles.modalButtonText}>Confirm</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
)}

{/* Remove Confirmation Modal */}
{showRemoveConfirm && bookToRemove && (
    <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Remove Book</Text>
            <Text style={styles.modalMessage}>
                Remove Book ID: {bookToRemove.userBookId} from this prompt?
            </Text>
            <View style={styles.modalButtons}>
                <TouchableOpacity
                    onPress={() => {
                        setShowRemoveConfirm(false);
                        setBookToRemove(null);
                    }}
                    style={[styles.modalButton, styles.modalButtonCancel]}
                >
                    <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleRemoveBook}
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                >
                    <Text style={styles.modalButtonText}>Remove</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
)}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primaryBlackHex },
    scrollContent: { padding: SPACING.space_20, paddingBottom: 100 },
    centerContainer: { flex: 1, backgroundColor: COLORS.primaryBlackHex, justifyContent: 'center', alignItems: 'center', padding: SPACING.space_32 },
    
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.space_16 },
    backIcon: { color: COLORS.primaryOrangeHex, fontSize: FONTSIZE.size_24, marginRight: SPACING.space_8 },
    backButtonText: { color: COLORS.primaryOrangeHex, fontSize: FONTSIZE.size_16, fontFamily: FONTFAMILY.poppins_medium },
    title: { fontSize: FONTSIZE.size_28, fontFamily: FONTFAMILY.poppins_bold, color: COLORS.primaryWhiteHex, marginBottom: SPACING.space_24 },
    
    card: { backgroundColor: COLORS.primaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_20, padding: SPACING.space_20, marginBottom: SPACING.space_20, borderWidth: 1, borderColor: COLORS.secondaryDarkGreyHex },
    label: { fontSize: FONTSIZE.size_12, fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryLightGreyHex, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.space_8 },
    description: { fontSize: FONTSIZE.size_18, fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryWhiteHex, lineHeight: FONTSIZE.size_24, marginBottom: SPACING.space_16 },
    
    badge: { backgroundColor: COLORS.secondaryDarkGreyHex, paddingHorizontal: SPACING.space_16, paddingVertical: SPACING.space_8, borderRadius: BORDERRADIUS.radius_15, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.primaryOrangeHex, marginBottom: SPACING.space_20 },
    badgeText: { color: COLORS.primaryOrangeHex, fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_semibold },
    
    section: { marginTop: SPACING.space_16 },
    progressBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.space_12, marginVertical: SPACING.space_12 },
    progressBarBg: { flex: 1, height: 12, backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_10, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.primaryGreyHex },
    progressBarFill: { height: '100%', backgroundColor: COLORS.primaryOrangeHex, borderRadius: BORDERRADIUS.radius_10 },
    percentText: { color: COLORS.primaryOrangeHex, fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_bold, minWidth: 45, textAlign: 'right' },
    
    inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.space_12, marginTop: SPACING.space_8 },
    input: { flex: 1, maxWidth: 120, backgroundColor: COLORS.secondaryDarkGreyHex, color: COLORS.primaryWhiteHex, borderRadius: BORDERRADIUS.radius_15, paddingHorizontal: SPACING.space_16, paddingVertical: SPACING.space_12, fontSize: FONTSIZE.size_20, fontFamily: FONTFAMILY.poppins_semibold, textAlign: 'center', borderWidth: 2, borderColor: COLORS.primaryOrangeHex },
    divider: { color: COLORS.primaryLightGreyHex, fontSize: FONTSIZE.size_24 },
    targetBox: { backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_15, paddingHorizontal: SPACING.space_16, paddingVertical: SPACING.space_12, borderWidth: 1, borderColor: COLORS.primaryGreyHex, minWidth: 80 },
    targetText: { color: COLORS.secondaryLightGreyHex, fontSize: FONTSIZE.size_20, fontFamily: FONTFAMILY.poppins_semibold, textAlign: 'center' },
    errorText: { color: COLORS.primaryRedHex, fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_medium, textAlign: 'center', marginTop: SPACING.space_12 },
    
    checkboxCard: { backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_15, padding: SPACING.space_16, borderWidth: 2, borderColor: COLORS.primaryGreyHex, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.space_8 },
    checkboxLabel: { fontSize: FONTSIZE.size_12, fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryLightGreyHex, marginBottom: SPACING.space_4 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.space_4, gap: SPACING.space_8, },
    checkboxStatus: { fontSize: FONTSIZE.size_16, fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryWhiteHex },
    checkboxIcon: { borderRadius: 4 },
    checkboxInnerIcon: { borderRadius: 4 },
    
    cardTitle: { fontSize: FONTSIZE.size_18, fontFamily: FONTFAMILY.poppins_bold, color: COLORS.primaryWhiteHex, marginBottom: SPACING.space_16, paddingBottom: SPACING.space_12, borderBottomWidth: 1, borderBottomColor: COLORS.primaryGreyHex },
    bookItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_10, padding: SPACING.space_12, marginBottom: SPACING.space_12 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primaryOrangeHex, marginRight: SPACING.space_12 },
    bookText: { flex: 1, color: COLORS.primaryWhiteHex, fontSize: FONTSIZE.size_16, fontFamily: FONTFAMILY.poppins_medium },
    note: { fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_regular, color: COLORS.secondaryLightGreyHex, textAlign: 'center', fontStyle: 'italic', marginTop: SPACING.space_16, backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_10, padding: SPACING.space_12 },
    
    buttonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.space_20, backgroundColor: COLORS.primaryBlackHex, borderTopWidth: 1, borderTopColor: COLORS.primaryDarkGreyHex },
    button: { backgroundColor: COLORS.primaryOrangeHex, paddingVertical: SPACING.space_16, borderRadius: BORDERRADIUS.radius_20, alignItems: 'center' },
    buttonText: { color: COLORS.primaryWhiteHex, fontSize: FONTSIZE.size_18, fontFamily: FONTFAMILY.poppins_semibold },
    
    loadingText: { fontSize: FONTSIZE.size_16, fontFamily: FONTFAMILY.poppins_medium, color: COLORS.secondaryLightGreyHex, marginTop: SPACING.space_16 },
    errorIcon: { fontSize: 60, marginBottom: SPACING.space_16 },
    noPromptText: { fontSize: FONTSIZE.size_18, fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryWhiteHex, textAlign: 'center', marginBottom: SPACING.space_24 },

    linkedBookItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
    marginBottom: SPACING.space_8,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
},
linkedBookInfo: {
    flex: 1,
},
linkedBookId: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    marginBottom: SPACING.space_4,
},
linkedBookDate: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
},
completedBadge: {
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_semibold,
    marginTop: SPACING.space_4,
},
removeButton: {
    backgroundColor: COLORS.primaryRedHex,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
},
removeButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_semibold,
},
noLinkedBooks: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    textAlign: 'center',
    marginVertical: SPACING.space_16,
},
linkBookButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_15,
    alignItems: 'center',
    marginTop: SPACING.space_12,
},
linkBookButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
},
cancelButton: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_15,
    alignItems: 'center',
    marginTop: SPACING.space_12,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
},
cancelButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
},
modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
},
modalContent: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
},
modalTitle: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
    marginBottom: SPACING.space_12,
    textAlign: 'center',
},
modalMessage: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    marginBottom: SPACING.space_24,
    textAlign: 'center',
    lineHeight: FONTSIZE.size_24,
},
modalButtons: {
    flexDirection: 'row',
    gap: SPACING.space_12,
},
modalButton: {
    flex: 1,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_15,
    alignItems: 'center',
},
modalButtonCancel: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
},
modalButtonConfirm: {
    backgroundColor: COLORS.primaryOrangeHex,
},
modalButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
},
modalButtonTextCancel: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
},
});

export default ChallengePromptDetailsScreen;