import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { BORDERRADIUS, COLORS, FONTSIZE, SPACING } from '../../../theme/theme';

interface Prompt {
    promptId: string;
    promptDescription: string;
    promptType: string;
    promptValue: string;
}

interface ChallengePromptsProps {
    ChallengeId: string;
    IsHost: boolean;
    onCreatePrompt: () => void;
    onViewPrompt: (prompt: Prompt) => void;
}

const PAGE_SIZE = 10;

const ChallengePrompts = ({ ChallengeId, IsHost, onCreatePrompt, onViewPrompt }: ChallengePromptsProps) => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [offset, setOffset] = useState<number>(0);

    const fetchPrompts = useCallback(async (isRefreshing = false) => {
        try {
            setLoading(true);
            setError(null);
            
            const challengePromptResponse = await instance.get(`${requests.fetchChallengePrompts(ChallengeId)}?limit=${PAGE_SIZE}&offset=${ isRefreshing ? 0 : offset}`);
            const response = challengePromptResponse.data;
            const fetchedPrompts: Prompt[] = response.data?.prompts || response.data || [];
            
            if (!Array.isArray(fetchedPrompts)) {
                throw new Error('Invalid response format: expected an array of prompts');
            }

            setHasMore(fetchedPrompts.length === PAGE_SIZE);
            
            if (isRefreshing) {
                setPrompts(fetchedPrompts);
                setOffset(0);
            } else {
                setPrompts(prev => offset === 0 ? fetchedPrompts : [...prev, ...fetchedPrompts]);
            }
        } catch (err) {
            console.error('Error fetching prompts:', err);
            setError('Failed to load prompts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [offset, ChallengeId]);

    useEffect(() => {
        fetchPrompts();
    }, [fetchPrompts]);

    const renderItem = ({ item }: { item: Prompt }) => (
        <TouchableOpacity 
            style={styles.itemContainer}
            onPress={() => onViewPrompt(item)}
            activeOpacity={0.8}
        >
            <View style={styles.itemContent}>
                <Text style={styles.promptTitle}>{item.promptDescription}</Text>
                <Text style={styles.promptType}>{item.promptType}</Text>
            </View>
            <View>
                <Text style={styles.arrowIcon}>→</Text>
            </View>
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!loading || !hasMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color="#888" />
            </View>
        );
    };

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No prompts available yet.</Text>
            <TouchableOpacity 
                style={styles.createButton} 
                onPress={onCreatePrompt}
            >
                <Text style={styles.createButtonText}>Create First Prompt</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Challenge Prompts</Text>
                {IsHost && <TouchableOpacity 
                    style={styles.createButtonSmall} 
                    onPress={onCreatePrompt}
                >
                    <Text style={styles.createButtonTextSmall}>+ New</Text>
                </TouchableOpacity>}
            </View>

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <FlatList
                data={prompts}
                renderItem={renderItem}
                keyExtractor={(item) => item.promptId}
                contentContainerStyle={prompts.length === 0 ? styles.listContent : null}
                ListEmptyComponent={!loading && renderEmptyComponent()}
                ListFooterComponent={renderFooter()}
                onEndReached={() => {
                    if (!loading && hasMore) {
                        setOffset(prev => prev + PAGE_SIZE);
                    }
                }}
                onEndReachedThreshold={0.2}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primaryBlackHex,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: SPACING.space_16,
        backgroundColor: COLORS.primaryBlackHex,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.secondaryLightGreyHex,
    },
    header: {
        fontSize: FONTSIZE.size_20,
        fontWeight: '600',
        color: COLORS.secondaryLightGreyHex,
    },
    listContent: {
        flexGrow: 1,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryDarkGreyHex,
        padding: SPACING.space_16,
        marginVertical: SPACING.space_4,
        marginHorizontal: SPACING.space_16,
        borderRadius: BORDERRADIUS.radius_8,
        shadowColor: COLORS.primaryLightGreyHex,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    itemContent: {
        flex: 1,
    },
    promptTitle: {
        fontSize: SPACING.space_16,
        fontWeight: '500',
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_4,
    },
    promptType: {
        fontSize: FONTSIZE.size_14,
        color: COLORS.primaryLightGreyHex,
        marginBottom: SPACING.space_4,
    },
    arrowIcon: {
        marginLeft: SPACING.space_8,
        color: COLORS.primaryOrangeHex,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.space_36,
    },
    emptyText: {
        fontSize: FONTSIZE.size_16,
        color: COLORS.primaryLightGreyHex,
        marginBottom: SPACING.space_20,
        textAlign: 'center',
    },
    errorContainer: {
        padding: SPACING.space_16,
        alignItems: 'center',
    },
    errorText: {
        color: COLORS.primaryRedHex,
        fontSize: FONTSIZE.size_16,
        marginBottom: SPACING.space_10,
        textAlign: 'center',
    },
    footer: {
        padding: SPACING.space_10,
        alignItems: 'center',
    },
    createButton: {
        backgroundColor: COLORS.primaryOrangeHex,
        padding: SPACING.space_15,
        borderRadius: BORDERRADIUS.radius_8,
        alignItems: 'center',
        margin: SPACING.space_16,
    },
    createButtonSmall: {
        backgroundColor: COLORS.primaryOrangeHex,
        padding: SPACING.space_8,
        borderRadius: BORDERRADIUS.radius_8,
        paddingHorizontal: SPACING.space_12,
    },
    createButtonText: {
        color: COLORS.primaryWhiteHex,
        fontSize: SPACING.space_16,
        fontWeight: '600',
    },
    createButtonTextSmall: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
        fontWeight: '600',
    },
});

export default ChallengePrompts;