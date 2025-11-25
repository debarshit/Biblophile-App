import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../../theme/theme';
import CustomPicker, { PickerOption } from '../../../../components/CustomPickerComponent';

interface TimeFramePickerProps {
  timeFrame: string;
  setTimeFrame: (value: string) => void;
}

const TimeFramePicker: React.FC<TimeFramePickerProps> = ({ timeFrame, setTimeFrame }) => {
  const timeFrameOptions: PickerOption[] = [
    { label: 'Last week', value: 'last-week', icon: 'calendar-today' },
    { label: 'Last month', value: 'last-month', icon: 'calendar-view-month' },
  ];

  return (
    <View style={styles.statusDropdown}>
      <Text style={styles.label}>Time frame: </Text>
      <View style={styles.pickerContainer}>
        <CustomPicker
          options={timeFrameOptions}
          selectedValue={timeFrame}
          onValueChange={(value) => setTimeFrame(value)}
        />
      </View>
    </View>
  );
};

export default TimeFramePicker;

const styles = StyleSheet.create({
  statusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.space_12,
  },
  label: {
    marginRight: SPACING.space_8,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
  },
  pickerContainer: {
    borderRadius: BORDERRADIUS.radius_8,
    width: 200,
  },
});