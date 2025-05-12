import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

const Footer = ({ openWebView }) => {
  return (
    <View style={styles.footer}>
      <TouchableOpacity
        onPress={() => {
          openWebView('https://biblophile.com/policies/customer-support.php')
        }}>
        <Text style={styles.footerLink}>📞 Contact</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          openWebView('https://biblophile.com/policies/privacy-policy.php')
        }}>
        <Text style={styles.footerLink}>🔒 Privacy</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.space_10,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
  },
  footerLink: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
  },
});

export default Footer;