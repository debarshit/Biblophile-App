import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BORDERRADIUS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import { JOIN_POLICY_OPTIONS, LIST_VISIBILITY_OPTIONS } from './Constants';
import type { ListSettings } from '../../types';

interface SelectRowProps {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onSelect: (value: string) => void;
    colors: any;
    s: ReturnType<typeof createStyles>;
}

const SelectRow: React.FC<SelectRowProps> = ({ label, value, options, onSelect, colors, s }) => (
    <View style={s.settingsRow}>
        <Text style={s.settingsLabel}>{label}</Text>
        <View style={s.pillRow}>
            {options.map(o => (
                <TouchableOpacity
                    key={o.value}
                    onPress={() => onSelect(o.value)}
                    style={[s.optionPill, value === o.value && s.optionPillActive]}
                >
                    <Text
                        style={[
                            s.optionPillText,
                            value === o.value && s.optionPillTextActive,
                        ]}
                    >
                        {o.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

interface Props {
    visible: boolean;
    settings: ListSettings;
    onClose: () => void;
    onSave: (patch: Partial<ListSettings>) => Promise<void>;
    colors: any;
}

const CollabSettingsModal: React.FC<Props> = ({
    visible,
    settings,
    onClose,
    onSave,
    colors,
}) => {
    const [draft, setDraft] = useState<ListSettings>(settings);
    const [saving, setSaving] = useState(false);

    const s = useMemo(() => createStyles(colors), [colors]);

    useEffect(() => {
        setDraft(settings);
    }, [settings, visible]);

    const set = <K extends keyof ListSettings>(field: K, value: ListSettings[K]) =>
        setDraft(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        setSaving(true);
        await onSave(draft);
        setSaving(false);
        onClose();
    };

    const rowProps = { colors, s };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <TouchableOpacity
                style={s.overlay}
                activeOpacity={1}
                onPress={saving ? undefined : onClose}
            >
                {/* Inner touchable stops overlay close when tapping the sheet */}
                <TouchableOpacity activeOpacity={1} style={s.sheet}>
                    <View style={s.handle} />
                    <Text style={s.title}>List Settings</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <SelectRow
                            label="Who can discover this list"
                            value={draft.listVisibility}
                            options={LIST_VISIBILITY_OPTIONS}
                            onSelect={v => set('listVisibility', v)}
                            {...rowProps}
                        />
                        <SelectRow
                            label="Who can see books inside"
                            value={draft.booksVisibility}
                            options={LIST_VISIBILITY_OPTIONS}
                            onSelect={v => set('booksVisibility', v)}
                            {...rowProps}
                        />
                        <SelectRow
                            label="Who can see members"
                            value={draft.membersVisibility}
                            options={LIST_VISIBILITY_OPTIONS}
                            onSelect={v => set('membersVisibility', v)}
                            {...rowProps}
                        />
                        <SelectRow
                            label="How people can join"
                            value={draft.joinPolicy}
                            options={JOIN_POLICY_OPTIONS}
                            onSelect={v => set('joinPolicy', v as ListSettings['joinPolicy'])}
                            {...rowProps}
                        />
                        <SelectRow
                            label="Default role for new members"
                            value={draft.defaultMemberRole}
                            options={[
                                { label: 'Editor', value: 'editor' },
                                { label: 'Viewer', value: 'viewer' },
                            ]}
                            onSelect={v =>
                                set('defaultMemberRole', v as ListSettings['defaultMemberRole'])
                            }
                            {...rowProps}
                        />

                        <View style={s.settingsRow}>
                            <Text style={s.settingsLabel}>
                                Max members (leave blank for unlimited)
                            </Text>

                            <TextInput
                                value={draft.maxMembers?.toString() ?? ''}
                                keyboardType="numeric"
                                placeholder="Unlimited"
                                placeholderTextColor={colors.secondaryLightGreyHex}
                                onChangeText={text =>
                                    set(
                                        'maxMembers',
                                        text ? Number(text) : undefined
                                    )
                                }
                                style={s.input}
                            />
                        </View>
                    </ScrollView>

                    <View style={s.divider} />

                    <TouchableOpacity
                        style={[s.saveBtn, saving && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Settings'}</Text>
                    </TouchableOpacity>
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
            maxHeight: '80%',
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
            color: '#fff',
            fontFamily: FONTFAMILY.poppins_semibold,
            fontSize: FONTSIZE.size_16,
            marginBottom: SPACING.space_16,
        },
        settingsRow: { marginBottom: SPACING.space_16 },
        settingsLabel: {
            color: colors.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
            marginBottom: 6,
        },
        pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
        optionPill: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.07)',
        },
        optionPillActive: { backgroundColor: colors.primaryOrangeHex },
        optionPillText: {
            color: colors.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_medium,
            fontSize: FONTSIZE.size_12,
        },
        optionPillTextActive: { color: '#fff' },
        divider: {
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.08)',
            marginVertical: SPACING.space_16,
        },
        saveBtn: {
            backgroundColor: colors.primaryOrangeHex,
            padding: SPACING.space_12,
            borderRadius: BORDERRADIUS.radius_10,
            alignItems: 'center',
        },
        saveBtnText: {
            color: '#fff',
            fontFamily: FONTFAMILY.poppins_semibold,
            fontSize: FONTSIZE.size_14,
        },
        input: {
            backgroundColor: '#252A32',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#fff',
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
        },
    });

export default CollabSettingsModal;