import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';
import ChallengeCard from '../components/ChallengeCard';
import CreateChallengeForm from '../components/CreateChallengeForm';

const ChallengeScreen = ({navigation}: any) => {
  const [myChallenges, setMyChallenges] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      // Fetch "My Challenges"
      const myChallengesResponse = await instance.get(requests.fetchChallenges, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setMyChallenges(myChallengesResponse.data);

      // Fetch "Active Challenges"
      const activeChallengesResponse = await instance.get(requests.fetchChallenges);
      setActiveChallenges(activeChallengesResponse.data);
    } catch (err) {
      setError('Failed to fetch challenges');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch challenges.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const renderChallengeItem = ({ item }) => {
    return <ChallengeCard challenge={item} />;
  };

  return (
    <SafeAreaView style={styles.ScreenContainer}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}
        scrollEventThrottle={16}>
        {/* App Header */}
        <HeaderBar title="" />

        <Text style={styles.ScreenTitle}>
          Find the best{'\n'}challenge for you
        </Text>

        {/* My Challenges */}
        <View style={styles.challengeListContainer}>
          <Text style={styles.ScreenTitle}>My Challenges</Text>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
          ) : myChallenges.length > 0 ? (
            <FlatList
              data={myChallenges}
              renderItem={renderChallengeItem}
              keyExtractor={(item) => item.ChallengeId.toString()}
              contentContainerStyle={styles.challengeList}
            />
          ) : (
            <Text style={styles.noChallengesText}>You are not part of any challenges.</Text>
          )}
        </View>

        {/* Active Challenges */}
        <View style={styles.challengeListContainer}>
          <Text style={styles.ScreenTitle}>Active Challenges</Text>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
          ) : activeChallenges.length > 0 ? (
            <FlatList
              data={activeChallenges}
              renderItem={renderChallengeItem}
              keyExtractor={(item) => item.ChallengeId.toString()}
              contentContainerStyle={styles.challengeList}
            />
          ) : (
            <Text style={styles.noChallengesText}>No active challenges available.</Text>
          )}
        </View>
      </Animated.ScrollView>
      {/* Create Challenge Modal */}
      <CreateChallengeForm
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        fetchChallenges={fetchChallenges} // Pass the fetchChallenges function to refresh data
      />
      {/* Button to create challenge */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    backgroundColor: COLORS.primaryOrangeHex,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  fabText: {
    color: COLORS.primaryWhiteHex,
    fontSize: 32,
    fontFamily: FONTFAMILY.poppins_bold,
    marginBottom: 4,
  },
  challengeListContainer: {
    marginTop: SPACING.space_30,
    paddingHorizontal: SPACING.space_20,
  },
  challengeList: {
    flexGrow: 1,
    gap: SPACING.space_20,
  },
  noChallengesText: {
    textAlign: 'center',
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    marginTop: SPACING.space_20,
  },
});

export default ChallengeScreen;