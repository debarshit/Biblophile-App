import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import BuddyReadCard from '../components/BuddyReadCard';
import { useNavigation } from '@react-navigation/native';

const BuddyReadsIndex = () => {
  const [myBuddyReads, setMyBuddyReads] = useState([]);
  const [activeBuddyReads, setActiveBuddyReads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;

  const navigation = useNavigation<any>();

  const fetchBuddyReads = async () => {
    try {
      setLoading(true);
      // Fetch "My BuddyReads"
      const myBuddyReadsResponse = await instance.get(requests.fetchMyBuddyReads, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setMyBuddyReads(myBuddyReadsResponse.data.data);

      // Fetch "Active BuddyReads"
      const activeBuddyReadsResponse = await instance.get(requests.fetchBuddyReads);
      setActiveBuddyReads(activeBuddyReadsResponse.data.data);
    } catch (err) {
      setError('Failed to fetch BuddyReads');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch BuddyReads.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuddyReads();
  }, []);

  const renderBuddyReadItem = ({ item }) => {
    return <BuddyReadCard buddyRead={item} onPress={(id) => navigation.navigate('BuddyReadsDetails', { buddyReadId: id })} />;
  };

  return (
    <SafeAreaView style={styles.ScreenContainer}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}
        scrollEventThrottle={16}>

        {/* My BuddyReads */}
        <View style={styles.buddyReadsListContainer}>
          <Text style={styles.ScreenTitle}>My BuddyReads</Text>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
          ) : myBuddyReads.length > 0 ? (
            <FlatList
              data={myBuddyReads}
              renderItem={renderBuddyReadItem}
              keyExtractor={(item) => item.buddyReadId.toString()}
              contentContainerStyle={styles.buddyReadsList}
            />
          ) : (
            <Text style={styles.noBuddyReadsText}>You are not part of any BuddyReads.</Text>
          )}
        </View>

        {/* Active BuddyReads */}
        <View style={styles.buddyReadsListContainer}>
          <Text style={styles.ScreenTitle}>Active BuddyReads</Text>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
          ) : activeBuddyReads.length > 0 ? (
            <FlatList
              data={activeBuddyReads}
              renderItem={renderBuddyReadItem}
              keyExtractor={(item) => item.buddyReadId.toString()}
              contentContainerStyle={styles.buddyReadsList}
            />
          ) : (
            <Text style={styles.noBuddyReadsText}>No active BuddyReads available.</Text>
          )}
        </View>
      </Animated.ScrollView>
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
    paddingBottom: SPACING.space_30,
  },
  ScreenTitle: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    paddingLeft: SPACING.space_30,
    marginBottom: SPACING.space_10,
  },
  buddyReadsListContainer: {
    marginTop: SPACING.space_30,
    paddingHorizontal: SPACING.space_20,
  },
  buddyReadsList: {
    flexGrow: 1,
    gap: SPACING.space_20,
  },
  noBuddyReadsText: {
    textAlign: 'center',
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    marginTop: SPACING.space_20,
  },
});

export default BuddyReadsIndex;