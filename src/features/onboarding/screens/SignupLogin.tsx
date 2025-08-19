import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { notificationService } from '../../../utils/notificationUtils';
import { FontAwesome as FaIcon, MaterialCommunityIcons as MdIcon } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests'; 
import {useStore} from '../../../store/store';
import { COLORS, FONTSIZE, SPACING } from '../../../theme/theme';
import Mascot from '../../../components/Mascot';
import CustomPicker from '../../../components/CustomPickerComponent';

const EyeIcon: React.FC<{ visible: boolean; onPress: () => void }> = ({ visible, onPress }) => {
    return (
        <TouchableOpacity onPress={onPress}>
            {visible ? (
                <MdIcon name='eye' style={[styles.icon, styles.eyeIcon]} />
            ) : (
                <MdIcon name='eye-off' style={[styles.icon, styles.eyeIcon]} />
            )}
        </TouchableOpacity>
    );
};

const SignupLogin: React.FC = ({ navigation }: any) => {
    const login = useStore((state: any) => state.login);

    const [isRegistration, setIsRegistration] = useState<boolean>(false);
    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
    const [focusedInput, setFocusedInput] = useState<string>('');
    const [mascotEmotion, setMascotEmotion] = useState<string>('welcome');

    //input states
    const [loginEmail , setLoginEmail] = useState<string>('');
    const [loginPass , setLoginPass] = useState<string>('');
    const [signupName , setSignupName] = useState<string>('');
    const [signupUserName, setSignupUserName] = useState<string>('');
    const [signupEmail, setSignupEmail] = useState<string>('');
    const [signupPhone , setSignupPhone] = useState<string>(null);
    const [signupPass , setSignupPass] = useState<string>('');
    const [signupPassCnf, setSignupPassCnf] = useState<string>('');
    const [source, setSource] = useState(null);
    const [loginMessage, setLoginMessage] = useState<{ text: string; color: string }>({ text: '', color: COLORS.primaryBlackHex });
    const [signupMessage, setSignupMessage] = useState<{ text: string; color: string }>({ text: '', color: COLORS.primaryBlackHex });
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleNotificationPermission = async (userData: any) => {
        try {
            // Use the notification service's permission flow
            const result = await notificationService.requestPermissions('general');
            
            if (result.success) {
                // Get the push token from the service
                const token = notificationService.getPushToken();
                completeLogin(userData, token);
            } else {
                // Complete login without notifications
                completeLogin(userData, null);
            }
        } catch (error) {
            console.error('Error handling notification permission:', error);
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

    // function to update state of input with
    // values entered by user in form
    const handleLoginEmail = (text: string) => {
        setLoginEmail(text);
    }
    
    const handleLoginPass = (text: string) => {
        setLoginPass(text);
    }
    
    const handleSignupName = (text: string) => {
        setSignupName(text);
    }

    const handleSignupUserName = (text: string) => {
        setSignupUserName(text);
    }
    
    const handleSignupEmail = (text: string) => {
        setSignupEmail(text);
    }
    
    const handleSignupPhone = (text: string) => {
        setSignupPhone(text);
    }
    
    const handleSignupPass = (text: string) => {
        setSignupPass(text);
    }
    
    const handleSignupPassCnf = (text: string) => {
        setSignupPassCnf(text);
    }

    const handleSourceChange = (text: string) => {
        setSource(text);
    }

    function toggleRegistration() {
        setIsRegistration(!isRegistration);
    }

    function togglePasswordVisibility() {
        setPasswordVisible(!passwordVisible);
        // Change mascot emotion when toggling password visibility
        setMascotEmotion(mascotEmotion ==  'eyesClosed'? 'eyesPeeping' : 'eyesClosed');
    }

    function handleFocus(inputName: string) {
        setFocusedInput(inputName);
        // Change mascot emotion based on input focus
        if (inputName === 'loginPass' || inputName === 'signupPass' || inputName === 'signupPassCnf') {
            setMascotEmotion(passwordVisible ? 'eyesPeeping' : 'eyesClosed');
        } else {
            setMascotEmotion('welcome');
        }
    }

    const validateEmail = (email: string) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };

    const validatePhone = (phone: string) => {
        const re = /^\d{10}$/;
        return re.test(phone);
    };

    const handleSignup = () => {
        if (!signupName || !signupUserName || !signupEmail || !signupPhone || !signupPass || !signupPassCnf || !source)
        {
            alert("Please fill all the details!");
            return;
        }
        if (!validateEmail(signupEmail)) {
            alert("Invalid email format!");
            return;
        }
        if (!validatePhone(signupPhone)) {
            alert("Invalid phone number format!");
            return;
        }
        else if (signupPass !== signupPassCnf) {
            alert("Passwords don't match");
            return;
        }
        else {
            async function fetchData() {
                setIsLoading(true);
                try {
                    const signupResponse = await instance.post(requests.userSignup, {
                        name: signupName,
                        userName: signupUserName,
                        email: signupEmail,
                        phone: signupPhone,
                        password: signupPass,
                        signupPassCnf: signupPassCnf,
                        source: source,
                    });

                    const response = signupResponse.data;
                    console.log(response);

                    if (response.data.message === 1)
                    {
                        setSignupMessage({ text: "Signup successful! You can login now.", color: COLORS.primaryOrangeHex });
                        setSignupName("");
                        setSignupUserName("");
                        setSignupEmail("");
                        setSignupPhone("");
                        setSignupPass("");
                        setSignupPassCnf("");
                        setSource(null);
                    }
                    else
                    {
                        setSignupMessage({ text: response.data.message, color: COLORS.primaryRedHex });
                    }
                  } catch (error) {
                    const errorMsg = error?.response?.data?.message || "Signup failed. Try again.";
                    setSignupMessage({ text: errorMsg, color: COLORS.primaryRedHex });
                  } finally {
                    setIsLoading(false);
                }
            }
            fetchData();
        }
    }

    const handleLogin = () => {
        if (!loginEmail || !loginPass)
        {
            setLoginMessage({ text: "Please fill all the details", color: COLORS.primaryRedHex });
            return;
        }
        else {
            async function fetchData() {
                setIsLoading(true);
                try {
                    const loginResponse = await instance.post(requests.userLogin, {
                        email: loginEmail,
                        pass: loginPass,
                      });

                    const response = loginResponse.data;

                    if (response.data.message === 1)
                    {
                        const userData = {
                            accessToken: response.data.accessToken,
                            refreshToken: response.data.refreshToken,
                            userId: response.data.userId,
                            userEmail: response.data.email,
                            userAddress: response.data.address,
                            userPhone: response.data.phone,
                            userName: response.data.fullName,
                            userUniqueUserName: response.data.name,
                            deposit: response.data.deposit,
                            profilePic: response.data.profilePic,
                        };

                        // Show notification permission dialog after successful login
                        await handleNotificationPermission(userData);
                    }
                    else
                    {
                        setLoginMessage({ text: response.data.message, color: COLORS.primaryRedHex });
                    }
                } catch (error) {
                    setLoginMessage({ text: "There was an error! Please try again.", color: COLORS.primaryRedHex });
                } finally {
                    setIsLoading(false); 
                }
            }
            fetchData();
        }
    }

    const forgotPassword = () => {
        if (!loginEmail)
        {
            setLoginMessage({ text: "Please fill the email address", color: COLORS.primaryRedHex });
        }
        else {
            async function fetchData() {
                try {
                    const forgotPasswordResponse = await instance.post(requests.forgotPassword, {
                        email: loginEmail,
                    });

                    const response = forgotPasswordResponse.data;
                    if (forgotPasswordResponse.data.status === 'success') {
                        setLoginMessage({ text: 'Reset link has been sent to this email id.', color: COLORS.primaryRedHex });
                    }
                  } catch (error) {
                    setLoginMessage({ text: "There was an error! Please try again.", color: COLORS.primaryRedHex });
                  }
            }
            fetchData();
        }
    }

    const openWebView = (url: string) => {
        navigation.push('Resources', {
          url: url
        });
      };

      useEffect(() => {
      
      }, [mascotEmotion])
      

    return (
        <ScrollView contentContainerStyle={styles.contentContainer}>
            <View style={styles.wrapper}>
                {!isRegistration ? (
                    <View>
                        <Mascot emotion={mascotEmotion} />
                        <Text style={styles.title}>Login</Text>
                        <Text style={[styles.successMessage, { color: loginMessage.color }]}>{loginMessage.text}</Text>
                        <View style={styles.inputBox}>
                            <View style={[styles.inputWrapper, focusedInput === 'loginEmail' && styles.highlightedInput]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder='Email id'
                                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                                    autoCapitalize='none'
                                    keyboardType='email-address'
                                    onFocus={() => handleFocus('loginEmail')}
                                    value={loginEmail} 
                                    onChangeText={(text) => handleLoginEmail(text)}
                                />
                                <FaIcon name='user' style={styles.icon} />
                            </View>
                        </View>
                        <View style={styles.inputBox}>
                            <View style={[styles.inputWrapper, focusedInput === 'loginPass' && styles.highlightedInput]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder='Password'
                                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                                    secureTextEntry={!passwordVisible}
                                    autoCapitalize='none'
                                    keyboardType='default'
                                    onFocus={() => handleFocus('loginPass')}
                                    value={loginPass} 
                                    onChangeText={(text) => handleLoginPass(text)}
                                />
                                <EyeIcon visible={passwordVisible} onPress={togglePasswordVisibility} />
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => forgotPassword()}>
                            <Text style={styles.forgotText}>Forgot password?</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleLogin} style={styles.button} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator size='small' color={COLORS.primaryWhiteHex} />
                            ) : (
                                <Text style={styles.buttonText}>Login</Text>
                            )}
                        </TouchableOpacity>
                        <View style={styles.registerLink}>
                            <Text style={styles.switchText}>Don't have an account? <Text style={styles.linkText} onPress={toggleRegistration}>Register</Text></Text>
                        </View>
                    </View>
                ) : (
                    <View>
                        <Mascot emotion={mascotEmotion}/>
                        <Text style={styles.title}>Sign up</Text>
                        <Text style={[styles.successMessage, { color: signupMessage.color }]}>{signupMessage.text}</Text>
                        <View style={styles.inputBox}>
                            <View style={[styles.inputWrapper, focusedInput === 'signupName' && styles.highlightedInput]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder='Full Name'
                                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                                    autoCapitalize='none'
                                    keyboardType='default'
                                    onFocus={() => handleFocus('signupName')}
                                    value={signupName} 
                                    onChangeText={(text) => handleSignupName(text)}
                                />
                                <FaIcon name='user' style={styles.icon} />
                            </View>
                        </View>
                        <View style={styles.inputBox}>
                            <View style={[styles.inputWrapper, focusedInput === 'signupUserName' && styles.highlightedInput]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder='Unique Username'
                                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                                    autoCapitalize='none'
                                    keyboardType='default'
                                    onFocus={() => handleFocus('signupUserName')}
                                    value={signupUserName} 
                                    onChangeText={(text) => handleSignupUserName(text)}
                                />
                                <FaIcon name='user' style={styles.icon} />
                            </View>
                        </View>
                        <View style={styles.inputBox}>
                            <View style={[styles.inputWrapper, focusedInput === 'signupEmail' && styles.highlightedInput]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder='Email id'
                                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                                    autoCapitalize='none'
                                    keyboardType='email-address'
                                    onFocus={() => handleFocus('signupEmail')}
                                    value={signupEmail} 
                                    onChangeText={(text) => handleSignupEmail(text)}
                                />
                                <MdIcon name='email' style={styles.icon} />
                            </View>
                        </View>
                        <View style={styles.inputBox}>
                            <View style={[styles.inputWrapper, focusedInput === 'signupPhone' && styles.highlightedInput]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder='Phone'
                                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                                    autoCapitalize='none'
                                    keyboardType='phone-pad'
                                    onFocus={() => handleFocus('signupPhone')}
                                    value={signupPhone} 
                                    onChangeText={(text) => handleSignupPhone(text)}
                                />
                                <FaIcon name='phone' style={styles.icon} />
                            </View>
                        </View>
                        <View style={styles.inputBox}>
                            <View style={[styles.inputWrapper, focusedInput === 'signupPass' && styles.highlightedInput]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder='Password'
                                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                                    secureTextEntry={true}
                                    autoCapitalize='none'
                                    keyboardType='default'
                                    onFocus={() => handleFocus('signupPass')}
                                    value={signupPass} 
                                    onChangeText={(text) => handleSignupPass(text)}
                                />
                                <FaIcon name='lock' style={styles.icon} />
                            </View>
                        </View>
                        <View style={styles.inputBox}>
                            <View style={[styles.inputWrapper, focusedInput === 'signupPassCnf' && styles.highlightedInput]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder='Confirm password'
                                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                                    secureTextEntry={true}
                                    autoCapitalize='none'
                                    keyboardType='default'
                                    onFocus={() => handleFocus('signupPassCnf')}
                                    value={signupPassCnf} 
                                    onChangeText={(text) => handleSignupPassCnf(text)}
                                />
                                <FaIcon name='lock' style={styles.icon} />
                            </View>
                        </View>
                        <Text style={styles.promptText}>How did you find us?</Text>
                        <View style={styles.inputBox}>
                            <CustomPicker
                                selectedValue={source}
                                onValueChange={handleSourceChange}
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
                        <TouchableOpacity onPress={handleSignup} style={styles.button} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator size='small' color={COLORS.primaryWhiteHex} />
                            ) : (
                                <Text style={styles.buttonText}>Signup</Text>
                            )}
                        </TouchableOpacity>
                        <View style={styles.registerLink}>
                            <Text style={styles.switchText}>Already have an account? <Text style={styles.linkText} onPress={toggleRegistration}>Login</Text></Text>
                        </View>
                    </View>
                )}
                <Text  style={styles.agreementMessageText}>By continuing you agree to our</Text>
                <View style={styles.agreementTextContainer}>
                <TouchableOpacity onPress={() => {
                    openWebView('https://biblophile.com/policies/terms-of-service.php')
                }}>
                    <Text  style={styles.agreementText}>Terms of service</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                    openWebView('https://biblophile.com/policies/privacy-policy.php')
                }}>
                    <Text  style={styles.agreementText}>Privacy policy</Text>
                </TouchableOpacity>
                </View>
            </View>
    </ScrollView>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        height: 'auto'
    },
    wrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: COLORS.primaryBlackHex,
    },
    successMessage: {
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
    },
    buttonText: {
        color: COLORS.primaryWhiteHex,
        fontSize: 18,
        textAlign: 'center',
    },
    registerLink: {
        marginTop: 20,
        alignItems: 'center',
        textDecorationColor: 'blue',
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
});

export default SignupLogin;
