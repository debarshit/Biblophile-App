import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import Toast from 'react-native-toast-message';

interface Prompt {
    promptId: string;
    challengeId: string;
    promptDescription: string;
    promptType: string;
    promptValue: string;
    Progress: string;
    Completed: boolean;
    bookRecommendations?: string | null;
}

interface ChallengePromptDetailsProps {
    promptId: string;
    onBack: () => void;
}

const ChallengePromptDetails: React.FC<ChallengePromptDetailsProps> = ({ promptId, onBack }) => {
    const [promptData, setPromptdata] = useState<Prompt | null>(null);
    const [progress, setProgress] = useState<string>('');
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0]?.accessToken;

    const hasQuantifiableTarget = promptData?.promptValue !== null;
    const progressPercentage = hasQuantifiableTarget 
        ? Math.min((Number(progress) / Number(promptData?.promptValue || 1)) * 100, 100) : isCompleted ? 100 : 0;

    const fetchPromptDetails = async () => {
        try {
          setIsLoading(true);
          const response = await instance(`${requests.fetchPromptDetails(promptId)}`, {
              headers: { Authorization: `Bearer ${accessToken}` }
          });
          const promptData = response.data.data;
          setPromptdata(promptData);
          setProgress(promptData.Progress || '');
          setIsCompleted(promptData.Completed || false);
        } catch (error) {
          setError('Failed to fetch prompt details');
          Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch challenge details.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => { fetchPromptDetails(); }, [promptId]);

    const handleCompleteChallenge = async () => {
        if (!promptData) return;
        try {
            const payload: any = hasQuantifiableTarget ? { progress } : { isCompleted: isCompleted ? 1 : 0 };
            const response = await instance.patch(requests.updatePromptProgress(promptId), payload, {
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }
            });
            if (response.data.message === 'Prompt progress and challenge progress updated successfully.') {
                setIsCompleted(true);
                Toast.show({ type: 'success', text1: 'Success', text2: 'Challenge updated successfully!' });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update challenge' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update challenge progress' });
        }
    };

    const handleProgressChange = (value: string) => {
        if (!promptData) return;
        if (Number(value) > Number(promptData.promptValue)) {
            setError('Progress cannot exceed the target value.');
        } else {
            setError('');
            setProgress(value);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
                <Text style={styles.loadingText}>Loading challenge details...</Text>
            </View>
        );
    }

    if (!promptData) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.noPromptText}>No prompt details available</Text>
                <TouchableOpacity onPress={onBack} style={styles.button}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backIcon}>← </Text>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                
                <Text style={styles.title}>Challenge Details</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Challenge</Text>
                    <Text style={styles.description}>{promptData.promptDescription}</Text>
                    
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{promptData.promptType}</Text>
                    </View>

                    {hasQuantifiableTarget ? (
                        <View style={styles.section}>
                            <Text style={styles.label}>Your Progress</Text>
                            <View style={styles.progressBar}>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                                </View>
                                <Text style={styles.percentText}>{progressPercentage.toFixed(0)}%</Text>
                            </View>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    value={progress}
                                    onChangeText={handleProgressChange}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={COLORS.primaryLightGreyHex}
                                />
                                <Text style={styles.divider}>/</Text>
                                <View style={styles.targetBox}>
                                    <Text style={styles.targetText}>{promptData.promptValue}</Text>
                                </View>
                            </View>
                            {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}
                        </View>
                    ) : (
                        <View style={styles.section}>
                            <Text style={styles.label}>Mark as Complete</Text>
                            <TouchableOpacity
    style={styles.checkboxCard}
    activeOpacity={0.8}
    onPress={() => setIsCompleted(!isCompleted)}
>
    <View>
        <Text style={styles.checkboxLabel}>Status</Text>

        <View style={styles.statusRow}>
            <Text style={styles.checkboxStatus}>
                {isCompleted ? 'Completed' : 'Not Completed'}
            </Text>

            <BouncyCheckbox
                size={20}
                fillColor={COLORS.primaryOrangeHex}
                unFillColor={COLORS.secondaryDarkGreyHex}
                isChecked={isCompleted}
                onPress={() => setIsCompleted(!isCompleted)}
                iconStyle={styles.checkboxIcon}
                innerIconStyle={styles.checkboxInnerIcon}
            />
        </View>
    </View>
</TouchableOpacity>
                        </View>
                    )}
                </View>

                {promptData.bookRecommendations && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Book Recommendations</Text>
                        {promptData.bookRecommendations.split(',').map((book, i) => (
                            <View key={i} style={styles.bookItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.bookText}>{book.trim()}</Text>
                            </View>
                        ))}
                        <Text style={styles.note}>💡 Feel free to choose your own books too</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleCompleteChallenge} style={styles.button}>
                    <Text style={styles.buttonText}>Update Progress</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primaryBlackHex },
    scrollContent: { padding: SPACING.space_20, paddingBottom: 100 },
    centerContainer: { flex: 1, backgroundColor: COLORS.primaryBlackHex, justifyContent: 'center', alignItems: 'center', padding: SPACING.space_32 },
    
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.space_16 },
    backIcon: { color: COLORS.primaryOrangeHex, fontSize: FONTSIZE.size_24, marginRight: SPACING.space_8 },
    backButtonText: { color: COLORS.primaryOrangeHex, fontSize: FONTSIZE.size_16, fontFamily: FONTFAMILY.poppins_medium },
    title: { fontSize: FONTSIZE.size_28, fontFamily: FONTFAMILY.poppins_bold, color: COLORS.primaryWhiteHex, marginBottom: SPACING.space_24 },
    
    card: { backgroundColor: COLORS.primaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_20, padding: SPACING.space_20, marginBottom: SPACING.space_20, borderWidth: 1, borderColor: COLORS.secondaryDarkGreyHex },
    label: { fontSize: FONTSIZE.size_12, fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryLightGreyHex, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.space_8 },
    description: { fontSize: FONTSIZE.size_18, fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryWhiteHex, lineHeight: FONTSIZE.size_24, marginBottom: SPACING.space_16 },
    
    badge: { backgroundColor: COLORS.secondaryDarkGreyHex, paddingHorizontal: SPACING.space_16, paddingVertical: SPACING.space_8, borderRadius: BORDERRADIUS.radius_15, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.primaryOrangeHex, marginBottom: SPACING.space_20 },
    badgeText: { color: COLORS.primaryOrangeHex, fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_semibold },
    
    section: { marginTop: SPACING.space_16 },
    progressBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.space_12, marginVertical: SPACING.space_12 },
    progressBarBg: { flex: 1, height: 12, backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_10, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.primaryGreyHex },
    progressBarFill: { height: '100%', backgroundColor: COLORS.primaryOrangeHex, borderRadius: BORDERRADIUS.radius_10 },
    percentText: { color: COLORS.primaryOrangeHex, fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_bold, minWidth: 45, textAlign: 'right' },
    
    inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.space_12, marginTop: SPACING.space_8 },
    input: { flex: 1, maxWidth: 120, backgroundColor: COLORS.secondaryDarkGreyHex, color: COLORS.primaryWhiteHex, borderRadius: BORDERRADIUS.radius_15, paddingHorizontal: SPACING.space_16, paddingVertical: SPACING.space_12, fontSize: FONTSIZE.size_20, fontFamily: FONTFAMILY.poppins_semibold, textAlign: 'center', borderWidth: 2, borderColor: COLORS.primaryOrangeHex },
    divider: { color: COLORS.primaryLightGreyHex, fontSize: FONTSIZE.size_24 },
    targetBox: { backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_15, paddingHorizontal: SPACING.space_16, paddingVertical: SPACING.space_12, borderWidth: 1, borderColor: COLORS.primaryGreyHex, minWidth: 80 },
    targetText: { color: COLORS.secondaryLightGreyHex, fontSize: FONTSIZE.size_20, fontFamily: FONTFAMILY.poppins_semibold, textAlign: 'center' },
    errorText: { color: COLORS.primaryRedHex, fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_medium, textAlign: 'center', marginTop: SPACING.space_12 },
    
    checkboxCard: { backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_15, padding: SPACING.space_16, borderWidth: 2, borderColor: COLORS.primaryGreyHex, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.space_8 },
    checkboxLabel: { fontSize: FONTSIZE.size_12, fontFamily: FONTFAMILY.poppins_medium, color: COLORS.primaryLightGreyHex, marginBottom: SPACING.space_4 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.space_4, gap: SPACING.space_8, },
    checkboxStatus: { fontSize: FONTSIZE.size_16, fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryWhiteHex },
    checkboxIcon: { borderRadius: 4 },
    checkboxInnerIcon: { borderRadius: 4 },
    
    cardTitle: { fontSize: FONTSIZE.size_18, fontFamily: FONTFAMILY.poppins_bold, color: COLORS.primaryWhiteHex, marginBottom: SPACING.space_16, paddingBottom: SPACING.space_12, borderBottomWidth: 1, borderBottomColor: COLORS.primaryGreyHex },
    bookItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_10, padding: SPACING.space_12, marginBottom: SPACING.space_12 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primaryOrangeHex, marginRight: SPACING.space_12 },
    bookText: { flex: 1, color: COLORS.primaryWhiteHex, fontSize: FONTSIZE.size_16, fontFamily: FONTFAMILY.poppins_medium },
    note: { fontSize: FONTSIZE.size_14, fontFamily: FONTFAMILY.poppins_regular, color: COLORS.secondaryLightGreyHex, textAlign: 'center', fontStyle: 'italic', marginTop: SPACING.space_16, backgroundColor: COLORS.secondaryDarkGreyHex, borderRadius: BORDERRADIUS.radius_10, padding: SPACING.space_12 },
    
    buttonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.space_20, backgroundColor: COLORS.primaryBlackHex, borderTopWidth: 1, borderTopColor: COLORS.primaryDarkGreyHex },
    button: { backgroundColor: COLORS.primaryOrangeHex, paddingVertical: SPACING.space_16, borderRadius: BORDERRADIUS.radius_20, alignItems: 'center' },
    buttonText: { color: COLORS.primaryWhiteHex, fontSize: FONTSIZE.size_18, fontFamily: FONTFAMILY.poppins_semibold },
    
    loadingText: { fontSize: FONTSIZE.size_16, fontFamily: FONTFAMILY.poppins_medium, color: COLORS.secondaryLightGreyHex, marginTop: SPACING.space_16 },
    errorIcon: { fontSize: 60, marginBottom: SPACING.space_16 },
    noPromptText: { fontSize: FONTSIZE.size_18, fontFamily: FONTFAMILY.poppins_semibold, color: COLORS.primaryWhiteHex, textAlign: 'center', marginBottom: SPACING.space_24 },
});

export default ChallengePromptDetails;