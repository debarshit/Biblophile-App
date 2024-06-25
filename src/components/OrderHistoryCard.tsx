import React from 'react';
import {
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from 'react-native';
import {COLORS, FONTFAMILY, FONTSIZE, SPACING} from '../theme/theme';
import OrderItemCard from './OrderItemCard';

interface OrderHistoryCardProps {
  order: any;
}
const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({
  order,
}) => {
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
                { size: order.OrderType === '0' ? 'Rent' : 'Buy', price: order.OrderType === '0' ? order.OrderAmount/order.OrderDuration : order.OrderAmount/order.OrderQuantity, currency: '₹' },
              ]}
              ItemPrice={order.OrderAmount}
              quantity={order.OrderType === '0' ? order.OrderDuration : order.OrderQuantity}
            />
      </View>
      <View style={styles.CardFooter}>
        {order.DeliveryDate !== "0000-00-00" && <View>
            <Text style={styles.FooterTitle}>Delivery Date</Text>
            <Text style={styles.FooterSubtitle}>{order.DeliveryDate}</Text>
          </View>}
        {order.DueDate !== "0000-00-00" &&  <View style={styles.ReturnContainer}>
            <Text style={styles.FooterTitle}>Return Date</Text>
            <Text style={styles.FooterPrice}> {order.DueDate}</Text>
          </View>}
      </View>
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
});

export default OrderHistoryCard;
