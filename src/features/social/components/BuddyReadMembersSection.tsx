import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { SPACING, FONTFAMILY, FONTSIZE, COLORS, BORDERRADIUS } from "../../../theme/theme";
import MemberProgressCard from "./MemberProgressCard";

interface Member {
  name: string;
  userId: string;
}

interface BuddyRead {
  buddyReadId: number;
  bookId: string;
  book_title: string;
  book_photo: string;
  book_pages: number;
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
}
const BuddyReadMembersSection: React.FC<BuddyReadMembersSectionProps> = ({ buddyRead, memberDisplayCount, loadMoreMembers }) => {
  return (
    buddyRead && (
      <View style={styles.membersContainer}>
        <Text style={styles.membersTitle}>Members:</Text>
        <View style={styles.membersGrid}>
          {buddyRead.members.slice(0, memberDisplayCount).map((member) => (
            <MemberProgressCard
              key={member.name}
              memberDetails={{ userId: member.userId, name: member.name, bookPages: buddyRead.book_pages, bookId: buddyRead.bookId }}
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
  