import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Platform, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';

import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { COLORS, FONTFAMILY, FONTSIZE } from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';
import { useTheme } from '../../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Entypo, FontAwesome5 } from '@expo/vector-icons';

type TabKey = 'profile' | 'social';

const ProfileScreen = ({ navigation, route }: any) => {
    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0].accessToken;
    const updateProfile = useStore((state: any) => state.updateProfile);

    const [avatar, setAvatar] = useState<string>(userDetails[0].profilePic);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [activeTab, setActiveTab] = useState<TabKey>('profile');

    const { COLORS } = useTheme();
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);

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

            const response = await instance.post(requests.uploadUserDp, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${accessToken}`,
                },
                onUploadProgress: (progressEvent: any) => {
                    const progress = progressEvent.loaded / progressEvent.total;
                    setUploadProgress(progress);
                },
            });
            if (response.data?.status === 'success') {
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

    // ── Social Links ─────────────────────────────────────────────────────────
    const [socials, setSocials] = useState({
        instagram: '',
        twitter: '',
        tiktok: '',
        goodreads: '',
        website: '',
    });
    const [socialsLoading, setSocialsLoading] = useState(false);
    const [socialsMessage, setSocialsMessage] = useState<{ text: string; isError: boolean } | null>(null);

    useEffect(() => {
        fetchSocialLinks();
    }, []);

    const fetchSocialLinks = async () => {
        try {
            const res = await instance.get(requests.getSocialLinks, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.data?.data) {
                const d = res.data.data;
                setSocials({
                    instagram: d.instagram || '',
                    twitter: d.twitter || '',
                    tiktok: d.tiktok || '',
                    goodreads: d.goodreads || '',
                    website: d.website || '',
                });
            }
        } catch (err) {
            console.log('Error fetching social links:', err);
        }
    };

    const saveSocialLinks = async () => {
        setSocialsLoading(true);
        setSocialsMessage(null);
        try {
            const res = await instance.put(requests.updateSocialLinks, socials, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setSocialsMessage({ text: res.data?.message || 'Social links updated!', isError: false });
            fetchSocialLinks();
        } catch (err: any) {
            setSocialsMessage({
                text: err?.response?.data?.message || 'Failed to update social links.',
                isError: true,
            });
        } finally {
            setSocialsLoading(false);
            setTimeout(() => setSocialsMessage(null), 4000);
        }
    };

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

            if (response.data.message === "User data updated") {
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
        <>
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryBlackHex }}>
                <KeyboardAwareScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    bottomOffset={100} // Margin offset space when keyboard opens up (accounts for KeyboardToolbar height too)
                >
                    <HeaderBar showBackButton={true} title='Edit Profile'/>
                    <View style={styles.wrapper}>
                        <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center' }}>
                            <View style={styles.avatarWrapper}>
                                <Image source={{ uri: avatar }} style={styles.avatarImage} />
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

                        {/* Tab Bar */}
                        <View style={styles.tabBar}>
                            <TouchableOpacity
                                style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
                                onPress={() => setActiveTab('profile')}
                            >
                                <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
                                    Profile
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabItem, activeTab === 'social' && styles.tabItemActive]}
                                onPress={() => setActiveTab('social')}
                            >
                                <Text style={[styles.tabLabel, activeTab === 'social' && styles.tabLabelActive]}>
                                    Social Links
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {activeTab === 'profile' && (
                            <View style={styles.tabContent}>
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
                        )}

                        {activeTab === 'social' && (
                            <View style={styles.tabContent}>
                                {/* Social Links Section */}
                                <View style={styles.socialSection}>
                                    <Text style={styles.socialHint}>
                                        Adding your social profiles increases your chances of being selected for ARC campaigns.
                                    </Text>

                                    {([
                                        { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourusername', icon: <Entypo name="instagram" size={16} color={COLORS.primaryWhiteHex} /> },
                                        { key: 'twitter',   label: 'Twitter (X)', placeholder: 'https://twitter.com/yourusername',   icon: <Entypo name="twitter" size={16} color={COLORS.primaryWhiteHex} /> },
                                        { key: 'tiktok',    label: 'TikTok',      placeholder: 'https://tiktok.com/@yourusername', icon: <FontAwesome5 name="tiktok" size={16} color={COLORS.primaryWhiteHex} /> },
                                        { key: 'goodreads', label: 'Goodreads',   placeholder: 'https://goodreads.com/user/show/...', icon: <FontAwesome5 name="goodreads" size={16} color={COLORS.primaryWhiteHex} /> },
                                        { key: 'website',   label: 'Website / Blog', placeholder: 'https://mybookblog.com',        icon: <FontAwesome5 name="blog" size={16} color={COLORS.primaryWhiteHex} /> },
                                    ] as const).map(({ key, label, placeholder, icon }) => (
                                        <View key={key} style={styles.socialFieldContainer}>
                                            <View style={styles.socialLabelRow}>
                                                <Text style={styles.socialEmoji}>{icon}</Text>
                                                <Text style={styles.socialLabel}>{label}</Text>
                                            </View>
                                            <View style={[
                                                styles.inputWrapper,
                                                focusedInput === `social_${key}` && styles.highlightedInput,
                                            ]}>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder={placeholder}
                                                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                                                    autoCapitalize="none"
                                                    keyboardType="url"
                                                    autoCorrect={false}
                                                    value={socials[key]}
                                                    onFocus={() => setFocusedInput(`social_${key}`)}
                                                    onBlur={() => setFocusedInput('')}
                                                    onChangeText={(text) => setSocials(prev => ({ ...prev, [key]: text }))}
                                                />
                                            </View>
                                        </View>
                                    ))}

                                    {socialsMessage && (
                                        <View style={[
                                            styles.socialsMessageBox,
                                            { borderColor: socialsMessage.isError ? COLORS.primaryRedHex : COLORS.primaryOrangeHex },
                                        ]}>
                                            <Text style={[
                                                styles.socialsMessageText,
                                                { color: socialsMessage.isError ? COLORS.primaryRedHex : COLORS.primaryOrangeHex },
                                            ]}>
                                                {socialsMessage.text}
                                            </Text>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.button, socialsLoading && styles.disabledButton]}
                                        onPress={saveSocialLinks}
                                        disabled={socialsLoading}
                                    >
                                        <Text style={styles.buttonText}>
                                            {socialsLoading ? 'Saving...' : 'Save Social Profiles'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </KeyboardAwareScrollView>
            </SafeAreaView>
            <KeyboardToolbar />
        </>
    );
};

export default ProfileScreen;

const createStyles = (COLORS: any) => StyleSheet.create({
    scrollContainer: {
        flex: 1,
        backgroundColor: COLORS.primaryBlackHex,
    },
    scrollContent: {
        flexGrow: 1,
    },
    wrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: COLORS.primaryBlackHex,
        paddingBottom: 30,
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
        marginTop: 10,
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
        marginBottom: 10,
    },
    // Tabs
    tabBar: {
        flexDirection: 'row',
        width: 300,
        backgroundColor: COLORS.secondaryDarkGreyHex,
        borderRadius: 8,
        padding: 4,
        marginBottom: 20,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    tabItemActive: {
        backgroundColor: COLORS.primaryOrangeHex,
    },
    tabLabel: {
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_medium,
        color: COLORS.secondaryLightGreyHex,
    },
    tabLabelActive: {
        color: COLORS.primaryWhiteHex,
    },
    tabContent: {
        width: 300,
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
        paddingTop: 10,
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
        width: '100%',
        marginTop: 10,
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
    // Social links section
    socialSection: {
        width: '100%',
        paddingBottom: 10,
    },
    socialHint: {
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_regular,
        color: COLORS.primaryWhiteHex,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(209,120,66,0.25)',
    },
    socialFieldContainer: {
        marginBottom: 12,
    },
    socialLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 5,
    },
    socialEmoji: {
        fontSize: 14,
    },
    socialLabel: {
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_semibold,
        color: COLORS.secondaryLightGreyHex,
    },
    socialsMessageBox: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginTop: 4,
        marginBottom: 4,
    },
    socialsMessageText: {
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_medium,
    },
});