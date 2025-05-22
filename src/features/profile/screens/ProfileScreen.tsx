import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Platform, KeyboardAvoidingView, ScrollView, Alert, SafeAreaView } from 'react-native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { COLORS, FONTFAMILY, FONTSIZE } from '../../../theme/theme';

const ProfileScreen = ({navigation, route}: any) => {
    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0].accessToken;
    const updateProfile = useStore((state: any) => state.updateProfile);

    // Define field configuration
    const fieldConfig = {
        name: { 
            property: 'Name', 
            placeholder: 'Full Name', 
            initial: userDetails[0].userName,
            storeField: 'name' 
        },
        userName: { 
            property: 'UserName', 
            placeholder: 'Unique Username', 
            initial: userDetails[0].userUniqueUserName,
            storeField: 'userName' 
        },
        email: { 
            property: 'UserEmail', 
            placeholder: 'Email id', 
            initial: userDetails[0].userEmail,
            storeField: 'email' 
        },
        phone: { 
            property: 'UserPhone', 
            placeholder: 'Phone number', 
            initial: userDetails[0].userPhone,
            storeField: 'phone' 
        },
        address: { 
            property: 'UserAddress', 
            placeholder: 'Address', 
            initial: userDetails[0].userAddress,
            storeField: 'address',
            multiline: true 
        }
    };

    // Initialize state dynamically
    const [formData, setFormData] = useState(() => 
        Object.fromEntries(Object.entries(fieldConfig).map(([key, config]) => [key, config.initial]))
    );
    
    const [originalValues] = useState(formData);
    const [password, setPassword] = useState<string>('');
    const [passwordCnf, setPasswordCnf] = useState<string>('');
    const [avatar, setAvatar] = useState<string>(userDetails[0].profilePic);
    const [updateMessages, setUpdateMessages] = useState<{ [key: string]: { text: string; color: string } }>({});
    const [updatingFields, setUpdatingFields] = useState<{ [key: string]: boolean }>({});
    const [focusedInput, setFocusedInput] = useState<string>('');

    const setFieldValue = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const setMessage = (field: string, text: string, isError: boolean = false) => {
        const color = isError ? COLORS.primaryRedHex : COLORS.primaryOrangeHex;
        setUpdateMessages(prev => ({ ...prev, [field]: { text, color } }));
        
        setTimeout(() => {
            setUpdateMessages(prev => {
                const newMessages = { ...prev };
                delete newMessages[field];
                return newMessages;
            });
        }, 3000);
    };

    const updateField = async (fieldKey: string) => {
        const config = fieldConfig[fieldKey];
        const value = formData[fieldKey];
        
        if (!value?.trim()) {
            setMessage(fieldKey, 'Field cannot be empty', true);
            return;
        }

        setUpdatingFields(prev => ({ ...prev, [fieldKey]: true }));
        
        try {
            const response = await instance.post(requests.updateUserData, {
                property: config.property,
                value: value.trim()
            }, {
                headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' }
            });

            if (response.data.message === "Updated") {
                setMessage(fieldKey, 'Updated successfully');
                
                updateProfile(config.storeField, value.trim());
                
                // Update original values
                originalValues[fieldKey] = value;
            } else {
                setMessage(fieldKey, response.data.message, true);
            }
        } catch (error) {
            console.log(error);
            setMessage(fieldKey, 'Update failed. Please try again.', true);
        } finally {
            setUpdatingFields(prev => ({ ...prev, [fieldKey]: false }));
        }
    };

    const handlePasswordUpdate = async () => {
        if (!password || !passwordCnf) {
            setMessage('password', 'Please fill both password fields', true);
            return;
        }
        
        if (password !== passwordCnf) {
            setMessage('password', "Passwords don't match", true);
            return;
        }

        setUpdatingFields(prev => ({ ...prev, password: true }));
        
        try {
            const response = await instance.post(requests.updateUserData, {
                property: 'UserPassword',
                value: password
            }, {
                headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' }
            });

            if (response.data.message === "Updated") {
                setMessage('password', 'Password updated successfully');
                setPassword('');
                setPasswordCnf('');
            } else {
                setMessage('password', response.data.message, true);
            }
        } catch (error) {
            console.log(error);
            setMessage('password', 'Password update failed. Please try again.', true);
        } finally {
            setUpdatingFields(prev => ({ ...prev, password: false }));
        }
    };

    const hasChanged = (fieldKey: string) => originalValues[fieldKey] !== formData[fieldKey];

    const renderField = (fieldKey: string) => {
        const config = fieldConfig[fieldKey];
        const value = formData[fieldKey];
        const changed = hasChanged(fieldKey);
        const updating = updatingFields[fieldKey];
        const message = updateMessages[fieldKey];

        return (
            <View key={fieldKey} style={styles.fieldContainer}>
                <View style={styles.inputBox}>
                    <View style={[styles.inputWrapper, focusedInput === fieldKey && styles.highlightedInput]}>
                        <TextInput
                            style={[styles.input, config.multiline && styles.addressInput]}
                            placeholder={config.placeholder}
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            autoCapitalize='none'
                            keyboardType='default'
                            multiline={config.multiline}
                            numberOfLines={config.multiline ? 4 : 1}
                            textAlignVertical={config.multiline ? 'top' : 'center'}
                            onFocus={() => setFocusedInput(fieldKey)}
                            value={value}
                            onChangeText={(text) => setFieldValue(fieldKey, text)}
                        />
                    </View>
                </View>
                
                {changed && (
                    <TouchableOpacity
                        onPress={() => updateField(fieldKey)}
                        style={[styles.updateButton, updating && styles.disabledButton]}
                        disabled={updating}
                    >
                        <Text style={styles.updateButtonText}>
                            {updating ? 'Updating...' : 'Update'}
                        </Text>
                    </TouchableOpacity>
                )}
                
                {message && (
                    <Text style={[styles.fieldMessage, { color: message.color }]}>
                        {message.text}
                    </Text>
                )}
            </View>
        );
    };

    const renderPasswordInput = (value: string, setter: (value: string) => void, placeholder: string, fieldKey: string) => (
        <View style={styles.inputBox}>
            <View style={[styles.inputWrapper, focusedInput === fieldKey && styles.highlightedInput]}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                    secureTextEntry={true}
                    autoCapitalize='none'
                    textContentType='password'
                    onFocus={() => setFocusedInput(fieldKey)}
                    value={value}
                    onChangeText={setter}
                />
            </View>
        </View>
    );

    useEffect(() => {
        if (route.params) {
            alert(route.params.update);
        }
    }, []);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: COLORS.primaryBlackHex }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView>
                <SafeAreaView style={styles.wrapper}>
                    <Text style={styles.title}>Edit Profile</Text>
                    <TouchableOpacity onPress={() => {}}>
                        <Image
                            source={{ uri: avatar }}
                            style={{ width: 100, height: 100, borderRadius: 50, margin: 20 }}
                        />
                    </TouchableOpacity>

                    {Object.keys(fieldConfig).map(renderField)}

                    {/* Password Section */}
                    <View style={styles.passwordSection}>
                        <Text style={styles.sectionTitle}>Change Password</Text>
                        
                        {renderPasswordInput(password, setPassword, 'New Password', 'password')}
                        {renderPasswordInput(passwordCnf, setPasswordCnf, 'Confirm New Password', 'passwordCnf')}
                        
                        {(password || passwordCnf) && (
                            <TouchableOpacity
                                onPress={handlePasswordUpdate}
                                style={[styles.button, updatingFields.password && styles.disabledButton]}
                                disabled={updatingFields.password}
                            >
                                <Text style={styles.buttonText}>
                                    {updatingFields.password ? 'Updating Password...' : 'Update Password'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        
                        {updateMessages.password && (
                            <Text style={[styles.fieldMessage, { color: updateMessages.password.color }]}>
                                {updateMessages.password.text}
                            </Text>
                        )}
                    </View>
                </SafeAreaView>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: COLORS.primaryBlackHex,
    },
    title: {
        fontSize: FONTSIZE.size_24,
        fontFamily: FONTFAMILY.poppins_semibold,
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
        color: COLORS.secondaryLightGreyHex,
    },
    fieldContainer: {
        marginBottom: 15,
        width: 300,
    },
    inputBox: {
        marginBottom: 5,
    },
    inputWrapper: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: COLORS.secondaryDarkGreyHex,
        borderColor: COLORS.primaryLightGreyHex,
        borderRadius: 5,
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        height: 40,
        paddingHorizontal: 10,
        color: COLORS.primaryWhiteHex,
        fontFamily: FONTFAMILY.poppins_regular,
    },
    highlightedInput: {
        borderColor: COLORS.primaryOrangeHex,
        borderWidth: 2,
    },
    addressInput: {
        height: 120,
        textAlignVertical: 'top',
    },
    updateButton: {
        backgroundColor: COLORS.primaryOrangeHex,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        alignSelf: 'flex-end',
        marginTop: 5,
    },
    updateButtonText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_medium,
        textAlign: 'center',
    },
    disabledButton: {
        backgroundColor: COLORS.primaryLightGreyHex,
    },
    fieldMessage: {
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_regular,
        marginTop: 5,
        textAlign: 'center',
    },
    passwordSection: {
        width: 300,
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.primaryLightGreyHex,
    },
    sectionTitle: {
        fontSize: FONTSIZE.size_18,
        fontFamily: FONTFAMILY.poppins_medium,
        color: COLORS.secondaryLightGreyHex,
        marginBottom: 15,
        textAlign: 'center',
    },
    button: {
        backgroundColor: COLORS.primaryOrangeHex,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 10,
    },
    buttonText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_16,
        fontFamily: FONTFAMILY.poppins_medium,
        textAlign: 'center',
    },
});