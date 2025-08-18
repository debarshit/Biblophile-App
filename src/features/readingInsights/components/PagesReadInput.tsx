import React, { useCallback, useEffect, useMemo, useState } from 'react'
import * as Notifications from 'expo-notifications';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { FontAwesome } from '@expo/vector-icons';
import { useStore } from '../../../store/store';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import BookStatusModal from '../../reading/components/BookStatusModal';
import SessionPrompt from './SessionPrompt';
import Mascot from '../../../components/Mascot';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';
import { useStreak } from '../../../hooks/useStreak';
import { useNavigation } from '@react-navigation/native';

// Memoized book item component
const BookItem = React.memo(({ book, navigation, onUpdatePress }) => (
  <View style={styles.book}>
    <TouchableOpacity
      onPress={() => {
        navigation.push('Details', {
          id: book.BookId,
          type: "Book",
        });
    }}>
      <Image source={{ uri: convertHttpToHttps(book.BookPhoto) }} style={styles.bookPhoto} />
    </TouchableOpacity>
    <TouchableOpacity 
      style={styles.updateButton}
      onPress={() => onUpdatePress(book)}
    >
      <Text style={styles.updateButtonText}>Update Status</Text>
    </TouchableOpacity>
  </View>
));

const PagesReadInput = () => {
  const navigation = useNavigation<any>();
  const [pagesRead, setPagesRead] = useState<string>('0');
  const [currentReads, setCurrentReads] = useState<any[]>([]);
  const [isLoadingCurrentReads, setIsLoadingCurrentReads] = useState(true);
  const [refreshData, setRefreshData] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // states for BookStatusModal
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedBookStatus, setSelectedBookStatus] = useState<string>('');
  const [selectedBookPage, setSelectedBookPage] = useState<number | undefined>(undefined);
  const [selectedBookStartDate, setSelectedBookStartDate] = useState<string | undefined>(undefined);
  const [selectedBookEndDate, setSelectedBookEndDate] = useState<string | undefined>(undefined);
  const [isBookStatusModalVisible, setIsBookStatusModalVisible] = useState(false);

  const userDetails = useStore((state: any) => state.userDetails);

  //  states for reading sessions
  const [showSessionPrompt, setShowSessionPrompt] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [promptMessage, setPromptMessage] = useState("");
  const [isCompletingSession, setIsCompletingSession] = useState(false);

  const startingTime = useStore((state: any) => state.sessionStartTime);
  const startingPage = useStore((state: any) => state.sessionStartPage);
  const setStartPage = useStore((state: any) => state.setStartPage);
  const clearSession = useStore((state: any) => state.clearSession);

  const { updateStreak } = useStreak(userDetails[0]?.accessToken);

  // Memoized values
  const userTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${userDetails[0]?.accessToken}`
  }), [userDetails]);

  // Memoized format time function
  const formatTime = useCallback((time) => {
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Memoized fetch functions
  const fetchCurrentReads = useCallback(async () => {
    setIsLoadingCurrentReads(true);
    try {
      const currentReadsResponse = await instance(requests.fetchCurrentReads, {
        headers: authHeaders,
      });
      const response = currentReadsResponse.data;
      setCurrentReads(response.data.currentReads);
    } catch (error) {
      console.error('Failed to fetch current reads:', error);
      setCurrentReads([]);
    } finally {
      setIsLoadingCurrentReads(false);
    }
  }, [authHeaders]);

  const fetchPagesRead = useCallback(async () => {
    try {
      const pagesReadResponse = await instance.get(`${requests.fetchPagesRead}?${userDetails[0].userId}&timezone=${userTimezone}`, {
        headers: authHeaders,
      });
      const response = pagesReadResponse.data;
      if (Array.isArray(response.data)) {
        const currentDate = new Date().setHours(0, 0, 0, 0);
        const todayPagesRead = response.data.find((item: any) => {
          const itemDate = new Date(item.dateRead).setHours(0, 0, 0, 0);
          return itemDate === currentDate;
        });    

        const pages = todayPagesRead ? todayPagesRead.pagesRead : 0;
        setPagesRead(String(pages));

        if (startingTime && (startingPage === null)) {
          setStartPage(pages);
        }
      } else {
        console.error('Pages read data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch pages read:', error);
    }
  }, [authHeaders, userDetails, userTimezone, startingTime, startingPage, setStartPage]);

  // Memoized session handlers
  const handleSaveSession = useCallback(() => {
    if (sessionData) {
      const diffInPages = Number(pagesRead) - Number(startingPage);
      console.log(`Saving session from ${sessionData.startTime} to ${new Date()} with ${diffInPages} pages read.`);   
      
      instance.post(requests.submitReadingDuration, sessionData, { headers: authHeaders })
        .then(response => {
          console.log('Session saved:', response.data.data);
        })
        .catch(error => {
          console.error('Error saving session:', error);
      });

      clearSession();
      setSessionData(null);
    }
    setShowSessionPrompt(false);
  }, [sessionData, pagesRead, startingPage, authHeaders, clearSession]);

  const handleCancelSave = useCallback(() => {
    setShowSessionPrompt(false);
    clearSession();
    setSessionData(null);
  }, [clearSession]);

  const checkActiveSession = useCallback(() => {
    if (startingTime) {
      const sessionMessage = "Do you wish to complete the session?";
      setPromptMessage(sessionMessage);
      setIsCompletingSession(true);
      setShowSessionPrompt(true);
    }
  }, [startingTime]);

  const handleCompleteSession = useCallback(() => {
    const diffInPages = (Number(startingPage) === 0 || startingPage == null) ? pagesRead : Number(pagesRead)-Number(startingPage);
    const sessionStartTime = startingTime;
    const message = `Your reading session was from ${formatTime(sessionStartTime)} to ${formatTime(new Date())}. You've read ${diffInPages} pages. Do you wish to save this session?`;
    setSessionData({ startTime: new Date(sessionStartTime), endTime: new Date(), pageDiff: diffInPages });
    setPromptMessage(message);
    setIsCompletingSession(false);
  }, [startingPage, pagesRead, startingTime, formatTime]);

  const handleContinueSession = useCallback(() => {
    setShowSessionPrompt(false);
  }, []);

  const handleSessionPromptAction = useCallback(() => {
    if (isCompletingSession) {
      handleCompleteSession();
    } else {
      handleSaveSession();
    }
  }, [isCompletingSession, handleCompleteSession, handleSaveSession]);

  const updatePagesRead = useCallback(async () => {
    if (pagesRead !== "" && pagesRead !== "0") {
      checkActiveSession();
      try {
        const updatePagesReadResponse = await instance.post(`${requests.updatePagesRead}?timezone=${userTimezone}`, {
          pageCount: pagesRead,
        }, {
          headers: authHeaders,
        });
        const response = updatePagesReadResponse.data;
        if (response.data.message === 'Updated') {
          if (!startingTime) {
            Alert.alert('Success', 'Updated');
          }
          await updateStreak(null);
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
  }, [pagesRead, checkActiveSession, userTimezone, authHeaders, startingTime, updateStreak]);

  // Memoized modal handlers
  const toggleTooltip = useCallback(() => {
    setShowTooltip(prev => !prev);
  }, []);

  const handleOpenBookStatusModal = useCallback((book: any) => {
    setSelectedBookId(book.BookId);
    setSelectedBookStatus('Currently reading');
    setSelectedBookPage(book.CurrentPage);
    setSelectedBookStartDate(book.StartDate);
    setSelectedBookEndDate(book.EndDate);
    setIsBookStatusModalVisible(true);
  }, []);

  const handleCloseBookStatusModal = useCallback(() => {
    setIsBookStatusModalVisible(false);
    setSelectedBookId('');
    setSelectedBookStatus('');
    setSelectedBookPage(undefined);
    setSelectedBookStartDate(undefined);
    setSelectedBookEndDate(undefined);
  }, []);

  const handleBookStatusUpdate = useCallback(async () => {
    setRefreshData(prev => !prev);
    await fetchPagesRead();
    await updateStreak(null);
    checkActiveSession();
    handleCloseBookStatusModal();
  }, [fetchPagesRead, updateStreak, checkActiveSession, handleCloseBookStatusModal]);

  useEffect(() => {
    fetchCurrentReads();
    fetchPagesRead();
  }, [refreshData]);

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
  }, [clearSession]);

  // Memoized rendered books list
  const renderedBooks = useMemo(() => 
    currentReads.map((book) => (
      <BookItem 
        key={book.BookId} 
        book={book} 
        navigation={navigation}
        onUpdatePress={handleOpenBookStatusModal}
      />
    )), [currentReads, navigation, handleOpenBookStatusModal]
  );

  // Render current reads section
  const renderCurrentReadsSection = () => {
    return (
      <View style={styles.currentReadsSection}>
        <Text style={styles.sectionHeading}>Current Reads</Text>
        {isLoadingCurrentReads ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
            <Text style={styles.loadingText}>Loading your books...</Text>
          </View>
        ) : currentReads.length > 0 ? (
          <ScrollView horizontal contentContainerStyle={styles.currentReads}>
            {renderedBooks}
          </ScrollView>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Mascot emotion="sleeping" />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.pagesReadContainer}>
      {renderCurrentReadsSection()}
      
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
          onChangeText={setPagesRead}
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

      <BookStatusModal
        visible={isBookStatusModalVisible}
        onClose={handleCloseBookStatusModal}
        bookId={selectedBookId}
        initialStatus={selectedBookStatus}
        initialPage={selectedBookPage}
        initialStartDate={selectedBookStartDate}
        initialEndDate={selectedBookEndDate}
        onUpdate={handleBookStatusUpdate}
      />

      <SessionPrompt
        visible={showSessionPrompt}
        message={promptMessage}
        onConfirm={handleSessionPromptAction}
        onCancel={isCompletingSession ? handleContinueSession : handleCancelSave}
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
  currentReadsSection: {
    width: '100%',
    marginBottom: SPACING.space_20,
  },
  sectionHeading: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    textAlign: 'center',
    marginBottom: SPACING.space_16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_30,
    gap: SPACING.space_10,
  },
  loadingText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_20,
  },
  currentReads: {
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_20,
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
  updateButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_8,
    paddingHorizontal: SPACING.space_12,
    borderRadius: 5,
    marginTop: SPACING.space_10,
  },
  updateButtonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    textAlign: 'center',
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