const requests = {
    //request to biblophile actions api
    getBookGenre:`/actions.php?action=getBookGenre`,
    getBooks:`/actions.php?action=getBooks&bookGenre=`,
    placeOrder: `/actions.php?action=placeOrder`,
    userLogin: `/actions.php?action=userLogin`,
    userSignup: `/actions.php?action=userSignup`,
    fetchUserData: `/actions.php?action=fetchUserData`,
    fetchOrders: `/actions.php?action=fetchOrders`,
    updateUserData: `/actions.php?action=updateUserData`,
    updateAppUserData: `/actions.php?action=updateAppUserData`,
    fetchDeposit: `/actions.php?action=fetchDeposit`,
    searchBooks: `/actions.php?action=searchBooks&searchQuery=`,
    fetchSubscriptionPlans: `/actions.php?action=fetchSubscriptionPlans`,
    fetchActivePlan: `/actions.php?action=fetchActivePlan&userId=`,
}

export default requests;