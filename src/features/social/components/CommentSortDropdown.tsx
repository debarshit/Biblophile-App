import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, LayoutChangeEvent } from 'react-native';
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

export const CommentSortDropdown: React.FC<Props> = ({
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
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [labelLayout, setLabelLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const labelRef = useRef(null);

  const toggleDropdown = () => {
    setIsVisible(!isVisible);
  };

  const handleItemSelect = (item: DropdownItem) => {
    setSelectedValue(item.value);
    onValueChange(item.value);
    setIsVisible(false);
  };

  const onLabelLayout = (event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setLabelLayout({ x, y, width, height });
    // Calculate the position where the dropdown should appear
    setDropdownPosition({ x: x, y: y + height + 5 }); // Adjust 5 for a small gap
  };

  return (
    <View>
      <TouchableOpacity
        ref={labelRef}
        style={[styles.labelContainer, labelStyle]}
        onPress={toggleDropdown}
        onLayout={onLabelLayout}
      >
        {label}
      </TouchableOpacity>

      {isVisible && (
        <View
          style={[
            styles.dropdownContainer,
            dropdownStyle,
            {
              position: 'absolute',
              top: dropdownPosition.y,
              right: -dropdownPosition.x,
            },
          ]}
        >
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  labelContainer: {
    padding: SPACING.space_8,
  },
  dropdownContainer: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    width: 150,
    zIndex: 10, // Ensure it appears above other elements
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