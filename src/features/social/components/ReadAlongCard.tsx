import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTSIZE, FONTFAMILY, SPACING, BORDERRADIUS } from '../../../theme/theme';

interface Host {
  name: string;
}

interface ReadAlong {
  readalong_id: number;
  host: Host;
  book_id: number;
  book_title: string;
  book_photo: string;
  start_date: string;
  end_date: string;
  max_members: number;
  created_at: string;
}

interface Props {
  readalong: ReadAlong;
  onPress: (id: number) => void;
}

const ReadAlongCard: React.FC<Props> = ({ readalong, onPress }) => {
  const { book_title, book_photo, end_date, start_date, host, readalong_id } = readalong;

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(readalong_id)}>
      <Image source={{ uri: book_photo }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{book_title}</Text>
        <Text style={styles.subtitle}>Hosted by: {host.name}</Text>
        <Text style={styles.endDate}>
            {start_date} - {end_date}
        </Text>
        <Text style={styles.link}>View</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ReadAlongCard;

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