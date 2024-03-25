const requests = {
    //request to biblophile actions api
    getBookGenre:`/actions.php?action=getBookGenre`,
    getBooks:`/actions.php?action=getBooks`,
    placeOrder: `/actions.php?action=placeOrder`,
    userLogin: `/actions.php?action=userLogin`,
    userSignup: `/actions.php?action=userSignup`,
    fetchUserData: `/actions.php?action=fetchUserData`,
    fetchOrders: `/actions.php?action=fetchOrders`,
    updateUserData: `/actions.php?action=updateUserData`,
    fetchDeposit: `/actions.php?action=fetchDeposit`,
}

export default requests;