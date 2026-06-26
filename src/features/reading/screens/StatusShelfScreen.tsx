import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../../../components/HeaderBar';
import ReadingQueueSection from '../components/ReadingQueueSection';
import { BookGrid } from '../components/BookGrid';
import { useStatusShelf } from '../hooks/useStatusShelf';
import { SPACING } from '../../../theme/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS_SLUG_MAP: Record<string, string> = {
    'Currently reading': 'currently-reading',
    'To be read': 'to-be-read',
    'Did not finish': 'did-not-finish',
    'Read': 'read',
};

const SLUG_STATUS_MAP: Record<string, string> = {
    'currently-reading': 'Currently reading',
    'to-be-read': 'To be read',
    'did-not-finish': 'Did not finish',
    'read': 'Read',
};

const EMPTY_MESSAGES: Record<string, string> = {
    'Read': 'No books marked as read yet',
    'Currently reading': 'No books currently being read',
    'To be read': 'No books in your reading list',
    'Did not finish': 'No books marked as did not finish',
};

const APP_BASE_URL = 'https://biblophile.com';

interface Props {
    route: any;
    navigation: any;
}

const StatusShelfScreen: React.FC<Props> = ({ route, navigation }) => {
    const { status, statusSlug, userData, username } = route.params ?? {};

    // Resolve the canonical status string from whichever param was passed
    const statusString: string = status ?? SLUG_STATUS_MAP[statusSlug] ?? statusSlug;

    const { COLORS } = useTheme();
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);

    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    const {
        books,
        loading,
        resolvedUserData,
        isFetchingUser,
        currentVisibility,
        loadMore,
        updatePrivacy,
        accessToken,
    } = useStatusShelf({
        status: statusString,
        userData,
        username,
    });

    const handleShare = async () => {
        if (!resolvedUserData) return;
        try {
            const slug =
                statusSlug ??
                STATUS_SLUG_MAP[statusString] ??
                statusString.toLowerCase().replace(/\s+/g, '-');
            const url = `${APP_BASE_URL}/profile/${resolvedUserData.userName}/${slug}`;
            await Share.share({
                title: `${resolvedUserData.userName}'s ${status} shelf`,
                message: `Check out this reading shelf: ${url}`,
            });
        } catch (error: any) {
            if (error?.message !== 'User did not share') {
                Alert.alert('Could not share', 'Please try again.');
            }
        }
    };

    const headerRight = useMemo(
        () => (
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={handleShare} style={styles.headerIconBtn}>
                    <Ionicons name="share-social-outline" size={22} color={COLORS.primaryWhiteHex} />
                </TouchableOpacity>
                {resolvedUserData?.isPageOwner && (
                    <TouchableOpacity
                        onPress={() => setShowPrivacyModal(true)}
                        style={styles.headerIconBtn}
                    >
                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.primaryWhiteHex} />
                    </TouchableOpacity>
                )}
            </View>
        ),
        [resolvedUserData?.isPageOwner, COLORS.primaryWhiteHex]
    );

    const listHeader = useMemo(
        () =>
            resolvedUserData?.isPageOwner ? (
                <ReadingQueueSection
                    status={statusString}
                    userData={resolvedUserData}
                    navigation={navigation}
                    accessToken={accessToken}
                />
            ) : null,
        [resolvedUserData?.isPageOwner, statusString]
    );

    if (isFetchingUser) {
        return (
            <SafeAreaView style={styles.container}>
                <HeaderBar showBackButton title="" />
                <View style={styles.centered}>
                    <Text style={styles.loadingText}>Loading shelf…</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <HeaderBar
                showBackButton
                title={statusString ?? ''}
                rightComponent={headerRight}
            />
            <BookGrid
                books={books}
                loading={loading}
                isPageOwner={resolvedUserData?.isPageOwner}
                emptyMessage={EMPTY_MESSAGES[statusString] ?? 'No books found for this status'}
                listHeader={listHeader}
                showPrivacyModal={showPrivacyModal}
                currentVisibility={currentVisibility}
                onClosePrivacyModal={() => setShowPrivacyModal(false)}
                onSelectVisibility={(v) => {
                    updatePrivacy(v);
                    setShowPrivacyModal(false);
                }}
                onEndReached={loadMore}
                navigation={navigation}
            />
        </SafeAreaView>
    );
};

const createStyles = (COLORS: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: COLORS.primaryDarkGreyHex,
            paddingHorizontal: SPACING.space_16,
            paddingTop: SPACING.space_16,
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.space_8,
        },
        headerIconBtn: {
            padding: SPACING.space_4,
        },
        loadingText: {
            color: COLORS.primaryWhiteHex,
        },
    });

export default StatusShelfScreen;