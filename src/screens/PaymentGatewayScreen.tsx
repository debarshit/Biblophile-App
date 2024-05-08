import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import WebView from 'react-native-webview';
import { COLORS } from '../theme/theme';

const PaymentGatewayScreen = ({navigation, route}: any) => {
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

const styles = StyleSheet.create({})