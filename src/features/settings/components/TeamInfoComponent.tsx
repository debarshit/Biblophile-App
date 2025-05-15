import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { SPACING, COLORS, BORDERRADIUS, FONTSIZE, FONTFAMILY } from '../../../theme/theme';
import { useNavigation } from '@react-navigation/native';

const TeamInfoComponent = () => {
    const [currentReads, setCurrentReads] = useState({});
    const navigation = useNavigation<any>();

    const fetchCurrentReads = async (userId) => {
        try {
        const response = await instance.post(requests.fetchCurrentReads, { userId });
        const books = response.data.currentReads || [];
        return books.length > 0 ? books.map(book => ({ name: book.BookName, id: book.BookId })) : 'nothing';
        } catch (error) {
        console.error(`Failed to fetch reads for user ${userId}:`, error);
        return 'nothing';
        }
    };

    useEffect(() => {
        const fetchReadsForTeam = async () => {
            try {
            const [debarshiReads, rashmiReads] = await Promise.all([
                fetchCurrentReads(1),
                fetchCurrentReads(7)
            ]);
            
            setCurrentReads({
                Debarshi: debarshiReads,
                Rashmi: rashmiReads,
            });
            } catch (error) {
            console.error('Error fetching reads:', error);
            }
        };

        fetchReadsForTeam();
    }, []);

    const renderTeamMember = (name, imageUri, description, reads, likes) => (
        <View style={styles.teamMember}>
          <View style={styles.teamMemberHeader}>
            <Image style={styles.teamImage} source={{ uri: imageUri }} />
            <View style={styles.teamBubble}>
              <Text style={styles.teamName}>{name}</Text>
            </View>
          </View>
          <View style={styles.teamMemberContent}>
            <Text style={styles.text}>{description}</Text>
            <Text style={styles.text}>
              Currently reading{' '}
              {Array.isArray(reads) ? (
                reads.map((book, index) => (
                  <Text
                    key={book.id}
                    style={styles.linkText}
                    onPress={() => navigation.push('Details', { id: book.id, type: 'Book' })}
                  >
                    {book.name}
                    {index < reads.length - 1 ? ', ' : ''}
                  </Text>
                ))
              ) : 'nothing'}.
            </Text>
            <Text style={styles.text}>{likes}</Text>
          </View>
        </View>
      );


  return (
    <View style={styles.section}>
        <View style={styles.sectionHeadingContainer}>
              <Text style={styles.heading}>Meet The Team</Text>
              <View style={styles.headingUnderline} />
            </View>
        <View style={styles.teamGrid}>
        {renderTeamMember(
            'Debarshi Das',
            'https://media.istockphoto.com/id/1097490360/vector/vector-illustration-of-cute-black-cat.jpg?s=612x612&w=0&k=20&c=Ef0qYl79aZJ6NJXJVbJ0onjXVNnSyqrN_TKPjieAIGE=',
            'Maintains the site, app, and other technical aspects.',
            currentReads['Debarshi'],
            'Likes to sleep in free time.'
        )}
        {renderTeamMember(
            'Rashmi Ramesh',
            'https://img.freepik.com/premium-vector/cute-cartoon-cat-vector-illustration-isolated-white-background_1151-48146.jpg',
            'Looks after design, social media, and operations.',
            currentReads['Rashmi'],
            'Likes to chatter in free time.'
        )}
        </View>
    </View>
  )
};

export default TeamInfoComponent;

const styles = StyleSheet.create({
    section: {
        marginHorizontal: SPACING.space_16,
        marginBottom: SPACING.space_24,
        backgroundColor: COLORS.primaryDarkGreyHex,
        padding: SPACING.space_20,
        borderRadius: BORDERRADIUS.radius_15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
        sectionHeadingContainer: {
        marginBottom: SPACING.space_16,
    },
    heading: {
        fontSize: FONTSIZE.size_20,
        color: COLORS.primaryWhiteHex,
        fontFamily: FONTFAMILY.poppins_semibold,
        marginBottom: SPACING.space_8,
    },
    headingUnderline: {
        height: 3,
        width: 60,
        backgroundColor: COLORS.primaryOrangeHex,
        borderRadius: BORDERRADIUS.radius_10,
    },
    teamGrid: {
        width: '100%',
    },
    teamMember: {
        width: '100%',
        backgroundColor: COLORS.primaryGreyHex,
        borderRadius: BORDERRADIUS.radius_15,
        marginBottom: SPACING.space_20,
        overflow: 'hidden',
    },
    teamMemberHeader: {
        position: 'relative',
    },
    teamImage: {
        width: '100%',
        height: 220,
        borderTopLeftRadius: BORDERRADIUS.radius_15,
        borderTopRightRadius: BORDERRADIUS.radius_15,
    },
    teamBubble: {
        position: 'absolute',
        bottom: -20,
        right: 20,
        backgroundColor: COLORS.primaryOrangeHex,
        paddingHorizontal: SPACING.space_16,
        paddingVertical: SPACING.space_10,
        borderRadius: BORDERRADIUS.radius_25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    teamName: {
        fontSize: FONTSIZE.size_16,
        color: COLORS.primaryWhiteHex,
        fontFamily: FONTFAMILY.poppins_semibold,
    },
    teamMemberContent: {
        padding: SPACING.space_16,
        paddingTop: SPACING.space_24,
    },
    linkText: {
        color: COLORS.primaryOrangeHex,
        textDecorationLine: 'underline',
        fontFamily: FONTFAMILY.poppins_medium,
    },
    text: {
        fontSize: FONTSIZE.size_14,
        color: COLORS.secondaryLightGreyHex,
        fontFamily: FONTFAMILY.poppins_regular,
        lineHeight: 22,
        marginBottom: SPACING.space_10,
    },
});