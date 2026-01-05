const isDevelopment = __DEV__;

const APIURL = isDevelopment ? 'api/v0/' : 'backend/api/v0/';

const requests = {
    //auth requests
    userLogin: `${APIURL}auth/login`,
    refreshToken: `${APIURL}auth/refresh-token`,
    userLogout: `${APIURL}auth/logout`,
    userSignup: `${APIURL}auth/signup`,
    forgotPassword: `${APIURL}auth/forgot-password`,

    //books data requests
    getBookGenre:`${APIURL}books/genre`,
    getBooks:`${APIURL}books/?bookGenre=`,
    fetchWorkDetails: (id) => `${APIURL}books/${id}`,
    fetchExternalBookDetails: (id) => `${APIURL}books/external/${id}`,
    fetchAverageRating: (id) => `${APIURL}books/${id}/rating`,
    fetchAverageEmotions: (id) => `${APIURL}books/${id}/emotions`,
    createWork: `${APIURL}books/works/`,
    addWorkEdition:(workId: number) => `${APIURL}books/works/${workId}/editions`,
    fetchWorkEditions:(workId: number) => `${APIURL}books/works/${workId}/editions`,
    submitBookRequest: `${APIURL}books/request`,
    fetchBookId: (isbn) => `${APIURL}books/isbn/${isbn}`,
    fetchBooksByUserBookIds: `${APIURL}books/userbooks`,
    fetchReadingStatus: (id) => `${APIURL}books/${id}/status`,
    submitReadingStatus: `${APIURL}books/status`,
    fetchProductReviews: (id) => `${APIURL}books/${id}/reviews`,
    searchBooks: `${APIURL}books/search?searchQuery=`,
    searchExternalBooks: `${APIURL}books/search-external?searchQuery=`,
    fetchReviewTags: `${APIURL}books/reviews/tags`,

    //books meta requests
    searchAuthors: `${APIURL}admin/book-meta/authors/search`,
    searchGenres: `${APIURL}admin/book-meta/genres/search`,
    searchSeries: `${APIURL}admin/book-meta/series/search`,

    //subscription requests
    fetchSubscriptionPlans: `${APIURL}subscriptions/plans`,
    fetchActivePlan: `${APIURL}subscriptions/active-plan`,

    //orders requests
    fetchOrders: `${APIURL}orders/`,
    placeOrder: `${APIURL}orders/`,
    placeSubscriptionOrder: `${APIURL}orders/subscription`,
    updateOrder: (orderId: number) => `${APIURL}orders/${orderId}`,

    //user requests
    fetchUserData: `${APIURL}?action=fetchUserData`,
    fetchUserDataFromUsername: (username) => `${APIURL}users/username/${username}`,
    updateUserData: `${APIURL}users/update`,
    uploadUserDp: `${APIURL}users/upload-dp`,
    fetchDeposit: `${APIURL}users/deposit`,
    requestDepositRefund: `${APIURL}users/deposit/request-refund`,
    registerNotificationToken: `${APIURL}users/notification-token`,
    fetchUserGoals: `${APIURL}users/goals`,
    fetchCurrentProgress: `${APIURL}users/progress`,
    submitGoal: `${APIURL}users/goals`,
    fetchAverageRatingByUser:`${APIURL}users/rating?userId=`,
    fetchAverageEmotionsByUser:`${APIURL}users/emotions?userId=`,
    fetchAverageDaystoFinish: `${APIURL}users/days-to-finish?userId=`,
    fetchUserReviews: `${APIURL}users/reviews?userId=`,
    updateUserReview: (ratingId) => `${APIURL}users/reviews/${ratingId}`,
    fetchBookShelf: `${APIURL}users/bookshelf`,
    fetchUserNotes: `${APIURL}users/notes`,
    updateUserNote: (id) => `${APIURL}users/notes/${id}`,

    //recommendation requests
    getSpotlight: `${APIURL}recommendations/spotlight`,
    fetchSeasonalRecommendations: `${APIURL}recommendations/seasonal`,
    fetchHotRecommendations: `${APIURL}recommendations/hot`,
    fetchCulturalRecommendations: `${APIURL}recommendations/cultural`,
    getFilteredRecommendations: `${APIURL}recommendations/filtered`,

    //city-discovery requests
    getCityEvents: (id: string) => `${APIURL}city-discover/${id}/events`,
    getCityPlaces: (id: string) => `${APIURL}city-discover/${id}/places`,
    submitEventStatus: `${APIURL}city-discover/submit/event`,

    //reading activity requests
    submitReadingDuration: `${APIURL}reading/reading-activity/reading-duration`,
    submitReview: `${APIURL}reading/reading-activity/reviews`,
    submitNote: `${APIURL}reading/reading-activity/notes`,
    fetchCurrentReads: `${APIURL}reading/reading-activity/current-reads`,
    fetchUserBooks: `${APIURL}reading/reading-activity/user-books`,
    updateBookDates: `${APIURL}reading/reading-activity/book-dates`,
    updateReadingStreak: `${APIURL}reading/reading-activity/streak`,
    updatePagesRead: `${APIURL}reading/reading-activity/pages-read`,

    //reading queue requests
    fetchReadingQueue: `${APIURL}reading/reading-queue`,
    addToQueue: `${APIURL}reading/reading-queue`,
    reorderQueue: `${APIURL}reading/reading-queue/reorder`,
    removeFromQueue: (userBookId) => `${APIURL}reading/reading-queue/${userBookId}`,

    //reading tag requests
    fetchUserTags: `${APIURL}reading/tags`,
    fetchUserBookshelfTags: `${APIURL}reading/tags/bookshelf`,
    createTag: `${APIURL}reading/tags`,
    fetchBookTags: (bookId) => `${APIURL}reading/tags/book/${bookId}`,
    fetchBooksByTag: (tagId) => `${APIURL}reading/tags/${tagId}/books`,
    assignTagToBook: (bookId, tagId) => `${APIURL}reading/tags/book/${bookId}/${tagId}`,
    removeTagFromBook: (bookId, tagId) => `${APIURL}reading/tags/book/${bookId}/${tagId}`,

    //reading insights requests
    fetchReadingStreak: `${APIURL}reading/reading-insights/streak`,
    fetchReadingStreakLogs: `${APIURL}reading/reading-insights/streak-logs`,
    fetchPagesRead: `${APIURL}reading/reading-insights/pages-read`,
    fetchReadingDurations: `${APIURL}reading/reading-insights/durations`,
    fetchReadingDurationGraph: `${APIURL}reading/reading-insights/duration-graph`,
    fetchReadingStreakLeaderboard: `${APIURL}reading/reading-insights/leaderboard`,
    fetchReadingTips: `${APIURL}reading/reading-insights/tips`,

    //give-away requests
    fetchGiveawayBooks: `${APIURL}giveaways/books`,

    //payment requests
    paymentRequest: `${APIURL}payments/request`,
    paymentSuccessful: `${APIURL}payments/success`,

    //ui and utils requests
    fetchBannerData:`${APIURL}ui/banners`,
    fetchEmotions:`${APIURL}?action=fetchEmotions`,

    //notifications requests
    fetchNotifications: `${APIURL}notifications/`,
    markNotificationAsRead: (notificationId) => `${APIURL}notifications/${notificationId}/read`,
    markAllNotificationsAsRead: `${APIURL}notifications/mark-all-read`,
    getUnreadNotificationCount: `${APIURL}notifications/unread-count`,

    //user-relations requests
    fetchUserRelations: (pageOwnerId) => `${APIURL}social/user-relations/${pageOwnerId}/relations`,
    fetchFriendRequests:`${APIURL}social/user-relations/friend-requests/incoming`,
    toggleFollow:`${APIURL}social/user-relations/toggle-follow`,
    toggleFriend:`${APIURL}social/user-relations/toggle-friend`,
    confirmRejectFriend:`${APIURL}social/user-relations/friend-request/action`,
    fetchPrivacyStatus:`${APIURL}social/user-relations/`,
    fetchSimilarUsers:`${APIURL}social/user-relations/similar-users`,

    //buddy-reads requests
    fetchBuddyReads:`${APIURL}social/buddy-reads/`,
    fetchMyBuddyReads:`${APIURL}social/buddy-reads/my-reads`,
    createBuddyRead:`${APIURL}social/buddy-reads/`,
    fetchBuddyReadDetails: (id) => `${APIURL}social/buddy-reads/${id}`,
    submitComment: (id) => `${APIURL}social/buddy-reads/${id}/comments`,
    fetchComments: (id) => `${APIURL}social/buddy-reads/${id}/comments`,
    fetchReplies: (commentId) => `${APIURL}social/buddy-reads/comments/${commentId}/replies`,
    deleteComment: (commentId) => `${APIURL}social/buddy-reads/comments/${commentId}`,
    toggleLike: (commentId) => `${APIURL}social/buddy-reads/comments/${commentId}/like`,
    JoinLeaveBuddyReads: (id) => `${APIURL}social/buddy-reads/${id}/join`,
    updateBuddyReadDescription: (id) => `${APIURL}social/buddy-reads/${id}/description`,

    //readalongs requests
    createReadalong:`${APIURL}social/readalongs/`,
    fetchReadalongs:`${APIURL}social/readalongs/`,
    fetchMyReadalongs:`${APIURL}social/readalongs/my-readalongs`,
    fetchReadalongDetails: (readalongId) => `${APIURL}social/readalongs/${readalongId}`,
    checkReadalongMembership:`${APIURL}social/readalongs/check-membership`,
    fetchReadalongParticipants:(readalongId) => `${APIURL}social/readalongs/${readalongId}/participants`,
    updateReadalongDescription: (readalongId) => `${APIURL}social/readalongs/${readalongId}/description`,
    JoinLeaveReadalongs:`${APIURL}social/readalongs/join-leave`,
    fetchReadalongComments: (checkpointId) => `${APIURL}social/readalongs/comments/${checkpointId}`,
    submitReadalongComment: (checkpointId) => `${APIURL}social/readalongs/checkpoints/${checkpointId}/comments`,
    toggleReadalongLike: (commentId) => `${APIURL}social/readalongs/comments/${commentId}/like`,
    deleteReadalongComment: (commentId) => `${APIURL}social/readalongs/comments/${commentId}`,
    createOrUpdateReadalongCheckpoints:`${APIURL}social/readalongs/checkpoints`,
    fetchreadalongCheckpoints: (readalongId) => `${APIURL}social/readalongs/${readalongId}/checkpoints`,
    
    //book clubs requests
    fetchBookClubs:`${APIURL}social/book-clubs/`,
    fetchMyBookClubs:`${APIURL}social/book-clubs/my-bookclubs`,
    fetchBookClubDetails: (bookClubId) => `${APIURL}social/book-clubs/${bookClubId}`,
    JoinLeaveBookClub:`${APIURL}social/book-clubs/join-leave`,
    createBookClub:`${APIURL}social/book-clubs/`,
    createOrUpdateBookClubMeetings:`${APIURL}social/book-clubs/meetings`, 
    fetchBookClubMeetings:(clubId) => `${APIURL}social/book-clubs/${clubId}/meetings`,
    checkBookClubMembership: (bookClubId) => `${APIURL}social/book-clubs/${bookClubId}/membership`,
    updateBookClubDescription: (bookClubId) => `${APIURL}social/book-clubs/${bookClubId}/description`,
    updateBookClubAbout: (bookClubId) => `${APIURL}social/book-clubs/${bookClubId}/about`,
    updateBookClubCode: (bookClubId) => `${APIURL}social/book-clubs/${bookClubId}/code-of-conduct`,

    //challenges requests
    fetchChallenges:`${APIURL}challenges/`,
    createChallenge:`${APIURL}challenges/`,
    checkChallengeHost:`${APIURL}challenges/check-host`,
    fetchChallengeDetails: (challengeId) => `${APIURL}challenges/${challengeId}`,
    checkChallengeMembership:`${APIURL}challenges/check-membership`,
    updateChallengeDescription: (challengeId) => `${APIURL}challenges/${challengeId}/description`,
    JoinLeaveChallenge:`${APIURL}challenges/toggle-membership`,
    createOrUpdateChallengePrompts:`${APIURL}challenges/prompts`,
    fetchChallengePrompts: (challengeId) => `${APIURL}challenges/${challengeId}/prompts`,
    fetchPromptDetails: (promptId) => `${APIURL}challenges/prompts/${promptId}`,
    updatePromptProgress: (promptId) => `${APIURL}challenges/prompts/${promptId}/progress`,
    fetchCategories:`${APIURL}challenges/categories`,
    fetchKeywords:`${APIURL}challenges/keywords`,
}

export default requests;