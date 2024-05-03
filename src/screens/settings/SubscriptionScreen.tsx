import React, { useState, useEffect } from 'react';
import { Dimensions, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import instance from '../../services/axios';
import requests from '../../services/requests';
import { useStore } from '../../store/store';
import { COLORS, FONTSIZE, FONTFAMILY, SPACING, BORDERRADIUS } from '../../theme/theme'; 

const { width } = Dimensions.get("window");

const SubscriptionScreen = ({navigation}: any) => {
    const [plans, setPlans] = useState([]);
    const [activePlan, setActivePlan] = useState([]);
    const [loading, setLoading] = useState(true);

    const userDetails = useStore((state: any) => state.userDetails);
    
    // Render each subscription plan
    const renderSubscriptionItem = ({ item }) => (
        <TouchableOpacity
        onPress={
            () => navigation.push('Payment', {amount: item.PlanPrice})
        }>
            <View style={styles.subscriptionItem}>
                <Text style={styles.title}>{item.PlanName}</Text>
                <Text style={styles.description}>{item.PlanDescription}</Text>
                {item.Extras == null ? null : <Text style={styles.extras}>{item.Extras}</Text>}
                <Text style={styles.price}>₹ {item.PlanPrice}</Text>
            </View>
        </TouchableOpacity>
    );

    useEffect(() => {
      async function fetchActivePlan() {
          try {
              const response = await instance(requests.fetchActivePlan+userDetails[0].userId);
              const data = response.data;
              setActivePlan(data);
            } catch (error) {
              console.error('Error fetching plans:', error);
            }
      }
    
      fetchActivePlan();
    }, []);

    useEffect(() => {
        async function fetchPlanList() {
            try {
                const response = await instance(requests.fetchSubscriptionPlans);
                const data = response.data;
                setPlans(data);
                setLoading(false);
              } catch (error) {
                console.error('Error fetching plans:', error);
              }
        }
      
        fetchPlanList();
      }, []);

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
    }
    else {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.depositView}>
            <Text style={styles.depositLabel}>Security deposit: </Text>
            <Text style={styles.price}>₹ {userDetails[0].deposit}</Text>
          </View>
          {
            activePlan[0] !== undefined && activePlan[0].PlanId !== null && 
            <>
              <Text style={styles.heading}>Active Plan</Text>
              <View style={styles.subscriptionItem}>
                <Text style={styles.title}>{activePlan[0].PlanName}</Text>
                <Text style={styles.description}>{activePlan[0].PlanDescription}</Text>
                <View style={styles.footer}>
                    <Text style={styles.price}>₹ {activePlan[0].PlanPrice}</Text>
                <Text style={styles.deadline}>Ends on: {activePlan[0].EndDate.split(" ")[0]}</Text>
                </View>
              </View>
            </>
          }
             <Text style={styles.heading}>Subscription Plans</Text>
            <FlatList
                data={plans}
                renderItem={renderSubscriptionItem}
                keyExtractor={(item) => item.PlanId.toString()}
            />
        </SafeAreaView>
      )
    }
}

export default SubscriptionScreen;

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
      heading: {
        fontSize: FONTSIZE.size_24,
        fontFamily: FONTFAMILY.poppins_bold,
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_16, 
        alignSelf: 'center',
    },
    depositView: {
      flexDirection: 'row',
    },
    depositLabel: {
        fontSize: FONTSIZE.size_16,
        fontFamily: FONTFAMILY.poppins_medium,
        color: COLORS.primaryOrangeHex,
        marginBottom: SPACING.space_12, 
    },
      subscriptionItem: {
        backgroundColor: COLORS.secondaryBlackRGBA, 
        borderRadius: BORDERRADIUS.radius_10, 
        padding: SPACING.space_16, 
        elevation: 3,
        margin: SPACING.space_10,
      },
      title: {
        fontSize: FONTSIZE.size_18, 
        fontFamily: FONTFAMILY.poppins_bold,
        marginBottom: SPACING.space_8,
        color: COLORS.primaryOrangeHex,
      },
      description: {
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_regular, 
        marginBottom: SPACING.space_12, 
        color: COLORS.secondaryLightGreyHex, 
      },
      extras: {
        fontSize: FONTSIZE.size_16,
        fontFamily: FONTFAMILY.poppins_semibold, 
        marginBottom: SPACING.space_12,
        color: COLORS.primaryOrangeHex, 
      },
      footer: {
        flexDirection: 'row',
        display: 'flex',
        justifyContent: 'space-between',
      },
      price: {
        fontSize: FONTSIZE.size_16, 
        fontFamily: FONTFAMILY.poppins_semibold, 
        color: COLORS.primaryWhiteHex, 
      },
      deadline: {
        fontSize: FONTSIZE.size_16, 
        fontFamily: FONTFAMILY.poppins_semibold, 
        color: COLORS.primaryRedHex, 
      },
})