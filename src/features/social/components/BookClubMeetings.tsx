import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { SPACING, COLORS, FONTSIZE, FONTFAMILY, BORDERRADIUS } from '../../../theme/theme';
import { useStore } from '../../../store/store';
import CreateMeetingModal from './CreateBookClubMeeting';

interface Member {
  name: string;
  userId: string;
}

interface BookClub {
  club_id: number;
  club_name: string;
  description: string;
  hosts: Member[];
  isHost: boolean;
  created_by_user_id: string;
}

interface Meeting {
  meeting_id: string;
  club_id: string;
  agenda: string;
  meeting_date: string;
  meeting_location: string;
}

interface Props {
  isHost: boolean;
  isMember: boolean;
  bookClub: BookClub;
}

const BookClubMeetings: React.FC<Props> = ({
  isHost,
  isMember,
  bookClub,
}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<'past' | 'future'>('future');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | undefined>(undefined);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;

  const limit = 10;

  const fetchMeetings = async () => {
    if (!bookClub?.club_id) return;

    setLoading(true);
    try {
      const response = await instance.get(requests.fetchBookClubMeetings, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          offset,
          limit,
          clubId: bookClub.club_id,
          timeFrame,
        },
      });

      const newMeetings = Array.isArray(response.data)
        ? response.data
        : response.data.meetings || [];

      if (newMeetings.length < limit) setHasMore(false);

      setMeetings((prev) => {
        const existingIds = new Set(prev.map((m) => m.meeting_id));
        const uniqueMeetings = newMeetings.filter((m) => !existingIds.has(m.meeting_id));
        return [...prev, ...uniqueMeetings];
      });
    } catch (err) {
      console.error(err);
      setError('Error fetching meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    setMeetings([]);
    setHasMore(true);
  }, [timeFrame]);

  useEffect(() => {
    fetchMeetings();
  }, [offset, timeFrame]);

  const handleEndReached = () => {
    if (!loading && hasMore) {
      setOffset((prev) => prev + limit);
    }
  };

  const toggleTimeFrame = () => {
    setTimeFrame((prev) => (prev === 'future' ? 'past' : 'future'));
  };

  const handleCreateMeeting = () => {
    setSelectedMeeting(undefined);
    setModalVisible(true);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setModalVisible(true);
  };

  const handleMeetingSuccess = () => {
    // Reset and reload meetings
    setOffset(0);
    setMeetings([]);
    setHasMore(true);
    fetchMeetings();
  };

  const renderMeetingItem = ({ item }: { item: Meeting }) => (
    <TouchableOpacity
      style={styles.meetingCard}
      onPress={() => null} // Could add navigation to a meeting details page
    >
      <View style={styles.cardHeader}>
        <Text style={styles.meetingDate}>{item.meeting_date}</Text>
        {isHost && (
          <TouchableOpacity onPress={() => handleEditMeeting(item)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.meetingTitle}>{item.agenda}</Text>
      <Text style={styles.meetingLocation}>Location: {item.meeting_location}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isHost && (
        <TouchableOpacity style={styles.createButton} onPress={()=>handleCreateMeeting()}>
          <Text style={styles.createButtonText}>Create a New Meeting</Text>
        </TouchableOpacity>
      )}

      {isMember && (
        <>
          <TouchableOpacity style={styles.toggleButton} onPress={toggleTimeFrame}>
            <Text style={styles.toggleButtonText}>
              View {timeFrame === 'future' ? 'Past' : 'Upcoming'} Meetings
            </Text>
          </TouchableOpacity>

          <FlatList
            data={meetings}
            renderItem={renderMeetingItem}
            keyExtractor={(item) => item.meeting_id}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loading ? <ActivityIndicator color={COLORS.primaryOrangeHex} /> : null}
            ListEmptyComponent={
              !loading && <Text style={styles.emptyText}>No meetings available.</Text>
            }
          />
        </>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Meeting Modal */}
      <CreateMeetingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleMeetingSuccess}
        bookClubId={bookClub?.club_id}
        accessToken={accessToken}
        isHost={isHost}
        existingMeeting={selectedMeeting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.space_16,
    backgroundColor: COLORS.primaryBlackHex,
  },
  createButton: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_16,
  },
  createButtonText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
    textAlign: 'center',
  },
  toggleButton: {
    backgroundColor: COLORS.primaryGreyHex,
    padding: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_16,
  },
  toggleButtonText: {
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  meetingCard: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_8,
  },
  meetingDate: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_light,
    fontSize: FONTSIZE.size_12,
  },
  editText: {
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_12,
  },
  meetingTitle: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
    marginBottom: SPACING.space_4,
  },
  meetingLocation: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  emptyText: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    textAlign: 'center',
    marginTop: SPACING.space_20,
  },
  errorText: {
    color: COLORS.primaryRedHex,
    fontSize: FONTSIZE.size_14,
    textAlign: 'center',
    marginTop: SPACING.space_20,
  },
});

export default BookClubMeetings;