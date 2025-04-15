import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { COLORS, FONTSIZE, FONTFAMILY, BORDERRADIUS, SPACING } from '../../../theme/theme';

interface DropdownItem {
  label: string;
  value: string;
}

interface Props {
  label: React.ReactNode;
  items: DropdownItem[];
  onValueChange: (value: string) => void;
  itemStyle?: any;
  itemTextStyle?: any;
  dropdownStyle?: any;
  labelStyle?: any;
}

export const Dropdown: React.FC<Props> = ({
  label,
  items,
  onValueChange,
  itemStyle,
  itemTextStyle,
  dropdownStyle,
  labelStyle,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const toggleDropdown = () => {
    setIsVisible(!isVisible);
  };

  const handleItemSelect = (item: DropdownItem) => {
    setSelectedValue(item.value);
    onValueChange(item.value);
    setIsVisible(false);
  };

  return (
    <View>
      <TouchableOpacity style={[styles.labelContainer, labelStyle]} onPress={toggleDropdown}>
        {label}
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={toggleDropdown}>
          <View style={[styles.dropdownContainer, dropdownStyle]}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.itemContainer, itemStyle]}
                  onPress={() => handleItemSelect(item)}
                >
                  <Text style={[styles.itemText, itemTextStyle]}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  labelContainer: {
    padding: SPACING.space_8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.secondaryBlackRGBA,
    justifyContent: 'flex-start',
    paddingTop: SPACING.space_36,
    alignItems: 'flex-end',
    paddingRight: SPACING.space_15,
  },
  dropdownContainer: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    width: 150,
  },
  itemContainer: {
    paddingVertical: SPACING.space_10,
    paddingHorizontal: SPACING.space_15,
  },
  itemText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
});