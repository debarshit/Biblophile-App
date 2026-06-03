import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDERRADIUS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';
import { ACTION_LABELS } from './Constants';
import type { ActivityItem } from '../../types';
import { formatTimeAgo } from '../../utils';

interface Props {
    tagId: string;
    accessToken: string;
    colors: any;
}

const ActivityTab: React.FC<Props> = ({ tagId, accessToken, colors }) => {
    const [items, setItems] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    const s = useMemo(() => createStyles(colors), [colors]);

    const fetchActivity = useCallback(
        async (off: number) => {
            setLoading(true);
            try {
                const res = await instance.get(requests.getListActivity(tagId), {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { limit: 20, offset: off },
                });
                const newItems: ActivityItem[] = res.data.data.activity;
                setItems(prev => (off === 0 ? newItems : [...prev, ...newItems]));
                setHasMore(res.data.data.hasMore);
                setOffset(off + 20);
            } catch {
                if (off === 0) setItems([]);
            } finally {
                setLoading(false);
            }
        },
        [accessToken, tagId]
    );

    useEffect(() => {
        fetchActivity(0);
    }, [fetchActivity]);

    if (loading && items.length === 0) {
        return (
            <View style={s.centered}>
                <Text style={s.mutedText}>Loading activity…</Text>
            </View>
        );
    }

    if (items.length === 0) {
        return <Text style={s.emptyText}>No activity yet</Text>;
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false}>
            {items.map(item => (
                <View key={item.id} style={s.row}>
                    <View style={s.avatar} />
                    <View style={s.info}>
                        <Text style={s.text}>
                            <Text style={s.name}>{item.userName} </Text>
                            <Text style={s.action}>
                                {ACTION_LABELS[item.action] ?? item.action}
                            </Text>
                            {!!item.workTitle && (
                                <Text style={s.workTitle}> {item.workTitle}</Text>
                            )}
                        </Text>
                        <Text style={s.time}>{formatTimeAgo(item.createdAt)}</Text>
                    </View>
                </View>
            ))}

            {hasMore && (
                <TouchableOpacity
                    style={s.loadMoreBtn}
                    onPress={() => fetchActivity(offset)}
                    disabled={loading}
                >
                    <Text style={s.loadMoreText}>{loading ? 'Loading…' : 'Load more'}</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};

const createStyles = (colors: any) =>
    StyleSheet.create({
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
        row: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingVertical: SPACING.space_10,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.05)',
            gap: SPACING.space_10,
        },
        avatar: {
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: 'rgba(255,255,255,0.1)',
            marginTop: 2,
        },
        info: { flex: 1 },
        text: {
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
            lineHeight: 20,
        },
        name: { color: '#fff', fontFamily: FONTFAMILY.poppins_semibold },
        action: { color: colors.secondaryLightGreyHex },
        workTitle: { color: colors.primaryOrangeHex },
        time: {
            color: 'rgba(255,255,255,0.3)',
            fontFamily: FONTFAMILY.poppins_regular,
            fontSize: FONTSIZE.size_12,
            marginTop: 2,
        },
        loadMoreBtn: {
            padding: SPACING.space_10,
            marginTop: SPACING.space_8,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: BORDERRADIUS.radius_10,
            alignItems: 'center',
        },
        loadMoreText: {
            color: colors.secondaryLightGreyHex,
            fontFamily: FONTFAMILY.poppins_medium,
            fontSize: FONTSIZE.size_12,
        },
    });

export default ActivityTab;