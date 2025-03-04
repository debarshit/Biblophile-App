import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { COLORS, SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import { useStore } from '../../../store/store';
import Mascot from '../../../components/Mascot';

interface ReviewScreenProps {
    userData: {
        userId: string;
        isPageOwner: boolean;
    };
}

const UserReviews: React.FC<ReviewScreenProps> = ({ userData }) => {
    const [reviews, setReviews] = useState([]);
    const [editing, setEditing] = useState<number | null>(null);
    const [currentReview, setCurrentReview] = useState({ rating: '', review: '' });
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const userDetails = useStore((state: any) => state.userDetails);
    const accessToken = userDetails[0].accessToken;


    const convertHttpToHttps = (url) => {
        if (url && url.startsWith('http://')) {
          return url.replace('http://', 'https://');
        }
        return url;
      };

      const fetchReviews = async (initial = false) => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const response = await instance.get(`${requests.fetchUserReviews}${userData.userId}?offset=${offset}&limit=10&timezone=${userTimezone}`);
            const newReviews = response.data;

            setReviews(initial ? newReviews : [...reviews, ...newReviews]);

            if (newReviews.length < 10) {
                setHasMore(false);
            } else {
                setOffset(offset + 10);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews(true);
    }, [userData.userId]);

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
                            userId: userData.userId,
                            productId,
                            actionType: 'delete'
                        },{
                            headers: {
                                Authorization: `Bearer ${accessToken}`
                            }
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
            userId: userData.userId,
            productId,
            rating: currentReview.rating,
            review: currentReview.review,
            actionType: 'update'
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
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

    const renderReview = ({ item }: any) => (
        <View key={item.ratingId} style={styles.reviewCard}>
            <Image source={{ uri: convertHttpToHttps(item.bookImage) }} style={styles.bookImage} />
            {editing === item.ratingId ? (
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
                    <TouchableOpacity onPress={() => handleSave(item.ratingId, item.productId)} style={styles.saveBtn}>
                        <Text style={styles.btnText}>Save</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text style={styles.rating}>Rating: {item.rating} / 5</Text>
                    <Text style={styles.reviewText}>{item.review}</Text>
                    {userData.isPageOwner && <View style={styles.btnGroup}>
                        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                            <Text style={styles.btnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.ratingId, item.productId)} style={styles.deleteBtn}>
                            <Text style={styles.btnText}>Delete</Text>
                        </TouchableOpacity>
                    </View>}
                </>
            )}
        </View>
    );

    return (
        <FlatList
            data={reviews}
            keyExtractor={(item) => item.ratingId.toString()}
            renderItem={renderReview}
            contentContainerStyle={styles.container}
            onEndReached={() => fetchReviews(false)}
            onEndReachedThreshold={0.5}  // Trigger when 50% of the list is visible
            ListFooterComponent={loading && <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />}
            ListEmptyComponent={!loading && <Mascot emotion="reading" />}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        padding: SPACING.space_20,
        backgroundColor: COLORS.primaryBlackHex,
        flexGrow: 1,
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

export default UserReviews;