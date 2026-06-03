import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import type { Tab } from '../../types';

const TABS: { key: Tab; label: string }[] = [
    { key: 'books', label: 'Books' },
    { key: 'members', label: 'Members' },
    { key: 'activity', label: 'Activity' },
];

interface Props {
    active: Tab;
    onChange: (tab: Tab) => void;
    colors: any;
}

const TabBar: React.FC<Props> = ({ active, onChange, colors }) => (
    <View style={styles.row}>
        {TABS.map(t => (
            <TouchableOpacity
                key={t.key}
                onPress={() => onChange(t.key)}
                style={[
                    styles.pill,
                    { backgroundColor: active === t.key ? colors.primaryOrangeHex : 'rgba(255,255,255,0.07)' },
                ]}
            >
                <Text
                    style={[
                        styles.label,
                        { color: active === t.key ? '#fff' : colors.secondaryLightGreyHex },
                    ]}
                >
                    {t.label}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: SPACING.space_8,
        marginBottom: SPACING.space_16,
    },
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
    },
    label: {
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_medium,
    },
});

export default TabBar;