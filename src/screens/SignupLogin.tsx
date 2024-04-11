import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { FontAwesome as FaIcon, MaterialCommunityIcons as MdIcon } from '@expo/vector-icons';
import instance from '../services/axios';
import requests from '../services/requests'; 
import {useStore} from '../store/store';
import { COLORS } from '../theme/theme';


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
    const addUser = useStore((state: any) => state.addUser);

    const [isRegistration, setIsRegistration] = useState<boolean>(false);
    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
    const [focusedInput, setFocusedInput] = useState<string>('');

    //input states
    const [loginEmail , setLoginEmail] = useState<string>('');
    const [loginPass , setLoginPass] = useState<string>('');
    const [signupName , setSignupName] = useState<string>('');
    const [signupEmail, setSignupEmail] = useState<string>('');
    const [signupPhone , setSignupPhone] = useState<string>(null);
    const [signupPass , setSignupPass] = useState<string>('');
    const [signupPassCnf, setSignupPassCnf] = useState<string>('');
    const [loginMessage, setLoginMessage] = useState<{ text: string; color: string }>({ text: '', color: COLORS.primaryBlackHex });
    const [signupMessage, setSignupMessage] = useState<{ text: string; color: string }>({ text: '', color: COLORS.primaryBlackHex });

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

    function toggleRegistration() {
        setIsRegistration(!isRegistration);
    }

    function togglePasswordVisibility() {
        setPasswordVisible(!passwordVisible);
    }

    function handleFocus(inputName: string) {
        setFocusedInput(inputName);
    }

    const handleSignup = () => {
        if (!signupName || !signupEmail || !signupPhone || !signupPass || !signupPassCnf)
        {
            alert("Please fill all the details!");
        }
        else if (signupPass !== signupPassCnf) {
            alert("Passwords don't match");
        }
        else {
            async function fetchData() {
                try {
                    const response = await instance.post(requests.userSignup, {
                        name: signupName,
                        email: signupEmail,
                        phone: signupPhone,
                        password: signupPass,
                        signupPassCnf: signupPassCnf,
                      });
                    if (response.data.message === 1)
                    {
                        setSignupMessage({ text: "Signup successful! You can login now.", color: COLORS.primaryOrangeHex });
                        setSignupName("");
                        setSignupEmail("");
                        setSignupPhone("");
                        setSignupPass("");
                        setSignupPassCnf("");
                    }
                    else
                    {
                        setSignupMessage({ text: response.data.message, color: COLORS.primaryRedHex });
                    }
                  } catch (error) {
                    console.log(error);
                  }
            }
            fetchData();
        }
    }

    const handleLogin = () => {
        if (!loginEmail || !loginPass)
        {
            setLoginMessage({ text: "Please fill all the details", color: COLORS.primaryRedHex });
        }
        else {
            async function fetchData() {
                try {
                    const response = await instance.post(requests.userLogin, {
                        email: loginEmail,
                        pass: loginPass,
                      });
                    if (response.data.message === 1)
                    {

                        const newUser = {
                            userId: response.data.userId,
                            userEmail: response.data.email,
                            userAddress: response.data.address,
                            userPhone: response.data.phone,
                            userName: response.data.name,
                            deposit: response.data.deposit,
                            profilePic: response.data.profilePic,
                          };
                          
                          login(newUser);
            
                    }
                    else
                    {
                        setLoginMessage({ text: response.data.message, color: COLORS.primaryRedHex });
                    }
                  } catch (error) {
                    setLoginMessage({ text: "There was an error! Please try again.", color: COLORS.primaryRedHex });
                  }
            }
            fetchData();
        }
    }

    const openWebView = (url: string) => {
        navigation.navigate('Resources', {
          url: url
        });
      };

    return (
        <View style={styles.wrapper}>
            {!isRegistration ? (
                <View>
                    <Image source={require('../assets/app_images/welcome.jpg')} style={styles.image} />
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
                    <TouchableOpacity onPress={() => handleLogin()} style={styles.button}>
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                    <View style={styles.registerLink}>
                        <Text style={styles.switchText}>Don't have an account? <Text style={styles.linkText} onPress={toggleRegistration}>Register</Text></Text>
                    </View>
                </View>
            ) : (
                <View>
                    <Image source={require('../assets/app_images/welcome.jpg')} style={styles.image} />
                    <Text style={styles.title}>Sign up</Text>
                    <Text style={[styles.successMessage, { color: signupMessage.color }]}>{signupMessage.text}</Text>
                    <View style={styles.inputBox}>
                        <View style={[styles.inputWrapper, focusedInput === 'signupUsername' && styles.highlightedInput]}>
                            <TextInput
                                style={styles.input}
                                placeholder='Username'
                                placeholderTextColor={COLORS.secondaryLightGreyHex}
                                autoCapitalize='none'
                                keyboardType='default'
                                onFocus={() => handleFocus('signupUsername')}
                                value={signupName} 
                                onChangeText={(text) => handleSignupName(text)}
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
                    <TouchableOpacity onPress={() => handleSignup()} style={styles.button}>
                        <Text style={styles.buttonText}>Sign up</Text>
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
                openWebView('https://biblophile.com/policies/terms-of-service.php')
              }}>
                <Text  style={styles.agreementText}>Privacy policy</Text>
            </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
    image: {
        width: 200, 
        height: 200, 
        resizeMode: 'contain',
        alignSelf: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
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
});

export default SignupLogin;
