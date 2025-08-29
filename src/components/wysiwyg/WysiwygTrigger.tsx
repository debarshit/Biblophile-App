import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../theme/theme';
import { WysiwygRender } from './WysiwygRender';

type WysiwygTriggerProps = {
  value?: string;
  placeholder?: string;
  onPress: () => void;
  maxLines?: number;
};

export function WysiwygTrigger({ 
  value = '', 
  placeholder = 'Tap to write...', 
  onPress,
  maxLines = 3 
}: WysiwygTriggerProps) {
  
  return (
    <TouchableOpacity style={styles.trigger} onPress={onPress}>
      <Text 
        style={[styles.text, !value && styles.placeholder]}
        numberOfLines={maxLines}
      >
        {value ? <WysiwygRender html={value} /> : placeholder}
      </Text>
      <Text style={styles.editHint}>Tap to edit</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 60,
    padding: SPACING.space_12,
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
    justifyContent: 'space-between',
  },
  text: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    lineHeight: 20,
  },
  placeholder: {
    color: COLORS.secondaryLightGreyHex,
  },
  editHint: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    marginTop: SPACING.space_8,
    textAlign: 'right',
  },
});