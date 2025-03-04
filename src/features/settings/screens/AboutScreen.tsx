import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import instance from '../../../services/axios';
import requests from '../../../services/requests';

const AboutScreen: React.FC = ({navigation}: any) => {
  const [currentReads, setCurrentReads] = useState({});

  const fetchCurrentReads = async (userId) => {
    try {
      const response = await instance.post(requests.fetchCurrentReads, {
        userId: userId,
      });
      const books = response.data.currentReads || []; 
      return books.length > 0 ? books.map(book => ({ name: book.BookName, id: book.BookId })) : 'nothing';
    } catch (error) {
      console.error('Failed to fetch current reads:', error);
      return 'nothing';
    } 
  };

  useEffect(() => {
    const fetchReadsForTeam = async () => {
      const debarshiReads = await fetchCurrentReads(1);
      const rashmiReads = await fetchCurrentReads(7);

      setCurrentReads({
        Debarshi: debarshiReads,
        Rashmi: rashmiReads,
      });
    };

    fetchReadsForTeam();
  }, []);

  const renderTeamMember = (name, imageUri, description, reads, likes) => (
    <View style={styles.teamMember}>
      <Image style={styles.teamImage} source={{ uri: imageUri }} />
      <Text style={styles.teamName}>{name}</Text>
      <Text style={styles.text}>{description}</Text>
      <Text style={styles.text}>
        Currently reading{' '}
         {Array.isArray(reads) ? (
          reads.map((book, index) => (
            <React.Fragment key={book.id}>
              <TouchableOpacity
                onPress={() => navigation.push('Details', { id: book.id, type: 'Book' })}
              >
                <Text style={styles.linkText}>{book.name}</Text>
              </TouchableOpacity>
              {index < reads.length - 1 && ', '}
            </React.Fragment>
          ))
        ) : 'nothing'}.
      </Text>
      <Text style={styles.text}>{likes}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.heading}>Our Mission</Text>
        <Text style={styles.text}>
            At Biblophile, we are passionate about making reading more accessible and enjoyable for everyone. We believe in the 
            magic of books and strive to bring that magic right to your doorstep. Our mission is simple: to eliminate the hassle of 
            buying, storing, and managing your book collection. With our services, you can rent, read, and return books 
            with ease—creating your own personal library at home.
            We also offer insightful reading stats and analytics to enhance your reading experience, 
            helping you discover more about your reading habits and preferences, and help you find your next read. Join us in our 
            mission to make reading more convenient, fun, and insightful for all.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Products & Services</Text>
        <Text style={styles.text}>We offer a range of products and services designed to enhance your reading experience:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>
            <Text style={styles.listItemTitle}>Buying and Renting Books:</Text> Convenient options to either add to your collection...
          </Text>
          <Text style={styles.listItem}>
            <Text style={styles.listItemTitle}>Smart Bookmarks for Reading Streaks:</Text> Innovative bookmarks that help you track your reading progress...
          </Text>
          <Text style={styles.listItem}>
            <Text style={styles.listItemTitle}>Reading Stats and Insights:</Text> Beautiful graphical interpretations of your reading habits...
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Meet the Team</Text>
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

      <View style={styles.section}>
        <Text style={styles.heading}>Our Blog</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://biblophile.com/blog/2023/11/13/introducing-biblophile-your-gateway-to-a-world-of-books/')}>
          <Text style={styles.linkText}>Check out our latest articles and insights on our blog.</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Fun Company Facts</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>1. Did you know? The name "Biblophile" came about in a rather unconventional way—during a late-night search for a domain name, a typo led to our unique name. We were so thrilled to snag the domain that we decided to keep the playful misspelling, and it’s become a charming part of our identity!</Text>
          <Text style={styles.listItem}>2. We’re a dynamic duo here at Biblophile. One of us focuses on coding and the technical wizardry behind our platform, while the other handles design, social media, and operations. Our teamwork ensures a seamless experience for our readers, blending technical expertise with creative flair.</Text>
          <Text style={styles.listItem}>3. Here’s a quirky touch: we’ve incorporated a “Book Discovery Challenge” into our service, where each month, we feature a surprise book genre or theme to ignite your curiosity and expand your reading horizons. Plus, our smart bookmarks not only track your reading streak but also come with customizable motivational quotes to keep you inspired!</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Contact Us</Text>
        <Text style={styles.text}>Email: <Text style={styles.linkText} onPress={() => Linking.openURL('mailto:help@biblophile.com')}>help@biblophile.com</Text></Text>
        <Text style={styles.text}>Phone: +91 96063 73974</Text>
        <View style={styles.socialLinks}>
          <FontAwesome5 name="facebook-f" size={24} color={COLORS.primaryOrangeHex} onPress={() => Linking.openURL('https://www.facebook.com/profile.php?id=61559661155321')} />
          <FontAwesome5 name="instagram" size={24} color={COLORS.primaryOrangeHex} onPress={() => Linking.openURL('https://www.instagram.com/__biblophile__/')} />
          <FontAwesome5 name="twitter" size={24} color={COLORS.primaryOrangeHex} onPress={() => Linking.openURL('https://x.com/__biblophile__')} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryBlackHex,
    padding: SPACING.space_20,
  },
  section: {
    marginBottom: SPACING.space_20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_10,
  },
  heading: {
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    marginBottom: SPACING.space_10,
  },
  text: {
    fontSize: FONTSIZE.size_16,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    lineHeight: 24,
  },
  list: {
    marginTop: SPACING.space_12,
  },
  listItem: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    marginBottom: SPACING.space_10,
  },
  listItemTitle: {
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  teamGrid: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  teamMember: {
    width: '100%',
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_15,
    alignItems: 'center',
    marginBottom: SPACING.space_15,
  },
  teamImage: {
    width: 200,
    height: 200,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_10,
  },
  teamName: {
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    marginBottom: SPACING.space_8,
  },
  linkText: {
    color: COLORS.primaryOrangeHex,
    textDecorationLine: 'underline',
    fontFamily: FONTFAMILY.poppins_semibold,
    lineHeight: 21,
  },
  socialLinks: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: SPACING.space_16,
    marginTop: SPACING.space_10,
  },
});

export default AboutScreen;
