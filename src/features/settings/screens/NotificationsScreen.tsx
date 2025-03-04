import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Mascot from '../../../components/Mascot';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationsScreen = () => {
  return (
    <SafeAreaView style={styles.screenContainer}>
        <View style={styles.mascot}>
          <Mascot emotion="sleeping"/>
          <Text style={styles.infoMessage}>No new notifications</Text>
        </View>
    </SafeAreaView>
  )
}

export default NotificationsScreen;

const styles = StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
    },
    mascot: {
        marginTop: SPACING.space_32,
        marginBottom: SPACING.space_36,
      },
      infoMessage: {
        fontSize: FONTSIZE.size_18,
        fontFamily: FONTFAMILY.poppins_semibold,
        textAlign: 'center',
        color: COLORS.primaryWhiteHex,
      },
})