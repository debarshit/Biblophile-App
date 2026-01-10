import React, { useCallback, useEffect, useMemo, useState } from 'react'
import * as Notifications from 'expo-notifications';
import { Alert, Linking, StyleSheet, View, ActivityIndicator, Text } from 'react-native'
import { useStore } from '../../../../store/store';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';
import { COLORS, SPACING, FONTSIZE, FONTFAMILY } from '../../../../theme/theme';
import BookStatusModal from '../../../reading/components/BookStatusModal';
import SessionPrompt from './SessionPrompt';
import { useStreak } from '../../../../hooks/useStreak';
import { useNavigation } from '@react-navigation/native';
import { useAnalytics } from '../../../../utils/analytics';
import { dismissTimerNotification, updateTimerNotification } from '../../../../utils/notificationUtils';
import CurrentlyReadingBooks from './CurrentlyReadingBooks';
import PagesReadInputForm from './PagesReadInputForm';
import SessionControls from './SessionControls';
import DailyNoteBottomSheet from './DailyNoteBottomSheet';
import ReadingHistoryModal from '../../../reading/components/ReadingHistoryModal';

const CurrentReadsSection = ({ showDiscoverLink = true }) => {
  const navigation = useNavigation<any>();
  const analytics = useAnalytics();
  const [pagesRead, setPagesRead] = useState<string>('0');
  const [currentReads, setCurrentReads] = useState<any[]>([]);
  const [isLoadingCurrentReads, setIsLoadingCurrentReads] = useState(true);
  const [refreshData, setRefreshData] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showDailyNoteBottomSheet, setShowDailyNoteBottomSheet] = useState(false);

  // states for BookStatusModal
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedWorkId, setSelectedWorkId] = useState<string>('');
  const [selectedBookStatus, setSelectedBookStatus] = useState<string>('');
  const [selectedBookrogressValue, setSelectedBookProgressValue] = useState<number>(0);
  const [selectedBookProgressUnit, setSelectedBookProgressUnit] = useState<'pages' | 'percentage' | 'seconds'>('pages');
  const [selectedBookStartDate, setSelectedBookStartDate] = useState<string | undefined>(undefined);
  const [selectedBookEndDate, setSelectedBookEndDate] = useState<string | undefined>(undefined);
  const [selectedUserbookId, setSelectedUserbookId] = useState<number | undefined>(undefined);
  const [isBookStatusModalVisible, setIsBookStatusModalVisible] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const userDetails = useStore((state: any) => state.userDetails);

  //  states for reading sessions
  const [timer, setTimer] = useState(0);
  const startSession = useStore((state) => state.startSession);
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

  const handleConfirmStartSession = () => {
    startSession();
    setShowSessionPrompt(false);
  };

  const handleCancelStartSession = () => {
    setShowSessionPrompt(false);
  };

  // Memoized session handlers
  const handleSaveSession = useCallback(() => {
    if (sessionData) {
      const diffInPages = Number(pagesRead) - Number(startingPage);
      console.log(`Saving session from ${sessionData.startTime} to ${new Date()} with ${diffInPages} pages read.`);   
      
      instance.post(requests.submitReadingDuration, sessionData, { headers: authHeaders })
        .then(response => {
          console.log('Session saved:', response.data.data);
          analytics.track('reading_session_saved');
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

  // const handleSessionPromptAction = useCallback(() => {
  //   if (isCompletingSession) {
  //     handleCompleteSession();
  //   } else {
  //     handleSaveSession();
  //   }
  // }, [isCompletingSession, handleCompleteSession, handleSaveSession]);

  // const updatePagesRead = useCallback(async () => {
  //   if (pagesRead !== "" && pagesRead !== "0") {
  //     checkActiveSession();
  //     try {
  //       const updatePagesReadResponse = await instance.post(`${requests.updatePagesRead}?timezone=${userTimezone}`, {
  //         pageCount: pagesRead,
  //       }, {
  //         headers: authHeaders,
  //       });
  //       const response = updatePagesReadResponse.data;
  //       if (response.data.message === 'Updated') {
  //         analytics.track('pages_read_updated');
  //         if (!startingTime) {
  //           // Alert.alert('Success', 'Updated');
  //           setShowDailyNoteBottomSheet(true);
  //         }
  //         await updateStreak(null);
  //         setRefreshData(prev => !prev);
  //       } else {
  //         Alert.alert('Error', response.data.message);
  //       }
  //     } catch (error) {
  //       Alert.alert('Error', 'Failed to update pages read.');
  //       console.log(error);
  //     }
  //   } else {
  //     Alert.alert('Page count is 0', 'Please enter number of pages read!');
  //   }
  // }, [pagesRead, checkActiveSession, userTimezone, authHeaders, startingTime, updateStreak]);

  // Memoized modal handlers
  const handleOpenBookStatusModal = useCallback((book: any) => {
    setSelectedBookId(book.BookId);
    setSelectedWorkId(book.WorkId);
    setSelectedBookStatus('Currently reading');
    setSelectedBookProgressUnit(book.ProgressUnit);
    setSelectedBookProgressValue(book.ProgressValue);
    setSelectedBookStartDate(book.StartDate);
    setSelectedBookEndDate(book.EndDate);
    setSelectedUserbookId(book.UserbookId);
    setIsBookStatusModalVisible(true);
  }, []);

  const handleCloseBookStatusModal = useCallback(() => {
    setIsBookStatusModalVisible(false);
    setSelectedBookId('');
    setSelectedWorkId('');
    setSelectedBookStatus('');
    setSelectedBookProgressUnit(undefined);
    setSelectedBookProgressValue(undefined);
    setSelectedBookEndDate(undefined);
    setSelectedUserbookId(undefined);
  }, []);

  const handleBookStatusUpdate = useCallback(async () => {
    setRefreshData(prev => !prev);
    setShowDailyNoteBottomSheet(true);
    await fetchPagesRead();
    await updateStreak(null);
    checkActiveSession();
    handleCloseBookStatusModal();
  }, [fetchPagesRead, updateStreak, checkActiveSession, handleCloseBookStatusModal]);

  const handleEditInstance = useCallback((instance: any) => {
    setSelectedBookId(instance.bookId || selectedBookId);
    setSelectedBookId(instance.workId || selectedWorkId);
    setSelectedBookStatus(instance.status);
    setSelectedBookProgressUnit(instance.ProgressUnit);
    setSelectedBookProgressValue(instance.ProgressValue);
    setSelectedBookStartDate(instance.startDate);
    setSelectedBookEndDate(instance.endDate);
    setSelectedUserbookId(instance.userbookId);
    setIsBookStatusModalVisible(true);
  }, [selectedBookId]);

  const handleStartSessionPress = useCallback(() => {
    setPromptMessage('Would you like to start a reading session?');
    setShowSessionPrompt(true);
    setIsCompletingSession(false);
  }, []);

  // Initialize data
  const initializeData = useCallback(async () => {
    if (!userDetails[0]?.accessToken || isInitialized) return;
    
    try {
      await Promise.all([
        fetchCurrentReads(),
        fetchPagesRead()
      ]);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }, [fetchCurrentReads, fetchPagesRead, userDetails, isInitialized]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    if (isInitialized && refreshData) {
      fetchCurrentReads();
      fetchPagesRead();
    }
  }, [refreshData, isInitialized]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      if (response.notification.request.content.data.type === 'timer' && 
          response.actionIdentifier === 'stop') {
        clearSession();
        setSessionData(null);
      } else {
        const url = response.notification.request.content.data.urlScheme;
        if (url) {
          Linking.openURL(url as string);
        }
      }
    });
  
    return () => subscription.remove();
  }, [clearSession]);

   // Session timer logic
    useEffect(() => {
      let timerInterval;
      
      if (startingTime) {
        timerInterval = setInterval(() => {
          const currentTime = new Date();
          const elapsedTime = Math.floor((currentTime.getTime() - new Date(startingTime).getTime()) / 1000);
          setTimer(elapsedTime);
          
          const minutes = Math.floor(elapsedTime / 60);
          const seconds = elapsedTime % 60;
          updateTimerNotification(minutes, seconds);
        }, 1000);
      } else {
        if (timerInterval) {
          clearInterval(timerInterval);
          dismissTimerNotification();
        }
      }
      
      return () => {
        if (timerInterval) {
          clearInterval(timerInterval);
          dismissTimerNotification();
        }
      };
    }, [startingTime]);

  // Show loading until initialized
  if (!isInitialized) {
    return (
      <View style={styles.pagesReadContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.pagesReadContainer}>
      <CurrentlyReadingBooks
        currentReads={currentReads}
        isLoading={isLoadingCurrentReads}
        showDiscoverLink={showDiscoverLink}
        navigation={navigation}
        onUpdatePress={handleOpenBookStatusModal}
      />
      
      {/* <PagesReadInputForm
        pagesRead={pagesRead}
        onPagesReadChange={setPagesRead}
        onUpdate={updatePagesRead}
      /> */}

      {/* <SessionControls
        startingTime={startingTime}
        timer={timer}
        onStartSession={handleStartSessionPress}
      /> */}

      <DailyNoteBottomSheet
        visible={showDailyNoteBottomSheet}
        onClose={() => setShowDailyNoteBottomSheet(false)}
        userDetails={userDetails}
      />

      <BookStatusModal
        visible={isBookStatusModalVisible}
        onClose={handleCloseBookStatusModal}
        bookId={selectedBookId}
        workId={selectedWorkId}
        initialStatus={selectedBookStatus}
        initialProgressUnit={selectedBookProgressUnit}
        initialProgressValue={selectedBookrogressValue}
        initialStartDate={selectedBookStartDate}
        initialEndDate={selectedBookEndDate}
        userBookId={selectedUserbookId}
        onUpdate={handleBookStatusUpdate}
        onViewHistory={() => {
          setIsBookStatusModalVisible(false);
          setTimeout(() => setShowHistoryModal(true), 300);
        }}
      />

      <ReadingHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        bookId={selectedBookId}
        onEditInstance={handleEditInstance}
      />

      <SessionPrompt
        visible={showSessionPrompt}
        message={promptMessage}
        onConfirm={() => {
          if (isCompletingSession) {
            handleCompleteSession();      // Step 1: completing
          } else if (sessionData) {
            handleSaveSession();          // Step 2: saving
          } else {
            handleConfirmStartSession();  // Starting new session
          }
        }}
        onCancel={() => {
          if (isCompletingSession) {
            handleContinueSession();      // Step 1: continue reading
          } else if (sessionData) {
            handleCancelSave();       // Step 2: discard and clear session
          } else {
            handleCancelStartSession();   // Cancel start session
          }
        }}
      />
    </View>
  );
};

export default CurrentReadsSection;

const styles = StyleSheet.create({
  pagesReadContainer: {
    marginBottom: SPACING.space_10,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
});