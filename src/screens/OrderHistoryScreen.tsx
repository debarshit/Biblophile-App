import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {useStore} from '../store/store';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import instance from '../services/axios';
import requests from '../services/requests';
import HeaderBar from '../components/HeaderBar';
import EmptyListAnimation from '../components/EmptyListAnimation';
import PopUpAnimation from '../components/PopUpAnimation';
import OrderHistoryCard from '../components/OrderHistoryCard';

const { width } = Dimensions.get("window");

const OrderHistoryScreen = ({navigation}: any) => {
  const [OrderHistoryList, setOrderHistoryList] = useState([]);
  const userDetails = useStore((state: any) => state.userDetails);

  const tabBarHeight = useBottomTabBarHeight();
  const [showAnimation, setShowAnimation] = useState(false);

  const [loading, setLoading] = useState(true);

  const buttonPressHandler = () => {
    setShowAnimation(true);
    setTimeout(() => {
      setShowAnimation(false);
    }, 2000);
  };

  useEffect(() => {
    async function fetchOrderHistory() {
        try {
            const response = await instance.post(requests.fetchOrders, {
              userId: userDetails[0].userId,
            });
            const data = response.data;
            setOrderHistoryList(data);
            setLoading(false);
          } catch (error) {
            console.error('Error fetching plans:', error);
          }
    }
  
    fetchOrderHistory();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      async function fetchOrderHistory() {
        try {
            const response = await instance.post(requests.fetchOrders, {
              userId: userDetails[0].userId,
            });
            const data = response.data;
            setOrderHistoryList(data);
          } catch (error) {
            console.error('Error fetching plans:', error);
          }
    }
  
    fetchOrderHistory();  
    }, [])
);

if (loading) {
  return (
    // Render shimmer effect while loading
    <SafeAreaView style={styles.container}>
      <View style={styles.shimmerFlex}>
        <ShimmerPlaceholder
        LinearGradient={LinearGradient}
          style={styles.ShimmerPlaceholder}
          shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
          visible={!loading}>
        </ShimmerPlaceholder>
        <ShimmerPlaceholder
        LinearGradient={LinearGradient}
          style={styles.ShimmerPlaceholder}
          shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
          visible={!loading}>
        </ShimmerPlaceholder>
        <ShimmerPlaceholder
        LinearGradient={LinearGradient}
          style={styles.ShimmerPlaceholder}
          shimmerColors={[COLORS.primaryDarkGreyHex, COLORS.primaryBlackHex, COLORS.primaryDarkGreyHex]}
          visible={!loading}>
        </ShimmerPlaceholder>
      </View>
    </SafeAreaView>
  )
} else {
  return (
    <SafeAreaView style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />

      {showAnimation ? (
        <PopUpAnimation
          style={styles.LottieAnimation}
          source={require('../lottie/download.json')}
        />
      ) : (
        <></>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <View
          style={[styles.ScrollViewInnerView, {marginBottom: tabBarHeight}]}>
          <View style={styles.ItemContainer}>
            <HeaderBar title="Order History" />

            {OrderHistoryList.length == 0 ? (
              <EmptyListAnimation title={'No Order History'} />
            ) : (
              <View style={styles.ListItemContainer}>
                {OrderHistoryList.map((data: any) => (
                  <OrderHistoryCard
                    key={data['OrderId'].toString()}
                    order={data}
                  />
                ))}
              </View>
            )}
          </View>
          {OrderHistoryList.length > 0 ? (
            <TouchableOpacity
              style={styles.DownloadButton}
              onPress={() => {
                buttonPressHandler();
              }}>
              <Text style={styles.ButtonText}>Download</Text>
            </TouchableOpacity>
          ) : (
            <></>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.space_16, 
    backgroundColor: COLORS.primaryBlackHex,
  },
  ShimmerPlaceholder: {
    width: width*0.9, 
    height: 200, 
    borderRadius: 10,
    marginHorizontal: 10, 
    marginTop: 10,
    marginBottom: 40,
    marginLeft: 20, 
  },
  shimmerFlex: {
    flexDirection: 'column',
  },
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  LottieAnimation: {
    height: 250,
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
    gap: SPACING.space_30,
  },
  DownloadButton: {
    margin: SPACING.space_20,
    backgroundColor: COLORS.primaryOrangeHex,
    alignItems: 'center',
    justifyContent: 'center',
    height: SPACING.space_36 * 2,
    borderRadius: BORDERRADIUS.radius_20,
  },
  ButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
});

export default OrderHistoryScreen;
