import React, { useMemo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDERRADIUS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';

interface Props {
    visible: boolean;
    saving: boolean;
    error?: string;
    tagName?: string;
    onClose: () => void;
    onConfirm: () => void;
    colors: any;
}

const EnableCollabModal: React.FC<Props> = ({
    visible,
    saving,
    error,
    tagName,
    onClose,
    onConfirm,
    colors,
}) => {
    const s = useMemo(() => createStyles(colors), [colors]);

    return (
        <Modal visible={visible} transparent animationType="slide">
            <TouchableOpacity
                style={s.overlay}
                activeOpacity={1}
                onPress={saving ? undefined : onClose}
            >
                <TouchableOpacity activeOpacity={1} style={s.sheet}>
                    <View style={s.handle} />
                    <Text style={s.title}>Make this collaborative?</Text>

                    <View style={s.iconRow}>
                        <View style={s.iconBox}>
                            <Ionicons
                                name="people-outline"
                                size={18}
                                color={colors.primaryOrangeHex}
                            />
                        </View>
                        <View style={s.iconMeta}>
                            <Text style={s.iconTitle}>
                                {tagName ?? 'This tag'} will become a shared list
                            </Text>
                            <Text style={s.iconSubtitle}>
                                Invite people, review join requests, and change member roles later.
                            </Text>
                        </View>
                    </View>

                    <View style={s.infoBox}>
                        <Text style={s.infoText}>
                            New collaborative lists start as members-only and invite-only. You can
                            adjust discovery, book visibility, member visibility, and default roles
                            from list settings after enabling.
                        </Text>
                    </View>

                    {!!error && <Text style={s.errorText}>{error}</Text>}

                    <View style={s.btnRow}>
                        <TouchableOpacity
                            style={[s.ghostBtn, saving && { opacity: 0.7 }]}
                            onPress={onClose}
                            disabled={saving}
                        >
                            <Text style={s.ghostBtnText}>Not now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.confirmBtn, saving && { opacity: 0.7 }]}
                            onPress={onConfirm}
                            disabled={saving}
                        >
                            <Text style={s.confirmBtnText}>
                                {saving ? 'Enabling…' : 'Yes, enable'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const createStyles = (colors: any) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        sheet: {
            backgroundColor: colors.primaryDarkGreyHex,
            borderTopLeftRadius: BORDERRADIUS.radius_20,
            borderTopRightRadius: BORDERRADIUS.radius_20,
            padding: SPACING.space_20,
        },
        handle: {
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignSelf: 'center',
            marginBottom: SPACING.space_16,
        },
        title: {
            color: colors.primaryWhiteHex,
            fontFamily: FONTFAMILY.poppins_semibold,
            fontSize: FONTSIZE.size_16,
            marginBottom: SPACING.space_16,
        },
        iconRow: {
            flexDirection: 'row',
            gap: SPACING.space_10,
            marginBottom: SPACING.space_16,
        },
        iconBox: {
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: 'rgba(209,120,66,0.14)',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        iconMeta: { flex: 1 },
        iconTitle: {
            color: colors.primaryWhiteHex,
            fontFamily: FONTFAMILY.poppins_semibold,
            fontSize: FONTSIZE.size_14,
        },
        iconSubtitle: {
            color: colors.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
            marginTop: 2,
        },
        infoBox: {
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: BORDERRADIUS.radius_10,
            padding: SPACING.space_12,
            marginBottom: SPACING.space_16,
        },
        infoText: {
            color: colors.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
            lineHeight: 20,
        },
        errorText: {
            color: '#e05252',
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
            marginBottom: SPACING.space_8,
        },
        btnRow: { flexDirection: 'row', gap: SPACING.space_10 },
        ghostBtn: {
            flex: 1,
            padding: SPACING.space_12,
            borderRadius: BORDERRADIUS.radius_10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center',
        },
        ghostBtnText: {
            color: colors.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_semibold,
            fontSize: FONTSIZE.size_14,
        },
        confirmBtn: {
            flex: 1,
            padding: SPACING.space_12,
            borderRadius: BORDERRADIUS.radius_10,
            backgroundColor: colors.primaryOrangeHex,
            alignItems: 'center',
        },
        confirmBtnText: {
            color: '#fff',
            fontFamily: FONTFAMILY.poppins_semibold,
            fontSize: FONTSIZE.size_14,
        },
    });

export default EnableCollabModal;