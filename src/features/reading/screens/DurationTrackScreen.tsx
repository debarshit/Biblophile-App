import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert, FlatList, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { COLORS, SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import { useStore } from '../../../store/store';
import Mascot from '../../../components/Mascot';

const DurationTrackScreen: React.FC = ({navigation}: any) => {
    const [durations, setDurations] = useState([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const userDetails = useStore((state: any) => state.userDetails);
    const userId = userDetails[0].userId;

    const fetchDurations = async (initial = false) => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const response = await instance.get(`${requests.fetchReadingDurations}${userId}?offset=${offset}&limit=10&timezone=${userTimezone}`);
            const newDurations = response.data;

            setDurations(initial ? newDurations : [...durations, ...newDurations]);

            if (newDurations.length < 10) {
                setHasMore(false);
            } else {
                setOffset(offset + 10);
            }
        } catch (error) {
            console.error("Error fetching durations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDurations(true);
    }, [userId]);

    const renderDurations = ({ item }: any) => {
        return (
            <View key={item.readingDurationId} style={styles.durationCard}>
                <View style={styles.durationContent}>
                    <View style={styles.durationTextContainer}>
                        <Text style={styles.durationText}>{item.note}</Text>
                        <Text style={styles.updatedAtText}>Updated at: {item.updatedAt}</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={durations}
                keyExtractor={(item) => item.readingDurationId.toString()}
                renderItem={renderDurations}
                contentContainerStyle={styles.container}
                onEndReached={() => fetchDurations(false)}
                onEndReachedThreshold={0.5}  // Trigger when 50% of the list is visible
                ListHeaderComponent={<Text style={styles.title}>My Reading Sessions</Text>}
                ListFooterComponent={loading && <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />}
                ListEmptyComponent={!loading && <Mascot emotion="reading" />}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.primaryBlackHex,
    },
    container: {
        padding: SPACING.space_20,
        backgroundColor: COLORS.primaryBlackHex,
        flexGrow: 1,
    },
    title: {
        fontSize: FONTSIZE.size_24,
        fontFamily: FONTFAMILY.poppins_bold,
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_20,
        textAlign: 'center',
    },
    durationCard: {
        padding: SPACING.space_20,
        backgroundColor: COLORS.primaryDarkGreyHex,
        borderRadius: BORDERRADIUS.radius_10,
        marginBottom: SPACING.space_16,
    },
    durationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    durationTextContainer: {
        flex: 1,
    },
    durationText: {
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_regular,
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_12,
    },
    updatedAtText: {
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_regular,
        color: COLORS.secondaryLightGreyHex,
        alignSelf: 'flex-end',
        marginBottom: SPACING.space_12,
    },
});

export default DurationTrackScreen;