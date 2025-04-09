import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
    BORDERRADIUS,
    COLORS,
    FONTFAMILY,
    FONTSIZE,
    SPACING,
  } from '../../../theme/theme';

interface Host {
  userId: string;
  name: string;
}

interface Challenge {
  ChallengeId: number;
  ChallengeTitle: string;
  Host: Host;
  StartDate: string;
  EndDate: string;
  CreatedAt: string;
}

interface ChallengeCardProps {
  challenge: Challenge;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge=null }) => {
  const { ChallengeId, ChallengeTitle, EndDate, StartDate, Host } = challenge;
  const navigation = useNavigation();

  const handlePress = () => {
    // navigation.navigate("ChallengeDetail", { ChallengeId, ChallengeTitle });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{ChallengeTitle}</Text>
      <Text style={styles.date}>{`${StartDate} - ${EndDate}`}</Text>
      <Text style={styles.host}>
        Hosted by: <Text style={styles.hostName}>{Host.name}</Text>
      </Text>
      <TouchableOpacity onPress={handlePress}>
        <Text style={styles.viewLink}>View</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primaryDarkGreyHex, // primaryDarkGreyHex
    borderRadius: 10, // radius_10
    padding: 16, // space_4
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    maxWidth: 300, // max-w-xs equivalent
    marginHorizontal: "auto", // mx-auto equivalent
    elevation: 5, // shadow equivalent
    transform: [{ scale: 1 }],
  },
  title: {
    fontSize: 20, // size_20
    fontFamily: FONTFAMILY.poppins_bold, // poppins_bold
    color: COLORS.primaryWhiteHex, // primaryWhiteHex
  },
  date: {
    marginTop: 8, // space_2
    fontSize: 14, // size_14
    color: COLORS.secondaryLightGreyHex, // secondaryLightGreyHex
  },
  host: {
    marginTop: 8, // space_2
    fontSize: 14, // size_14
    color: COLORS.secondaryLightGreyHex, // secondaryLightGreyHex
  },
  hostName: {
    color: COLORS.primaryOrangeHex, // primaryOrangeHex
  },
  viewLink: {
    marginTop: 16, // space_4
    fontSize: 16, // size_16
    fontFamily: FONTFAMILY.poppins_semibold, // poppins_semibold
    color: COLORS.primaryOrangeHex, // primaryOrangeHex
    textDecorationLine: "underline",
  },
});

export default ChallengeCard;