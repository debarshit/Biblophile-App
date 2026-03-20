import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useStore } from '../../../store/store';
import { useTheme } from '../../../contexts/ThemeContext';

const themes = [
  {
    value: 'light',
    label: 'Light',
    icon: <FontAwesome5 name="sun" size={18} color="#D17842" />,
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: <FontAwesome5 name="moon" size={18} color="#D17842" />,
  },
  {
    value: 'system',
    label: 'System',
    icon: <FontAwesome5 name="mobile-alt" size={18} color="#D17842" />,
  },
];

interface ThemeModalProps {
  visibility: boolean;
  onClose: () => void;
}

const ThemeModal = ({ visibility, onClose }: ThemeModalProps) => {
  const { themePreference, setThemePreference } = useStore();
  const { COLORS } = useTheme();

  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const handleThemeSelect = (theme: 'light' | 'dark' | 'system') => {
    setThemePreference(theme);
    onClose();
  };

  return (
    <Modal
      visible={visibility}
      onRequestClose={onClose}
      animationType="slide"
      transparent
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Choose Theme</Text>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.instructionText}>
              Customize how Biblophile looks.
            </Text>

            <View style={styles.themeList}>
              {themes.map((theme) => (
                <TouchableOpacity
                  key={theme.value}
                  style={[
                    styles.themeItem,
                    themePreference === theme.value && styles.selectedThemeItem,
                  ]}
                  onPress={() => handleThemeSelect(theme.value as any)}
                >
                  <View style={styles.themeItemContent}>
                    <Text style={styles.themeIcon}>{theme.icon}</Text>
                    <Text style={styles.themeName}>{theme.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const createStyles = (COLORS) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.secondaryBlackRGBA,
    },
    modalContainer: {
      backgroundColor: COLORS.primaryBlackHex,
      borderRadius: 20,
      width: '80%',
      padding: 24,
    },
    header: {
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.primaryGreyHex,
      marginBottom: 16,
    },
    headerText: {
      fontSize: 20,
      color: COLORS.primaryWhiteHex,
      fontFamily: 'Poppins-Bold',
    },
    body: {
      marginTop: 12,
    },
    instructionText: {
      fontSize: 16,
      color: COLORS.secondaryLightGreyHex,
      marginBottom: 16,
    },
    themeList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    themeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primaryGreyHex,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 16,
      width: '48%',
    },
    selectedThemeItem: {
      borderWidth: 1,
      borderColor: COLORS.primaryOrangeHex,
    },
    themeItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    themeIcon: {
      marginRight: 8,
    },
    themeName: {
      color: COLORS.primaryWhiteHex,
      fontSize: 12,
      fontFamily: 'Poppins-Regular',
    },
  });

export default ThemeModal;