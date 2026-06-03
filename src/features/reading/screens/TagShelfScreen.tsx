import React, { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../../../components/HeaderBar';
import { BookGrid } from '../components/BookGrid';
import { SPACING, FONTFAMILY, FONTSIZE } from '../../../theme/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTagShelf } from '../hooks/useTagShelf';
import { useCollabTagShelf } from '../hooks/useCollabTagShelf';
import TabBar from '../components/collaborativeList/TabBar';
import MembersTab from '../components/collaborativeList/MembersTab';
import ActivityTab from '../components/collaborativeList/ActivityTab';
import CollabSettingsModal from '../components/collaborativeList/CollabSettingsModal';
import EnableCollabModal from '../components/collaborativeList/EnableCollabModal';
import { useShelfUser } from '../hooks/useShelfUser';

const APP_BASE_URL = 'https://biblophile.com';

interface Props {
    route: any;
    navigation: any;
}

const TagShelfScreen: React.FC<Props> = ({ route, navigation }) => {
    const { tagId, tagName, userData, username } = route.params ?? {};

    const { COLORS } = useTheme();
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);

    // Modals visibility state
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showEnableCollabConfirm, setShowEnableCollabConfirm] = useState(false);
    const [showCollabSettings, setShowCollabSettings] = useState(false);

    const {
        accessToken,
        resolvedUserData,
        isFetchingUser,
    } = useShelfUser({
        userData,
        username,
    });

    // 1. Collaboration metadata & actions orchestration hook
        const collab = useCollabTagShelf({
        tagId,
        accessToken,
    });

    // 2. Core shelf data fetching hook
    const shelf = useTagShelf({
        tagId,
        userData: resolvedUserData,
        username,
        isCollaborative: collab.isCollaborative,
        metaLoaded: collab.metaLoaded,
        accessToken,
    });

    const {
        books,
        loading,
        currentVisibility,
        loadMore,
        updatePrivacy,
        refreshBooks,
    } = shelf;

    const {
        activeTab,
        setActiveTab,
        isCollaborative,
        listSettings,
        myMembership,
        enablingCollab,
        enableCollabError,
        enableCollaboration,
        saveSettings,
        joinRequest,
        cancelRequest,
        setMyMembership,
    } = collab;

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

    const handleEnableCollabConfirm = async () => {
        const success = await enableCollaboration();
        if (success) {
            setShowEnableCollabConfirm(false);
            setShowCollabSettings(true);
            refreshBooks();
        }
    };

    // Header Right Actions matching website layout policies
    const headerRight = useMemo(() => (
        <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.headerIconBtn}>
                <Ionicons name="share-social-outline" size={22} color={COLORS.primaryWhiteHex} />
            </TouchableOpacity>

            {resolvedUserData?.isPageOwner && (
                <>
                    {!isCollaborative ? (
                        <TouchableOpacity
                            onPress={() => setShowEnableCollabConfirm(true)}
                            style={styles.headerIconBtn}
                        >
                            <Ionicons name="people-outline" size={20} color={COLORS.primaryWhiteHex} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setShowCollabSettings(true)}
                            style={styles.headerIconBtn}
                        >
                            <Ionicons name="settings-outline" size={20} color={COLORS.primaryWhiteHex} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={() => setShowPrivacyModal(true)}
                        style={styles.headerIconBtn}
                    >
                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.primaryWhiteHex} />
                    </TouchableOpacity>
                </>
            )}
        </View>
    ), [resolvedUserData?.isPageOwner, isCollaborative, COLORS.primaryWhiteHex, styles]);

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

            {/* Collaborative tag badge display */}
            {isCollaborative && (
                <View style={styles.collabBadge}>
                    <Ionicons name="people-outline" size={12} color={COLORS.secondaryLightGreyHex} />
                    <Text style={styles.collabBadgeText}>Collaborative list</Text>
                </View>
            )}

            {/* Tab navigation rendered exclusively if list is collaborative */}
            {isCollaborative && (
                <TabBar active={activeTab} onChange={setActiveTab} colors={COLORS} />
            )}

            {/* Books Display Tab */}
            {activeTab === 'books' && (
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
            )}

            {/* Members Operations Tab */}
            {activeTab === 'members' && isCollaborative && (
                <View style={styles.tabContent}>
                    <MembersTab
                        tagId={tagId}
                        accessToken={accessToken}
                        isOwner={!!resolvedUserData?.isPageOwner}
                        currentUserId={Number(resolvedUserData?.userId)}
                        joinPolicy={listSettings.joinPolicy}
                        myMembership={myMembership}
                        onJoinRequest={joinRequest}
                        onCancelRequest={cancelRequest}
                        onMembershipChange={setMyMembership}
                        colors={COLORS}
                    />
                </View>
            )}

            {/* Audit / Activity Log Tab */}
            {activeTab === 'activity' && isCollaborative && (
                <View style={styles.tabContent}>
                    <ActivityTab tagId={tagId} accessToken={accessToken} colors={COLORS} />
                </View>
            )}

            {/* Management & Administration Modals */}
            <EnableCollabModal
                visible={showEnableCollabConfirm}
                saving={enablingCollab}
                error={enableCollabError}
                tagName={tagName}
                onClose={() => setShowEnableCollabConfirm(false)}
                onConfirm={handleEnableCollabConfirm}
                colors={COLORS}
            />

            <CollabSettingsModal
                visible={showCollabSettings}
                settings={listSettings}
                onClose={() => setShowCollabSettings(false)}
                onSave={saveSettings}
                colors={COLORS}
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
            fontFamily: FONTFAMILY.poppins_medium,
            fontSize: FONTSIZE.size_14,
        },
        collabBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginBottom: SPACING.space_8,
        },
        collabBadgeText: {
            color: COLORS.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
        },
        tabContent: {
            flex: 1,
        },
    });

export default TagShelfScreen;