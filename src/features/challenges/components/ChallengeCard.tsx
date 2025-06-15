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
  challengeId: number;
  challengeTitle: string;
  Host: Host;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface ChallengeCardProps {
  challenge: Challenge;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge=null }) => {
  const { challengeId, challengeTitle, endDate, startDate, Host } = challenge;
  const navigation = useNavigation<any>();

  const handlePress = () => {
    navigation.navigate("ChallengeDetails", { challengeId, challengeTitle });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{challengeTitle}</Text>
      <Text style={styles.date}>{`${startDate} - ${endDate}`}</Text>
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
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_16,
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    maxWidth: 300,
    marginHorizontal: "auto",
    elevation: 5,
    transform: [{ scale: 1 }],
  },
  title: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  date: {
    marginTop: SPACING.space_8,
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
  },
  host: {
    marginTop: SPACING.space_8,
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
  },
  hostName: {
    color: COLORS.primaryOrangeHex,
  },
  viewLink: {
    marginTop: SPACING.space_4,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
    textDecorationLine: "underline",
  },
});

export default ChallengeCard;