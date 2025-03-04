import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { COLORS, FONTFAMILY, FONTSIZE } from '../../../theme/theme';

const ProfileScreen = ({navigation, route}: any) => {
    const userDetails = useStore((state: any) => state.userDetails);
    const updateProfile = useStore((state: any) => state.updateProfile);

    const [name, setName] = useState<string>(userDetails[0].userName);
    const [userName, setUserName] = useState<string>(userDetails[0].userUniqueUserName);
    const [email, setEmail] = useState<string>(userDetails[0].userEmail);
    const [phone, setPhone] = useState<string>(userDetails[0].userPhone);
    const [address, setAddress] = useState<string>(userDetails[0].userAddress);
    const [password, setPassword] = useState<string>('');
    const [passwordCnf, setPasswordCnf] = useState<string>('');
    const [avatar, setAvatar] = useState<string>(userDetails[0].profilePic);
    const [updateMessage, setUpdateMessage] = useState<{ text: string; color: string }>({ text: '', color: COLORS.primaryBlackHex });

    const [focusedInput, setFocusedInput] = useState<string>('');
    

    const handleSave = () => {
        if (!name || !userName || !email || !phone || !password || !passwordCnf || !address)
        {
            setUpdateMessage({ text: "Please fill all the details", color: COLORS.primaryRedHex });
        }
        else if (password !== passwordCnf) {
            setUpdateMessage({ text: "Passwords don't match", color: COLORS.primaryRedHex });
        }
        else {
            async function fetchData() {
                try {
                    const response = await instance.post(requests.updateAppUserData, {
                        userId: userDetails[0].userId,
                        name: name,
                        userName: userName,
                        email: email,
                        phone: phone,
                        address: address,
                        password: password,
                        passwordCnf: passwordCnf,
                      });
                    if (response.data.message === 1)
                    {
                        setUpdateMessage({ text: "Your details have been successfully updated", color: COLORS.primaryOrangeHex });
                        updateProfile(name, email, phone, address);
                        console.log(userDetails[0].userAddress);
                    }
                    else
                    {
                        setUpdateMessage({ text: response.data.message, color: COLORS.primaryRedHex });
                    }
                  } catch (error) {
                    console.log(error);
                  }
            }
            fetchData();
        }
    }

    function handleFocus(inputName: string) {
        setFocusedInput(inputName);
    }

    useEffect(() => {
      if (route.params) {
        alert (route.params.update);
      }
    
    }, [])
    

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: COLORS.primaryBlackHex }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Adjust behavior for different platforms
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Offset to adjust the view position
        >
            <ScrollView>
            <View style={styles.wrapper}>
                <Text style={styles.title}>Edit Profile</Text>
                <TouchableOpacity onPress={() => {}}>
                    <Image
                    source={{ uri: avatar }}
                    style={{ width: 100, height: 100, borderRadius: 50, margin: 20, }}
                    />
                </TouchableOpacity>
                <Text style={[styles.updateMessage, { color: updateMessage.color }]}>{updateMessage.text}</Text>
                <View style={styles.inputBox}>
                    <View style={[styles.inputWrapper, focusedInput === 'name' && styles.highlightedInput]}>
                        <TextInput
                            style={styles.input}
                            placeholder='Full Name'
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            autoCapitalize='none'
                            keyboardType='default'
                            onFocus={() => handleFocus('name')}
                            value={name} 
                            onChangeText={(text) => setName(text)}
                        />
                    </View>
                </View>
                <View style={styles.inputBox}>
                    <View style={[styles.inputWrapper, focusedInput === 'userName' && styles.highlightedInput]}>
                        <TextInput
                            style={styles.input}
                            placeholder='Unique Username'
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            autoCapitalize='none'
                            keyboardType='default'
                            onFocus={() => handleFocus('userName')}
                            value={userName} 
                            onChangeText={(text) => setUserName(text)}
                        />
                    </View>
                </View>
                <View style={styles.inputBox}>
                    <View style={[styles.inputWrapper, focusedInput === 'email' && styles.highlightedInput]}>
                        <TextInput
                            style={styles.input}
                            placeholder='Email id'
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            autoCapitalize='none'
                            keyboardType='default'
                            onFocus={() => handleFocus('email')}
                            value={email} 
                            onChangeText={(text) => setEmail(text)}
                        />
                    </View>
                </View>
                <View style={styles.inputBox}>
                    <View style={[styles.inputWrapper, focusedInput === 'phone' && styles.highlightedInput]}>
                        <TextInput
                            style={styles.input}
                            placeholder='Phone number'
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            autoCapitalize='none'
                            keyboardType='default'
                            onFocus={() => handleFocus('phone')}
                            value={phone} 
                            onChangeText={(text) => setPhone(text)}
                        />
                    </View>
                </View>
                <View style={styles.inputBox}>
                    <View style={[styles.inputWrapper, focusedInput === 'address' && styles.highlightedInput]}>
                        <TextInput
                            style={[styles.input, styles.addressInput]}
                            placeholder='Address'
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            autoCapitalize='none'
                            keyboardType='default'
                            multiline={true} 
                            numberOfLines={4}
                            onFocus={() => handleFocus('address')}
                            value={address} 
                            onChangeText={(text) => setAddress(text)}
                        />
                    </View>
                </View>
                <View style={styles.inputBox}>
                    <View style={[styles.inputWrapper, focusedInput === 'password' && styles.highlightedInput]}>
                        <TextInput
                            style={styles.input}
                            placeholder='Password'
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            secureTextEntry={true}
                            autoCapitalize='none'
                            keyboardType='default'
                            onFocus={() => handleFocus('password')}
                            value={password} 
                            onChangeText={(text) => setPassword(text)}
                        />
                    </View>
                </View>
                <View style={styles.inputBox}>
                    <View style={[styles.inputWrapper, focusedInput === 'passwordCnf' && styles.highlightedInput]}>
                        <TextInput
                            style={styles.input}
                            placeholder='Confirm password'
                            placeholderTextColor={COLORS.secondaryLightGreyHex}
                            secureTextEntry={true}
                            autoCapitalize='none'
                            keyboardType='default'
                            textContentType='password'
                            onFocus={() => handleFocus('passwordCnf')}
                            value={passwordCnf} 
                            onChangeText={(text) => setPasswordCnf(text)}
                        />
                    </View>
                </View>
                
                <TouchableOpacity onPress={() => handleSave()} style={styles.button}>
                    <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default ProfileScreen

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
        fontFamily:FONTFAMILY.poppins_semibold,
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
        color: COLORS.secondaryLightGreyHex,
    },
    updateMessage: {
        marginBottom: 10,
        textAlign: 'center',
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
    button: {
        backgroundColor: COLORS.primaryOrangeHex,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 10,
    },
    buttonText: {
        color: COLORS.primaryWhiteHex,
        fontSize: FONTSIZE.size_18,
        fontFamily: FONTFAMILY.poppins_medium,
        textAlign: 'center',
    },
})