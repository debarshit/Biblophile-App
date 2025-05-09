import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SPACING, FONTSIZE, FONTFAMILY, BORDERRADIUS } from '../../../theme/theme';

interface User {
  name: string;
  userId: string;
}

interface BookClub {
  club_id: number;
  club_name: string;
  host: User[];
}

interface BookClubCardProps {
  bookClub: BookClub;
}

const BookClubCard: React.FC<BookClubCardProps> = ({ bookClub }) => {
  const navigation = useNavigation<any>();
  const { club_id, club_name, host } = bookClub;

  let runByText = '';
  if (host.length === 1) {
    runByText = `Run by ${host[0].name}`;
  } else if (host.length === 2) {
    runByText = `Run by ${host[0].name} and ${host[1].name}`;
  } else if (host.length > 2) {
    runByText = `Run by ${host[0].name}, ${host[1].name} and more`;
  }

  const handlePress = () => {
    navigation.navigate('BookClubDetails', {
      bookClubId: club_id,
    });
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.clubName} numberOfLines={1}>
        {club_name}
      </Text>
      <Text style={styles.runByText}>{runByText}</Text>
      <TouchableOpacity onPress={handlePress} style={styles.viewButton}>
        <Text style={styles.viewButtonText}>View</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_16,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginVertical: SPACING.space_8,
  },
  clubName: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  runByText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_16,
  },
  viewButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.space_8,
  },
  viewButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
    textDecorationLine: 'underline',
  },
});

export default BookClubCard;