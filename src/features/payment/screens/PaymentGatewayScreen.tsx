import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import React, { useMemo } from 'react';
import WebView from 'react-native-webview';
import { COLORS } from '../../../theme/theme';
import { useTheme } from '../../../contexts/ThemeContext';

const PaymentGatewayScreen = ({navigation, route}: any) => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryBlackHex }}>
        <WebView
              source={{ uri: route.params.url }}
              style={{ flex: 1 }}
          />
      </SafeAreaView>   
  )
}

export default PaymentGatewayScreen;

const createStyles = (COLORS) => StyleSheet.create({})