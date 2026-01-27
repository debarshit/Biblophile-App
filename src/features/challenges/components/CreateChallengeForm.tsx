import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, 
    Button, Platform, ScrollView, Linking
} from 'react-native';
import {
    BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING
} from '../../../theme/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import Toast from 'react-native-toast-message';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import CustomPicker from '../../../components/CustomPickerComponent';

const CreateChallengeForm = ({ modalVisible, setModalVisible, fetchChallenges }) => {
    const [formData, setFormData] = useState({
        challengeTitle: '',
        challengeDescription: '',
        challengeType: 'personal',
        startDate: new Date(),
        endDate: new Date(),
        selectedCategory: '',
        selectedKeywords: []
    });
    
    const [datePickerState, setDatePickerState] = useState({
        showStartDatePicker: false,
        showEndDatePicker: false,
        showDatePicker: false,
        currentPickerMode: 'start'
    });
    
    const [dataState, setDataState] = useState({ categories: [], keywords: [], loading: false });
    const accessToken = useStore(state => state.userDetails[0]?.accessToken);

    useEffect(() => {
        if (modalVisible) fetchCategoriesAndKeywords();
    }, [modalVisible]);

    const fetchCategoriesAndKeywords = async () => {
        setDataState(prev => ({ ...prev, loading: true }));
        try {
            const [catRes, keyRes] = await Promise.all([
                instance.get(requests.fetchCategories),
                instance.get(requests.fetchKeywords)
            ]);
            setDataState({
                categories: catRes.data.data || [],
                keywords: keyRes.data.data || [],
                loading: false
            });
        } catch (error) {
            console.error('Error fetching categories/keywords:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load categories and keywords.'
            });
            setDataState(prev => ({ ...prev, loading: false }));
        }
    };

    const updateFormData = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    const handleKeywordToggle = (keywordId) => {
        const { selectedKeywords } = formData;
        if (selectedKeywords.includes(keywordId)) {
            updateFormData('selectedKeywords', selectedKeywords.filter(id => id !== keywordId));
        } else if (selectedKeywords.length < 3) {
            updateFormData('selectedKeywords', [...selectedKeywords, keywordId]);
        } else {
            Toast.show({
                type: 'info',
                text1: 'Maximum Keywords',
                text2: 'You can select up to 3 keywords only.'
            });
        }
    };

    const resetForm = () => {
        setFormData({
            challengeTitle: '',
            challengeDescription: '',
            challengeType: 'personal',
            startDate: new Date(),
            endDate: new Date(),
            selectedCategory: '',
            selectedKeywords: []
        });
    };

    const validateForm = () => {
        const { challengeTitle, challengeType, selectedCategory, startDate, endDate } = formData;
        const now = new Date();
        
        const validations = [
            { condition: !challengeTitle.trim(), message: 'Challenge title is required.' },
            { condition: !challengeType, message: 'Challenge type is required.' },
            { condition: !selectedCategory, message: 'Please select a category.' },
            { condition: !startDate || !endDate, message: 'Both start and end dates are required.' },
            { condition: endDate < now, message: 'Dates cannot be in the past.' },
            { condition: startDate >= endDate, message: 'Start date must be before end date.' }
        ];

        for (const validation of validations) {
            if (validation.condition) {
                Toast.show({
                    type: 'error',
                    text1: 'Validation Error',
                    text2: validation.message
                });
                return false;
            }
        }
        return true;
    };

    const handleCreateChallenge = () => {
        if (!validateForm()) return;

        const challengeData = {
            challengeTitle: formData.challengeTitle,
            challengeDescription: formData.challengeDescription,
            challengeType: formData.challengeType,
            startDate: formData.startDate?.toISOString(),
            endDate: formData.endDate?.toISOString(),
            categoryId: formData.selectedCategory,
            keywordIds: formData.selectedKeywords
        };

        instance.post(requests.createChallenge, challengeData, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        .then(() => {
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Challenge created successfully!'
            });
            resetForm();
            setModalVisible(false);
            fetchChallenges();
        })
        .catch((error) => {
            console.error('Create challenge error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to create challenge. Please try again.'
            });
        });
    };

    const handleDatePress = (mode) => {
        const updates = Platform.OS === 'android' 
            ? { currentPickerMode: mode, showDatePicker: true, showStartDatePicker: false, showEndDatePicker: false }
            : { 
                showStartDatePicker: mode === 'start', 
                showEndDatePicker: mode === 'end', 
                showDatePicker: false 
            };
        setDatePickerState(prev => ({ ...prev, ...updates }));
    };

    const onDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setDatePickerState(prev => ({ ...prev, showDatePicker: false }));
            if (selectedDate) {
                const dateKey = datePickerState.currentPickerMode === 'start' ? 'startDate' : 'endDate';
                updateFormData(dateKey, selectedDate);
            }
        } else {
            const currentDate = selectedDate || (datePickerState.showStartDatePicker ? formData.startDate : formData.endDate);
            if (datePickerState.showStartDatePicker) {
                setDatePickerState(prev => ({ ...prev, showStartDatePicker: false }));
                updateFormData('startDate', currentDate);
            } else if (datePickerState.showEndDatePicker) {
                setDatePickerState(prev => ({ ...prev, showEndDatePicker: false }));
                updateFormData('endDate', currentDate);
            }
        }
    };

    const handleGuidelinesPress = () => {
        Linking.openURL('https://biblophile.com/challenges/guidelines');
    };

    const renderKeywordButton = (keyword) => {
        const isSelected = formData.selectedKeywords.includes(keyword.keywordId);
        const isDisabled = !isSelected && formData.selectedKeywords.length >= 3;
        
        return (
            <TouchableOpacity
                key={keyword.keywordId}
                style={[
                    styles.keywordButton,
                    isSelected && styles.keywordButtonSelected,
                    isDisabled && styles.keywordButtonDisabled
                ]}
                onPress={() => handleKeywordToggle(keyword.keywordId)}
                disabled={isDisabled}
            >
                <Text style={[
                    styles.keywordButtonText,
                    isSelected && styles.keywordButtonTextSelected,
                    isDisabled && styles.keywordButtonTextDisabled
                ]}>
                    {keyword.keywordName}{isSelected && ' ✓'}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderFormField = (label, required = false) => (
        <Text style={styles.label}>{label} {required && '*'}</Text>
    );

    // Transform categories data for CustomPicker
    const categoryOptions = dataState.categories.map(category => ({
        label: category.categoryName,
        value: category.categoryId,
        icon: 'category' // placeholder icon
    }));

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => { resetForm(); setModalVisible(false); }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.modalTitle}>Create a New Challenge</Text>

                        {renderFormField('Challenge Title', true)}
                        <TextInput
                            style={styles.input}
                            placeholder="Enter challenge title"
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            value={formData.challengeTitle}
                            onChangeText={(text) => updateFormData('challengeTitle', text)}
                        />

                        {renderFormField('Challenge Description')}
                        <TextInput
                            style={[styles.input, styles.textarea]}
                            placeholder="Optional. Add details like rules, checkpoints, etc."
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            value={formData.challengeDescription}
                            onChangeText={(text) => updateFormData('challengeDescription', text)}
                            multiline
                            numberOfLines={4}
                        />

                        <View style={styles.checkboxGrid}>
                            <View style={styles.checkboxContainer}>
                                {renderFormField('Challenge Type', true)}
                                {['personal', 'public'].map(type => (
                                    <BouncyCheckbox
                                        key={type}
                                        size={25}
                                        fillColor="#D17842"
                                        unFillColor="#52555A"
                                        style={styles.checkbox}
                                        text={type.charAt(0).toUpperCase() + type.slice(1)}
                                        textStyle={{
                                          textDecorationLine: "none",
                                        }}
                                        onPress={() => updateFormData('challengeType', type)}
                                        isChecked={formData.challengeType === type}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Community Guidelines Tip */}
                        {formData.challengeType === 'public' && (
                            <View style={styles.guidelinesTip}>
                                <Text style={styles.guidelinesText}>
                                    💡 Hosting a public challenge?{' '}
                                    <Text 
                                        style={styles.guidelinesLink}
                                        onPress={handleGuidelinesPress}
                                    >
                                        Read our community guidelines
                                    </Text>
                                </Text>
                            </View>
                        )}

                        {renderFormField('Category', true)}
                        <CustomPicker
                            options={categoryOptions}
                            selectedValue={formData.selectedCategory}
                            onValueChange={(value) => updateFormData('selectedCategory', value)}
                            placeholder="Choose a category"
                            style={styles.customPickerContainer}
                            disabled={dataState.loading}
                        />

                        <View style={styles.keywordSection}>
                            <View style={styles.keywordHeader}>
                                {renderFormField('Keywords')}
                                <Text style={styles.keywordCounter}>
                                    {formData.selectedKeywords.length}/3 selected
                                </Text>
                            </View>
                            
                            <View style={styles.keywordContainer}>
                                {dataState.keywords.map(renderKeywordButton)}
                            </View>
                            
                            {formData.selectedKeywords.length === 0 && (
                                <Text style={styles.keywordHint}>
                                    Select up to 3 keywords to help others discover your challenge
                                </Text>
                            )}
                        </View>

                        {['Start Date', 'End Date'].map((label, index) => {
                            const mode = index === 0 ? 'start' : 'end';
                            const date = formData[`${mode}Date`];
                            return (
                                <View key={label}>
                                    {renderFormField(label)}
                                    <TouchableOpacity onPress={() => handleDatePress(mode)} style={styles.dateInput}>
                                        <Text style={styles.dateText}>
                                            {date ? date.toLocaleDateString() : `Select ${label}`}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                        
                        {/* Date Pickers */}
                        {datePickerState.showDatePicker && (
                            <DateTimePicker
                                value={datePickerState.currentPickerMode === 'start' ? formData.startDate : formData.endDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onDateChange}
                            />
                        )}

                        {Platform.OS === 'ios' && datePickerState.showStartDatePicker && (
                            <DateTimePicker
                                value={formData.startDate}
                                textColor={COLORS.primaryWhiteHex}
                                mode="date"
                                display="spinner"
                                onChange={onDateChange}
                            />
                        )}
                        {Platform.OS === 'ios' && datePickerState.showEndDatePicker && (
                            <DateTimePicker
                                value={formData.endDate}
                                textColor={COLORS.primaryWhiteHex}
                                mode="date"
                                display="spinner"
                                onChange={onDateChange}
                            />
                        )}

                        <View style={styles.modalActions}>
                            <Button title="Create" color={COLORS.primaryOrangeHex} onPress={handleCreateChallenge} />
                            <Button title="Cancel" color={COLORS.primaryOrangeHex} onPress={() => { resetForm(); setModalVisible(false); }} />
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default CreateChallengeForm;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: COLORS.secondaryDarkGreyHex,
        borderRadius: BORDERRADIUS.radius_25,
        width: '90%',
        maxHeight: '90%',
    },
    scrollContent: {
        padding: SPACING.space_20,
    },
    modalTitle: {
        fontSize: FONTSIZE.size_24,
        fontFamily: FONTFAMILY.poppins_semibold,
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 2,
        borderColor: COLORS.primaryLightGreyHex,
        borderRadius: BORDERRADIUS.radius_8,
        padding: SPACING.space_10,
        color: COLORS.primaryWhiteHex,
        backgroundColor: COLORS.primaryGreyHex,
        marginBottom: SPACING.space_15,
    },
    textarea: {
        height: 100,
        textAlignVertical: 'top',
    },
    checkboxGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: SPACING.space_15,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.space_8,
        flexWrap: 'wrap',
    },
    checkbox: {
        marginRight: SPACING.space_8,
    },
    label: {
        color: COLORS.primaryWhiteHex,
        fontFamily: FONTFAMILY.poppins_medium,
        fontSize: FONTSIZE.size_16,
        marginBottom: SPACING.space_8,
        flexShrink: 1,
        flexWrap: 'wrap',
    },
    guidelinesTip: {
        backgroundColor: COLORS.primaryGreyHex + '80',
        borderRadius: BORDERRADIUS.radius_8,
        padding: SPACING.space_12,
        marginBottom: SPACING.space_15,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primaryOrangeHex,
    },
    guidelinesText: {
        color: COLORS.secondaryLightGreyHex,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_regular,
        lineHeight: 20,
    },
    guidelinesLink: {
        color: COLORS.primaryOrangeHex,
        fontFamily: FONTFAMILY.poppins_medium,
        textDecorationLine: 'underline',
    },
    customPickerContainer: {
        marginBottom: SPACING.space_15,
        zIndex: 1000,
    },
    keywordSection: {
        marginBottom: SPACING.space_15,
    },
    keywordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.space_10,
    },
    keywordCounter: {
        color: COLORS.secondaryLightGreyHex,
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_regular,
    },
    keywordContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.space_8,
        padding: SPACING.space_15,
        backgroundColor: COLORS.primaryGreyHex + '80',
        borderRadius: BORDERRADIUS.radius_10,
        borderWidth: 1,
        borderColor: COLORS.primaryLightGreyHex,
        marginBottom: SPACING.space_8,
    },
    keywordButton: {
        paddingHorizontal: SPACING.space_12,
        paddingVertical: SPACING.space_8,
        borderRadius: BORDERRADIUS.radius_8,
        backgroundColor: COLORS.primaryGreyHex,
        borderWidth: 1,
        borderColor: COLORS.primaryLightGreyHex,
    },
    keywordButtonSelected: {
        backgroundColor: COLORS.primaryOrangeHex,
        borderColor: COLORS.primaryOrangeHex,
        transform: [{ scale: 1.05 }],
    },
    keywordButtonDisabled: {
        backgroundColor: COLORS.primaryGreyHex,
        borderColor: COLORS.primaryLightGreyHex,
        opacity: 0.5,
    },
    keywordButtonText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_medium,
    },
    keywordButtonTextSelected: {
        fontFamily: FONTFAMILY.poppins_semibold,
    },
    keywordButtonTextDisabled: {
        color: COLORS.secondaryLightGreyHex,
    },
    keywordHint: {
        color: COLORS.secondaryLightGreyHex,
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_regular,
        fontStyle: 'italic',
    },
    dateInput: {
        padding: SPACING.space_12,
        marginBottom: SPACING.space_15,
        backgroundColor: COLORS.primaryGreyHex,
        borderWidth: 2,
        borderColor: COLORS.primaryLightGreyHex,
        borderRadius: BORDERRADIUS.radius_8,
    },
    dateText: {
        fontSize: FONTSIZE.size_16,
        color: COLORS.primaryWhiteHex,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.space_20,
        gap: SPACING.space_15,
    },
});