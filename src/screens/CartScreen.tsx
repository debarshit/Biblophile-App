import React, { useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {useStore} from '../store/store';
import {COLORS, SPACING} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import EmptyListAnimation from '../components/EmptyListAnimation';
import PaymentFooter from '../components/PaymentFooter';
import CartItem from '../components/CartItem';

const CartScreen = ({navigation, route}: any) => {
  const CartList = useStore((state: any) => state.CartList);
  const CartPrice = useStore((state: any) => state.CartPrice);
  const incrementCartItemQuantity = useStore(
    (state: any) => state.incrementCartItemQuantity,
  );
  const decrementCartItemQuantity = useStore(
    (state: any) => state.decrementCartItemQuantity,
  );
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const tabBarHeight = useBottomTabBarHeight();

  const buttonPressHandler = () => {
    if (CartList.length != 0) {
      Alert.alert("Delivery Fees", "1. Buying Books: Orders <  ₹120 incur ₹50 delivery fee; otherwise, delivery is free.\n2. Renting Books: Orders < ₹120 incur ₹90 for delivery and pickup; otherwise, both are free.",
        [
          {
              text: "Cancel",
              style: "cancel"
          },
          {
              text: "OK",
              onPress: () => navigation.push('Payment', { amount: calculateFinalPrice(), cart: CartList })
          }
        ]
      )
    }
  };

  const incrementCartItemQuantityHandler = (id: string, size: string) => {
    incrementCartItemQuantity(id, size);
    calculateCartPrice();
  };

  const decrementCartItemQuantityHandler = (id: string, size: string) => {
    decrementCartItemQuantity(id, size);
    calculateCartPrice();
  };

  const getPrice = (item) => {
    const { type, prices, actualPrice } = item;
    const priceInfo = prices[0];
  
    if (type === "Book") {
      return priceInfo.size === "Buy" ? priceInfo.price : actualPrice;
    } else {
      return priceInfo.size === "QR" ? priceInfo.price : priceInfo.price / 1.3;
    }
  };

  const calculateFinalPrice = () => {
    let additionalCost = 0;
    const numericCartPrice = parseFloat(CartPrice); // Ensure CartPrice is a number
  
    if (numericCartPrice < 120) {
      CartList.forEach((item: any) => {
        if (item.type === "Book") {
          const priceInfo = item.prices[0];
          additionalCost += priceInfo.size === "Buy" ? 50 : 90;
        }
      });
    }
    return (numericCartPrice + additionalCost).toFixed(2);
  };

  return (
    <SafeAreaView style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <View
          style={[styles.ScrollViewInnerView, {marginBottom: tabBarHeight}]}>
          <View style={styles.ItemContainer}>
            <HeaderBar title="Cart" />

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
                        price: getPrice(data),
                        name: data.name,
                        genre: data.genre,
                        poster: data.poster,
                        photo: data.photo,
                        averageRating: data.averageRating,
                        ratingCount: data.ratingCount,
                        description: data.description,
                      });
                    }}
                    key={data.id}>
                    <CartItem
                      id={data.id}
                      name={data.name}
                      photo={data.photo}
                      genre={data.genre}
                      prices={data.prices}
                      type="Book"
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

const styles = StyleSheet.create({
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
