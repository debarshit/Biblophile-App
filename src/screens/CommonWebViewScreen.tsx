import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

const CommonWebViewScreen = ({ route }: any) => {
  const { url } = route.params;

  return (
    <View style={{ flex: 1 }}>
      <WebView source={{ uri: url }} style={{ flex: 1 }} />
    </View>
  );
};

const styles = StyleSheet.create({});

export default CommonWebViewScreen;