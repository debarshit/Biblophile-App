import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Platform, Modal } from 'react-native';
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

  const toggleOptions = () => !disabled && setShowOptions(!showOptions);

  const renderOption = ({ item, index }: { item: PickerOption; index: number }) => {
    const isSelected = selectedValue === item.value;
    return (
      <TouchableOpacity
        style={[
          styles.option, 
          isSelected && styles.selectedOption,
          index === options.length - 1 && styles.lastOption
        ]}
        onPress={() => handleOptionSelect(item.value)}
        activeOpacity={0.7}
      >
        <MaterialIcons 
          name={item.icon as keyof typeof MaterialIcons.glyphMap} 
          size={18} 
          color={isSelected ? COLORS.primaryOrangeHex : COLORS.primaryWhiteHex} 
        />
        <Text style={[
          styles.optionText, 
          isSelected && styles.selectedOptionText
        ]}>
          {item.label}
        </Text>
        {isSelected && (
          <MaterialIcons name="check" size={18} color={COLORS.primaryOrangeHex} />
        )}
      </TouchableOpacity>
    );
  };

  const TriggerButton = () => (
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
  );

  const OptionsList = ({ style: listStyle }: { style?: any }) => (
    <FlatList
      data={options}
      renderItem={renderOption}
      keyExtractor={(item) => item.value}
      style={listStyle}
      showsVerticalScrollIndicator={Platform.OS === 'android'}
      nestedScrollEnabled={Platform.OS === 'ios'}
      bounces={false}
    />
  );

  return (
    <View style={[styles.container, style]}>
      <TriggerButton />
      
      {Platform.OS === 'android' ? (
        <Modal
          visible={showOptions && !disabled}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOptions(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowOptions(false)}
          >
            <View style={styles.modalContent}>
              <OptionsList style={styles.modalList} />
            </View>
          </TouchableOpacity>
        </Modal>
      ) : (
        showOptions && !disabled && (
          <View style={styles.optionsContainer}>
            <OptionsList style={styles.optionsList} />
          </View>
        )
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
    maxHeight: 200,
  },
  optionsList: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
  },
  modalContent: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: COLORS.secondaryLightGreyHex,
    maxHeight: 300,
    width: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalList: {
    flexGrow: 0,
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