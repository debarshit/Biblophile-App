import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import {useStore} from '../store/store';
import instance from '../services/axios';
import requests from '../services/requests';
import GradientBGIcon from '../components/GradientBGIcon';
import PaymentMethod from '../components/PaymentMethod';
import PaymentFooter from '../components/PaymentFooter';
import PopUpAnimation from '../components/PopUpAnimation';

const PaymentList = [
  {
    name: 'Online',
    icon: 'credit-card',
    isIcon: true,
  },
  {
    name: 'COD',
    icon: 'wallet',
    isIcon: false,
  },
];

const PaymentScreen = ({navigation, route}: any) => {
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const clearCart = useStore(
    (state: any) => state.clearCart,
  );
  const userDetails = useStore((state: any) => state.userDetails);

  const [paymentMode, setPaymentMode] = useState('Online');
  const [showAnimation, setShowAnimation] = useState(false);
  const [isSubscription, setIsSubscription] = useState(false);
  const [amount, setAmount] = useState(route.params.amount);

  const { action } = route.params || {}; // Ensure params exist

  //handle the deep linked function
  const handleAction = (action) => {
    setAmount(action);
  };

  const placeOrder = async (paymentStatus) => {
    if (userDetails[0].userAddress === null) {
      navigation.push('Profile', {
        update: "Please fill your address",
      });
    }
    else {
      try {
        for (const data of route.params.cart) {
          const response = await instance.post(requests.placeOrder, {
            custId: userDetails[0].userId,
            custName: userDetails[0].userName,
            custPhone: userDetails[0].userPhone,
            custAddress: userDetails[0].userAddress,
            orderedBook: data.name,
            orderImage: data.photo,
            payment: paymentStatus,
            orderMode: data.prices[0].size,
            custOrderDuration: data.prices[0].quantity, //duration for rent and qty for buy
            amount: (data.prices[0].price*data.prices[0].quantity),
          });
          
          if (response.data.message === 1) {
            setShowAnimation(true);
            clearCart();
            calculateCartPrice();
            setTimeout(() => {
              setShowAnimation(false);
              navigation.navigate('History');
            }, 2000);
          } else {
            alert(response.data.message);
            console.log(response);
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  const placeSubscriptionOrder = async () => {
    try {
        const response = await instance.post(requests.placeSubscriptionOrder, {
          custId: userDetails[0].userId,
          planId: route.params.subscription,
        });
        
        if (response.data.message === 1) {
          //navigate to subscription page or just do navigation.back
          setShowAnimation(true);
            setTimeout(() => {
              setShowAnimation(false);
              navigation.navigate('Subscription');
            }, 2000);

        } else {
          alert(response.data.message);
          console.log(response);
        }
      
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (route.params.subscription) {
      setIsSubscription(true);
    }
  }, [isSubscription]);

  useEffect(() => {
    if (action) {
      handleAction(action);
    }
  }, [action]);
  

  const handleOnlinePayment = async () => {
    if (userDetails[0].userAddress === null) {
      navigation.push('Profile', {
        update: 'Please fill your address',
      });
    } else {
      if (amount > 0) {
        try {
          const response = await instance.post(requests.paymentRequest, {
            customerName: userDetails[0].userName,
            customerPhone: userDetails[0].userPhone,
            amount: amount,
          });

          if (response.data && response.data.link_url) {
            navigation.push('PaymentGateway', {
              url: response.data.link_url,
            });

            const link_id = response.data.link_id;

            let timeoutReached = false;

            const pollPaymentStatus = setInterval(async () => {
              try {
                const statusResponse = await instance.post(
                  requests.paymentSuccessful + link_id,
                  {
                    customerId: userDetails[0].userId,
                    customerPhone: userDetails[0].userPhone,
                    amount: route.params.amount,
                  },
                );
                if (statusResponse.data.status === 'success. You can close this window.') {
                  clearInterval(pollPaymentStatus);
                  if (action) {
                    navigation.navigate('History');
                  } else {
                    if (isSubscription) {
                      placeSubscriptionOrder();
                    } else {
                      placeOrder(1);
                    }
                  }
                }
              } catch (error) {
                console.error(
                  'Error occurred while checking payment status:',
                  error,
                );
              }
            }, 5000);

            // Stop polling after 5 minutes (300000ms)
          setTimeout(() => {
            timeoutReached = true;
            clearInterval(pollPaymentStatus);
            alert('Payment status check timed out. Please try again later.');
          }, 300000);

          } else {
            alert('Network error! Please try again.');
          }
        } catch (error) {
          console.error('Error occurred during payment:', error);
        }
      } else {
        placeOrder(0);
      }
    }
  };

  const buttonPressHandler = () => {
    if (paymentMode === 'Online') {
      handleOnlinePayment();
    } else {
      if (!action) {
        if (isSubscription) {
          placeSubscriptionOrder();
        } else {
          placeOrder(0);
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />

      {showAnimation ? (
        <PopUpAnimation
          style={styles.LottieAnimation}
          source={require('../lottie/successful.json')}
        />
      ) : (
        <></>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <View style={styles.HeaderContainer}>
          <TouchableOpacity
            onPress={() => {
              navigation.pop();
            }}>
            <GradientBGIcon
              name="left"
              color={COLORS.primaryLightGreyHex}
              size={FONTSIZE.size_16}
            />
          </TouchableOpacity>
          <Text style={styles.HeaderText}>Payments</Text>
          <View style={styles.EmptyView} />
        </View>

        <View style={styles.PaymentOptionsContainer}>
          {PaymentList.map((data: any) => (
            <TouchableOpacity
              key={data.name}
              onPress={() => {
                setPaymentMode(data.name);
              }}>
              <PaymentMethod
                paymentMode={paymentMode}
                name={data.name}
                icon={data.icon}
                isIcon={data.isIcon}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <PaymentFooter
        buttonTitle={`Pay ${paymentMode}`}
        price={{price: amount, currency: '₹'}}
        buttonPressHandler={buttonPressHandler}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  LottieAnimation: {
    flex: 1,
  },
  ScrollViewFlex: {
    flexGrow: 1,
  },
  HeaderContainer: {
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  HeaderText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
  EmptyView: {
    height: SPACING.space_36,
    width: SPACING.space_36,
  },
  PaymentOptionsContainer: {
    padding: SPACING.space_15,
    gap: SPACING.space_15,
  },
});

export default PaymentScreen;
