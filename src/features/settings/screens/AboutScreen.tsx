import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import TeamInfoComponent from '../components/TeamInfoComponent';

const AboutScreen = () => {

  const renderSectionHeading = (title) => (
    <View style={styles.sectionHeadingContainer}>
      <Text style={styles.heading}>{title}</Text>
      <View style={styles.headingUnderline} />
    </View>
  );

  const renderListItem = (icon, title, text) => (
    <View style={styles.listItemContainer}>
      <View style={styles.listBullet}>
        <FontAwesome5 name={icon} size={12} color={COLORS.primaryOrangeHex} />
      </View>
      <View style={styles.listContent}>
        <Text style={styles.listItemTitle}>{title}</Text>
        <Text style={styles.listItemText}>{text}</Text>
      </View>
    </View>
  );

  const renderFactItem = (number, text) => (
    <View style={styles.factItem}>
      <View style={styles.factNumber}>
        <Text style={styles.factNumberText}>{number}</Text>
      </View>
      <Text style={styles.factText}>{text}</Text>
    </View>
  );

  const renderContactItem = (icon, text, onPress) => (
    <TouchableOpacity style={styles.contactItem} onPress={onPress}>
      <FontAwesome5 name={icon} size={20} color={COLORS.primaryOrangeHex} />
      <Text style={styles.contactText}>{text}</Text>
    </TouchableOpacity>
  );

  const renderSocialButton = (icon, url) => (
    <TouchableOpacity 
      style={styles.socialButton}
      onPress={() => Linking.openURL(url)}
    >
      <FontAwesome5 name={icon} size={22} color={COLORS.primaryWhiteHex} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Biblophile</Text>
          <Text style={styles.bannerSubtitle}>Your gateway to a world of books</Text>
        </View>

        <View style={styles.section}>
          {renderSectionHeading('Our Mission')}
          <Text style={styles.text}>
            At Biblophile, we are passionate about making reading more accessible and enjoyable for everyone. We believe in the 
            magic of books and strive to bring that magic right to your doorstep. Our mission is simple: to eliminate the hassle of 
            buying, storing, and managing your book collection.
          </Text>
          <Text style={styles.text}>
            We also offer insightful reading stats and analytics to enhance your reading experience, 
            helping you discover more about your reading habits and preferences, and help you find your next read.
          </Text>
        </View>

        <View style={styles.section}>
          {renderSectionHeading('Products & Services')}
          <Text style={styles.text}>We offer a range of products and services designed to enhance your reading experience:</Text>
          <View style={styles.list}>
            {renderListItem('book', 'Buying and Renting Books', 'Convenient options to either add to your collection...')}
            {renderListItem('bookmark', 'Smart Bookmarks for Reading Streaks', 'Innovative bookmarks that help you track your reading progress...')}
            {renderListItem('chart-bar', 'Reading Stats and Insights', 'Beautiful graphical interpretations of your reading habits...')}
          </View>
        </View>

        <TeamInfoComponent />

        <View style={styles.section}>
          {renderSectionHeading('Our Blog')}
          <TouchableOpacity 
            style={styles.blogButton}
            onPress={() => Linking.openURL('https://biblophile.com/blog/2023/11/13/introducing-biblophile-your-gateway-to-a-world-of-books/')}
          >
            <FontAwesome5 name="rss" size={16} color={COLORS.primaryWhiteHex} style={styles.blogIcon} />
            <Text style={styles.blogButtonText}>Check out our latest articles</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          {renderSectionHeading('Fun Company Facts')}
          <View style={styles.factsList}>
            {renderFactItem(1, 'Did you know? The name "Biblophile" came about in a rather unconventional way—during a late-night search for a domain name, a typo led to our unique name. We were so thrilled to snag the domain that we decided to keep the playful misspelling, and it\'s become a charming part of our identity!')}
            {renderFactItem(2, 'We\'re a dynamic duo here at Biblophile. One of us focuses on coding and the technical wizardry behind our platform, while the other handles design, social media, and operations. Our teamwork ensures a seamless experience for our readers, blending technical expertise with creative flair.')}
            {renderFactItem(3, 'Here\'s a quirky touch: we\'ve incorporated a "Book Discovery Challenge" into our service, where each month, we feature a surprise book genre or theme to ignite your curiosity and expand your reading horizons. Plus, our smart bookmarks not only track your reading streak but also come with customizable motivational quotes to keep you inspired!')}
          </View>
        </View>

        <View style={styles.section}>
          {renderSectionHeading('Contact Us')}
          <View style={styles.contactContainer}>
            {renderContactItem('envelope', 'help@biblophile.com', () => Linking.openURL('mailto:help@biblophile.com'))}
            {renderContactItem('phone-alt', '+91 96063 73974', null)}
          </View>
          
          <View style={styles.socialLinks}>
            {renderSocialButton('facebook-f', 'https://www.facebook.com/profile.php?id=61559661155321')}
            {renderSocialButton('instagram', 'https://www.instagram.com/__biblophile__/')}
            {renderSocialButton('twitter', 'https://x.com/__biblophile__')}
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Biblophile. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  contentContainer: {
    paddingBottom: SPACING.space_30,
  },
  banner: {
    backgroundColor: COLORS.primaryOrangeHex,
    padding: SPACING.space_24,
    alignItems: 'center',
    borderBottomLeftRadius: BORDERRADIUS.radius_25,
    borderBottomRightRadius: BORDERRADIUS.radius_25,
    marginBottom: SPACING.space_20,
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerTitle: {
    fontSize: FONTSIZE.size_30,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_4,
  },
  bannerSubtitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
    opacity: 0.9,
  },
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
  text: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    lineHeight: 22,
    marginBottom: SPACING.space_10,
  },
  list: {
    marginTop: SPACING.space_12,
  },
  listItemContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.space_16,
  },
  listBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_10,
    marginTop: 2,
  },
  listContent: {
    flex: 1,
  },
  listItemTitle: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    marginBottom: 4,
  },
  listItemText: {
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    lineHeight: 20,
  },


  blogButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
  },
  blogIcon: {
    marginRight: SPACING.space_8,
  },
  blogButtonText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  factsList: {
    marginTop: SPACING.space_10,
  },
  factItem: {
    flexDirection: 'row',
    marginBottom: SPACING.space_16,
  },
  factNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryOrangeHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_12,
    marginTop: 2,
  },
  factNumberText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_14,
  },
  factText: {
    flex: 1,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    lineHeight: 22,
  },
  contactContainer: {
    marginBottom: SPACING.space_16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_16,
  },
  contactText: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    marginLeft: SPACING.space_12,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.space_10,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryOrangeHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.space_10,
    shadowColor: COLORS.primaryOrangeHex,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  footer: {
    marginTop: SPACING.space_10,
    paddingVertical: SPACING.space_16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
});

export default AboutScreen;