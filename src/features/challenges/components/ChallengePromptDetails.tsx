import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { BORDERRADIUS, COLORS, FONTSIZE, SPACING } from '../../../theme/theme';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import Toast from 'react-native-toast-message';

interface Prompt {
    PromptId: string;
    ChallengeId: string;
    PromptDescription: string;
    PromptType: string;
    PromptValue: string;
    Progress: string;
    Completed: boolean;
    BookRecommendations?: string | null;
}

interface ChallengePromptDetailsProps {
    promptId: string;
    onBack: () => void;
}

const ChallengePromptDetails: React.FC<ChallengePromptDetailsProps> = ({ 
    promptId, 
    onBack,
}) => {
    const [promptData, setPromptdata] = useState<Prompt | null>(null);
    const [progress, setProgress] = useState<string>('');
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0]?.accessToken;

    const fetchPromptDetails = async () => {
        try {
          setIsLoading(true);
          const response = await instance(
            `${requests.fetchPromptDetails}&prompt_id=${promptId}`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
    
          const promptData = response.data;
          setPromptdata(promptData);
          setProgress(promptData.Progress || '');
          setIsCompleted(promptData.Completed || false);
    
        } catch (error) {
          setError('Failed to fetch prompt details');
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to fetch challenge details.',
          });
        } finally {
            setIsLoading(false);
        }
      };
    
      useEffect(() => {
        fetchPromptDetails();
      }, [promptId]);

    const handleCompleteChallenge = async () => {
        if (!promptData) return;

        try {
            const response = await instance.post(requests.updatePromptProgress, {
                promptId: promptData.PromptId,
                progress: promptData.PromptValue ? progress : null,
                isCompleted: !promptData.PromptValue ? true : isCompleted,
              }, {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            );
            const data = response.data;
    
            if (data.success) {
                setIsCompleted(true);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Challenge updated successfully!',
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to update challenge',
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update challenge progress',
            });
            console.error(error);
        }
    };

    const handleProgressChange = (value: string) => {
        if (!promptData) return;
        if (Number(value) > Number(promptData.PromptValue)) {
            setError('Progress cannot exceed the target value.');
        } else {
            setError('');
            setProgress(value);
        }
    };

    const renderBookRecommendations = (recommendations: string | null) => {
        if (!recommendations) return null;

        const books = recommendations.split(',').map(book => book.trim());
        
        return (
            <View style={styles.recommendationsContainer}>
                <Text style={styles.sectionTitle}>Book Recommendations</Text>
                <View style={styles.booksList}>
                    {books.map((book, index) => (
                        <Text key={index} style={styles.bookItem}>• {book}</Text>
                    ))}
                </View>
                <Text style={styles.noteText}>You can choose your own books too.</Text>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading prompt details...</Text>
            </View>
        );
    }

    if (!promptData) {
        return (
            <View style={styles.container}>
                <Text style={styles.noPromptText}>No prompt details available</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back to Challenges</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Challenge Prompt</Text>

            <View style={styles.contentContainer}>
                <View style={styles.section}>
                    <Text style={styles.promptDescription}>{promptData.PromptDescription}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Type: <Text style={styles.highlightText}>{promptData.PromptType}</Text>
                    </Text>
                </View>

                {promptData.PromptValue !== null ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Target</Text>
                        <View style={styles.progressContainer}>
                            <TextInput
                                style={styles.progressInput}
                                value={progress}
                                onChangeText={handleProgressChange}
                                keyboardType="numeric"
                            />
                            <Text style={styles.progressText}>/ {promptData.PromptValue}</Text>
                        </View>
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Completed</Text>
                        <View style={styles.checkboxContainer}>
                            <BouncyCheckbox
                                size={25}
                                fillColor="#D17842"
                                unFillColor="#52555A"
                                isChecked={isCompleted}
                                onPress={() => setIsCompleted(!isCompleted)}
                            />
                            <Text style={styles.checkboxLabel}>{isCompleted ? 'Yes' : 'No'}</Text>
                        </View>
                    </View>
                )}

                {promptData.BookRecommendations && renderBookRecommendations(promptData.BookRecommendations)}
            </View>

            <TouchableOpacity
                onPress={handleCompleteChallenge}
                style={styles.updateButton}
            >
                <Text style={styles.updateButtonText}>Update Challenge</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING.space_20,
        backgroundColor: COLORS.primaryBlackHex,
    },
    contentContainer: {
        marginBottom: SPACING.space_20,
    },
    backButton: {
        marginBottom: SPACING.space_20,
    },
    backButtonText: {
        color: COLORS.primaryOrangeHex,
        fontSize: FONTSIZE.size_16,
    },
    title: {
        fontSize: FONTSIZE.size_24,
        fontWeight: 'bold',
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_20,
    },
    noPromptText: {
        fontSize: FONTSIZE.size_18,
        fontWeight: '600',
        color: COLORS.primaryWhiteHex,
        textAlign: 'center',
        paddingVertical: SPACING.space_24,
    },
    section: {
        marginBottom: SPACING.space_20,
    },
    promptDescription: {
        fontSize: FONTSIZE.size_18,
        fontWeight: '600',
        color: COLORS.secondaryLightGreyHex,
    },
    sectionTitle: {
        fontSize: FONTSIZE.size_18,
        fontWeight: '600',
        color: COLORS.secondaryLightGreyHex,
        textAlign: 'center',
    },
    highlightText: {
        color: COLORS.primaryOrangeHex,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.space_10,
    },
    progressInput: {
        width: 80,
        height: 40,
        backgroundColor: COLORS.secondaryDarkGreyHex,
        color: COLORS.primaryWhiteHex,
        borderRadius: BORDERRADIUS.radius_8,
        paddingHorizontal: SPACING.space_10,
        marginRight: SPACING.space_10,
        textAlign: 'center',
    },
    progressText: {
        color: COLORS.primaryOrangeHex,
        fontSize: FONTSIZE.size_16,
    },
    errorText: {
        color: COLORS.primaryRedHex,
        fontSize: FONTSIZE.size_14,
        textAlign: 'center',
        marginTop: SPACING.space_4,
    },
    loadingText: {
        fontSize: FONTSIZE.size_16,
        color: COLORS.primaryWhiteHex,
        textAlign: 'center',
        marginTop: SPACING.space_20,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.space_10,
    },
    checkboxLabel: {
        color: COLORS.primaryOrangeHex,
        fontSize: FONTSIZE.size_16,
        marginLeft: SPACING.space_8,
    },
    recommendationsContainer: {
        marginTop: SPACING.space_20,
    },
    booksList: {
        marginTop: SPACING.space_10,
    },
    bookItem: {
        color: COLORS.primaryOrangeHex,
        fontSize: FONTSIZE.size_16,
        marginLeft: SPACING.space_20,
    },
    noteText: {
        fontSize: FONTSIZE.size_14,
        color: COLORS.primaryLightGreyHex,
        textAlign: 'center',
        marginTop: SPACING.space_20,
    },
    updateButton: {
        backgroundColor: COLORS.primaryOrangeHex,
        paddingVertical: SPACING.space_12,
        borderRadius: BORDERRADIUS.radius_8,
        alignItems: 'center',
        marginTop: SPACING.space_20,
    },
    updateButtonText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_16,
        fontWeight: '600',
    },
});

export default ChallengePromptDetails;