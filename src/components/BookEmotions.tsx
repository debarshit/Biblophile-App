import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import instance from '../services/axios';
import requests from '../services/requests';
import { useStore } from '../store/store';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';

interface BookEmotionsProps {
    id: string;
    isGoogleBook: boolean;
    product: any;
}

interface Emotion {
    emotionId: string;
    emotion: string;
    value: number;
}

const BookEmotions: React.FC<BookEmotionsProps> = ({ id, isGoogleBook, product }) => {
    const [emotions, setEmotions] = useState<Emotion[]>([]);
    const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const userDetails = useStore((state: any) => state.userDetails);

  async function fetchEmotions() {
    try {
        let bookIdToFetch = id;

        if (isGoogleBook) {
            const isbn = product.volumeInfo?.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier || '';
            if (isbn) {
                const bookIdResponse = await instance.post(requests.fetchBookId, { ISBN: isbn });
                if (bookIdResponse.data.bookId) {
                    bookIdToFetch = bookIdResponse.data.bookId;
                } else {
                    return;
                }
            }
        }

        const response = await instance.post(requests.fetchEmotions, {
            userId: userDetails[0].userId,
            bookId: bookIdToFetch,
        });

        setEmotions(response.data.map((emotion: any) => ({ ...emotion, value: Number(emotion.value) })));
    } catch (error) {
        console.error('Error fetching emotions:', error);
    }
}

useEffect(() => {
    fetchEmotions();
}, [product]);

const handleMoodChange = (index: number, newValue: number) => {
    const updatedMoods = [...emotions];
    updatedMoods[index].value = newValue;
    setEmotions(updatedMoods);
};

const handleEmotionSubmit = async () => {
    try {
        const userId = userDetails[0].userId;
        const emotionsData = emotions.map(emotion => ({
            emotionId: emotion.emotionId,
            value: emotion.value
        }));

        let bookId = id;

        if (isGoogleBook) {
            const bookData = {
                ISBN: product.volumeInfo?.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier || '',
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

        const reviewData = {
            userId: userId,
            productId: bookId,
            emotions: emotionsData
        };

        const response = await instance.post(requests.submitEmotionScore, reviewData);

        if (response.data.message === "Updated") {
            setUpdateMessage("Updated successfully!");
        } else {
            setUpdateMessage("Uh oh! Please try again");
        }
    } catch (error) {
        console.error('Error submitting score:', error);
        setUpdateMessage("Uh oh! Please try again");
    }
};

  return (
    <View style={styles.container}>
            {userDetails[0].userId ? (
                <>
                    {updateMessage && <Text style={styles.updateMessage}>{updateMessage}</Text>}
                    {emotions.map((mood, index) => (
                        <View key={mood.emotionId} style={styles.moodSlider}>
                            <Text style={styles.moodLabel}>{mood.emotion}</Text>
                            <Slider
                                style={styles.moodRange}
                                minimumValue={0}
                                maximumValue={100}
                                value={mood.value}
                                onValueChange={(value) => handleMoodChange(index, value)}
                                minimumTrackTintColor={COLORS.primaryOrangeHex}
                                maximumTrackTintColor={COLORS.primaryWhiteHex}
                                thumbTintColor={COLORS.primaryOrangeHex}
                            />
                            <Text style={styles.moodValue}>{Math.round(mood.value)}</Text>
                        </View>
                    ))}
                    <Button title="Update" onPress={handleEmotionSubmit} color={COLORS.primaryOrangeHex} />
                </>
            ) : (
                <Text style={styles.loginPrompt}>Login to put a review.</Text>
            )}
        </View>
  );
};

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.space_12,
        padding: SPACING.space_18,
        backgroundColor: COLORS.primaryDarkGreyHex,
        borderRadius: BORDERRADIUS.radius_10,
        maxWidth: 600,
        margin: 'auto',
    },
    moodSlider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.space_20,
        padding: SPACING.space_10,
        backgroundColor: COLORS.primaryBlackRGBA,
        borderRadius: BORDERRADIUS.radius_10,
    },
    moodLabel: {
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_regular,
        color: COLORS.primaryWhiteHex,
    },
    moodRange: {
        flex: 3,
        height: 40,
    },
    moodValue: {
        fontSize: FONTSIZE.size_18,
        color: COLORS.primaryWhiteHex,
        width: 40,
        textAlign: 'center',
    },
    updateMessage: {
        fontSize: FONTSIZE.size_16,
        fontFamily: FONTFAMILY.poppins_bold,
        color: COLORS.primaryOrangeHex,
        textAlign: 'center',
        marginBottom: SPACING.space_10,
    },
    loginPrompt: {
        fontSize: FONTSIZE.size_16,
        color: '#FFA500',
        textAlign: 'center',
    },
});

export default BookEmotions;
