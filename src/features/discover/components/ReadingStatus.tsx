import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, ToastAndroid } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Entypo from '@expo/vector-icons/Entypo';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import {
    BORDERRADIUS,
    COLORS,
    FONTFAMILY,
    FONTSIZE,
    SPACING,
  } from '../../../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import CustomPicker, { PickerOption } from '../../../components/CustomPickerComponent';


const ReadingStatus = ({ id, isGoogleBook, product }) => {
    const [status, setStatus] = useState('To be read');
    const [currentPage, setCurrentPage] = useState('');
    const [updateMessage, setUpdateMessage] = useState(null);

    const userDetails = useStore((state: any) => state.userDetails);

    const statusOptions: PickerOption[] = [
        ...(status === 'Currently reading' || status === 'Paused'
            ? [{ label: 'Paused', value: 'Paused', icon: 'pause' }]
            : []),
        { label: 'Read', value: 'Read', icon: 'check-circle' },
        { label: 'Currently reading', value: 'Currently reading', icon: 'menu-book' },
        { label: 'To be read', value: 'To be read', icon: 'bookmark-border' },
        { label: 'Did not finish', value: 'Did not finish', icon: 'cancel' },
        { label: 'Remove', value: 'Remove', icon: 'delete' },
    ];

    async function fetchReadingStatus() {
        if (userDetails) {
            try {
                let bookIdToFetch = id;

                if (isGoogleBook) {
                    const isbn = product.volumeInfo?.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || '';
                    if (isbn) {
                        const response = await instance.get(requests.fetchBookId(isbn));
                        const bookIdResponse = response.data;
                        if (bookIdResponse.data.bookId) {
                            bookIdToFetch = bookIdResponse.data.bookId;
                        } else {
                            return;
                        }
                    }
                }

                const response = await instance.get(requests.fetchReadingStatus(bookIdToFetch), {
                    headers: {
                        Authorization: `Bearer ${userDetails[0].accessToken}`,
                    },
                });

                const readingStatusResponse = response.data;

                if (readingStatusResponse.data.status) {
                    setStatus(readingStatusResponse.data.status);
                }

                if (readingStatusResponse.data.currentPage) {
                    setCurrentPage(readingStatusResponse.data.currentPage);
                }
                
            } catch (error) {
                console.error('Error fetching emotions:', error);
            }
        }
    }

    useEffect(() => {
        fetchReadingStatus();
    }, [product]);

    interface ReadingStatusRequest {
        bookId: any;
        status: string;
        currentPage?: string; // Optional property
    }

    const submitReadingStatus = async () => {
        if (userDetails) {
            try {
                let bookId = id;

                if (isGoogleBook) {
                    const bookData = {
                        ISBN: product.volumeInfo?.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || '',
                        Title: product.volumeInfo?.title || '',
                        Pages: product.volumeInfo?.pageCount || '',
                        Price: product.saleInfo?.listPrice?.amount || 0,
                        Description: product.volumeInfo?.description || '',
                        Authors: JSON.stringify(product.volumeInfo?.authors || []),
                        Genres: JSON.stringify(product.volumeInfo?.categories || []),
                        Image: product.volumeInfo?.imageLinks?.thumbnail || ''
                    };

                    const response = await instance.post(requests.addBook, bookData);
                    const bookResponse = response.data;

                    if (bookResponse.data.message === "Book added/updated successfully") {
                        bookId = bookResponse.data.bookId;
                    } else {
                        setUpdateMessage("Failed to add/update book");
                        return;
                    }
                }

                const requestData: ReadingStatusRequest = {
                    bookId: bookId,
                    status: status,
                };

                if (status === "Currently reading") {
                    requestData.currentPage = currentPage;
                }

                const response = await instance.post(requests.submitReadingStatus, requestData, {
                    headers: {
                        Authorization: `Bearer ${userDetails[0].accessToken}`,
                    },
                });
                
                const submitReadingStatusResponse = response.data;

                if (submitReadingStatusResponse.data.message === "Updated") {
                    setUpdateMessage("Updated successfully!");
                    if (Platform.OS == 'android') {
                        ToastAndroid.showWithGravity(
                          `Updated successfully!`,
                          ToastAndroid.SHORT,
                          ToastAndroid.CENTER,
                        );
                      }
                      else {
                        Toast.show({
                          type: 'info', 
                          text1: `Updated successfully!`,
                          visibilityTime: 2000, 
                          autoHide: true, 
                          position: 'bottom',
                          bottomOffset: 100, 
                        });
                      }
                } else {
                    setUpdateMessage(submitReadingStatusResponse.data.message);
                    if (Platform.OS == 'android') {
                        ToastAndroid.showWithGravity(
                          `Updated successfully!`,
                          ToastAndroid.SHORT,
                          ToastAndroid.CENTER,
                        );
                      }
                      else {
                        Toast.show({
                          type: 'info', 
                          text1: `Updated successfully!`,
                          visibilityTime: 2000, 
                          autoHide: true, 
                          position: 'bottom',
                          bottomOffset: 100, 
                        });
                    }
                }
            } catch (error) {
                console.error('Error submitting score:', error);
                setUpdateMessage("Uh oh! Please try again");
            }
        } else {
            setUpdateMessage("Login to update reading status");
        }
    };

    return (
        <View style={styles.container}>
            {updateMessage && <Text style={styles.updateMessage}>{updateMessage}</Text>}
            <View style={styles.statusDropdown}>
                {/* <Text style={styles.label}>Status: </Text> */}
                <View style={styles.pickerContainer}>
                    {Platform.OS === 'ios' ? (
                        <CustomPicker
                          options={statusOptions}
                          selectedValue={status}
                          onValueChange={(value) => setStatus(value)}
                        />
                    ) : (
                        <Picker
                        selectedValue={status}
                        style={styles.picker}
                        onValueChange={(itemValue) => setStatus(itemValue)}
                        >
                        {(status === 'Currently reading' || status === 'Paused') && (
                            <Picker.Item label="Paused" value="Paused" />
                        )}
                        <Picker.Item label="Read" value="Read" />
                        <Picker.Item label="Currently reading" value="Currently reading" />
                        <Picker.Item label="To be read" value="To be read" />
                        <Picker.Item label="Did not finish" value="Did not finish" />
                        <Picker.Item label="Remove" value="Remove" />
                        </Picker>
                    )}
                </View>
            </View>
            {status === 'Currently reading' && (
                <View style={styles.pageNumberInput}>
                    {/* <Text style={styles.label}>Current Page:</Text> */}
                    <TextInput
                        style={styles.input}
                        placeholder='current page'
                        placeholderTextColor={COLORS.secondaryLightGreyHex}
                        keyboardType="numeric"
                        value={String(currentPage)}
                        onChangeText={(text) => setCurrentPage(text)}
                    />
                </View>
            )}
            <TouchableOpacity onPress={submitReadingStatus}>
                <View style={styles.iconContainer}>
                    <LinearGradient
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
                        style={styles.LinearGradientBG}>
                        <Entypo name="check" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_24}/>
                    </LinearGradient>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
    },
    iconContainer: {
        height: SPACING.space_36,
        width: SPACING.space_36,
        borderWidth: 2,
        borderColor: COLORS.secondaryDarkGreyHex,
        borderRadius: SPACING.space_12,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.secondaryDarkGreyHex,
        overflow: 'hidden',
      },
      LinearGradientBG: {
        height: SPACING.space_36,
        width: SPACING.space_36,
        alignItems: 'center',
        justifyContent: 'center',
      },
    updateMessage: {
        fontFamily: FONTFAMILY.poppins_bold,
        fontSize: FONTSIZE.size_16,
        color: COLORS.primaryOrangeHex,
        marginBottom: SPACING.space_8,
    },
    statusDropdown: {
        flexDirection: 'row',
        alignSelf: 'center',
        marginBottom: SPACING.space_16,
        fontFamily: FONTFAMILY.poppins_regular,
        color: COLORS.primaryWhiteHex,
    },
    // label: {
    //     marginRight: SPACING.space_8,
    //     color: COLORS.primaryWhiteHex,
    // },
    pickerContainer: {
        borderRadius: BORDERRADIUS.radius_8,
        width: 250,
    },
    picker: {
        width: '100%',
        padding: SPACING.space_8,
        borderColor: COLORS.secondaryLightGreyHex,
        borderRadius: BORDERRADIUS.radius_10,
        fontFamily: FONTFAMILY.poppins_regular,
        color: COLORS.primaryWhiteHex,
    },
    pageNumberInput: {
        flexDirection: 'row',
        alignSelf: 'center',
        marginBottom: SPACING.space_16,
    },
    input: {
        padding: 8,
        backgroundColor: COLORS.primaryGreyHex,
        borderColor: COLORS.secondaryLightGreyHex,
        borderWidth: 1,
        borderRadius: BORDERRADIUS.radius_8,
        color: COLORS.primaryWhiteHex,
        fontFamily: FONTFAMILY.poppins_regular,
        fontSize: FONTSIZE.size_16,
        width: 150,
    },
});

export default ReadingStatus;
