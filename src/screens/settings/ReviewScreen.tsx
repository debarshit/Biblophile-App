import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import instance from '../../services/axios';
import requests from '../../services/requests';
import { COLORS, SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../theme/theme';
import { useStore } from '../../store/store';
import Mascot from '../../components/Mascot';

const ReviewScreen: React.FC = () => {
    const [reviews, setReviews] = useState([]);
    const [editing, setEditing] = useState<number | null>(null);
    const [currentReview, setCurrentReview] = useState({ rating: '', review: '' });

    const userDetails = useStore((state: any) => state.userDetails);
    const userId = userDetails[0].userId;

    const convertHttpToHttps = (url) => {
        if (url && url.startsWith('http://')) {
          return url.replace('http://', 'https://');
        }
        return url;
      };

    useEffect(() => {
        instance.get(`${requests.fetchUserReviews}${userId}`)
            .then(response => {
                setReviews(response.data);
            })
            .catch(error => console.error("Error fetching reviews:", error));
    }, [userId]);

    const handleEdit = (review: any) => {
        setEditing(review.ratingId);
        setCurrentReview({ rating: review.rating, review: review.review });
    };

    const handleDelete = (ratingId: number, productId: number) => {
        Alert.alert(
            "Delete Review",
            "Are you sure you want to delete this review?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "OK", onPress: () => {
                        instance.post(requests.updateUserReview, {
                            userId,
                            productId,
                            actionType: 'delete'
                        })
                            .then(response => {
                                setReviews(reviews.filter(review => review.ratingId !== ratingId));
                                Alert.alert(response.data.message);
                            })
                            .catch(error => console.error("Error deleting review:", error));
                    }
                }
            ]
        );
    };

    const handleSave = (ratingId: number, productId: number) => {
        instance.post(requests.updateUserReview, {
            userId,
            productId,
            rating: currentReview.rating,
            review: currentReview.review,
            actionType: 'update'
        })
            .then(response => {
                setReviews(reviews.map(review =>
                    review.ratingId === ratingId ? { ...review, rating: currentReview.rating, review: currentReview.review } : review
                ));
                setEditing(null);
                Alert.alert(response.data.message);
            })
            .catch(error => console.error("Error updating review:", error));
    };

    const handleChange = (name: string, value: string) => {
        setCurrentReview(prev => ({ ...prev, [name]: value }));
    };

    return (
        <>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>My Ratings & Reviews</Text>
                {reviews.length === 0 && <Mascot emotion="reading" />}
                {reviews.map((review: any) => (
                    <View key={review.ratingId} style={styles.reviewCard}>
                        <Image source={{ uri: convertHttpToHttps(review.bookImage) }} style={styles.bookImage} />
                        {editing === review.ratingId ? (
                            <>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={currentReview.rating}
                                    onChangeText={(value) => handleChange('rating', value)}
                                    placeholder="Rating (1-5)"
                                    maxLength={1}
                                />
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={currentReview.review}
                                    onChangeText={(value) => handleChange('review', value)}
                                    placeholder="Your review"
                                    multiline
                                />
                                <TouchableOpacity onPress={() => handleSave(review.ratingId, review.productId)} style={styles.saveBtn}>
                                    <Text style={styles.btnText}>Save</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.rating}>Rating: {review.rating} / 5</Text>
                                <Text style={styles.reviewText}>{review.review}</Text>
                                <View style={styles.btnGroup}>
                                    <TouchableOpacity onPress={() => handleEdit(review)} style={styles.editBtn}>
                                        <Text style={styles.btnText}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(review.ratingId, review.productId)} style={styles.deleteBtn}>
                                        <Text style={styles.btnText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                ))}
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: SPACING.space_20,
        backgroundColor: COLORS.primaryBlackHex,
        height: "100%",
    },
    title: {
        fontSize: FONTSIZE.size_24,
        fontFamily: FONTFAMILY.poppins_bold,
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_20,
        textAlign: 'center',
    },
    reviewCard: {
        padding: SPACING.space_20,
        backgroundColor: COLORS.primaryDarkGreyHex,
        borderRadius: BORDERRADIUS.radius_10,
        marginBottom: SPACING.space_16,
    },
    bookImage: {
        width: 100,
        height: 150,
        borderRadius: BORDERRADIUS.radius_8,
        marginBottom: SPACING.space_12,
        alignSelf: 'center',
    },
    rating: {
        fontSize: FONTSIZE.size_16,
        fontFamily: FONTFAMILY.poppins_medium,
        color: COLORS.primaryOrangeHex,
        marginBottom: SPACING.space_8,
        textAlign: 'center',
    },
    reviewText: {
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_regular,
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_12,
    },
    input: {
        width: '100%',
        padding: SPACING.space_10,
        marginBottom: SPACING.space_12,
        borderRadius: BORDERRADIUS.radius_8,
        backgroundColor: COLORS.primaryBlackRGBA,
        borderColor: COLORS.primaryLightGreyHex,
        borderWidth: 1,
        fontFamily: FONTFAMILY.poppins_medium,
        color: COLORS.primaryWhiteHex,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    btnGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    saveBtn: {
        backgroundColor: COLORS.primaryOrangeHex,
        padding: SPACING.space_8,
        borderRadius: BORDERRADIUS.radius_8,
        alignItems: 'center',
        marginVertical: SPACING.space_10,
    },
    editBtn: {
        backgroundColor: COLORS.primaryGreyHex,
        padding: SPACING.space_8,
        borderRadius: BORDERRADIUS.radius_8,
        alignItems: 'center',
        marginRight: SPACING.space_10,
    },
    deleteBtn: {
        backgroundColor: COLORS.primaryRedHex,
        padding: SPACING.space_8,
        borderRadius: BORDERRADIUS.radius_8,
        alignItems: 'center',
    },
    btnText: {
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_medium,
        color: COLORS.primaryWhiteHex,
    }
});

export default ReviewScreen;