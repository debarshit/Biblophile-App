import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDERRADIUS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';
import type { Member, Membership, PendingRow } from '../../types';

interface Props {
    tagId: string;
    accessToken: string;
    isOwner: boolean;
    currentUserId: number;
    joinPolicy: 'invite_only' | 'request_only' | 'open';
    myMembership: Membership | null;
    onJoinRequest: () => Promise<void>;
    onCancelRequest: () => Promise<void>;
    onMembershipChange: (membership: Membership | null) => void;
    colors: any;
}

const MembersTab: React.FC<Props> = ({
    tagId,
    accessToken,
    isOwner,
    currentUserId,
    joinPolicy,
    myMembership,
    onJoinRequest,
    onCancelRequest,
    onMembershipChange,
    colors,
}) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [pending, setPending] = useState<PendingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteUserName, setInviteUserName] = useState('');
    const [inviting, setInviting] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    const s = useMemo(() => createStyles(colors), [colors]);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await instance.get(requests.getListMembers(tagId), {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setMembers(res?.data?.data?.members ?? []);
        } catch {
            setMembers([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken, tagId]);

    const fetchPending = useCallback(async () => {
        try {
            const res = await instance.get(requests.getPendingRequests(tagId), {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setPending(res?.data?.data?.pending ?? []);
        } catch {
            setPending([]);
        }
    }, [accessToken, tagId]);

    useEffect(() => {
        fetchMembers();
        if (isOwner) fetchPending();
    }, [fetchMembers, fetchPending, isOwner]);

    const handleInvite = async () => {
        if (!inviteUserName.trim()) return;
        setInviting(true);
        setInviteError('');
        try {
            const userRes = await instance.get(
                requests.fetchUserDataFromUsername(inviteUserName.trim()),
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const targetUserId = userRes.data.data.userId;
            await instance.post(
                requests.inviteMember(tagId),
                { targetUserId },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setInviteUserName('');
            fetchMembers();
            fetchPending();
        } catch (e: any) {
            setInviteError(e?.response?.data?.message || 'User not found');
        } finally {
            setInviting(false);
        }
    };

    const respondToRequest = async (requestUserId: number, accept: boolean) => {
        try {
            await instance.patch(
                requests.respondToJoinRequest(tagId, requestUserId.toString()),
                { accept },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            fetchPending();
            fetchMembers();
        } catch (e) {
            console.error('respondToRequest error', e);
        }
    };

    const respondToInvite = async (accept: boolean) => {
        try {
            await instance.patch(
                requests.respondToInvite(tagId),
                { accept },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            onMembershipChange(
                accept
                    ? { role: myMembership?.role || 'viewer', status: 'accepted', initiatedBy: 'owner' }
                    : null
            );
            fetchMembers();
        } catch (e) {
            console.error('respondToInvite error', e);
        }
    };

    const removeMember = async (targetUserId: number) => {
        try {
            await instance.delete(
                requests.removeMember(tagId, targetUserId.toString()),
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (targetUserId === currentUserId) onMembershipChange(null);
            fetchMembers();
        } catch (e) {
            console.error('removeMember error', e);
        }
    };

    const updateRole = async (targetUserId: number, role: 'editor' | 'viewer') => {
        try {
            await instance.patch(
                requests.updateMemberRole(tagId, targetUserId.toString()),
                { role },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            fetchMembers();
        } catch (e) {
            console.error('updateRole error', e);
        }
    };

    //menu handlers
    const openMemberMenu = (member: Member) => {
        setSelectedMember(member);
        setMenuVisible(true);
    };

    const closeMemberMenu = () => {
        setMenuVisible(false);
        setSelectedMember(null);
    };

    const handleRoleChange = async (
        role: 'editor' | 'viewer',
        ) => {
        if (!selectedMember) return;

        await updateRole(selectedMember.userId, role);
        closeMemberMenu();
        };

        const handleRemoveMember = async () => {
        if (!selectedMember) return;

        await removeMember(selectedMember.userId);
        closeMemberMenu();
    };

    const canRequestJoin = !isOwner && !myMembership && joinPolicy !== 'invite_only';
    const hasPendingInvite =
        myMembership?.status === 'pending' && myMembership?.initiatedBy === 'owner';
    const hasOwnPendingRequest =
        myMembership?.status === 'pending' && myMembership?.initiatedBy !== 'owner';

    return (
        <ScrollView style={{paddingHorizontal: SPACING.space_16}} showsVerticalScrollIndicator={false}>
            {/* Join / cancel CTAs */}
            {canRequestJoin && (
                <TouchableOpacity style={s.primaryBtn} onPress={onJoinRequest}>
                    <Text style={s.primaryBtnText}>
                        {joinPolicy === 'open' ? '+ Join list' : 'Request to join'}
                    </Text>
                </TouchableOpacity>
            )}

            {hasPendingInvite && (
                <View style={s.inviteCard}>
                    <Text style={s.inviteCardTitle}>You have an invite to join this list</Text>
                    <View style={s.inviteCardRow}>
                        <TouchableOpacity
                            style={[s.primaryBtn, s.flex1, s.noMarginBottom]}
                            onPress={() => respondToInvite(true)}
                        >
                            <Text style={s.primaryBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.ghostBtn, s.flex1]}
                            onPress={() => respondToInvite(false)}
                        >
                            <Text style={s.ghostBtnText}>Decline</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {hasOwnPendingRequest && (
                <TouchableOpacity
                    style={[s.ghostBtn, { marginBottom: SPACING.space_16 }]}
                    onPress={onCancelRequest}
                >
                    <Text style={s.ghostBtnText}>Cancel join request</Text>
                </TouchableOpacity>
            )}

            {/* Pending requests (owner only) */}
            {isOwner && pending.length > 0 && (
                <View style={{ marginBottom: SPACING.space_16 }}>
                    <Text style={s.sectionLabel}>PENDING REQUESTS</Text>
                    {pending.map(row => (
                        <View key={row.id} style={s.memberRow}>
                            <Image
                                source={{ uri: row.userProfilePic }}
                                style={s.avatar}
                                resizeMode="cover"
                            />
                            <View style={s.memberInfo}>
                                <Text style={s.memberName}>{row.name}</Text>
                                <Text style={s.memberMeta}>
                                    @{row.userName} ·{' '}
                                    {row.initiatedBy === 'member' ? 'wants to join' : 'invite sent'}
                                </Text>
                            </View>
                            {row.initiatedBy === 'member' && (
                                <View style={s.actionRow}>
                                    <TouchableOpacity
                                        style={s.iconBtn}
                                        onPress={() => respondToRequest(row.userId, true)}
                                    >
                                        <Ionicons
                                            name="checkmark"
                                            size={15}
                                            color={colors.primaryOrangeHex}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={s.iconBtn}
                                        onPress={() => respondToRequest(row.userId, false)}
                                    >
                                        <Ionicons
                                            name="close"
                                            size={15}
                                            color={colors.secondaryLightGreyHex}
                                        />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}

            {/* Invite input (owner only) */}
            {isOwner && (
                <View style={{ marginBottom: SPACING.space_16 }}>
                    <Text style={s.sectionLabel}>INVITE A FRIEND</Text>
                    <View style={s.inviteInputRow}>
                        <TextInput
                            value={inviteUserName}
                            onChangeText={setInviteUserName}
                            placeholder="@username"
                            placeholderTextColor={colors.secondaryLightGreyHex}
                            onSubmitEditing={handleInvite}
                            style={s.textInput}
                        />
                        <TouchableOpacity
                            style={[s.inviteBtn, inviting && { opacity: 0.7 }]}
                            onPress={handleInvite}
                            disabled={inviting}
                        >
                            <Text style={s.inviteBtnText}>{inviting ? '...' : 'Invite'}</Text>
                        </TouchableOpacity>
                    </View>
                    {!!inviteError && <Text style={s.errorText}>{inviteError}</Text>}
                </View>
            )}

            <View style={s.divider} />

            {/* Members list */}
            {loading ? (
                <View style={s.centered}>
                    <Text style={s.mutedText}>Loading members…</Text>
                </View>
            ) : members.length === 0 ? (
                <Text style={s.emptyText}>No members yet</Text>
            ) : (
                members.map(m => (
                    <View key={m.userId} style={s.memberRow}>
                        <Image
                            source={{ uri: m.userProfilePic }}
                            style={s.avatar}
                            resizeMode="cover"
                        />
                        <View style={s.memberInfo}>
                            <Text style={s.memberName}>{m.name}</Text>
                            <Text style={s.memberMeta}>@{m.userName} · {m.role}</Text>
                        </View>
                        {isOwner && m.role !== 'owner' && (
                            <TouchableOpacity
                                style={s.iconBtn}
                                onPress={() => openMemberMenu(m)}
                            >
                                <Ionicons
                                name="ellipsis-vertical"
                                size={16}
                                color={colors.secondaryLightGreyHex}
                                />
                            </TouchableOpacity>
                        )}
                        {!isOwner && m.userId === currentUserId && (
                            <TouchableOpacity
                                style={s.ghostPill}
                                onPress={() => removeMember(currentUserId)}
                            >
                                <Text style={s.ghostPillText}>Leave</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))
            )}
            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={closeMemberMenu}
                >
                <Pressable
                    style={s.modalBackdrop}
                    onPress={closeMemberMenu}
                >
                    <Pressable
                    style={s.menuSheet}
                    onPress={() => {}}
                    >
                    <Text style={s.menuTitle}>
                        {selectedMember?.name}
                    </Text>

                    <Text style={s.menuSubtitle}>
                        Current role: {selectedMember?.role}
                    </Text>

                    {selectedMember?.role !== 'viewer' && (
                        <TouchableOpacity
                        style={s.menuItem}
                        onPress={() =>
                            handleRoleChange('viewer')
                        }
                        >
                        <Text style={s.menuItemText}>
                            Change to Viewer
                        </Text>
                        </TouchableOpacity>
                    )}

                    {selectedMember?.role !== 'editor' && (
                        <TouchableOpacity
                        style={s.menuItem}
                        onPress={() =>
                            handleRoleChange('editor')
                        }
                        >
                        <Text style={s.menuItemText}>
                            Change to Editor
                        </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={s.menuItem}
                        onPress={handleRemoveMember}
                    >
                        <Text style={s.removeText}>
                        Remove Member
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={s.menuItem}
                        onPress={closeMemberMenu}
                    >
                        <Text style={s.menuCancelText}>
                        Cancel
                        </Text>
                    </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </ScrollView>
        
    );
};

const createStyles = (colors: any) =>
    StyleSheet.create({
        primaryBtn: {
            backgroundColor: colors.primaryOrangeHex,
            padding: SPACING.space_12,
            borderRadius: BORDERRADIUS.radius_10,
            alignItems: 'center',
            marginBottom: SPACING.space_16,
        },
        primaryBtnText: {
            color: '#fff',
            fontFamily: FONTFAMILY.poppins_semibold,
            fontSize: FONTSIZE.size_14,
        },
        ghostBtn: {
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            padding: SPACING.space_12,
            borderRadius: BORDERRADIUS.radius_10,
            alignItems: 'center',
        },
        ghostBtnText: {
            color: colors.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_medium,
            fontSize: FONTSIZE.size_14,
        },
        flex1: { flex: 1 },
        noMarginBottom: { marginBottom: 0 },
        inviteCard: {
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: BORDERRADIUS.radius_10,
            padding: SPACING.space_12,
            marginBottom: SPACING.space_16,
        },
        inviteCardTitle: {
            color: '#fff',
            fontFamily: FONTFAMILY.poppins_semibold,
            fontSize: FONTSIZE.size_12,
            marginBottom: SPACING.space_8,
        },
        inviteCardRow: { flexDirection: 'row', gap: SPACING.space_8 },
        sectionLabel: {
            color: colors.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_medium,
            fontSize: FONTSIZE.size_12,
            marginBottom: SPACING.space_8,
        },
        memberRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: SPACING.space_10,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.05)',
            gap: SPACING.space_10,
        },
        avatar: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.1)',
        },
        memberInfo: { flex: 1, minWidth: 0 },
        memberName: {
            color: '#fff',
            fontFamily: FONTFAMILY.poppins_semibold,
            fontSize: FONTSIZE.size_12,
        },
        memberMeta: {
            color: colors.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
        },
        actionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.space_4 },
        iconBtn: {
            width: 30,
            height: 30,
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.07)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        ghostPill: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
        },
        ghostPillText: {
            color: colors.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
        },
        inviteInputRow: { flexDirection: 'row', gap: SPACING.space_8 },
        textInput: {
            flex: 1,
            backgroundColor: 'rgba(255,255,255,0.07)',
            borderRadius: BORDERRADIUS.radius_10,
            padding: SPACING.space_8,
            color: '#fff',
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
        },
        inviteBtn: {
            backgroundColor: colors.primaryOrangeHex,
            paddingHorizontal: 14,
            borderRadius: BORDERRADIUS.radius_10,
            justifyContent: 'center',
        },
        inviteBtnText: {
            color: '#fff',
            fontFamily: FONTFAMILY.poppins_semibold,
            fontSize: FONTSIZE.size_12,
        },
        errorText: {
            color: '#e05252',
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
            marginTop: 4,
        },
        divider: {
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.08)',
            marginBottom: SPACING.space_16,
        },
        centered: { alignItems: 'center', paddingVertical: SPACING.space_20 },
        mutedText: {
            color: colors.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
        },
        emptyText: {
            color: colors.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
            textAlign: 'center',
            paddingVertical: SPACING.space_20,
        },
        modalBackdrop: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'flex-end',
        },

        menuSheet: {
        backgroundColor: colors.primaryBlackHex,
        padding: SPACING.space_20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        },

    menuTitle: {
    color: '#fff',
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    marginBottom: 4,
    },

    menuSubtitle: {
    color: colors.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    marginBottom: SPACING.space_16,
    },

    menuItem: {
    paddingVertical: SPACING.space_12,
    },

    menuItemText: {
    color: '#fff',
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    },

    removeText: {
    color: '#E05252',
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    },

    menuCancelText: {
    color: colors.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    },
});

export default MembersTab;