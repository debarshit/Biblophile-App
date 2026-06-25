import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useMemo } from 'react'
import WebView from 'react-native-webview'
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { COLORS, FONTSIZE } from '../../../theme/theme'
import GradientBGIcon from '../../../components/GradientBGIcon'
import { useTheme } from '../../../contexts/ThemeContext'

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
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

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

  const onMessage = async (event) => {
    const data = JSON.parse(event.nativeEvent.data);

    if (data.type === 'download') {
      try {
        const permission = await MediaLibrary.requestPermissionsAsync();

        if (!permission.granted) return;

        const base64 = data.image.replace(
          /^data:image\/\w+;base64,/,
          ''
        );

        const fileUri =
          FileSystem.cacheDirectory + data.filename;

        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const asset = await MediaLibrary.createAssetAsync(fileUri);

        await MediaLibrary.createAlbumAsync(
          'Biblophile',
          asset,
          false
        );

        alert('Saved to Gallery!');
      } catch (e) {
        console.log(e);
      }
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
        onMessage={onMessage}
        style={{ flex: 1 }} 
      />
    </SafeAreaView>
  );
};

export default ResourceScreen

const createStyles = (COLORS) => StyleSheet.create({})