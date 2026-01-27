import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Platform, ToastAndroid } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import Toast from 'react-native-toast-message';
import { useCity } from '../../../contexts/CityContext';

const RequestBookButton = ({ id, isGoogleBook, product, userDetails, actualPrice }) => {
  const { selectedCity } = useCity();
  
const submitBookRequest = async () => {
  if (userDetails) {
    try {
      let bookId = id;

      if (isGoogleBook) {
        const workPayload = {
          title: product.volumeInfo?.title || '',
          description: product.volumeInfo?.description || '',
          originalLanguage: 'en', // Google Books usually doesn't give this cleanly
          authors: product.volumeInfo?.authors || [],
          genres: product.volumeInfo?.categories || [],
          edition: {
            isbn: product.volumeInfo?.industryIdentifiers
              ?.find((id) => id.type === 'ISBN_13')?.identifier || null,
            format: 'paperback', // default assumption
            pageCount: product.volumeInfo?.pageCount || null,
            language: 'en',
            publisher: null,
            publicationYear: null,
            cover: product.volumeInfo?.imageLinks?.thumbnail || null,
          },
        };
        const response = await instance.post(requests.createWork, workPayload);
        const bookResponse = response.data;

        if (bookResponse.status === "success") {
          bookId = bookResponse.data.bookId;
        } else {
          Alert.alert("Failed to add/update book");
          return;
        }
      }

      const requestData = {
        userId: userDetails[0].userId,
        bookId: bookId,
      };

      const response = await instance.post(requests.submitBookRequest, requestData);
      const submitBookRequestResponse = response.data;

      if (
        submitBookRequestResponse?.data?.message === "Updated" || 
        submitBookRequestResponse?.data?.message
      ) {
        const successMessage = submitBookRequestResponse.data.message || "Request submitted successfully!";
        
        if (Platform.OS === 'android') {
          ToastAndroid.showWithGravity(
            successMessage,
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
          );
        } else {
          Toast.show({
            type: 'success',
            text1: successMessage,
            visibilityTime: 2000,
            autoHide: true,
            position: 'bottom',
            bottomOffset: 100,
          });
        }
      } else {
        Alert.alert(submitBookRequestResponse?.message || "Something went wrong");
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Uh oh! Please try again";

      Alert.alert("Error", errorMessage);
    }
  } else {
    Alert.alert("Login to update reading status");
  }
};

  if (selectedCity == 'Bengaluru') {
    return (
      <View>
        <TouchableOpacity
          onPress={submitBookRequest}
          style={styles.SizeBox}
        >
          <Text style={[styles.SizeText, { fontSize: FONTSIZE.size_14, color: COLORS.primaryOrangeHex }]}>
            Request To Rent
          </Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    return;
  }
};

const styles = StyleSheet.create({
  SizeBox: {
    flex: 1,
    backgroundColor: COLORS.primaryDarkGreyHex,
    alignItems: 'center',
    justifyContent: 'center',
    height: SPACING.space_24 * 2,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 2,
  },
  SizeText: {
    fontFamily: FONTFAMILY.poppins_medium,
  },
});

export default RequestBookButton;