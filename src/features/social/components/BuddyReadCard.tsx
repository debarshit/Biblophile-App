import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTSIZE, FONTFAMILY, SPACING, BORDERRADIUS } from '../../../theme/theme';

interface User {
  name: string;
}

interface BuddyRead {
  buddy_read_id: number;
  book_title: string;
  book_photo: string;
  end_date: string;
  users: User[];
}

interface Props {
  buddyRead: BuddyRead;
  onPress: (id: number) => void;
}

const BuddyReadCard: React.FC<Props> = ({ buddyRead, onPress }) => {
  const { book_title, book_photo, end_date, users, buddy_read_id } = buddyRead;

  let readingWithText = '';
  if (users.length === 1) {
    readingWithText = `Reading with ${users[0].name}`;
  } else if (users.length === 2) {
    readingWithText = `Reading with ${users[0].name} and ${users[1].name}`;
  } else if (users.length > 2) {
    readingWithText = `Reading with ${users[0].name}, ${users[1].name} and more`;
  }

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(buddy_read_id)}>
      <Image source={{ uri: book_photo }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{book_title}</Text>
        <Text style={styles.subtitle}>{readingWithText}</Text>
        <Text style={styles.endDate}>
          Ends on: {end_date ? end_date : 'when everyone finishes the book'}
        </Text>
        <Text style={styles.link}>View</Text>
      </View>
    </TouchableOpacity>
  );
};

export default BuddyReadCard;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_12,
    flexDirection: 'row',
    marginBottom: SPACING.space_16,
  },
  image: {
    width: 100,
    height: 150,
    borderRadius: BORDERRADIUS.radius_10,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    marginLeft: SPACING.space_16,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  subtitle: {
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    marginTop: SPACING.space_4,
  },
  endDate: {
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_8,
  },
  link: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    marginTop: SPACING.space_12,
  },
});