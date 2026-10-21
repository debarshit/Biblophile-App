import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useMemo } from 'react';
import WebView from 'react-native-webview';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBGIcon from '../../../components/GradientBGIcon';

const PaymentGatewayScreen = ({ navigation, route }: any) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.pop()}>
          <GradientBGIcon
            name="left"
            color={COLORS.primaryLightGreyHex}
            size={FONTSIZE.size_16}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <View style={styles.emptyView} />
      </View>

      <WebView
        source={{ uri: route.params.url }}
        style={styles.webView}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
            <Text style={styles.loadingText}>Securing payment gateway...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default PaymentGatewayScreen;

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
    },
    header: {
      paddingHorizontal: SPACING.space_20,
      paddingVertical: SPACING.space_10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: COLORS.primaryBlackHex,
    },
    headerTitle: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_16,
      color: COLORS.primaryWhiteHex,
    },
    emptyView: {
      height: 36,
      width: 36,
    },
    webView: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
    },
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: COLORS.primaryBlackHex,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.space_12,
    },
    loadingText: {
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_14,
      color: COLORS.secondaryLightGreyHex,
    },
  });