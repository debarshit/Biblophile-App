import React, { useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import { notificationService } from '../../../utils/notificationUtils';
import { FontAwesome as FaIcon, MaterialCommunityIcons as MdIcon } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { FONTSIZE, SPACING } from '../../../theme/theme';
import Mascot from '../../../components/Mascot';
import CustomPicker from '../../../components/CustomPickerComponent';
import { useAnalytics } from '../../../utils/analytics';
import { useTheme } from '../../../contexts/ThemeContext';

const EyeIcon: React.FC<{ visible: boolean; onPress: () => void; styles: any }> = ({
    visible,
    onPress,
    styles,
}) => (
    <TouchableOpacity onPress={onPress}>
        {visible ? (
            <MdIcon name="eye" style={[styles.icon, styles.eyeIcon]} />
        ) : (
            <MdIcon name="eye-off" style={[styles.icon, styles.eyeIcon]} />
        )}
    </TouchableOpacity>
);
const LOGIN_INPUTS = ['loginEmail', 'loginPass'] as const;
const SIGNUP_INPUTS = [
    'signupName',
    'signupUserName',
    'signupEmail',
    'signupPass',
    'signupPassCnf',
] as const;

const SignupLogin: React.FC = ({ navigation }: any) => {
    const login = useStore((state: any) => state.login);
    const analytics = useAnalytics();
    const { COLORS } = useTheme();
    const styles = useMemo(() => createStyles(COLORS), [COLORS]);

    const [isRegistration, setIsRegistration] = useState<boolean>(false);
    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
    const [focusedInput, setFocusedInput] = useState<string>('');
    const [mascotEmotion, setMascotEmotion] = useState<string>('welcome');

    // Input states
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [signupName, setSignupName] = useState('');
    const [signupUserName, setSignupUserName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPhone, setSignupPhone] = useState('');
    const [signupPass, setSignupPass] = useState('');
    const [signupPassCnf, setSignupPassCnf] = useState('');
    const [source, setSource] = useState<string | null>(null);
    const [loginMessage, setLoginMessage] = useState({ text: '', color: COLORS.primaryBlackHex });
    const [signupMessage, setSignupMessage] = useState({ text: '', color: COLORS.primaryBlackHex });
    const [isLoading, setIsLoading] = useState(false);
    const [newsletterOptIn, setNewsletterOptIn] = useState(true);

    // Refs for toolbar prev/next focus management
    const inputRefs = useRef<Record<string, TextInput | null>>({});

    const activeInputList = isRegistration ? SIGNUP_INPUTS : LOGIN_INPUTS;

    const focusNext = () => {
        const idx = activeInputList.indexOf(focusedInput as any);
        if (idx !== -1 && idx < activeInputList.length - 1) {
            inputRefs.current[activeInputList[idx + 1]]?.focus();
        }
    };

    const focusPrev = () => {
        const idx = activeInputList.indexOf(focusedInput as any);
        if (idx > 0) {
            inputRefs.current[activeInputList[idx - 1]]?.focus();
        }
    };

    const isFirstInput = activeInputList.indexOf(focusedInput as any) <= 0;
    const isLastInput =
        activeInputList.indexOf(focusedInput as any) >= activeInputList.length - 1;

    const handleNotificationPermission = async (userData: any) => {
        try {
            // Use the notification service's permission flow
            const result = await notificationService.requestPermissions('general');
            const token = result.success ? notificationService.getPushToken() : null;
            completeLogin(userData, token);
        } catch {
            completeLogin(userData, null);
        }
    };

     // Complete login process
    const completeLogin = async (userData: any, notificationToken: string | null) => {
        const newUser = {
            ...userData,
            notificationToken: notificationToken,
        };
        
        login(newUser);

        // Update notification token on server if we have one
        if (notificationToken) {
            try {
                const updateResponse = await instance.post(requests.registerNotificationToken, {
                    userId: userData.userId,
                    token: notificationToken,
                    device: Platform.OS,
                });
                if (updateResponse.data.message !== 'Notification token saved') {
                    console.log('Failed to update notification token');
                }
            } catch (error) {
                console.log('Error updating notification token:', error);
            }
        }
    };

    // ----- Focus / mascot -----
    const handleFocus = (inputName: string) => {
        setFocusedInput(inputName);
        if (['loginPass', 'signupPass', 'signupPassCnf'].includes(inputName)) {
            setMascotEmotion(passwordVisible ? 'eyesPeeping' : 'eyesClosed');
        } else {
            setMascotEmotion('welcome');
        }
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible((v) => !v);
        setMascotEmotion((e) => (e === 'eyesClosed' ? 'eyesPeeping' : 'eyesClosed'));
    };

    const toggleRegistration = () => setIsRegistration((r) => !r);

    const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
    const validatePhone = (phone: string) => /^\d{10}$/.test(phone);

    const handleLogin = async () => {
        if (!loginEmail || !loginPass) {
            setLoginMessage({ text: 'Please fill all the details', color: COLORS.primaryRedHex });
            return;
        }
        setIsLoading(true);
        try {
            const { data } = await instance.post(requests.userLogin, {
                email: loginEmail,
                pass: loginPass,
            });
            if (data.data.message === 1) {
                const userData = {
                    accessToken: data.data.accessToken,
                    refreshToken: data.data.refreshToken,
                    userId: data.data.userId,
                    userEmail: data.data.email,
                    userAddress: data.data.address,
                    userPhone: data.data.phone,
                    userName: data.data.fullName,
                    userUniqueUserName: data.data.name,
                    deposit: data.data.deposit,
                    profilePic: data.data.profilePic,
                };
                await handleNotificationPermission(userData);
                await analytics.identifyUser(String(userData.userId), {
                    userId: String(userData.userId),
                    email: userData.userEmail,
                    name: userData.userName,
                    username: userData.userUniqueUserName,
                });
                analytics.login('email');
            } else {
                setLoginMessage({ text: data.data.message, color: COLORS.primaryRedHex });
            }
        } catch (error: any) {
            setLoginMessage({
                text: error?.response?.data?.message || 'There was an error! Please try again.',
                color: COLORS.primaryRedHex,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async () => {
        if (!signupName || !signupUserName || !signupEmail || !signupPass || !signupPassCnf || !source) {
            alert('Please fill all the details!');
            return;
        }
        if (!validateEmail(signupEmail)) { alert('Invalid email format!'); return; }
        if (signupPhone && !validatePhone(signupPhone)) { alert('Invalid phone number format!'); return; }
        if (signupPass !== signupPassCnf) { alert("Passwords don't match"); return; }

        setIsLoading(true);
        try {
            const payload: any = {
                name: signupName,
                userName: signupUserName,
                email: signupEmail,
                password: signupPass,
                signupPassCnf,
                source,
                newsletterOptIn,
            };
            if (signupPhone) payload.phone = signupPhone;

            const { data } = await instance.post(requests.userSignup, payload);
            if (data.data.message === 1) {
                setSignupMessage({ text: 'Signup successful! You can login now.', color: COLORS.primaryOrangeHex });
                setSignupName(''); setSignupUserName(''); setSignupEmail('');
                setSignupPhone(''); setSignupPass(''); setSignupPassCnf('');
                setSource(null); setNewsletterOptIn(true);
                analytics.signup('email');
            } else {
                setSignupMessage({ text: data.data.message, color: COLORS.primaryRedHex });
            }
        } catch (error: any) {
            setSignupMessage({
                text: error?.response?.data?.message || 'Signup failed. Try again.',
                color: COLORS.primaryRedHex,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const forgotPassword = async () => {
        if (!loginEmail) {
            setLoginMessage({ text: 'Please fill the email address', color: COLORS.primaryRedHex });
            return;
        }
        try {
            await instance.post(requests.forgotPassword, { email: loginEmail });
            setLoginMessage({ text: 'Reset link has been sent to this email id.', color: COLORS.primaryRedHex });
        } catch {
            setLoginMessage({ text: 'There was an error! Please try again.', color: COLORS.primaryRedHex });
        }
    };

    const openWebView = (url: string) => navigation.push('Resources', { url });

    // ----- Shared ref setter -----
    const setRef = (name: string) => (ref: TextInput | null) => {
        inputRefs.current[name] = ref;
    };

    // ----- Render -----
    return (
        <>
            <KeyboardAwareScrollView
                style={{ flex: 1, backgroundColor: COLORS.primaryBlackHex }}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
                bottomOffset={80}
            >
                <View style={styles.wrapper}>
                    {!isRegistration ? (
                        /* ===== LOGIN ===== */
                        <View style={styles.formContainer}>
                            <Mascot emotion={mascotEmotion} />
                            <Text style={styles.title}>Login</Text>
                            <Text style={[styles.statusMessage, { color: loginMessage.color }]}>
                                {loginMessage.text}
                            </Text>

                            <View style={styles.inputBox}>
                                <View style={[styles.inputWrapper, focusedInput === 'loginEmail' && styles.highlightedInput]}>
                                    <TextInput
                                        ref={setRef('loginEmail')}
                                        style={styles.input}
                                        placeholder="Email id"
                                        placeholderTextColor={COLORS.secondaryLightGreyHex}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        returnKeyType="next"
                                        onFocus={() => handleFocus('loginEmail')}
                                        onSubmitEditing={focusNext}
                                        blurOnSubmit={false}
                                        value={loginEmail}
                                        onChangeText={setLoginEmail}
                                    />
                                    <FaIcon name="user" style={styles.icon} />
                                </View>
                            </View>

                            <View style={styles.inputBox}>
                                <View style={[styles.inputWrapper, focusedInput === 'loginPass' && styles.highlightedInput]}>
                                    <TextInput
                                        ref={setRef('loginPass')}
                                        style={styles.input}
                                        placeholder="Password"
                                        placeholderTextColor={COLORS.secondaryLightGreyHex}
                                        secureTextEntry={!passwordVisible}
                                        autoCapitalize="none"
                                        returnKeyType="done"
                                        onFocus={() => handleFocus('loginPass')}
                                        onSubmitEditing={handleLogin}
                                        value={loginPass}
                                        onChangeText={setLoginPass}
                                    />
                                    <EyeIcon visible={passwordVisible} onPress={togglePasswordVisibility} styles={styles} />
                                </View>
                            </View>

                            <TouchableOpacity onPress={forgotPassword}>
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleLogin} style={styles.button} disabled={isLoading}>
                                {isLoading
                                    ? <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
                                    : <Text style={styles.buttonText}>Login</Text>}
                            </TouchableOpacity>

                            <View style={styles.registerLink}>
                                <Text style={styles.switchText}>
                                    Don't have an account?{' '}
                                    <Text style={styles.linkText} onPress={toggleRegistration}>Register</Text>
                                </Text>
                            </View>
                        </View>
                    ) : (
                        /* ===== SIGN UP ===== */
                        <View style={styles.formContainer}>
                            <Mascot emotion={mascotEmotion} />
                            <Text style={styles.title}>Sign up</Text>
                            <Text style={[styles.statusMessage, { color: signupMessage.color }]}>
                                {signupMessage.text}
                            </Text>

                            <View style={styles.inputBox}>
                                <View style={[styles.inputWrapper, focusedInput === 'signupName' && styles.highlightedInput]}>
                                    <TextInput
                                        ref={setRef('signupName')}
                                        style={styles.input}
                                        placeholder="Full Name"
                                        placeholderTextColor={COLORS.secondaryLightGreyHex}
                                        autoCapitalize="words"
                                        returnKeyType="next"
                                        onFocus={() => handleFocus('signupName')}
                                        onSubmitEditing={focusNext}
                                        blurOnSubmit={false}
                                        value={signupName}
                                        onChangeText={setSignupName}
                                    />
                                    <FaIcon name="user" style={styles.icon} />
                                </View>
                            </View>

                            <View style={styles.inputBox}>
                                <View style={[styles.inputWrapper, focusedInput === 'signupUserName' && styles.highlightedInput]}>
                                    <TextInput
                                        ref={setRef('signupUserName')}
                                        style={styles.input}
                                        placeholder="Unique Username"
                                        placeholderTextColor={COLORS.secondaryLightGreyHex}
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        onFocus={() => handleFocus('signupUserName')}
                                        onSubmitEditing={focusNext}
                                        blurOnSubmit={false}
                                        value={signupUserName}
                                        onChangeText={setSignupUserName}
                                    />
                                    <FaIcon name="user" style={styles.icon} />
                                </View>
                            </View>

                            <View style={styles.inputBox}>
                                <View style={[styles.inputWrapper, focusedInput === 'signupEmail' && styles.highlightedInput]}>
                                    <TextInput
                                        ref={setRef('signupEmail')}
                                        style={styles.input}
                                        placeholder="Email id"
                                        placeholderTextColor={COLORS.secondaryLightGreyHex}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        returnKeyType="next"
                                        onFocus={() => handleFocus('signupEmail')}
                                        onSubmitEditing={focusNext}
                                        blurOnSubmit={false}
                                        value={signupEmail}
                                        onChangeText={setSignupEmail}
                                    />
                                    <MdIcon name="email" style={styles.icon} />
                                </View>
                            </View>

                            <View style={styles.inputBox}>
                                <View style={[styles.inputWrapper, focusedInput === 'signupPass' && styles.highlightedInput]}>
                                    <TextInput
                                        ref={setRef('signupPass')}
                                        style={styles.input}
                                        placeholder="Password"
                                        placeholderTextColor={COLORS.secondaryLightGreyHex}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        returnKeyType="next"
                                        onFocus={() => handleFocus('signupPass')}
                                        onSubmitEditing={focusNext}
                                        blurOnSubmit={false}
                                        value={signupPass}
                                        onChangeText={setSignupPass}
                                    />
                                    <FaIcon name="lock" style={styles.icon} />
                                </View>
                            </View>

                            <View style={styles.inputBox}>
                                <View style={[styles.inputWrapper, focusedInput === 'signupPassCnf' && styles.highlightedInput]}>
                                    <TextInput
                                        ref={setRef('signupPassCnf')}
                                        style={styles.input}
                                        placeholder="Confirm password"
                                        placeholderTextColor={COLORS.secondaryLightGreyHex}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        returnKeyType="done"
                                        onFocus={() => handleFocus('signupPassCnf')}
                                        onSubmitEditing={handleSignup}
                                        value={signupPassCnf}
                                        onChangeText={setSignupPassCnf}
                                    />
                                    <FaIcon name="lock" style={styles.icon} />
                                </View>
                            </View>

                            <Text style={styles.promptText}>How did you find us?</Text>
                            <View style={styles.inputBox}>
                                <CustomPicker
                                    selectedValue={source}
                                    onValueChange={setSource}
                                    options={[
                                        { label: 'Social Media', value: 'Social Media', icon: 'share' },
                                        { label: 'Friends/Word of Mouth', value: 'Word of Mouth', icon: 'people' },
                                        { label: 'Online Ads', value: 'Online Ads', icon: 'campaign' },
                                        { label: 'App Store', value: 'App Store', icon: 'store' },
                                        { label: 'Influencer/Online Communities', value: 'Forums or Online Communities', icon: 'forum' },
                                        { label: 'Print Media', value: 'Print Media', icon: 'local-library' },
                                        { label: 'Other', value: 'Other', icon: 'more-horiz' },
                                    ]}
                                />
                            </View>

                            <View style={styles.newsletterContainer}>
                                <TouchableOpacity
                                    style={styles.checkboxRow}
                                    onPress={() => setNewsletterOptIn((v) => !v)}
                                >
                                    <MdIcon
                                        name={newsletterOptIn ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                        size={22}
                                        color={COLORS.primaryOrangeHex}
                                    />
                                    <Text style={styles.newsletterText}>
                                        Send me book recommendations & reader updates
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity onPress={handleSignup} style={styles.button} disabled={isLoading}>
                                {isLoading
                                    ? <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
                                    : <Text style={styles.buttonText}>Signup</Text>}
                            </TouchableOpacity>

                            <View style={styles.registerLink}>
                                <Text style={styles.switchText}>
                                    Already have an account?{' '}
                                    <Text style={styles.linkText} onPress={toggleRegistration}>Login</Text>
                                </Text>
                            </View>
                        </View>
                    )}

                    <Text style={styles.agreementMessageText}>By continuing you agree to our</Text>
                    <View style={styles.agreementTextContainer}>
                        <TouchableOpacity onPress={() => openWebView('https://biblophile.com/policies/terms-of-service.php')}>
                            <Text style={styles.agreementText}>Terms of service</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openWebView('https://biblophile.com/policies/privacy-policy.php')}>
                            <Text style={styles.agreementText}>Privacy policy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAwareScrollView>

            {/* Keyboard toolbar — appears above the software keyboard */}
            <KeyboardToolbar
                onPrevCallback={focusPrev}
                onNextCallback={focusNext}
                isPrevDisabled={isFirstInput}
                isNextDisabled={isLastInput}
                onDoneCallback={() => inputRefs.current[focusedInput]?.blur()}
            />
        </>
    );
};

const createStyles = (COLORS: any) =>
    StyleSheet.create({
        contentContainer: {
            flexGrow: 1,
            justifyContent: 'center',
        },
        wrapper: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            backgroundColor: COLORS.primaryBlackHex,
        },
        formContainer: {
            width: '100%',
            alignItems: 'center',
        },
        statusMessage: {
            marginBottom: 10,
            textAlign: 'center',
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            marginTop: 0,
            marginBottom: 20,
            textAlign: 'center',
            color: COLORS.secondaryLightGreyHex,
        },
        inputBox: {
            marginBottom: 10,
            width: 300,
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
        },
        highlightedInput: {
            borderColor: COLORS.primaryOrangeHex,
            borderWidth: 2,
        },
        icon: {
            fontSize: 20,
            marginLeft: 10,
            color: COLORS.primaryOrangeHex,
        },
        eyeIcon: {
            marginLeft: 7,
        },
        button: {
            backgroundColor: COLORS.primaryOrangeHex,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 5,
            marginTop: 10,
            width: 300,
        },
        buttonText: {
            color: COLORS.primaryWhiteHex,
            fontSize: 18,
            textAlign: 'center',
        },
        registerLink: {
            marginTop: 20,
            alignItems: 'center',
        },
        switchText: {
            color: COLORS.secondaryLightGreyHex,
        },
        linkText: {
            color: COLORS.primaryOrangeHex,
            textDecorationLine: 'underline',
        },
        forgotText: {
            color: COLORS.primaryOrangeHex,
            textDecorationLine: 'underline',
            alignSelf: 'flex-end',
        },
        agreementMessageText: {
            marginTop: 20,
            color: COLORS.primaryLightGreyHex,
        },
        agreementTextContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 10,
        },
        agreementText: {
            color: COLORS.secondaryLightGreyHex,
            textDecorationLine: 'underline',
            margin: 10,
        },
        promptText: {
            fontSize: FONTSIZE.size_14,
            marginBottom: SPACING.space_10,
            textAlign: 'center',
            color: COLORS.primaryWhiteHex,
        },
        newsletterContainer: {
            width: 300,
            marginBottom: 10,
        },
        checkboxRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        newsletterText: {
            marginLeft: 8,
            color: COLORS.primaryWhiteHex,
            fontSize: FONTSIZE.size_14,
            flex: 1,
        },
    });

export default SignupLogin;