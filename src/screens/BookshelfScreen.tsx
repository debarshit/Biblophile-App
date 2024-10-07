import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import instance from '../services/axios';
import requests from '../services/requests';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useStore } from '../store/store';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import BookshelfCard from '../components/BookshelfCard';
import Mascot from '../components/Mascot';
import BookListModal from '../components/BookListModal';

const BookshelfScreen = ({ navigation }) => {
  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const userDetails = useStore((state: any) => state.userDetails);

  const fetchUserBooks = async () => {
    try {
      const response = await instance.post(requests.fetchUserBooks, {
        userId: userDetails[0].userId,
      });
      setUserBooks(response.data.userBooks);
    } catch (error) {
      console.error('Failed to fetch user books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBooks();
  }, []);

  const convertHttpToHttps = (url) => {
    if (url && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  const renderBooksByStatus = (status) => {
    const books = userBooks.filter((book) => book.Status === status);
    if (books.length === 0) {
      return null;
    }

    const openModal = (status) => () => {
      setModalVisible(true);
      setSelectedStatus(status);
    };

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{status}</Text>
          <TouchableOpacity onPress={openModal(status)}>
            <Text style={styles.showMoreText}>Show More</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={books}
          contentContainerStyle={styles.bookshelfContainer}
          keyExtractor={(item) => item.BookId}
          renderItem={({ item }) => (
            <BookshelfCard
            id={item.BookId}
            photo={convertHttpToHttps(item.BookPhoto)}
            status={item.Status}
            startDate={item.StartDate}
            endDate={item.EndDate}
            currentPage={item.CurrentPage}
            onUpdate={null}
            navigation={navigation}

          />
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewFlex}
      >
        <HeaderBar title="My Bookshelf" />

        {userBooks.length === 0 && <Mascot emotion="sleeping"/>}

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <>
            {renderBooksByStatus('Currently reading')}
            {renderBooksByStatus('Read')}
            {renderBooksByStatus('Paused')}
            {renderBooksByStatus('To be read')}
            {renderBooksByStatus('Did not finish')}
          </>
        )}
      </ScrollView>
      <BookListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        status={selectedStatus}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  scrollViewFlex: {
    paddingBottom: SPACING.space_30,
  },
  sectionContainer: {
    marginBottom: SPACING.space_20,
  },
  sectionTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
    paddingLeft: SPACING.space_20,
    marginBottom: SPACING.space_12,
  },
  bookshelfContainer: {
    paddingLeft: SPACING.space_20,
    gap: SPACING.space_20,
  },
  loadingText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    textAlign: 'center',
    marginTop: SPACING.space_36,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showMoreText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    paddingRight: SPACING.space_20,
  },
});

export default BookshelfScreen;
