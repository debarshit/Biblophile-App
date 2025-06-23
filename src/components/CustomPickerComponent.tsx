import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';

export interface PickerOption {
  label: string;
  value: string;
  icon: string;
}

interface CustomPickerProps {
  options: PickerOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  style?: any;
  disabled?: boolean;
}

const CustomPicker: React.FC<CustomPickerProps> = ({
  options,
  selectedValue,
  onValueChange,
  placeholder = "Select an option",
  style,
  disabled = false,
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;
  const displayIcon = selectedOption ? selectedOption.icon : 'arrow-drop-down';

  const handleOptionSelect = (value: string) => {
    onValueChange(value);
    setShowOptions(false);
  };

  const toggleOptions = () => {
    if (!disabled) {
      setShowOptions(!showOptions);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={[styles.trigger, disabled && styles.disabled]} 
        onPress={toggleOptions}
        disabled={disabled}
      >
        <View style={styles.triggerContent}>
          <MaterialIcons 
            name={displayIcon as keyof typeof MaterialIcons.glyphMap} 
            size={20} 
            color={disabled ? COLORS.secondaryLightGreyHex : COLORS.primaryOrangeHex} 
          />
          <Text style={[
            styles.triggerText, 
            !selectedOption && styles.placeholderText,
            disabled && styles.disabledText
          ]}>
            {displayText}
          </Text>
          <MaterialIcons 
            name={showOptions ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={24} 
            color={disabled ? COLORS.secondaryLightGreyHex : COLORS.primaryWhiteHex} 
          />
        </View>
      </TouchableOpacity>
      
      {showOptions && !disabled && (
        <ScrollView style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option, 
                selectedValue === option.value && styles.selectedOption,
                index === options.length - 1 && styles.lastOption
              ]}
              onPress={() => handleOptionSelect(option.value)}
            >
              <MaterialIcons 
                name={option.icon as keyof typeof MaterialIcons.glyphMap} 
                size={18} 
                color={selectedValue === option.value ? COLORS.primaryOrangeHex : COLORS.primaryWhiteHex} 
              />
              <Text style={[
                styles.optionText, 
                selectedValue === option.value && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
              {selectedValue === option.value && (
                <MaterialIcons 
                  name="check" 
                  size={18} 
                  color={COLORS.primaryOrangeHex} 
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default CustomPicker;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  trigger: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: COLORS.secondaryLightGreyHex,
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: COLORS.primaryBlackHex,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_12,
  },
  triggerText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    flex: 1,
    marginLeft: SPACING.space_8,
  },
  placeholderText: {
    color: COLORS.secondaryLightGreyHex,
    fontStyle: 'italic',
  },
  disabledText: {
    color: COLORS.secondaryLightGreyHex,
  },
  optionsContainer: {
    position: 'absolute',
    maxHeight: 200,
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: COLORS.secondaryLightGreyHex,
    marginTop: SPACING.space_4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondaryLightGreyHex,
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  selectedOption: {
    backgroundColor: COLORS.primaryBlackHex,
  },
  optionText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    flex: 1,
    marginLeft: SPACING.space_8,
  },
  selectedOptionText: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_medium,
  },
});