const requests = {
    //request to biblophile actions api
    getBookGenre:`/actions1.php?action=getBookGenre`,
    getBooks:`/actions1.php?action=getBooks&bookGenre=`,
    fetchProductDetails:`/actions1.php?action=fetchProductDetails&id=`,
    fetchExternalBookDetails:`/actions1.php?action=fetchExternalBookDetails&id=`, 
    fetchAverageRating:`/actions1.php?action=fetchAverageRating&id=`,
    fetchAverageEmotions:`/actions1.php?action=fetchAverageEmotions&id=`,
    addBook: `/actions1.php?action=addBook`,
    fetchBookId:`/actions1.php?action=fetchBookId`,
    fetchReadingStatus:`/actions1.php?action=fetchReadingStatus`,
    submitReadingStatus: `/actions1.php?action=submitReadingStatus`,
    fetchProductReviews:`/actions1.php?action=fetchProductReviews&id=`,
    fetchEmotions:`/actions1.php?action=fetchEmotions`,
    submitReview: `/actions1.php?action=submitReview`,
    submitEmotionScore: `/actions1.php?action=submitEmotionScore`,
    placeOrder: `/actions1.php?action=placeOrder`,
    placeSubscriptionOrder: `/actions1.php?action=placeSubscriptionOrder`,
    userLogin: `/actions1.php?action=userLogin`,
    userSignup: `/actions1.php?action=userSignup`,
    forgotPassword: `/actions1.php?action=forgotPassword`,
    fetchUserData: `/actions1.php?action=fetchUserData`,
    fetchOrders: `/actions1.php?action=fetchOrders`,
    updateUserData: `/actions1.php?action=updateUserData`,
    updateAppUserData: `/actions1.php?action=updateAppUserData`,
    fetchDeposit: `/actions1.php?action=fetchDeposit`,
    searchBooks: `/actions1.php?action=searchBooks&searchQuery=`,
    searchExternalBooks: `/actions1.php?action=searchExternalBooks&searchQuery=`,
    fetchSubscriptionPlans: `/actions1.php?action=fetchSubscriptionPlans`,
    fetchActivePlan: `/actions1.php?action=fetchActivePlan&userId=`,
    getBookmarks: `/actions1.php?action=getBookmarks`,
    fetchReadingStreak: `/actions1.php?action=fetchReadingStreak&userId=`,
    updateReadingStreak: `/actions1.php?action=updateReadingStreak&userId=`,
    updatePagesRead: `/actions1.php?action=updatePagesRead&userId=`,
    fetchReadingTips: `/actions1.php?action=fetchReadingTips`,
    updateNotificationToken: `/actions1.php?action=updateNotificationToken`,
    fetchReadingStreakLeaderboard: `/actions1.php?action=fetchReadingStreakLeaderboard&userId=`,
    fetchPagesRead: `/actions1.php?action=fetchPagesRead&userId=`,
    fetchCurrentReads: `/actions1.php?action=fetchCurrentReads`,
    fetchUserBooks: `/actions1.php?action=fetchUserBooks`,
    paymentRequest: `/actions1.php?action=paymentRequest`,
    paymentSuccessful: `/actions1.php?action=paymentSuccessful&linkId=`,

    //request to biblophile user-insights api
    fetchAverageRatingByUser:`/userInsights.php?action=fetchAverageRatingByUser&userId=`,
    fetchAverageEmotionsByUser:`/userInsights.php?action=fetchAverageEmotionsByUser&userId=`,
    fetchAverageDaystoFinish: `/userInsights.php?action=fetchAverageDaystoFinish&userId=`,
    fetchUserReviews: `/userInsights.php?action=fetchUserReviews&userId=`,
    updateUserReview: `/userInsights.php?action=updateUserReview`,
}

export default requests;