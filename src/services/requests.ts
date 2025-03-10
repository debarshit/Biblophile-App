const isDevelopment = __DEV__;

const APIURL = isDevelopment ? 'apis/dev/actions.php' : 'apis/prod/actions.php';
const INSIGHTSAPI = isDevelopment ? 'apis/dev/userInsights.php' : 'apis/prod/userInsights.php';
const UTILS_ACTIONS_API_URL = isDevelopment ? 'apis/dev/utilsActions.php' : 'apis/prod/utilsActions.php';
const SOCIAL_API_URL = isDevelopment ? 'apis/dev/social/social-api.php' : 'apis/prod/social/social-api.php';
const CHALLENGES_API_URL = isDevelopment ? 'apis/dev/challenges/challenges-api.php' : 'apis/prod/challenges/challenges-api.php';

const requests = {
    //request to biblophile actions api
    getBookGenre:`${APIURL}?action=getBookGenre`,
    getBooks:`${APIURL}?action=getBooks&bookGenre=`,
    getSpotlight: `${APIURL}?action=getSpotlight`,
    fetchProductDetails:`${APIURL}?action=fetchProductDetails&id=`,
    fetchExternalBookDetails:`${APIURL}?action=fetchExternalBookDetails&id=`, 
    fetchAverageRating:`${APIURL}?action=fetchAverageRating&id=`,
    fetchAverageEmotions:`${APIURL}?action=fetchAverageEmotions&id=`,
    addBook: `${APIURL}?action=addBook`,
    submitBookRequest: `${APIURL}?action=submitBookRequest`,
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
    userLogout: `${APIURL}?action=logout`,
    userSignup: `${APIURL}?action=userSignup`,
    forgotPassword: `${APIURL}?action=forgotPassword`,
    fetchUserData: `${APIURL}?action=fetchUserData`,
    fetchUserDataFromUsername: `${APIURL}?action=fetchUserDataFromUsername`,
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
    registerNotificationToken: `${APIURL}?action=registerNotificationToken`,
    fetchReadingStreakLeaderboard: `${APIURL}?action=fetchReadingStreakLeaderboard&userId=`,
    fetchPagesRead: `${APIURL}?action=fetchPagesRead&userId=`,
    fetchReadingDurationGraph: `${APIURL}?action=fetchReadingDurationGraph&userId=`,
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
    fetchUserGoals: `${INSIGHTSAPI}?action=fetchUserGoals&userId=`,
    fetchCurrentProgress: `${INSIGHTSAPI}?action=fetchCurrentProgress&userId=`,
    submitGoal: `${INSIGHTSAPI}?action=submitGoal&userId=`,

    //request to biblophile util apis
    fetchBannerData:`${UTILS_ACTIONS_API_URL}?action=fetchBannerData`,

    //request to biblophile social apis
    fetchUserRelations:`${SOCIAL_API_URL}?action=fetchUserRelations`,
    fetchFriendRequests:`${SOCIAL_API_URL}?action=fetchFriendRequests`,
    toggleFollow:`${SOCIAL_API_URL}?action=toggleFollow`,
    toggleFriend:`${SOCIAL_API_URL}?action=toggleFriend`,
    confirmRejectFriend:`${SOCIAL_API_URL}?action=confirmRejectFriend`,
    fetchPrivacyStatus:`${SOCIAL_API_URL}?action=fetchPrivacyStatus`,
}

export default requests;