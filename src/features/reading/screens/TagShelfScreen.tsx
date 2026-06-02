import React, { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../../../components/HeaderBar';
import { BookGrid } from '../components/BookGrid';
import { SPACING } from '../../../theme/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTagShelf } from '../hooks/useTagShelf';

const APP_BASE_URL = 'https://biblophile.com';

interface Props {
    route: any;
    navigation: any;
}

/**
 * TagShelfScreen
 *
 * Currently mirrors StatusShelfScreen's behaviour for tag-based shelves.
 * The collaborative structure (shared tags, multi-user membership, etc.)
 * will be built out here without touching StatusShelfScreen.
 */
const TagShelfScreen: React.FC<Props> = ({ route, navigation }) => {
    const { tagId, tagName, userData, username } = route.params ?? {};

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
    } = useTagShelf({
        tagId,
        userData,
        username,
    });

    const handleShare = async () => {
        if (!resolvedUserData) return;
        try {
            const url = `${APP_BASE_URL}/profile/${resolvedUserData.userName}/tags/${tagId}/${encodeURIComponent(tagName ?? '')}`;
            await Share.share({
                title: `${resolvedUserData.userName}'s ${tagName} shelf`,
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
                title={tagName ?? ''}
                rightComponent={headerRight}
            />

            {/* TODO: Collaborative tag UI goes here — member avatars, join/leave, activity feed */}

            <BookGrid
                books={books}
                loading={loading}
                isPageOwner={resolvedUserData?.isPageOwner}
                emptyMessage="No books tagged here yet"
                listHeader={null}
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

export default TagShelfScreen;