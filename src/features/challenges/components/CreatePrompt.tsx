import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { BORDERRADIUS, COLORS, FONTSIZE, SPACING } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';

type PromptType = 'CustomGoal' | 'PagesRead' | 'BooksFinished';

const CreatePrompt = ({ challengeId, IsHost, onBack, onSuccess }) => {
    const [promptDescription, setPromptDescription] = useState('');
    const [bookRecommendations, setBookRecommendations] = useState('');
    const [promptType, setPromptType] = useState<PromptType>('CustomGoal');
    const [promptValue, setPromptValue] = useState('');
    const [loading, setLoading] = useState(false);

    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0]?.accessToken;

    const handleSubmit = async () => {
        if (!IsHost) {
            Alert.alert('Error', 'You must be the host to create a prompt.');
            return;
        }

        setLoading(true);
        try {
            const promptData = {
                challengeId,
                promptDescription,
                promptType: promptType,
                promptValue,
                bookRecommendations
            };

            const response = await instance.post(requests.createOrUpdateChallengePrompts, promptData, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });
              if (response.data.success) {
                onSuccess();
              }
              else {
                Alert.alert('Error', 'Process could not be completed.');
              }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back to Prompts</Text>
            </TouchableOpacity>
            
            <Text style={styles.title}>Create/Update Prompt</Text>
            
            {/* Prompt Description */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Prompt Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="For example 'Read a book about your home state'"
                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                    value={promptDescription}
                    onChangeText={setPromptDescription}
                    multiline
                    numberOfLines={4}
                />
            </View>

            {/* Book Recommendations */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Book Recommendations (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., 'The Great Gatsby, Moby Dick, To Kill a Mockingbird'"
                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                    value={bookRecommendations}
                    onChangeText={setBookRecommendations}
                />
                <Text style={styles.hintText}>Suggestions for participants</Text>
            </View>
            
            {/* Prompt Type */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Prompt Type</Text>
                <View style={styles.radioGroup}>
                    <BouncyCheckbox
                        size={25}
                        fillColor="#D17842"
                        unFillColor="#52555A"
                        style={styles.checkbox}
                        isChecked={promptType === 'CustomGoal'}
                        onPress={() => setPromptType('CustomGoal')}
                    />
                    <Text style={styles.checkBoxText}>Custom Goal</Text>
                    <BouncyCheckbox
                        size={25}
                        fillColor="#D17842"
                        unFillColor="#52555A"
                        style={styles.checkbox}
                        isChecked={promptType === 'PagesRead'}
                        onPress={() => setPromptType('PagesRead')}
                    />
                    <Text style={styles.checkBoxText}>Pages Read</Text>
                    <BouncyCheckbox
                        size={25}
                        fillColor="#D17842"
                        unFillColor="#52555A"
                        style={styles.checkbox}
                        isChecked={promptType === 'BooksFinished'}
                        onPress={() => setPromptType('BooksFinished')}
                    />
                    <Text style={styles.checkBoxText}>Books Finished</Text>
                </View>
            </View>
            
            {/* Prompt Value */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Prompt Value</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="3 for books; fantasy, action for genre; 200 for pages; empty for custom"
                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                    value={promptValue}
                    onChangeText={setPromptValue}
                    multiline
                    numberOfLines={4}
                />
            </View>
            
            {/* Buttons */}
            <View style={styles.buttonGroup}>
                <TouchableOpacity 
                    style={styles.submitButton} 
                    onPress={handleSubmit}
                    disabled={loading || !IsHost}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Creating...' : 'Create Prompt'}
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={onBack}
                    disabled={!IsHost}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING.space_20,
        backgroundColor: COLORS.primaryBlackHex,
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
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_24,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'Poppins-Bold',
    },
    inputGroup: {
        marginBottom: SPACING.space_20,
    },
    label: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_18,
        marginBottom: SPACING.space_10,
        fontFamily: 'Poppins-SemiBold',
    },
    input: {
        backgroundColor: COLORS.primaryGreyHex,
        color: COLORS.primaryWhiteHex,
        padding: SPACING.space_15,
        borderRadius: BORDERRADIUS.radius_8,
        borderWidth: SPACING.space_2,
        borderColor: COLORS.primaryLightGreyHex,
        fontSize: FONTSIZE.size_16,
        fontFamily: 'Poppins-Regular',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: SPACING.space_10,
    },
    checkbox: {
        marginLeft: SPACING.space_8,
    },
    checkBoxText: {
        fontSize: FONTSIZE.size_10,
        color: COLORS.primaryWhiteHex,
        lineHeight: SPACING.space_24,
    },
    hintText: {
        color: COLORS.primaryLightGreyHex,
        fontSize: FONTSIZE.size_14,
        textAlign: 'center',
        marginTop: SPACING.space_10,
        fontFamily: 'Poppins-Regular',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.space_20,
    },
    submitButton: {
        backgroundColor: COLORS.primaryOrangeHex,
        padding: SPACING.space_15,
        borderRadius: BORDERRADIUS.radius_10,
        minWidth: 180,
        alignItems: 'center',
        marginRight: 20,
    },
    submitButtonText: {
        color: COLORS.primaryWhiteHex,
        fontSize: SPACING.space_16,
        fontWeight: 'bold',
        fontFamily: 'Poppins-Bold',
    },
    cancelButton: {
        padding: SPACING.space_15,
    },
    cancelButtonText: {
        color: COLORS.primaryWhiteHex,
        fontSize: SPACING.space_16,
        textDecorationLine: 'underline',
        fontFamily: 'Poppins-Regular',
    },
});

export default CreatePrompt;