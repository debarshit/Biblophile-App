import React, { useRef, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING } from '../../../theme/theme';
import { CommentInputForm } from '../components/CommentInputForm';
import ReadalongCheckpointDetails, { type ReadalongCheckpointDetailsRef } from '../components/ReadalongCheckpointDetails';
import { useRoute, type RouteProp } from '@react-navigation/native';
import HeaderBar from '../../../components/HeaderBar';
import { useTheme } from '../../../contexts/ThemeContext';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

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
    const { COLORS } = useTheme();
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);

    const handleCommentSubmit = useCallback(async (text: string, progressPercentage: number) => {
        if (checkpointDetailsRef.current) {
            await checkpointDetailsRef.current.submitComment(text, progressPercentage);
        }
    }, []);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <HeaderBar title="Checkpoint Discussion" showBackButton={true} />
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" bottomOffset={16}>
            <ReadalongCheckpointDetails
                ref={checkpointDetailsRef}
                readalong={readalong}
                currentUser={currentUser}
                isMember={isMember}
                isHost={isHost}
                checkpointId={checkpointId}
                checkpointPrompt={checkpointPrompt}
            />
            </KeyboardAwareScrollView>

            {isMember && (
                <KeyboardStickyView >
                    <View style={styles.fixedCommentInputContainer}>
                        <CommentInputForm
                            onSubmit={handleCommentSubmit}
                            isLoading={false}
                            showPageInput
                            initialPageNumber={currentUser.progressPercentage}
                            placeholder="Share your thoughts..."
                        />
                    </View>
                </KeyboardStickyView>
            )}
        </SafeAreaView>
    );
};

const createStyles = (COLORS) => StyleSheet.create({
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
    },
});

export default ReadalongCheckpointDiscussion;