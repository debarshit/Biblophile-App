import React, { useState, useEffect } from 'react';
import { 
  Dimensions, 
  FlatList, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  ActivityIndicator,
  ScrollView,
  Alert,
  ToastAndroid,
  Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { COLORS, FONTSIZE, FONTFAMILY, SPACING, BORDERRADIUS } from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get("window");

const SubscriptionScreen = ({ navigation }) => {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [newSubscription, setNewSubscription] = useState(false);
  const [loadingRefund, setLoadingRefund] = useState(false);
  const [refundRequested, setRefundRequested] = useState(false);

  const userDetails = useStore((state) => state.userDetails);

  const fetchActivePlan = async () => {
    try {
      const response = await instance(requests.fetchActivePlan, {
        headers: {
          Authorization: `Bearer ${userDetails[0].accessToken}`,
        },
      });
      const data = response.data.data;
      
      const hadActivePlan = activePlan.length > 0 && activePlan[0]?.PlanId;
      const hasActivePlan = data.length > 0 && data[0]?.PlanId;
      
      setActivePlan(data);
      
      // Show success message if this is a new subscription
      if (!hadActivePlan && hasActivePlan && newSubscription) {
        setShowSuccessMessage(true);
        setNewSubscription(false);
      }
    } catch (error) {
      console.error('Error fetching active plan:', error);
    }
  };

  // Fetch subscription plans
  const fetchPlanList = async () => {
    try {
      const response = await instance(requests.fetchSubscriptionPlans);
      const data = response.data.data;
      setPlans(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleRefundRequest = async () => {
    try {
      setLoadingRefund(true);
      const res = await instance.post(requests.requestDepositRefund,
        { amount: userDetails[0].deposit },
        {
          headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
        }
      );
      
      if (res.status === 200) {
        setRefundRequested(true);
        // Show toast notification
        if (Platform.OS === 'android') {
          ToastAndroid.showWithGravity(
            'Refund request submitted successfully',
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
          );
        } else {
          Toast.show({
            type: 'success',
            text1: 'Refund Request Sent',
            text2: 'Your deposit refund request has been submitted',
            visibilityTime: 2000,
            autoHide: true,
            position: 'bottom',
            bottomOffset: 100,
          });
        }
      }
    } catch (err) {
      console.error("Error requesting deposit refund", err.response.data.message);
      // Show error toast
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(
          err.response.data.message || 'Something went wrong. Try again later.',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Request Failed',
          text2: err.response.data.message || 'Something went wrong while requesting refund',
          visibilityTime: 2000,
          autoHide: true,
          position: 'bottom',
          bottomOffset: 100,
        });
      }
    } finally {
      setLoadingRefund(false);
    }
  };


  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchActivePlan(),
          fetchPlanList()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadInitialData();
  }, []);

  // Refresh active plan on screen focus
  useFocusEffect(
    React.useCallback(() => {
      fetchActivePlan();
      return () => {};
    }, [])
  );

  // Handle subscription selection and payment
  const handleSubscription = (planPrice, planId) => {
    if (processingPayment) return;
    
    // Validate user data before proceeding
    if (!userDetails[0].userName || !userDetails[0].userPhone) {
      Alert.alert(
        "Missing Information",
        "Please ensure your name and phone number are set in your profile before subscribing.",
        [{ text: "OK" }]
      );
      return;
    }
    
    setProcessingPayment(true);
    
    // Navigate to payment screen with plan details
    navigation.push('Payment', {
      amount: planPrice,
      subscription: planId,
      onPaymentSuccess: () => {
        setNewSubscription(true);
        fetchActivePlan();
        setProcessingPayment(false);
      }
    });
  };

  // Render subscription plan item
  const renderSubscriptionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.subscriptionItem}
      onPress={() => handleSubscription(item.PlanPrice, item.PlanId)}
      disabled={processingPayment}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text style={styles.title}>{item.PlanName}</Text>
        <View style={styles.titleUnderline} />
        <Text style={styles.description}>{item.PlanDescription}</Text>
        {item.Extras && <Text style={styles.extras}>{item.Extras}</Text>}
        <Text style={styles.price}>₹ {item.PlanPrice}</Text>
        <View style={styles.subscribeButton}>
          <Text style={styles.subscribeButtonText}>Subscribe</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.shimmerContainer}>
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={styles.shimmerPlaceholder}
            shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
            visible={!loading}
          />
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={styles.shimmerPlaceholder}
            shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
            visible={!loading}
          />
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={styles.shimmerPlaceholder}
            shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
            visible={!loading}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar showBackButton={true} title='Subscription Options'/>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Security Deposit */}
        <View style={styles.depositView}>
          <View style={styles.depositInfo}>
            <Text style={styles.depositLabel}>Security deposit: </Text>
            <Text style={styles.depositValue}>₹ {userDetails[0].deposit}</Text>
          </View>
          
          {/* Deposit Refund Button */}
          {userDetails[0].deposit !== "0" && !refundRequested && (
            <TouchableOpacity
              style={styles.refundButton}
              onPress={handleRefundRequest}
              disabled={loadingRefund}
              activeOpacity={0.7}
            >
              {loadingRefund ? (
                <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
              ) : (
                <MaterialIcons name="money-off" size={18} color={COLORS.primaryWhiteHex} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Refund Request Status */}
        {refundRequested && (
          <View style={styles.refundStatusContainer}>
            <MaterialIcons name="check-circle" size={20} color="#00c853" />
            <Text style={styles.refundStatusText}>Your refund request has been submitted.</Text>
          </View>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <View style={styles.successMessage}>
            <Text style={styles.successMessageTitle}>Subscription activated successfully!</Text>
            <Text style={styles.successMessageText}>You now have full access to our library. Start exploring our collection.</Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => navigation.navigate('Library')}
            >
              <Text style={styles.browseButtonText}>Browse Books Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Plan Section */}
        {activePlan[0] && activePlan[0].PlanId && (
          <>
            <Text style={styles.heading}>Active Plan</Text>
            <View style={styles.activePlanContainer}>
              <View style={styles.activeFlag}>
                <Text style={styles.activeFlagText}>ACTIVE</Text>
              </View>
              <Text style={styles.title}>{activePlan[0].PlanName}</Text>
              <View style={styles.titleUnderline} />
              <Text style={styles.description}>{activePlan[0].PlanDescription}</Text>
              <View style={styles.footer}>
                <Text style={styles.price}>₹ {activePlan[0].PlanPrice}</Text>
                {activePlan[0].EndDate && (
                  <Text style={styles.deadline}>
                    Ends on: {activePlan[0].EndDate.split(" ")[0]}
                  </Text>
                )}
              </View>
              
              {!showSuccessMessage && (
                <TouchableOpacity 
                  style={styles.browseButton}
                  onPress={() => navigation.navigate('Library')}
                >
                  <Text style={styles.browseButtonText}>Browse Our Library</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Subscription Plans Section */}
        <Text style={styles.heading}>Subscription Plans</Text>
        
        {/* Location restriction notice */}
        <View style={styles.locationNotice}>
          <Text style={styles.locationNoticeIcon}>ⓘ</Text>
          <View style={styles.locationNoticeContent}>
            <Text style={styles.locationNoticeTitle}>Bangalore Only:</Text>
            <Text style={styles.locationNoticeText}>
              Our subscription services are currently available exclusively for customers in Bangalore.
            </Text>
          </View>
        </View>

        {/* Processing Payment Indicator */}
        {processingPayment && (
          <View style={styles.processingPayment}>
            <ActivityIndicator color={COLORS.primaryOrangeHex} size="small" />
            <Text style={styles.processingPaymentText}>Processing payment, please wait...</Text>
          </View>
        )}

        {/* Subscription Plans List */}
        <FlatList
          data={plans}
          renderItem={renderSubscriptionItem}
          keyExtractor={(item) => item.PlanId.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.plansList}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.space_16,
    backgroundColor: COLORS.primaryBlackHex,
  },
  shimmerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerPlaceholder: {
    width: width * 0.9,
    height: 200,
    borderRadius: BORDERRADIUS.radius_10,
    marginVertical: SPACING.space_16,
  },
  heading: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_24,
    marginBottom: SPACING.space_16,
    textAlign: 'center',
  },
  depositView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_12,
  },
  depositInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  depositLabel: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
    marginRight: SPACING.space_8,
  },
  depositValue: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  refundButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_8,
    marginLeft: SPACING.space_12,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    borderWidth: 1,
    borderColor: '#00c853',
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_12,
    marginBottom: SPACING.space_12,
  },
  refundStatusText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: '#00c853',
    marginLeft: SPACING.space_8,
    flex: 1,
  },
  subscriptionItem: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_24,
    marginBottom: SPACING.space_24,
    marginHorizontal: SPACING.space_16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
    marginBottom: SPACING.space_12,
    color: COLORS.primaryOrangeHex,
    textAlign: 'center',
  },
  titleUnderline: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.primaryOrangeHex,
    opacity: 0.6,
    marginBottom: SPACING.space_12,
  },
  description: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    marginBottom: SPACING.space_16,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
  extras: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
    marginBottom: SPACING.space_12,
    color: COLORS.primaryWhiteHex,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    textAlign: 'center',
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.space_16,
    paddingTop: SPACING.space_12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  price: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  deadline: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryRedHex,
  },
  activePlanContainer: {
    backgroundColor: 'rgba(209, 120, 66, 0.15)',
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_24,
    marginBottom: SPACING.space_24,
    marginHorizontal: SPACING.space_16,
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
    position: 'relative',
    alignItems: 'center',
  },
  activeFlag: {
    position: 'absolute',
    top: SPACING.space_12,
    right: -SPACING.space_30,
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_4,
    paddingHorizontal: SPACING.space_24,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },
  activeFlagText: {
    color: COLORS.primaryBlackHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_12,
  },
  subscribeButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_8,
    paddingVertical: SPACING.space_10,
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.space_16,
  },
  subscribeButtonText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  locationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(209, 120, 66, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(209, 120, 66, 0.3)',
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_16,
    marginHorizontal: SPACING.space_2,
    marginBottom: SPACING.space_24,
  },
  locationNoticeIcon: {
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryOrangeHex,
    marginRight: SPACING.space_12,
  },
  locationNoticeContent: {
    flex: 1,
  },
  locationNoticeTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_4,
  },
  locationNoticeText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
    lineHeight: 21,
  },
  processingPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
    marginBottom: SPACING.space_16,
  },
  processingPaymentText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_8,
  },
  plansList: {
    paddingBottom: SPACING.space_36,
  },
  successMessage: {
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    borderWidth: 1,
    borderColor: '#00c853',
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_16,
    marginVertical: SPACING.space_20,
    alignItems: 'center',
  },
  successMessageTitle: {
    color: '#00c853',
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    marginBottom: SPACING.space_12,
  },
  successMessageText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    textAlign: 'center',
    marginBottom: SPACING.space_8,
  },
  browseButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_10,
    paddingHorizontal: SPACING.space_24,
    borderRadius: BORDERRADIUS.radius_8,
    marginTop: SPACING.space_8,
  },
  browseButtonText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
});

export default SubscriptionScreen;