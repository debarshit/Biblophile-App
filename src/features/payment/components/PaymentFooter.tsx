import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import PriceBreakdownTable from './PriceBreakdownTable';
import DeliveryOptions from './DeliveryOptions';
import CouponSystem from './CouponSystem';
import requests from '../../../services/requests';
import instance from '../../../services/axios';
import { useStore } from '../../../store/store';
import { useNavigation } from '@react-navigation/native';

interface PriceProps {
  price: string;
  size?: string;
  currency: string;
}

interface DeliveryOptionsData {
  deliveryOption: "delivery" | "self-pickup";
  pickupLocationId: string | null;
  appliedCoupon: string | null;
}

interface PaymentFooterProps {
  price: PriceProps;
  buttonPressHandler: (totalPrice: string, securityDeposit: string, deliveryOptions: DeliveryOptionsData) => void;
  buttonTitle: string;
}

const PaymentFooter: React.FC<PaymentFooterProps> = ({
  price,
  buttonPressHandler,
  buttonTitle,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [subscription, setSubscription] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState("0.00");
  const [securityDeposit, setSecurityDeposit] = useState("0.00");
  const [totalPrice, setTotalPrice] = useState("0.00");
  const navigation = useNavigation<any>();
  
  // Delivery and pickup states
  const [pickupDropOption, setPickupDropOption] = useState<"delivery" | "self-pickup">("delivery");
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<string>("");
  
  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const userDetails = useStore((state: any) => state.userDetails);
  const CartList = useStore((state: any) => state.CartList);

  // Valid coupon codes
  const VALID_COUPONS = {
    'PINEAPPLE': {
      type: 'delivery_waiver',
      description: 'Free delivery & pickup'
    }
  };

  useEffect(() => {
    async function fetchActivePlan() {
        try {
            const response = await instance(requests.fetchActivePlan, {
              headers: {
                Authorization: `Bearer ${userDetails[0].accessToken}`,
              },
            });
            const data = response.data.data;
            if (data[0].PlanId !== null) {
              setSubscription(true);
            }
          } catch (error) {
            console.error('Error fetching plans:', error);
          }
    }
  
    fetchActivePlan();
  }, []);

  useEffect(() => {
    async function fetchPricingDetails() {
      try {
        const delivery = calculateDeliveryFee();
        const deposit = await calculateSecurityDeposit();

        setDeliveryFee(delivery);
        setSecurityDeposit(deposit);

        const total = (
          parseFloat(price.price) +
          parseFloat(delivery) +
          parseFloat(deposit)
        ).toFixed(2);

        setTotalPrice(total);
      } catch (error) {
        console.error('Error calculating pricing details:', error);
      }
    }

    fetchPricingDetails();
  }, [price.price, CartList, subscription, pickupDropOption, appliedCoupon]);
  
  // Calculate delivery fee based on cart items, pickup option, and coupon
  const calculateDeliveryFee = (): string => {
    if (subscription || pickupDropOption === "self-pickup" || appliedCoupon === 'PINEAPPLE') {
      return "0.00";
    }

    let deliveryFee = 0;
    const numericCartPrice = parseFloat(price.price);

    if (numericCartPrice < 120 && CartList.length > 0) {
      CartList.forEach((item) => {
        if (item.type === "Book") {
          const priceInfo = item.prices[0];
          deliveryFee += priceInfo.size === "Buy" ? 50 : 90;
        }
      });
    }

    return deliveryFee.toFixed(2);
  };

  // Calculate the security deposit if needed
  const calculateSecurityDeposit = async (): Promise<string> => {
    const hasRentItem = CartList.some(
      (item) => item.type === 'Book' && item.prices[0].size !== 'Buy'
    );

    if (!hasRentItem) {
      return "0.00";
    }

    try {
      const response = await instance.get(requests.fetchDeposit, {
        headers: {
          Authorization: `Bearer ${userDetails[0].accessToken}`,
        },
      });

      const currentDeposit = response.data.data.deposit|| 0;
      return currentDeposit < 300 ? (300 - currentDeposit).toFixed(2) : "0.00";
    } catch (error) {
      console.error("Failed to fetch deposit:", error);
      return "0.00";
    }
  };

  // Handle coupon application
  const handleCouponApplied = (couponCode: string) => {
    setAppliedCoupon(couponCode);
  };

  // Handle coupon removal
  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  // Handle delivery option change
  const handleDeliveryOptionChange = (option: "delivery" | "self-pickup") => {
    setPickupDropOption(option);
    if (option === "delivery") {
      setSelectedPickupLocation("");
    }
  };

  // Handle pickup location selection
  const handlePickupLocationSelect = (locationId: string) => {
    setSelectedPickupLocation(locationId);
  };

  const navigateToSubscription = () => {
    navigation.navigate('Subscription');
  };

  // Handle button press with delivery options
  const handleButtonPress = () => {
    if (pickupDropOption === "self-pickup" && !selectedPickupLocation) {
      alert("Please select a pickup point for self-pickup.");
      return;
    }

    const deliveryOptions: DeliveryOptionsData = {
      deliveryOption: pickupDropOption,
      pickupLocationId: pickupDropOption === "self-pickup" ? selectedPickupLocation : null,
      appliedCoupon: appliedCoupon
    };
    
    buttonPressHandler(totalPrice, securityDeposit, deliveryOptions);
  };
  
  return (
    <View style={styles.priceFooterContainer}>
      {buttonTitle === 'Pay' && <>
        {/* Delivery Options Section */}
        <DeliveryOptions
          deliveryOption={pickupDropOption}
          onDeliveryOptionChange={handleDeliveryOptionChange}
          selectedPickupLocationId={selectedPickupLocation}
          onPickupLocationSelect={handlePickupLocationSelect}
          userToken={userDetails[0].accessToken}
        />

        {/* Coupon Section */}
        <CouponSystem
          appliedCoupon={appliedCoupon}
          onCouponApplied={handleCouponApplied}
          onCouponRemoved={handleCouponRemoved}
          validCoupons={VALID_COUPONS}
        />

        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}>
          <Text style={styles.expandButtonText}>
            {expanded ? "Hide Details" : "View Price Breakdown"}
          </Text>
        </TouchableOpacity>
        
        {expanded && (
          <PriceBreakdownTable 
            subtotal={price.price}
            deliveryFee={deliveryFee}
            securityDeposit={securityDeposit}
            totalPrice={totalPrice}
          />
        )}

        {!subscription && parseFloat(deliveryFee) > 0 && (
          <TouchableOpacity 
            style={styles.subscriptionPromo}
            onPress={navigateToSubscription}>
            <Text style={styles.promoText}>
              <Text style={styles.subscribeNowText}> Subscribe now </Text>
              to get free delivery and save on rentals!
            </Text>
          </TouchableOpacity>
        )}
      </>}
      
      <View style={styles.priceFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceTitle}>{price.size === 'Buy' && buttonTitle !== 'Pay' ? 'From' : 'Total'}</Text>
          <Text style={styles.priceText}>
            ₹ <Text style={styles.price}>{totalPrice === 'NaN' ? '' : buttonTitle === 'Pay' ? totalPrice : price.price}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handleButtonPress}>
          <Text style={styles.buttonText}>{buttonTitle}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  priceFooterContainer: {
    backgroundColor: COLORS.primaryBlackHex,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondaryDarkGreyHex,
    paddingTop: SPACING.space_10,
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: SPACING.space_10,
  },
  expandButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
  },
  subscriptionPromo: {
    paddingHorizontal: SPACING.space_20,
    paddingBottom: SPACING.space_10,
  },
  promoText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
  subscribeNowText: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  priceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.space_20,
    padding: SPACING.space_20,
  },
  priceContainer: {
    alignItems: 'center',
    width: 100,
  },
  priceTitle: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
  },
  priceText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryOrangeHex,
  },
  price: {
    color: COLORS.primaryWhiteHex,
  },
  payButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: SPACING.space_36 * 2,
    borderRadius: BORDERRADIUS.radius_20,
  },
  buttonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
});

export default PaymentFooter;