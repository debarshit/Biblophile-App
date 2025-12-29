import React, { use } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import { Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ChallengesBanner = () => {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.container}
      onPress={() => navigation.navigate('Challenges')}
    >
      <View style={styles.left}>
        <Entypo
          name="medal"
          size={22}
          color={COLORS.primaryOrangeHex}
        />
        <Text style={styles.text}>
          Explore challenges (beta)
        </Text>
      </View>

      <Text style={styles.cta}>View</Text>
    </TouchableOpacity>
  );
};

export default ChallengesBanner;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.space_20,
    marginTop: SPACING.space_12,
    marginBottom: SPACING.space_8,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingVertical: SPACING.space_12,
    paddingHorizontal: SPACING.space_16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex + '30',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_10,
  },
  text: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  cta: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
  },
});