import React, { createContext, useContext, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { BORDERRADIUS, DARK_COLORS, FONTFAMILY, FONTSIZE, LIGHT_COLORS, SPACING } from '../theme/theme';
import { useStore } from '../store/store';

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const themePreference = useStore(state => state.themePreference);

  const scheme = useMemo(() => {
    if (themePreference === 'system') return systemScheme;
    return themePreference;
  }, [themePreference, systemScheme]);

  const theme = useMemo(() => {
    const COLORS = scheme === 'dark' ? DARK_COLORS : LIGHT_COLORS

    return {
      COLORS,
      SPACING,
      FONTSIZE,
      FONTFAMILY,
      BORDERRADIUS,
      scheme,
    }
  }, [scheme])

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }

  return context
}