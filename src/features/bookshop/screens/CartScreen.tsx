import React, { useMemo, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import {useStore} from '../../../store/store';
import {COLORS, SPACING} from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';
import EmptyListAnimation from '../../../components/EmptyListAnimation';
import PaymentFooter from '../../payment/components/PaymentFooter';
import CartItem from '../components/CartItem';
import { useTheme } from '../../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnalytics } from '../../../utils/analytics';

interface DeliveryOptionsData {
  deliveryOption: "delivery" | "self-pickup";
  pickupLocationId: string | null;
  appliedCoupon: string | null;
}

const CartScreen = ({navigation, route}: any) => {
  const analytics = useAnalytics();
  const CartList = useStore((state: any) => state.CartList);
  const CartPrice = useStore((state: any) => state.CartPrice);
  const incrementCartItemQuantity = useStore(
    (state: any) => state.incrementCartItemQuantity,
  );
  const decrementCartItemQuantity = useStore(
    (state: any) => state.decrementCartItemQuantity,
  );
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  useEffect(() => {
    analytics.track('cart_viewed', {
      cartSize: CartList.length,
      totalPrice: CartPrice,
    });
  }, []);

  const buttonPressHandler = (finalPrice: string, securityDeposit: string, deliveryOptions: DeliveryOptionsData) => {
    if (CartList.length != 0) {
      analytics.track('checkout_started', {
        amount: finalPrice,
        securityDeposit: securityDeposit,
        itemCount: CartList.length,
      });
      // Navigate directly to Payment with the calculated final price
      navigation.push('Payment', { 
        amount: finalPrice, 
        cart: CartList,
        securityDeposit: securityDeposit,
        deliveryOptions: deliveryOptions
      });
    }
  };

  const incrementCartItemQuantityHandler = (id: string, size: string) => {
    incrementCartItemQuantity(id, size);
    calculateCartPrice();
    analytics.track('cart_quantity_increased', { itemId: id, size });
  };

  const decrementCartItemQuantityHandler = (id: string, size: string) => {
    decrementCartItemQuantity(id, size);
    calculateCartPrice();
    analytics.track('cart_quantity_decreased', { itemId: id, size });
  };

  return (
    <SafeAreaView style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <View
          style={[styles.ScrollViewInnerView]}>
          <View style={styles.ItemContainer}>
            <HeaderBar showBackButton={true} title="Cart" />

            {CartList.length == 0 ? (
              <EmptyListAnimation title={'Cart is Empty'} />
            ) : (
              <View style={styles.ListItemContainer}>
                {CartList.map((data: any) => (
                  <TouchableOpacity
                    onPress={() => {
                      navigation.push('Details', {
                        id: data.id,
                        type: data.type,
                      });
                    }}
                    key={data.id}>
                    <CartItem
                      id={data.id}
                      name={data.name}
                      photo={data.photo}
                      prices={data.prices}
                      type={data.type}
                      incrementCartItemQuantityHandler={
                        incrementCartItemQuantityHandler
                      }
                      decrementCartItemQuantityHandler={
                        decrementCartItemQuantityHandler
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {CartList.length != 0 ? (
            <PaymentFooter
              buttonPressHandler={buttonPressHandler}
              buttonTitle="Pay"
              price={{price: CartPrice, currency: '₹'}}
            />
          ) : (
            <></>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  ScrollViewFlex: {
    flexGrow: 1,
  },
  ScrollViewInnerView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  ItemContainer: {
    flex: 1,
  },
  ListItemContainer: {
    paddingHorizontal: SPACING.space_20,
    gap: SPACING.space_20,
  },
});

export default CartScreen;