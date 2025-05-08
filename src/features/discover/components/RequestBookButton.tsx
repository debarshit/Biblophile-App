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
          const bookData = {
            ISBN: product['volumeInfo']['industryIdentifiers']?.find(id => id.type === 'ISBN_13')?.identifier || '',
            Title: product['volumeInfo']['title'] || '',
            Pages: product['volumeInfo']['pageCount'] || '',
            Price: actualPrice || 0,
            Description: product['volumeInfo']['description'] || '',
            Authors: JSON.stringify(product['volumeInfo']['authors'] || []),
            Genres: JSON.stringify(product['volumeInfo']['categories'] || []),
            Image: product['volumeInfo']['imageLinks']['thumbnail'] || ''
          };

          const bookResponse = await instance.post(requests.addBook, bookData);

          if (bookResponse.data.message === "Book added/updated successfully") {
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

        if (response.data.message === "Updated" || response.data.message) {
          if (Platform.OS === 'android') {
            ToastAndroid.showWithGravity(
              `Request Updated successfully!`,
              ToastAndroid.SHORT,
              ToastAndroid.CENTER,
            );
          } else {
            Toast.show({
              type: 'info', 
              text1: `Request Updated successfully!`,
              visibilityTime: 2000, 
              autoHide: true, 
              position: 'bottom',
              bottomOffset: 100, 
            });
          }
        }
      } catch (error) {
        console.error('Error submitting request:', error);
        Alert.alert("Uh oh! Please try again");
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