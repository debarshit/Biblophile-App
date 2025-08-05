import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

interface Challenge {
  challengeId: number;
  challengeTitle: string;
  challengeDescription?: string;
  challengeType: string;
  Host: { userId: string; name: string };
  Category: { categoryId: string; categoryName: string };
  Keywords: string[];
  startDate: string;
  endDate: string;
  createdAt: string;
  isPublic: boolean;
}

interface ChallengeCardProps {
  challenge: Challenge;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge }) => {
  const { challengeId, challengeTitle, challengeDescription, challengeType, endDate, startDate, Host, Category, Keywords = [] } = challenge;
  const navigation = useNavigation<any>();

  // Status logic
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const isActive = now >= start && now <= end;
  const isPast = now > end;
  
  const statusConfig = {
    color: isActive ? '#4CAF50' : isPast ? COLORS.secondaryLightGreyHex : COLORS.primaryOrangeHex,
    text: isActive ? 'Active' : isPast ? 'Completed' : 'Upcoming'
  };

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handlePress = () => navigation.navigate("ChallengeDetails", { challengeId, challengeTitle });

  const DetailRow = ({ label, value, style }: { label: string; value: string; style?: any }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, style]}>{value}</Text>
    </View>
  );

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>{challengeTitle}</Text>
          <Text style={styles.challengeType}>{challengeType} Challenge</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
          <Text style={[styles.statusText, isPast && { color: COLORS.primaryWhiteHex }]}>
            {statusConfig.text}
          </Text>
        </View>
      </View>

      {/* Description */}
      {challengeDescription && (
        <Text style={styles.description} numberOfLines={2}>{challengeDescription}</Text>
      )}

      {/* Details */}
      <View style={styles.detailsSection}>
        <DetailRow label="Category" value={Category?.categoryName || 'N/A'} style={{ color: COLORS.primaryOrangeHex }} />
        <DetailRow label="Host" value={Host?.name || 'Unknown'} style={{ color: COLORS.primaryWhiteHex }} />
        <DetailRow label="Duration" value={`${formatDate(startDate)} - ${formatDate(endDate)}`} style={{ color: COLORS.primaryWhiteHex }} />
      </View>

      {/* Keywords */}
      {Keywords.length > 0 && (
        <View style={styles.keywordsSection}>
          <View style={styles.keywordsContainer}>
            {Keywords.slice(0, 3).map((keyword, index) => (
              <View key={index} style={styles.keywordTag}>
                <Text style={styles.keywordText}>{keyword}</Text>
              </View>
            ))}
            {Keywords.length > 3 && (
              <View style={[styles.keywordTag, { backgroundColor: COLORS.primaryGreyHex }]}>
                <Text style={[styles.keywordText, { color: COLORS.secondaryLightGreyHex }]}>
                  +{Keywords.length - 3} more
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Action Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity onPress={handlePress}>
          <Text style={styles.viewButtonText}>View Challenge</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_16,
    elevation: 4,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.space_12,
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.space_12,
  },
  title: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    lineHeight: FONTSIZE.size_18 * 1.3,
  },
  challengeType: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    textTransform: 'capitalize',
    marginTop: SPACING.space_2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryBlackHex,
  },
  description: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    lineHeight: FONTSIZE.size_14 * 1.4,
    marginBottom: SPACING.space_16,
  },
  detailsSection: {
    marginBottom: SPACING.space_16,
    gap: SPACING.space_8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
  },
  detailValue: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    flex: 1,
    textAlign: 'right',
  },
  keywordsSection: {
    marginBottom: SPACING.space_16,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_8,
  },
  keywordTag: {
    backgroundColor: COLORS.primaryGreyHex,
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_8,
  },
  keywordText: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  actionSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: SPACING.space_12,
  },
  viewButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
    textDecorationLine: 'underline',
  },
});

export default ChallengeCard;