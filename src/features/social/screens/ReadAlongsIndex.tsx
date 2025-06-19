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
import ReadAlongCard from '../components/ReadAlongCard';
import { useNavigation } from '@react-navigation/native';

const ReadAlongsIndex = () => {
  const [myReadalongs, setMyReadalongs] = useState([]);
  const [activeReadalongs, setActiveReadalongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0]?.accessToken;

  const navigation = useNavigation<any>();

  const fetchReadalongs = async () => {
    try {
      setLoading(true);
      // Fetch "My Readalongs"
      const myReadalongsResponse = await instance.get(requests.fetchMyReadalongs, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setMyReadalongs(myReadalongsResponse.data.data);

      // Fetch "Active Readalongs"
      const activeReadalongsResponse = await instance.get(requests.fetchReadalongs);
      setActiveReadalongs(activeReadalongsResponse.data.data);
    } catch (err) {
      setError('Failed to fetch Readalongs');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch Readalongs.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadalongs();
  }, []);

  const renderReadalongItem = ({ item }) => {
    return <ReadAlongCard readalong={item} onPress={(id) => navigation.navigate('ReadalongDetails', { readalongId: id })} />;
  };

  return (
    <SafeAreaView style={styles.ScreenContainer}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}
        scrollEventThrottle={16}>

        {/* My Readalongs */}
        <View style={styles.readalongsListContainer}>
          <Text style={styles.ScreenTitle}>My Readalongs</Text>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
          ) : myReadalongs.length > 0 ? (
            <FlatList
              data={myReadalongs}
              renderItem={renderReadalongItem}
              keyExtractor={(item) => item.readalongId.toString()}
              contentContainerStyle={styles.readalongsList}
            />
          ) : (
            <Text style={styles.noreadalongsText}>You are not part of any Readalongs.</Text>
          )}
        </View>

        {/* Active Readalongs */}
        <View style={styles.readalongsListContainer}>
          <Text style={styles.ScreenTitle}>Active Readalongs</Text>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
          ) : activeReadalongs.length > 0 ? (
            <FlatList
              data={activeReadalongs}
              renderItem={renderReadalongItem}
              keyExtractor={(item) => item.readalongId.toString()}
              contentContainerStyle={styles.readalongsList}
            />
          ) : (
            <Text style={styles.noreadalongsText}>No active Readalongs available.</Text>
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
  readalongsListContainer: {
    marginTop: SPACING.space_30,
    paddingHorizontal: SPACING.space_20,
  },
  readalongsList: {
    flexGrow: 1,
    gap: SPACING.space_20,
  },
  noreadalongsText: {
    textAlign: 'center',
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    marginTop: SPACING.space_20,
  },
});

export default ReadAlongsIndex;