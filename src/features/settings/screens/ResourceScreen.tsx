import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import WebView from 'react-native-webview'
import { COLORS, FONTSIZE } from '../../../theme/theme'
import GradientBGIcon from '../../../components/GradientBGIcon'

const ResourceScreen = ({ navigation, route }: any) => {
  const rawPath = route.params?.url || 
                route.params?.['*'] || 
                Object.values(route.params || {}).find(p => typeof p === 'string');

  let cleanPath = rawPath;
  if (!cleanPath || cleanPath === 'undefined') {
    // If the params are empty, try to see if the URL was the route name itself
    cleanPath = route.name === 'Resources' ? '' : route.name;
  }

  let finalUrl = cleanPath?.startsWith('http') 
    ? cleanPath 
    : `https://biblophile.com/${cleanPath}`;

  // We extract everything from params except the internal navigation keys
  const { url, path, ...otherParams } = route.params || {};
  delete otherParams['*']; 

  const queryParts = Object.keys(otherParams).map(
    key => `${key}=${encodeURIComponent(otherParams[key])}`
  );

  if (queryParts.length > 0) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl += separator + queryParts.join('&');
  }

  console.log('[DeepLink] Opening WebView with:', finalUrl);

  const BackHandler = () => {
    if (navigation.canGoBack()) {
      navigation.pop();
    } else {
      navigation.navigate('Tab');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryBlackHex }}>
      <TouchableOpacity onPress={BackHandler} style={{ position: 'absolute', top: 64, left: 16, zIndex: 1 }}>
        <GradientBGIcon 
          name="left" 
          color={COLORS.primaryLightGreyHex} 
          size={FONTSIZE.size_16} 
        />
      </TouchableOpacity>
      <WebView 
        source={{ uri: finalUrl }} 
        style={{ flex: 1 }} 
      />
    </SafeAreaView>
  );
};

export default ResourceScreen

const styles = StyleSheet.create({})