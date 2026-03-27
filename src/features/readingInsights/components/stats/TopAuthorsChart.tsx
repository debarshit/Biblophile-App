import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useStore } from '../../../../store/store';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';

interface TopAuthorsChartProps {
  timeFrame: string;
}

interface AuthorItem {
  authorId: number;
  authorName: string;
  count: number;
}

function timeFrameToFrom(timeFrame: string): string | undefined {
  const now = new Date();
  if (timeFrame === 'last-week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }
  if (timeFrame === 'last-month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  }
  return undefined;
}

const TopAuthorsChart: React.FC<TopAuthorsChartProps> = ({ timeFrame }) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const userDetails = useStore((state) => state.userDetails);

  const [authors, setAuthors] = useState<AuthorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const from = timeFrameToFrom(timeFrame);
        const params = new URLSearchParams({ timezone: userTimezone });
        if (from) params.set('from', from);

        const response = await instance.get(
          `${requests.fetchAuthorStats}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${userDetails[0].accessToken}` } },
        );

        const raw: AuthorItem[] = response.data?.data?.authors ?? [];
        setAuthors(raw.filter(a => a.count > 0));
      } catch (e) {
        console.error('Failed to fetch author stats:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFrame]);

  const maxCount = authors[0]?.count ?? 1;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  if (error || authors.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          {error ? 'Failed to load data.' : 'No author data yet.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Top Authors</Text>
      <View style={styles.card}>
        {authors.map((item, i) => {
          const pct   = (item.count / maxCount) * 100;
          const isTop = i === 0;
          return (
            <View key={item.authorId} style={styles.row}>
              <Text style={[styles.rank, isTop && styles.rankTop]}>#{i + 1}</Text>
              <View style={styles.nameAndBar}>
                <View style={styles.nameRow}>
                  <Text
                    style={[styles.authorName, isTop && styles.authorNameTop]}
                    numberOfLines={1}
                  >
                    {item.authorName}
                  </Text>
                  <Text style={[styles.bookCount, isTop && styles.bookCountTop]}>
                    {item.count} {item.count === 1 ? 'book' : 'books'}
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${pct}%` },
                      isTop && styles.barFillTop,
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default TopAuthorsChart;

const createStyles = (COLORS: any) => StyleSheet.create({
  statContainer: {
    backgroundColor: 'transparent',
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_8,
  },
  centered: {
    paddingVertical: SPACING.space_36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
  title: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_16,
    gap: SPACING.space_12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_12,
  },
  rank: {
    width: 28,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'center',
  },
  rankTop: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
  },
  nameAndBar: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_4,
  },
  authorName: {
    flex: 1,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
  },
  authorNameTop: {
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
  },
  bookCount: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    marginLeft: SPACING.space_8,
  },
  bookCountTop: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  barBg: {
    height: 6,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.secondaryLightGreyHex,
    borderRadius: 3,
  },
  barFillTop: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
});