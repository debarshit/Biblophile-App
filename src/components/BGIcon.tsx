import React, { useMemo } from 'react';
import {StyleSheet, Text, View} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import {BORDERRADIUS, SPACING} from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';

interface BGIconProps {
  name: string;
  color: string;
  size: number;
  BGColor: string;
}

const BGIcon: React.FC<BGIconProps> = ({name, color, size, BGColor}) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={[styles.IconBG, {backgroundColor: BGColor}]}>
      <AntDesign name={name} color={color} size={size} />
    </View>
  );
};

const createStyles = (COLORS) => StyleSheet.create({
  IconBG: {
    height: SPACING.space_30,
    width: SPACING.space_30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDERRADIUS.radius_8,
  },
});

export default BGIcon;
