import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import BookshelfCard from './BookshelfCard';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import instance from '../services/axios';
import requests from '../services/requests';
import { useStore } from '../store/store';

const BookListModal = ({ visible, onClose, status }, { navigation }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);

    const userDetails = useStore((state: any) => state.userDetails);

    const convertHttpToHttps = (url) => {
        if (url && url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }
        return url;
    };

    const fetchBookShelf = async (page) => {
        setLoading(true);
        try {
            const response = await instance.post(requests.fetchBookShelf, {
                userId: userDetails[0].userId,
                status,
                limit: 10,
                offset: page * 10,
        });
            const newBooks = response.data.userBooks;

            if (newBooks.length < 10) {
                setHasMore(false); // No more books to load
            }

            setBooks((prevBooks) => [...prevBooks, ...newBooks]);
        } catch (error) {
            console.error('Failed to fetch user books:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookShelf(page);
    }, [page]);

    useEffect(() => {
        if (visible) {
            setBooks([]);
            setPage(0);
            setHasMore(true);
            fetchBookShelf(0);
        }
    }, [status, visible]);

    const loadMoreBooks = () => {
        if (hasMore && !loading) {
            setPage((prevPage) => prevPage + 1);
        }
    };
      
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
        >
        <View style={styles.overlay}>
            <View style={styles.modalContent}>
                <TouchableOpacity onPress={onClose}>
                    <Text style={styles.closeButton}>Close</Text>
                </TouchableOpacity>
                <FlatList
                    data={books}
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
                    onEndReached={loadMoreBooks}
                    onEndReachedThreshold={0.5} // Trigger when the user is 50% away from the bottom
                    ListFooterComponent={loading ? <Text>Loading...</Text> : null}
                />
            </View>
        </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: SPACING.space_10,
    padding: SPACING.space_20,
  },
  closeButton: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
    marginTop: SPACING.space_10,
  },
});

export default BookListModal;