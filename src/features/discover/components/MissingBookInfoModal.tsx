import React, { useState } from 'react';
import {
    StyleSheet, Text, TouchableOpacity, View, Modal, TextInput,
    Button, ScrollView, ActivityIndicator
} from 'react-native';
import {
    BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING
} from '../../../theme/theme';
import Toast from 'react-native-toast-message';
import instance from '../../../services/axios';
import requests from '../../../services/requests';

interface Props {
    modalVisible: boolean;
    setModalVisible: (visible: boolean) => void;
    accessToken?: string;
    workId?: number;
    bookId?: string | null;
}

const MissingBookInfoModal: React.FC<Props> = ({
    modalVisible,
    setModalVisible,
    accessToken,
    workId,
    bookId,
}) => {
    const [formData, setFormData] = useState({
        targetType: 'edition' as 'work' | 'edition',
        field: '',
        oldValue: '',
        newValue: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);

    const updateFormData = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const resetForm = () => {
        setFormData({
            targetType: 'edition',
            field: '',
            oldValue: '',
            newValue: '',
            reason: ''
        });
    };

    const validateForm = () => {
        if (!formData.field.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Please specify what information is missing or incorrect.'
            });
            return false;
        }

        if (!formData.newValue.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Please provide the correct value.'
            });
            return false;
        }

        return true;
    };

    const submitProposal = async () => {
        if (!accessToken) {
            Toast.show({
                type: 'error',
                text1: 'Authentication Required',
                text2: 'Please login to report changes.'
            });
            return;
        }

        if (!validateForm()) return;

        const targetId = formData.targetType === 'work' ? workId : Number(bookId);

        if (!targetId) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Invalid book or work ID.'
            });
            return;
        }

        setLoading(true);

        try {
            await instance.post(
                requests.createChangeProposal,
                {
                    targetType: formData.targetType,
                    targetId,
                    proposedChanges: [
                        {
                            field: formData.field,
                            oldValue: formData.oldValue || null,
                            newValue: formData.newValue,
                        },
                    ],
                    reason: formData.reason,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Your suggestion has been sent for review!'
            });
            
            resetForm();
            setModalVisible(false);
        } catch (err: any) {
            console.error('Submit proposal error:', err);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err?.response?.data?.message || 'Failed to submit proposal. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        resetForm();
        setModalVisible(false);
    };

    const renderFormField = (label: string, required = false) => (
        <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Text style={styles.modalTitle}>
                            Report Missing or Incorrect Information
                        </Text>

                        {/* Field Input */}
                        {renderFormField('What information is missing or incorrect?', true)}
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Publisher name, author, page count, description"
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            value={formData.field}
                            onChangeText={(text) => updateFormData('field', text)}
                        />

                        {/* Old Value */}
                        {renderFormField('Current value (optional)')}
                        <TextInput
                            style={styles.input}
                            placeholder="What's currently shown (if any)"
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            value={formData.oldValue}
                            onChangeText={(text) => updateFormData('oldValue', text)}
                        />

                        {/* New Value */}
                        {renderFormField('Correct value', true)}
                        <TextInput
                            style={styles.input}
                            placeholder="Enter the correct information"
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            value={formData.newValue}
                            onChangeText={(text) => updateFormData('newValue', text)}
                        />

                        {/* Reason */}
                        {renderFormField('Reason / source (optional)')}
                        <TextInput
                            style={[styles.input, styles.textarea]}
                            placeholder="Explain why this change is needed or provide a source"
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            value={formData.reason}
                            onChangeText={(text) => updateFormData('reason', text)}
                            multiline
                            numberOfLines={4}
                        />

                        {/* Info Tip */}
                        <View style={styles.infoTip}>
                            <Text style={styles.infoText}>
                                💡 Your suggestion will be reviewed before being applied. Thank you for helping improve book information!
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.button, styles.submitButton]}
                                onPress={submitProposal}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.primaryWhiteHex} />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit</Text>
                                )}
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={handleClose}
                                disabled={loading}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default MissingBookInfoModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContainer: {
        backgroundColor: COLORS.secondaryDarkGreyHex,
        borderRadius: BORDERRADIUS.radius_25,
        width: '90%',
        maxHeight: '80%',
    },
    scrollContent: {
        padding: SPACING.space_24,
    },
    modalTitle: {
        fontSize: FONTSIZE.size_20,
        fontFamily: FONTFAMILY.poppins_semibold,
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_20,
        textAlign: 'center',
    },
    label: {
        color: COLORS.secondaryLightGreyHex,
        fontFamily: FONTFAMILY.poppins_medium,
        fontSize: FONTSIZE.size_14,
        marginBottom: SPACING.space_8,
    },
    required: {
        color: COLORS.primaryOrangeHex,
    },
    input: {
        borderWidth: 2,
        borderColor: COLORS.primaryLightGreyHex,
        borderRadius: BORDERRADIUS.radius_10,
        padding: SPACING.space_12,
        color: COLORS.primaryWhiteHex,
        backgroundColor: COLORS.primaryGreyHex,
        marginBottom: SPACING.space_16,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_regular,
    },
    textarea: {
        height: 100,
        textAlignVertical: 'top',
    },
    infoTip: {
        backgroundColor: COLORS.primaryGreyHex + '80',
        borderRadius: BORDERRADIUS.radius_10,
        padding: SPACING.space_12,
        marginBottom: SPACING.space_20,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primaryOrangeHex,
    },
    infoText: {
        color: COLORS.secondaryLightGreyHex,
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_regular,
        lineHeight: 18,
    },
    modalActions: {
        gap: SPACING.space_12,
    },
    button: {
        paddingVertical: SPACING.space_12,
        paddingHorizontal: SPACING.space_20,
        borderRadius: BORDERRADIUS.radius_10,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    submitButton: {
        backgroundColor: COLORS.primaryOrangeHex,
    },
    submitButtonText: {
        color: COLORS.primaryWhiteHex,
        fontFamily: FONTFAMILY.poppins_semibold,
        fontSize: FONTSIZE.size_16,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primaryLightGreyHex,
    },
    cancelButtonText: {
        color: COLORS.secondaryLightGreyHex,
        fontFamily: FONTFAMILY.poppins_medium,
        fontSize: FONTSIZE.size_16,
    },
});