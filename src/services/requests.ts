const isDevelopment = __DEV__;

const APIURL = isDevelopment ? '/actions1.php' : '/actions.php';
const INSIGHTSAPI = isDevelopment ? '/userInsightsDev.php' : '/userInsights.php';

const requests = {
    //request to biblophile actions api
    getBookGenre:`${APIURL}?action=getBookGenre`,
    getBooks:`${APIURL}?action=getBooks&bookGenre=`,
    fetchProductDetails:`${APIURL}?action=fetchProductDetails&id=`,
    fetchExternalBookDetails:`${APIURL}?action=fetchExternalBookDetails&id=`, 
    fetchAverageRating:`${APIURL}?action=fetchAverageRating&id=`,
    fetchAverageEmotions:`${APIURL}?action=fetchAverageEmotions&id=`,
    addBook: `${APIURL}?action=addBook`,
    fetchBookId:`${APIURL}?action=fetchBookId`,
    fetchReadingStatus:`${APIURL}?action=fetchReadingStatus`,
    submitReadingStatus: `${APIURL}?action=submitReadingStatus`,
    submitReadingDuration: `${APIURL}?action=submitReadingDuration`,
    fetchProductReviews:`${APIURL}?action=fetchProductReviews&id=`,
    fetchEmotions:`${APIURL}?action=fetchEmotions`,
    submitReview: `${APIURL}?action=submitReview`,
    submitNote: `${APIURL}?action=submitNote`,
    submitEmotionScore: `${APIURL}?action=submitEmotionScore`,
    placeOrder: `${APIURL}?action=placeOrder`,
    placeSubscriptionOrder: `${APIURL}?action=placeSubscriptionOrder`,
    userLogin: `${APIURL}?action=userLogin`,
    userSignup: `${APIURL}?action=userSignup`,
    forgotPassword: `${APIURL}?action=forgotPassword`,
    fetchUserData: `${APIURL}?action=fetchUserData`,
    fetchOrders: `${APIURL}?action=fetchOrders`,
    updateUserData: `${APIURL}?action=updateUserData`,
    updateAppUserData: `${APIURL}?action=updateAppUserData`,
    fetchDeposit: `${APIURL}?action=fetchDeposit`,
    searchBooks: `${APIURL}?action=searchBooks&searchQuery=`,
    searchExternalBooks: `${APIURL}?action=searchExternalBooks&searchQuery=`,
    fetchSubscriptionPlans: `${APIURL}?action=fetchSubscriptionPlans`,
    fetchActivePlan: `${APIURL}?action=fetchActivePlan&userId=`,
    getBookmarks: `${APIURL}?action=getBookmarks`,
    fetchReadingStreak: `${APIURL}?action=fetchReadingStreak&userId=`,
    updateReadingStreak: `${APIURL}?action=updateReadingStreak&userId=`,
    updatePagesRead: `${APIURL}?action=updatePagesRead`,
    fetchReadingTips: `${APIURL}?action=fetchReadingTips`,
    updateNotificationToken: `${APIURL}?action=updateNotificationToken`,
    fetchReadingStreakLeaderboard: `${APIURL}?action=fetchReadingStreakLeaderboard&userId=`,
    fetchPagesRead: `${APIURL}?action=fetchPagesRead&userId=`,
    fetchCurrentReads: `${APIURL}?action=fetchCurrentReads`,
    fetchUserBooks: `${APIURL}?action=fetchUserBooks`,
    updateBookDates: `${APIURL}?action=updateBookDates`,
    paymentRequest: `${APIURL}?action=paymentRequest`,
    paymentSuccessful: `${APIURL}?action=paymentSuccessful&linkId=`,

    //request to biblophile user-insights api
    fetchAverageRatingByUser:`${INSIGHTSAPI}?action=fetchAverageRatingByUser&userId=`,
    fetchAverageEmotionsByUser:`${INSIGHTSAPI}?action=fetchAverageEmotionsByUser&userId=`,
    fetchAverageDaystoFinish: `${INSIGHTSAPI}?action=fetchAverageDaystoFinish&userId=`,
    fetchUserReviews: `${INSIGHTSAPI}?action=fetchUserReviews&userId=`,
    updateUserReview: `${INSIGHTSAPI}?action=updateUserReview`,
    fetchBookShelf: `${INSIGHTSAPI}?action=fetchBookShelf`,
    fetchUserNotes: `${INSIGHTSAPI}?action=fetchUserNotes&userId=`,
    updateUserNote: `${INSIGHTSAPI}?action=updateUserNote`,
    fetchReadingDurations: `${INSIGHTSAPI}?action=fetchReadingDurations&userId=`,
}

export default requests;