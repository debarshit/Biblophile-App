import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Entypo from '@expo/vector-icons/Entypo';
import instance from '../services/axios';
import requests from '../services/requests';
import { useStore } from '../store/store';
import {
    BORDERRADIUS,
    COLORS,
    FONTFAMILY,
    FONTSIZE,
    SPACING,
  } from '../theme/theme';


const ReadingStatus = ({ id, isGoogleBook, product }) => {
    const [status, setStatus] = useState('To be read');
    const [currentPage, setCurrentPage] = useState('');
    const [updateMessage, setUpdateMessage] = useState(null);

    const userDetails = useStore((state: any) => state.userDetails);

    async function fetchReadingStatus() {
        if (userDetails) {
            try {
                let bookIdToFetch = id;

                if (isGoogleBook) {
                    const isbn = product.volumeInfo?.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || '';
                    if (isbn) {
                        const bookIdResponse = await instance.post(requests.fetchBookId, { ISBN: isbn });
                        if (bookIdResponse.data.bookId) {
                            bookIdToFetch = bookIdResponse.data.bookId;
                        } else {
                            return;
                        }
                    }
                }

                const response = await instance.post(requests.fetchReadingStatus, {
                    userId: userDetails[0].userId,
                    bookId: bookIdToFetch,
                });

                if (response.data.status) {
                    setStatus(response.data.status);
                }

                if (response.data.currentPage) {
                    setCurrentPage(response.data.currentPage);
                }
                
            } catch (error) {
                console.error('Error fetching emotions:', error);
            }
        }
    }

    useEffect(() => {
        fetchReadingStatus();
    }, [product]);

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

                    const bookResponse = await instance.post(requests.addBook, bookData);

                    if (bookResponse.data.message === "Book added/updated successfully") {
                        bookId = bookResponse.data.bookId;
                    } else {
                        setUpdateMessage("Failed to add/update book");
                        return;
                    }
                }

                const requestData = {
                    userId: userDetails[0].userId,
                    bookId: bookId,
                    status: status,
                    currentPage: currentPage,
                };

                if (status === "Currently reading") {
                    requestData.currentPage = currentPage;
                }

                const response = await instance.post(requests.submitReadingStatus, requestData);

                if (response.data.message === "Updated") {
                    setUpdateMessage("Updated successfully!");
                } else {
                    setUpdateMessage(response.data.message);
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
                <Picker
                    selectedValue={status}
                    style={styles.picker}
                    onValueChange={(itemValue) => setStatus(itemValue)}
                >
                    <Picker.Item label="Read" value="Read" />
                    <Picker.Item label="Currently reading" value="Currently reading" />
                    <Picker.Item label="To be read" value="To be read" />
                </Picker>
                <TouchableOpacity onPress={submitReadingStatus}>
                <Entypo name="check" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_24}/>
                </TouchableOpacity>
            </View>
            {status === 'Currently reading' && (
                <View style={styles.pageNumberInput}>
                    <Text style={styles.label}>Current Page:</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={String(currentPage)}
                        onChangeText={(text) => setCurrentPage(text)}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        padding: SPACING.space_16,
    },
    updateMessage: {
        fontFamily: 'Poppins-Bold',
        fontSize: 16,
        color: 'orange',
        marginBottom: 8,
    },
    statusDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.space_16,
        fontFamily: FONTFAMILY.poppins_regular,
        color: COLORS.primaryWhiteHex,
    },
    label: {
        marginRight: SPACING.space_8,
        color: COLORS.primaryWhiteHex,
    },
    picker: {
        width: 150,
        padding: SPACING.space_8,
        borderColor: COLORS.secondaryLightGreyHex,
        borderRadius: BORDERRADIUS.radius_8,
        fontFamily: FONTFAMILY.poppins_regular,
        color: 'white',
        backgroundColor: COLORS.primaryGreyHex,
    },
    pageNumberInput: {
        flexDirection: 'row',
        alignItems: 'center',
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
        width: 100,
        maxWidth: 120,
    },
});

export default ReadingStatus;
