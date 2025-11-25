import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, TextInput, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';

interface PageStatsChartProps {
  pagesRead: any[];
  timeFrame: string;
  userDetails: any[];
  fetchPagesRead: () => void;
  analytics: any;
}

const PageStatsChart: React.FC<PageStatsChartProps> = ({ 
  pagesRead, 
  timeFrame, 
  userDetails, 
  fetchPagesRead,
  analytics 
}) => {
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, value: '', date: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editPageCount, setEditPageCount] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const handleSave = async () => {
    try {
      const updatedPageCount = parseInt(editPageCount, 10);
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await instance.post(`${requests.updatePagesRead}?timezone=${userTimezone}`, {
        pageCount: updatedPageCount,
        date: selectedDate
      }, {
        headers: { Authorization: `Bearer ${userDetails[0].accessToken}` },
      });
      
      if (response.data.data.message === "Updated" || response.data.data.message === "Inserted") {
        alert('Page count updated successfully');
        setIsEditing(false);
        setTooltipPos({ ...tooltipPos, visible: false });
        fetchPagesRead();
        analytics.track('pages_read_updated');
      }
    } catch (error) {
      console.error('Failed to update page count:', error);
    }
  };

  if (!Array.isArray(pagesRead) || pagesRead.length === 0) {
    return (
      <View style={styles.statContainer}>
        <Text style={styles.title}>Pages Read in Last {timeFrame === 'last-week' ? '7 Days' : '30 Days'}</Text>
        <Text style={styles.highlightText}>No data available</Text>
      </View>
    );
  }

  const labelCount = timeFrame === 'last-week' ? 7 : 30;
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const labels = [];
  const dataPoints = Array(labelCount).fill(0);

  for (let i = labelCount - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString("en-CA", { timeZone: userTimezone }));
  }

  pagesRead.forEach(item => {
    const itemDate = new Date(item.dateRead).toLocaleDateString("en-CA", { timeZone: userTimezone });
    const index = labels.indexOf(itemDate);
    if (index !== -1) {
      dataPoints[index] = item.pagesRead;
    }
  });

  const adjustedLabels = labels.map((label, index) => {
    if (index === 0 || index === Math.floor(labels.length / 2) || index === labels.length - 1) {
      return label;
    }
    return '';
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toISOString().split('T')[0];

  return (
    <View style={styles.statContainer}>
      <Text style={styles.title}>Pages Read in Last {timeFrame === 'last-week' ? '7 Days' : '30 Days'}</Text>
      <TouchableWithoutFeedback onPress={() => setTooltipPos({ ...tooltipPos, visible: false })}>
        <View>
          <LineChart
            data={{
              labels: adjustedLabels,
              datasets: [{ data: dataPoints }],
            }}
            width={Dimensions.get('window').width - SPACING.space_16 * 2}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" pgs"
            withVerticalLines={false}
            withHorizontalLines={false}
            withInnerLines={false}
            chartConfig={{
              backgroundColor: COLORS.primaryDarkGreyHex,
              backgroundGradientFrom: COLORS.primaryDarkGreyHex,
              backgroundGradientTo: COLORS.primaryDarkGreyHex,
              decimalPlaces: 0,
              color: (opacity = 1) => COLORS.primaryOrangeHex,
              labelColor: (opacity = 1) => COLORS.primaryWhiteHex,
              style: { borderRadius: BORDERRADIUS.radius_8 },
              propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.primaryBlackHex },
            }}
            bezier
            style={{
              marginVertical: SPACING.space_16,
              borderRadius: BORDERRADIUS.radius_8,
            }}
            onDataPointClick={(data) => {
              const { x, y, index } = data;
              const date = labels[index];
              setSelectedDate(date);
              setEditPageCount(dataPoints[index].toString());
              setTooltipPos({
                x, y, visible: true,
                value: `${dataPoints[index]} pages`,
                date: date,
              });
              setIsEditing(false);
            }}
          />
          {tooltipPos.visible && (
            <View style={[styles.tooltip, { top: tooltipPos.y - 30, left: tooltipPos.x - 25 }]}>
              {isEditing ? (
                <View>
                  <TextInput
                    style={styles.input}
                    value={editPageCount}
                    onChangeText={setEditPageCount}
                    keyboardType="numeric"
                  />
                  <TouchableWithoutFeedback onPress={handleSave}>
                    <Text style={styles.saveButton}>Save</Text>
                  </TouchableWithoutFeedback>
                </View>
              ) : (
                <View>
                  <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
                  <Text style={styles.tooltipText}>{tooltipPos.date}</Text>
                  {selectedDate === yesterdayFormatted && (
                    <TouchableWithoutFeedback onPress={() => setIsEditing(true)}>
                      <Text style={styles.editButton}>Edit</Text>
                    </TouchableWithoutFeedback>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default PageStatsChart;

const styles = StyleSheet.create({
  statContainer: {
    backgroundColor: 'transparent',
    borderRadius: BORDERRADIUS.radius_8,
    padding: SPACING.space_8,
  },
  title: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_bold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_16,
    textAlign: 'center',
  },
  highlightText: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_18,
    textAlign: 'center',
    padding: SPACING.space_20,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tooltipText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  input: {
    height: 40,
    borderColor: COLORS.secondaryLightGreyHex,
    borderWidth: 1,
    borderRadius: BORDERRADIUS.radius_8,
    paddingHorizontal: SPACING.space_8,
    color: COLORS.primaryWhiteHex,
    backgroundColor: COLORS.primaryGreyHex,
    marginBottom: SPACING.space_8,
  },
  saveButton: {
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    textAlign: 'center',
  },
  editButton: {
    color: COLORS.primaryOrangeHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_bold,
    textAlign: 'center',
  },
});