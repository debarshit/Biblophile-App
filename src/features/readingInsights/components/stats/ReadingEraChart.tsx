//not attached to anything. Might add or remove later. 
// Just a fun experiment to visualize reading eras and trends over time. 
// Can be used in the future as a more detailed breakdown of reading history, or 
// as a fun "timeline" view of your reading journey.
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  SPACING,
  FONTFAMILY,
  FONTSIZE,
  BORDERRADIUS,
} from '../../../../theme/theme';

const screenWidth = Dimensions.get('window').width;

const DATA = [
  {
    year: '2022',
    title: 'Fantasy Era',
    text: 'Fantasy obsession',
    books: 24,
    tags: ['Immersive', 'Escapism'],
  },
  {
    year: '2023',
    title: 'Mind Era',
    text: 'Psychology & philosophy',
    books: 12,
    tags: ['Deep', 'Reflective'],
  },
  {
    year: '2024',
    title: 'Russian Era',
    text: 'Long Russian novels',
    books: 8,
    tags: ['Heavy', 'Slow'],
  },
  {
    year: '2025',
    title: 'Essay Era',
    text: 'Essays & science writing',
    books: 18,
    tags: ['Curious', 'Analytical'],
  },
];

const COLORS_MAP = ['#FFBC42', '#FF7E5F', '#42D1D1', '#9C4DD4'];

const ReadingTimeline = () => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const maxBooks = Math.max(...DATA.map(d => d.books));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Reading Eras</Text>

      {/* 📈 Trend Chart */}
      {/* <LineChart
        data={{
          labels: DATA.map(d => d.year),
          datasets: [{ data: DATA.map(d => d.books) }],
        }}
        width={screenWidth - 32}
        height={180}
        chartConfig={{
          backgroundGradientFrom: COLORS.primaryDarkGreyHex,
          backgroundGradientTo: COLORS.primaryDarkGreyHex,
          color: () => COLORS.primaryOrangeHex,
          labelColor: () => COLORS.primaryWhiteHex,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: COLORS.primaryOrangeHex,
          },
        }}
        bezier
        style={styles.chart}
      /> */}

      {/* 📜 Timeline */}
      <View style={styles.card}>
        {DATA.map((item, index) => {
          const widthPercent = (item.books / maxBooks) * 100;

          return (
            <View key={index} style={styles.row}>
              {/* Timeline Line */}
              <View style={styles.left}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: COLORS_MAP[index] },
                  ]}
                />
                {index !== DATA.length - 1 && (
                  <View style={styles.line} />
                )}
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.year}>{item.year}</Text>
                <Text style={styles.era}>{item.title}</Text>
                <Text style={styles.text}>{item.text}</Text>

                {/* 📊 Intensity Bar */}
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${widthPercent}%`,
                        backgroundColor: COLORS_MAP[index],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.meta}>{item.books} books</Text>

                {/* 🧠 Tags */}
                <View style={styles.tagsRow}>
                  {item.tags.map((tag, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default ReadingTimeline;

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_8,
      padding: SPACING.space_12,
    },

    title: {
      fontSize: FONTSIZE.size_24,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryWhiteHex,
      textAlign: 'center',
      marginBottom: SPACING.space_12,
    },

    chart: {
      borderRadius: BORDERRADIUS.radius_8,
      marginBottom: SPACING.space_16,
    },

    card: {
      paddingVertical: SPACING.space_8,
    },

    row: {
      flexDirection: 'row',
      marginBottom: SPACING.space_20,
    },

    left: {
      width: 30,
      alignItems: 'center',
    },

    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },

    line: {
      width: 2,
      flex: 1,
      backgroundColor: COLORS.secondaryLightGreyHex,
      marginTop: 2,
    },

    content: {
      flex: 1,
      paddingLeft: SPACING.space_8,
    },

    year: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.secondaryLightGreyHex,
    },

    era: {
      fontSize: FONTSIZE.size_16,
      fontFamily: FONTFAMILY.poppins_bold,
      color: COLORS.primaryOrangeHex,
      marginTop: 2,
    },

    text: {
      fontSize: FONTSIZE.size_12,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.primaryWhiteHex,
      marginTop: 2,
    },

    barBackground: {
      height: 6,
      backgroundColor: COLORS.primaryGreyHex,
      borderRadius: 3,
      marginTop: SPACING.space_8,
      overflow: 'hidden',
    },

    barFill: {
      height: 6,
      borderRadius: 3,
    },

    meta: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_regular,
      color: COLORS.secondaryLightGreyHex,
      marginTop: 4,
    },

    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: SPACING.space_8,
    },

    tag: {
      backgroundColor: COLORS.primaryGreyHex,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },

    tagText: {
      fontSize: FONTSIZE.size_10,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryWhiteHex,
    },
  });