import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { SPACING, FONTFAMILY, FONTSIZE, COLORS, BORDERRADIUS } from "../../../theme/theme";
import MemberProgressCard from "./MemberProgressCard";

interface Member {
  name: string;
  userId: string;
}

interface BuddyRead {
  workId: number;
  buddyReadId: number;
  bookId: string;
  book_title: string;
  book_photo: string;
  buddyReadDescription: string;
  startDate: string;
  endDate: string;
  maxMembers: number;
  members: Member[];
  host: Member;
}

interface BuddyReadMembersSectionProps {
    buddyRead?: BuddyRead | null;
    memberDisplayCount: number;
    loadMoreMembers: () => void;
    currentUserId?: string | null;
}
const BuddyReadMembersSection: React.FC<BuddyReadMembersSectionProps> = ({ buddyRead, memberDisplayCount, loadMoreMembers, currentUserId, }) => {
  // Reorder: move current user to the top
  const orderedMembers = [...buddyRead.members].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return 0;
  });
  return (
    buddyRead && (
      <View style={styles.membersContainer}>
        <Text style={styles.membersTitle}>Members:</Text>
        <View style={styles.membersGrid}>
          {orderedMembers.slice(0, memberDisplayCount).map((member) => (
            <MemberProgressCard
              key={member.name}
              memberDetails={{ userId: member.userId, name: member.name, workId: buddyRead.workId }}
            />
          ))}
        </View>
        {memberDisplayCount < buddyRead.members.length && (
          <TouchableOpacity onPress={loadMoreMembers} style={styles.loadMoreButton}>
            <Text style={styles.loadMoreButtonText}>Load More</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  );
};

const styles = StyleSheet.create({
  membersContainer: {
      marginBottom: SPACING.space_20,
  },
  membersTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_10,
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_10,
  },
  loadMoreButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
    marginTop: SPACING.space_15,
  },
  loadMoreButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
});

export default BuddyReadMembersSection;