import React, { useEffect, useState } from 'react'
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { FontAwesome } from '@expo/vector-icons';
import { useStore } from '../store/store';
import instance from '../services/axios';
import requests from '../services/requests';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import PageStatus from './PageStatus';

const PagesReadInput = ({navigation}: any) => {
  const [pagesRead, setPagesRead] = useState<string>('');
  const [currentReads, setCurrentReads] = useState<any[]>([]);
  const [refreshData, setRefreshData] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const userDetails = useStore((state: any) => state.userDetails);

  const fetchCurrentReads = async () => {
    try {
      const response = await instance.post(requests.fetchCurrentReads, {
        userId: userDetails[0].userId,
      });
      setCurrentReads(response.data.currentReads);
    } catch (error) {
      console.error('Failed to fetch current reads:', error);
    }
  };

  const fetchPagesRead = async () => {
    try {
      const response = await instance.get(`${requests.fetchPagesRead}${userDetails[0].userId}`);
      if (Array.isArray(response.data)) {
        const currentDate = new Date().setHours(0, 0, 0, 0);
        const todayPagesRead = response.data.find((item: any) => {
          const itemDate = new Date(item.dateRead).setHours(0, 0, 0, 0);
          return itemDate === currentDate;
        });

        if (todayPagesRead) {
          setPagesRead(todayPagesRead.pagesRead);
        } else {
          setPagesRead('');
        }
      } else {
        console.error('Pages read data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch pages read:', error);
    }
  };

  const convertHttpToHttps = (url) => {
    if (url && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  useEffect(() => {
    fetchCurrentReads();
    fetchPagesRead();
  }, [refreshData]);

  const updatePagesRead = async () => {
    if (pagesRead !== '') {
      try {
        const response = await instance.post(requests.updatePagesRead, {
          userId: userDetails[0].userId,
          pageCount: pagesRead,
        });
        if (response.data.message === 'Updated') {
          Alert.alert('Success', 'Updated');
          setRefreshData(prev => !prev);
        } else {
          Alert.alert('Error', response.data.message);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to update pages read.');
        console.log(error);
      }
    } else {
      Alert.alert('Page count is 0', 'Please enter number of pages read!');
    }
  };

  const toggleTooltip = () => {
    setShowTooltip(prev => !prev);
  };

  return (
    <View style={styles.pagesReadContainer}>
      {currentReads.length > 0 && (
        <ScrollView horizontal contentContainerStyle={styles.currentReads}>
          {currentReads.map((book) => (
            <View key={book.BookId} style={styles.book}>
              <TouchableOpacity
                onPress={() => {
                  navigation.push('Details', {
                    id: book.BookId,
                    type: "Book",
                  });
              }}>
                <Image source={{ uri: convertHttpToHttps(book.BookPhoto) }} style={styles.bookPhoto} />
              </TouchableOpacity>
              <PageStatus id={book.BookId} page={book.CurrentPage} startDate={book.StartDate} onUpdate={() => setRefreshData(prev => !prev)} status='Currently reading'/>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={styles.inputBox}>
        <View style={styles.inputLabelContainer}>
          <Text style={styles.inputLabel}>Pages read today</Text>
          <TouchableOpacity onPress={toggleTooltip} style={styles.infoIconContainer}>
            <FontAwesome name="info-circle" style={styles.infoIcon} />
            {showTooltip && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>
                  This is automatically updated, but you can update it manually if there's an inaccuracy.
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder='Optional'
          placeholderTextColor={COLORS.secondaryLightGreyHex}
          autoCapitalize='none'
          keyboardType='numeric'
          value={pagesRead}
          onChangeText={(text) => setPagesRead(text)}
          accessibilityLabel="Pages Read"
          accessibilityHint="Enter the number of pages read today"
        />
        <TouchableOpacity onPress={updatePagesRead} style={styles.button}>
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
        <Text style={styles.subtext}>
          Automatically updated from your reading progress. Update manually only if inaccurate.
        </Text>
      </View>
    </View>
  );
};

export default PagesReadInput;

const styles = StyleSheet.create({
  pagesReadContainer: {
    marginBottom: SPACING.space_20,
    alignItems: 'center',
  },
  currentReads: {
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_20,
  },
  book: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_10,
    borderRadius: 8,
    marginHorizontal: SPACING.space_10,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bookPhoto: {
    width: 100,
    height: 150,
    borderRadius: 5,
  },
  inputBox: {
    alignItems: 'center',
    gap: SPACING.space_10,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_4,
    position: 'relative',
  },
  inputLabel: {
    color: COLORS.primaryWhiteHex,
  },
  input: {
    padding: SPACING.space_10,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderColor: COLORS.primaryLightGreyHex,
    borderWidth: 1,
    borderRadius: 5,
    color: COLORS.primaryWhiteHex,
    width: 300,
    textAlign: 'center',
    zIndex: -1,
  },
  button: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_4,
    paddingHorizontal: SPACING.space_20,
    borderRadius: 5,
    marginTop: SPACING.space_10,
    width: 'auto',
    alignSelf: 'center',
    transform: [{ scale: 1 }],
  },
  buttonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_medium,
    textAlign: 'center',
  },
  subtext: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    marginTop: SPACING.space_4,
    textAlign: 'center',
  },
  infoIconContainer: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: 20,
    right: 5,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    color: COLORS.primaryWhiteHex,
    padding: SPACING.space_4,
    borderRadius: 4,
    fontSize: FONTSIZE.size_12,
    width: 200,
    zIndex: 1,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  tooltipText: {
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  infoIcon: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_18,
  },
});
