import React, { useState } from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../../../theme/theme';
import OrderItemCard from './OrderItemCard';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';

interface OrderHistoryCardProps {
  order: any;
}
const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({
  order,
}) => {
  const [orderStatus, setOrderStatus] = useState(order.OrderStatus);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [showPickupDetails, setShowPickupDetails] = useState(false);
  const userDetails = useStore((state: any) => state.userDetails);

  const handleReturnRequest = async () => {
    setButtonDisabled(true);
    try {
      const response = await instance.put(
        requests.updateOrder(order.OrderId), 
        {}, 
        {
          headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
        }
      );

      const result = await response.data.data;
      if (result.success) {
        setOrderStatus("5");
        Alert.alert("Success", "Return request submitted successfully!");
      } else {
        Alert.alert("Error", result.message || "Failed to request return.");
        setButtonDisabled(false);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "An error occurred while processing your request.");
      setButtonDisabled(false);
    }
  };

  // Check if return button should be shown
  const showReturnButton =
    order.OrderType == "0" && 
    order.DeliveryDate &&
    order.DeliveryDate !== "0000-00-00" &&
    orderStatus == "3";

  const getReturnButtonText = () => {
    if (orderStatus == "5") {
      return "Return Scheduled";
    }
    return "Ready to Return";
  };

  const getReturnButtonStyle = () => {
    if (orderStatus === "5") {
      return [styles.returnButton, styles.returnButtonScheduled];
    }
    return styles.returnButton;
  };
  return (
    <View style={styles.CardContainer}>
      <View style={styles.CardHeader}>
        <View>
          <Text style={styles.HeaderTitle}>Order Time</Text>
          <Text style={styles.HeaderSubtitle}>{order.OrderDate}</Text>
        </View>
        <View style={styles.PriceContainer}>
          <Text style={styles.HeaderTitle}>Total Amount</Text>
          <Text style={styles.HeaderPrice}>₹ {order.OrderAmount}</Text>
        </View>
      </View>
      <View style={styles.ListContainer}>
            <OrderItemCard
              type={order.OrderStatus}
              name={order.OrderItem}
              photo={order.OrderImage}
              prices={[
                { size: order.OrderType == '0' ? 'Rent' : 'Buy', price: order.OrderType == '0' ? order.OrderAmount/order.OrderDuration : order.OrderAmount/order.OrderQuantity, currency: '₹' },
              ]}
              ItemPrice={order.OrderAmount}
              quantity={order.OrderType == '0' ? order.OrderDuration : order.OrderQuantity}
            />
      </View>
      <View style={styles.CardFooter}>
        {order.DeliveryDate !== "0000-00-00" && <View>
            <Text style={styles.FooterTitle}>{order.PickupDropOption === 'self-pickup' ? 'Pickup from': 'Delivery Date'}</Text>
            <Text style={styles.FooterSubtitle}>{order.DeliveryDate}</Text>
          </View>}
        {order.OrderStatus === '0' && <View>
          <Text style={styles.FooterSubtitle}>Order Cancelled</Text>
        </View>}
        {order.DueDate !== "0000-00-00" &&  <View style={styles.ReturnContainer}>
            <Text style={styles.FooterTitle}>Return Date</Text>
            <Text style={styles.FooterPrice}> {order.DueDate}</Text>
          </View>}
      </View>
      {/* Return Button */}
      {(showReturnButton || orderStatus == "5") && (
        <View style={styles.returnButtonContainer}>
          <TouchableOpacity
            style={getReturnButtonStyle()}
            onPress={handleReturnRequest}
            disabled={buttonDisabled || orderStatus == "5"}
          >
            <Text style={styles.returnButtonText}>
              {getReturnButtonText()}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {order.PickupDropOption === 'self-pickup' && order.pickupLocation && (
        <View style={styles.pickupContainer}>
          <TouchableOpacity 
            style={styles.pickupHeader}
            onPress={() => setShowPickupDetails(!showPickupDetails)}
          >
            <Text style={styles.FooterTitle}>Pickup Type: Self Pickup</Text>
            <Text style={styles.expandIcon}>
              {showPickupDetails ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          
          {showPickupDetails && (
            <View style={styles.pickupDetails}>
              <Text style={styles.FooterSubtitle}>
                {order.pickupLocation.locationName}, {order.pickupLocation.cityName}
              </Text>
              <Text style={styles.FooterSubtitle}>{order.pickupLocation.address}</Text>
              <Text style={styles.FooterSubtitle}>
                Opening Hours: {order.pickupLocation.openingHours}
              </Text>
              <Text style={styles.FooterSubtitle}>
                Contact: {order.pickupLocation.contactNumber}
              </Text>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${order.pickupLocation.latitude},${order.pickupLocation.longitude}`
                  )
                }
              >
                <Text style={styles.directionsText}>
                  📍 Get Directions
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  CardContainer: {
    gap: SPACING.space_10,
  },
  CardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.space_20,
    alignItems: 'center',
  },
  HeaderTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  HeaderSubtitle: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  PriceContainer: {
    alignItems: 'flex-end',
  },
  HeaderPrice: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryOrangeHex,
  },
  ListContainer: {
    gap: SPACING.space_20,
  },
  CardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.space_20,
    alignItems: 'center',
  },
  FooterTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  FooterSubtitle: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  ReturnContainer: {
    alignItems: 'flex-end',
  },
  FooterPrice: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryOrangeHex,
  },
  returnButtonContainer: {
    marginTop: SPACING.space_15,
    alignItems: 'center',
  },
  returnButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_12,
    borderRadius: SPACING.space_8,
    minWidth: 150,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  returnButtonScheduled: {
    backgroundColor: COLORS.primaryGreyHex || '#666',
    opacity: 0.7,
  },
  returnButtonText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
  },
  pickupContainer: {
    marginTop: SPACING.space_10,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex || '#333',
    paddingTop: SPACING.space_10,
  },
  pickupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.space_8,
  },
  expandIcon: {
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  pickupDetails: {
    paddingLeft: SPACING.space_16,
    paddingTop: SPACING.space_8,
    gap: SPACING.space_4,
  },
  directionsButton: {
    marginTop: SPACING.space_8,
  },
  directionsText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
  },
});

export default OrderHistoryCard;