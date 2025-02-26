import React, { useEffect, useState } from 'react'
import * as Notifications from 'expo-notifications';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { FontAwesome } from '@expo/vector-icons';
import { useStore } from '../store/store';
import instance from '../services/axios';
import requests from '../services/requests';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import PageStatus from './PageStatus';
import SourceReferralModal from './SourceReferralModal';
import SessionPrompt from './SessionPrompt';

const PagesReadInput = ({navigation}: any) => {
  const [pagesRead, setPagesRead] = useState<string>('0');
  const [currentReads, setCurrentReads] = useState<any[]>([]);
  const [refreshData, setRefreshData] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);

  const userDetails = useStore((state: any) => state.userDetails);

  //states for reading sessions
  const [showSessionPrompt, setShowSessionPrompt] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [promptMessage, setPromptMessage] = useState("");
  const [isCompletingSession, setIsCompletingSession] = useState(false);

  const startingTime = useStore((state: any) => state.sessionStartTime);
  const startingPage = useStore((state: any) => state.sessionStartPage);
  const setStartPage = useStore(
    (state: any) => state.setStartPage,
  );
  const clearSession = useStore(
    (state: any) => state.clearSession,
  );

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

  const handleSaveSession = () => {
    if (sessionData) {
      const diffInPages = Number(pagesRead) - Number(startingPage);
      console.log(`Saving session from ${sessionData.startTime} to ${new Date()} with ${diffInPages} pages read.`);   
      
      //send the data to backend
      instance.post(requests.submitReadingDuration, sessionData)
        .then(response => {
          console.log('Session saved:', response.data);
          // Handle successful response
        })
        .catch(error => {
          console.error('Error saving session:', error);
          // Handle error
      });

      clearSession();
      setSessionData(null);
    }
    setShowSessionPrompt(false);
};

const handleCancelSave = () => {
  setShowSessionPrompt(false);

  clearSession();
  setSessionData(null);
};

const checkActiveSession = () => {
  const sessionStartTime = startingTime;
  if (sessionStartTime) {
      const sessionMessage = "Do you wish to complete the session?";
      setPromptMessage(sessionMessage);
      setIsCompletingSession(true);
      setShowSessionPrompt(true);
  }
};

const handleCompleteSession = () => {
  const diffInPages = (Number(startingPage) === 0 || startingPage == null) ? pagesRead : Number(pagesRead)-Number(startingPage);
  const sessionStartTime = startingTime;
  const message = `Your reading session was from ${formatTime(sessionStartTime)} to ${formatTime(new Date())}. You've read ${diffInPages} pages. Do you wish to save this session?`;
  setSessionData({ startTime: new Date(sessionStartTime), endTime: new Date(), pageDiff: diffInPages, userId: userDetails[0].userId });
  setPromptMessage(message);
  setIsCompletingSession(false);
};

const handleContinueSession = () => {
  setShowSessionPrompt(false);
  // Do nothing, just continue the session
};

const handleSessionPromptAction = () => {
  if (isCompletingSession) {
      handleCompleteSession();
  } else {
      handleSaveSession();
  }
};

  const fetchPagesRead = async () => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await instance.get(`${requests.fetchPagesRead}${userDetails[0].userId}&timezone=${userTimezone}`);
      if (Array.isArray(response.data)) {
        const currentDate = new Date().setHours(0, 0, 0, 0);
        const todayPagesRead = response.data.find((item: any) => {
          const itemDate = new Date(item.dateRead).setHours(0, 0, 0, 0);
          return itemDate === currentDate;
        });    

        const pages = todayPagesRead ? todayPagesRead.pagesRead : 0;
        setPagesRead(String(pages));;

        if (startingTime && (startingPage === null)) {
          setStartPage(pages);
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
    fetchSourceReferral();
  }, [refreshData]);

  const updatePagesRead = async () => {
    if (pagesRead !== "" && pagesRead !== "0") {
      checkActiveSession();
      try {
        const response = await instance.post(requests.updatePagesRead, {
          userId: userDetails[0].userId,
          pageCount: pagesRead,
        });
        if (response.data.message === 'Updated') {
          if (!startingTime) {
            Alert.alert('Success', 'Updated');
          }
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

  const fetchSourceReferral = async () => {
    try {
      const response = await instance.post(requests.fetchUserData, {
        userId: userDetails[0].userId,
      });
      if (response.data.sourceReferral === null) {
        handleOpenModal();
      }
    } catch (error) {
      console.error('Failed to fetch current reads:', error);
    } 
  };

  const toggleTooltip = () => {
    setShowTooltip(prev => !prev);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      if (response.notification.request.content.data.type === 'timer' && 
          response.actionIdentifier === 'stop') {
        clearSession();
        setSessionData(null);
      } else {
        const url = response.notification.request.content.data.urlScheme;
        if (url) {
          Linking.openURL(url);
        }
      }
    });
  
    return () => subscription.remove();
  }, []);

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
              <PageStatus 
                id={book.BookId} 
                page={book.CurrentPage} 
                startDate={book.StartDate} 
                onUpdate={() => {
                  setRefreshData(prev => !prev);
                  checkActiveSession();
                }} 
                status='Currently reading'
            />
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
      <SessionPrompt
        visible={showSessionPrompt}
        message={promptMessage}
        onConfirm={handleSessionPromptAction}
        onCancel={isCompletingSession ? handleContinueSession : handleCancelSave}
      />
      <SourceReferralModal 
        isOpen={isModalOpen} 
        onRequestClose={handleCloseModal} 
      />
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
