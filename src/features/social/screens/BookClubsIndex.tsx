import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';

import BookClubCard from '../components/BookClubCard';
import { COLORS, SPACING, FONTSIZE, FONTFAMILY, BORDERRADIUS } from '../../../theme/theme';
import { useStore } from '../../../store/store';

interface User {
  name: string;
  userId: string;
}

interface BookClub {
  clubId: number;
  clubName: string;
  host: User[];
}

const BookClubsIndex = () => {
  const [myBookClubs, setMyBookClubs] = useState<BookClub[]>([]);
  const [activeBookClubs, setActiveBookClubs] = useState<BookClub[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;

  const navigation = useNavigation<any>();

  const fetchBookClubs = async () => {
    try {
      const myBookClubsResponse = accessToken ? await instance.get(
        requests.fetchMyBookClubs, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      ) : { data: [] };

      const activeBookClubsResponse = await instance.get(
        requests.fetchBookClubs
      );

      setMyBookClubs(myBookClubsResponse.data.data);
      setActiveBookClubs(activeBookClubsResponse.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch book clubs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsAuthenticated(!!accessToken);
    fetchBookClubs();
  }, []);

  const handleCreateClub = () => {
    navigation.navigate('CreateBookClub');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Welcome to Book Clubs</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Clubs</Text>
          {myBookClubs.length > 0 ? (
            myBookClubs.map((club) => <BookClubCard key={club.clubId} bookClub={club} />)
          ) : (
            <Text style={styles.placeholderText}>You are not a member of any clubs.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Book Clubs</Text>
          {activeBookClubs.length > 0 ? (
            activeBookClubs.map((club) => <BookClubCard key={club.clubId} bookClub={club} />)
          ) : (
            <Text style={styles.placeholderText}>No active book clubs available.</Text>
          )}
        </View>

        {!isAuthenticated && (
          <Text style={[styles.placeholderText, { marginTop: SPACING.space_20 }]}>
            Please log in to join book clubs.
          </Text>
        )}
      </ScrollView>
      {/* Button to create challenge */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateClub}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.space_16,
    backgroundColor: COLORS.primaryBlackHex,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  title: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
    textAlign: 'center',
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
  section: {
    marginBottom: SPACING.space_24,
  },
  sectionTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_12,
  },
  placeholderText: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  errorText: {
    color: 'red',
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
  },
});

export default BookClubsIndex;