import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../../theme/theme';
import { CommentInputForm } from '../components/CommentInputForm';
import ReadalongCheckpointDetails, { type ReadalongCheckpointDetailsRef } from '../components/ReadalongCheckpointDetails';
import { useRoute, type RouteProp } from '@react-navigation/native';
import HeaderBar from '../../../components/HeaderBar';

interface Host {
    name: string;
    userId: string;
}

interface CurrentUser {
    userId: string;
    readingStatus: string;
    progressPercentage: number;
}

interface Readalong {
    readalongId: number;
    bookId: string;
    book_title: string;
    book_photo: string;
    book_pages: number;
    readalong_description: string;
    startDate: string;
    endDate: string;
    maxMembers: number;
    members: number;
    host: Host;
}

type ReadalongCheckpointDetailsScreenRouteProp = RouteProp<{
    params: {
        readalong: Readalong;
        currentUser: CurrentUser;
        isMember: boolean;
        isHost: boolean;
        checkpointId: string;
        checkpointPrompt: string;
    };
}>;

const ReadalongCheckpointDiscussion: React.FC = () => {
    const route = useRoute<ReadalongCheckpointDetailsScreenRouteProp>();
    const { readalong, currentUser, isMember, isHost, checkpointId, checkpointPrompt } = route.params;

    const checkpointDetailsRef = useRef<ReadalongCheckpointDetailsRef>(null);

    const handleCommentSubmit = useCallback(async (text: string, progressPercentage: number) => {
        if (checkpointDetailsRef.current) {
            await checkpointDetailsRef.current.submitComment(text, progressPercentage);
        }
    }, []);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <HeaderBar title="Checkpoint Discussion" showBackButton={true} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ReadalongCheckpointDetails
                    ref={checkpointDetailsRef}
                    readalong={readalong}
                    currentUser={currentUser}
                    isMember={isMember}
                    isHost={isHost}
                    checkpointId={checkpointId}
                    checkpointPrompt={checkpointPrompt}
                />

                {/* Fixed Comment Input at Bottom */}
                {isMember && (
                    <View style={styles.fixedCommentInputContainer}>
                        <CommentInputForm
                            onSubmit={handleCommentSubmit}
                            isLoading={false}
                            showPageInput
                            initialPageNumber={currentUser.progressPercentage}
                            placeholder="Share your thoughts..."
                        />
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primaryBlackHex,
    },
    fixedCommentInputContainer: {
        backgroundColor: COLORS.primaryBlackHex,
        borderTopWidth: 1,
        borderTopColor: COLORS.primaryGreyHex,
        paddingHorizontal: SPACING.space_15,
        paddingVertical: SPACING.space_10,
        paddingBottom: Platform.OS === 'ios' ? SPACING.space_10 : SPACING.space_15,
    },
});

export default ReadalongCheckpointDiscussion;