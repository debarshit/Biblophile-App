import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import {
    BORDERRADIUS,
    COLORS,
    FONTSIZE,
    SPACING,
  } from '../../../theme/theme';

interface SessionPromptProps {
  message: string;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const SessionPrompt: React.FC<SessionPromptProps> = ({ message, visible, onConfirm, onCancel }) => {
  return (
    <Modal transparent={true} animationType="slide" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.btnText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.btnText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackRGBA
  },
  box: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  message: {
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.space_30,
    width: '70%',
  },
  confirmBtn: {
    padding: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_4,
    backgroundColor: COLORS.primaryOrangeHex,
  },
  cancelBtn: {
    padding: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_4,
    backgroundColor: COLORS.primaryDarkGreyHex,
  },
  btnText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
  },
});

export default SessionPrompt;
