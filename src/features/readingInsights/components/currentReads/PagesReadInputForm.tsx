import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';

interface PagesReadInputFormProps {
  pagesRead: string;
  onPagesReadChange: (value: string) => void;
  onUpdate: () => void;
}

const PagesReadInputForm: React.FC<PagesReadInputFormProps> = ({
  pagesRead,
  onPagesReadChange,
  onUpdate,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const toggleTooltip = useCallback(() => {
    setShowTooltip(prev => !prev);
  }, []);

  return (
    <View style={styles.inputBox}>
      <View style={styles.inputLabelContainer}>
        <Text style={styles.inputLabel}>Pages read today</Text>
        <TouchableOpacity onPress={toggleTooltip} style={styles.infoIconContainer}>
          <FontAwesome name="info-circle" style={styles.infoIcon} />
          {showTooltip && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                This is automatically updated, but you can update it manually if there's an inaccuracy.
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder='Optional'
        placeholderTextColor={COLORS.secondaryLightGreyHex}
        autoCapitalize='none'
        keyboardType='numeric'
        value={pagesRead}
        onChangeText={onPagesReadChange}
        accessibilityLabel="Pages Read"
        accessibilityHint="Enter the number of pages read today"
      />
      <TouchableOpacity onPress={onUpdate} style={styles.button}>
        <Text style={styles.buttonText}>Update</Text>
      </TouchableOpacity>
      <Text style={styles.subtext}>
        Automatically updated from your reading progress. Update manually only if inaccurate.
      </Text>
    </View>
  );
};

export default PagesReadInputForm;

const styles = StyleSheet.create({
  inputBox: {
    alignItems: 'center',
    gap: SPACING.space_10,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_4,
    position: 'relative',
  },
  inputLabel: {
    color: COLORS.primaryWhiteHex,
  },
  input: {
    padding: SPACING.space_10,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderColor: COLORS.primaryLightGreyHex,
    borderWidth: 1,
    borderRadius: 5,
    color: COLORS.primaryWhiteHex,
    width: 300,
    textAlign: 'center',
    zIndex: -1,
  },
  button: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_4,
    paddingHorizontal: SPACING.space_20,
    borderRadius: 5,
    marginTop: SPACING.space_10,
    width: 'auto',
    alignSelf: 'center',
    transform: [{ scale: 1 }],
  },
  buttonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_medium,
    textAlign: 'center',
  },
  subtext: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    marginTop: SPACING.space_4,
    textAlign: 'center',
  },
  infoIconContainer: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: 20,
    right: 5,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    color: COLORS.primaryWhiteHex,
    padding: SPACING.space_4,
    borderRadius: 4,
    fontSize: FONTSIZE.size_12,
    width: 200,
    zIndex: 1,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  tooltipText: {
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  infoIcon: {
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_18,
  },
});