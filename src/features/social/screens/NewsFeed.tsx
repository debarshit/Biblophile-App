import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, Image, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme'

interface FeedItem {
  title: string;
  pubDate: string;
  description: string;
  link: string;
  enclosure?: {
    link: string;
  };
}

const NewsFeed = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const rssUrl = 'https://bookriot.com/feed/';

  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
      );
      const data = await response.json();

      if (data.status === 'ok') {
        setFeedItems(data.items);
      } else {
        setError('Failed to fetch RSS feed.');
      }
    } catch (err) {
      setError('An error occurred while fetching the RSS feed.');
    } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const renderItem = ({ item }: { item: FeedItem }) => (
    <View style={styles.card}>
      {item.enclosure?.link ? (
        <Image
          source={{ uri: item.enclosure.link }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.pubDate}>{item.pubDate}</Text>
      <Text style={styles.description} numberOfLines={3}>{item.description.replace(/<[^>]+>/g, '')}</Text>
      <TouchableOpacity
        style={styles.readMoreBtn}
        onPress={() => Linking.openURL(item.link)}
      >
        <Text style={styles.readMoreText}>Read More</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>News Feed</Text>
        <Text style={styles.betaTag}>Beta</Text>
      </View>
      {loading && <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.feedList}
        refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchFeed(true)}
                colors={[COLORS.primaryOrangeHex]}
                tintColor={COLORS.primaryOrangeHex}
            />
        }
      />
    </View>
  );
};

export default NewsFeed;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
    padding: SPACING.space_16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.space_20,
  },
  
  headerText: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
  },
  
  betaTag: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_4,
    marginTop: SPACING.space_2,
  },
  feedList: {
    paddingBottom: SPACING.space_20,
  },
  card: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
    marginBottom: SPACING.space_16,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_12,
  },
  title: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  pubDate: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_8,
  },
  description: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_12,
  },
  readMoreBtn: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_8,
    paddingHorizontal: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_8,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
  },
  error: {
    color: COLORS.primaryRedHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    marginBottom: SPACING.space_16,
  },
});