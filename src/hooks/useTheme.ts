import { useColorScheme } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/theme';

export const useTheme = () => {
  const scheme = useColorScheme();

  const COLORS = scheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return { COLORS, scheme };
};