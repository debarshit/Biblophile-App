import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import WebView from 'react-native-webview'
import { COLORS, FONTSIZE } from '../../../theme/theme'
import GradientBGIcon from '../../../components/GradientBGIcon'

const ResourceScreen = ({navigation, route}: any) => {
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
              source={{ uri: route.params.url }}
              style={{ flex: 1 }}
          />
      </SafeAreaView>   
  )
}

export default ResourceScreen

const styles = StyleSheet.create({})