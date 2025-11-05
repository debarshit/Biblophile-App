import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Platform, KeyboardAvoidingView, ScrollView, Alert, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ActivityIndicator } from 'react-native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { COLORS, FONTFAMILY, FONTSIZE } from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';

const ProfileScreen = ({navigation, route}: any) => {
    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0].accessToken;
    const updateProfile = useStore((state: any) => state.updateProfile);

    const [avatar, setAvatar] = useState<string>(userDetails[0].profilePic);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const pickImage = async () => {
        // Ask for permission
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos.');
        return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
        });

        if (result.canceled) return;

        const selected = result.assets[0];
        if (selected.fileSize && selected.fileSize > 2 * 1024 * 1024) {
            Alert.alert('File too large', 'Please choose an image smaller than 2MB.');
            return;
        }

        const manipResult = await ImageManipulator.manipulateAsync(
            selected.uri,
            [{ resize: { width: 512, height: 512 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        setAvatar(manipResult.uri);
        confirmUpload(manipResult);
    };

    const confirmUpload = async (image: any) => {
        Alert.alert(
        'Upload this photo?',
        '',
        [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upload', onPress: () => uploadPhoto(image) },
        ]
        );
    };

    const uploadPhoto = async (image: any) => {
        try {
        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('photo', {
            uri: image.uri,
            name: `profile.jpg`,
            type: 'image/jpeg',
        } as any);

        const response = await instance.post(requests.uploadUserPhoto, formData, {
            headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${accessToken}`,
            },
            onUploadProgress: (progressEvent: any) => {
            const progress = progressEvent.loaded / progressEvent.total;
            setUploadProgress(progress);
            },
        });

        if (response.data?.success) {
            const newUrl = response.data.data?.UserPhoto;
            setAvatar(newUrl);
            updateProfile('profilePic', newUrl);
            Alert.alert('Success', 'Profile photo updated!');
        } else {
            Alert.alert('Upload Failed', response.data?.message || 'Try again later.');
        }
        } catch (error) {
        console.log('Upload Error:', error);
        Alert.alert('Error', 'Could not upload the image.');
        } finally {
        setUploading(false);
        setUploadProgress(0);
        }
    };

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
            const updateResponse = await instance.put(requests.updateUserData, {
                property: config.property,
                value: value.trim()
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const response = updateResponse.data;

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
            const updateResponse = await instance.post(requests.updateUserData, {
                property: 'UserPassword',
                value: password
            }, {
                headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' }
            });

            const response = updateResponse.data;

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
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryBlackHex }}>
<           KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: COLORS.primaryBlackHex }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView>
                    <HeaderBar showBackButton={true} title='Edit Profile'/>
                    <View style={styles.wrapper}>
                        <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center' }}>
                            <View style={styles.avatarWrapper}>
                                <Image
                                source={{ uri: avatar }}
                                style={styles.avatarImage}
                                />
                                <View style={styles.overlay}>
                                <Text style={styles.overlayText}>Change</Text>
                                </View>
                            </View>

                            {uploading && (
                                <View style={styles.uploadProgress}>
                                <ActivityIndicator color={COLORS.primaryOrangeHex} size="small" />
                                <Text style={{ color: COLORS.primaryWhiteHex, marginLeft: 8 }}>
                                    Uploading... {Math.round(uploadProgress * 100)}%
                                </Text>
                                </View>
                            )}
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
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
    avatarWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 2,
        borderColor: COLORS.primaryOrangeHex,
        marginBottom: 20,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_medium,
    },
    uploadProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
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