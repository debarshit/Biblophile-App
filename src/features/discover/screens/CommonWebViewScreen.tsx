import React, { useEffect, useRef, useState } from "react";
import { BackHandler } from "react-native";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useStore } from "../../../store/store";
import { useNavigation } from "@react-navigation/native";

const CommonWebViewScreen = ({ route, navigation }: any) => {
  const { url } = route.params;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const logout = useStore((state: any) => state.logout);
  const userDetails = useStore((state: any) => state.userDetails);

  const accessToken = userDetails[0]?.accessToken;
  const refreshToken = userDetails[0]?.refreshToken;

  navigation = useNavigation();
  const webViewRef = useRef(null);

  useEffect(() => {
      if (accessToken && refreshToken) {
        setIsLoggedIn(true);
      } else {
        const logoutAndNavigate = async () => {
          try {
            await logout();
            navigation.navigate("SignupLogin");
          } catch (error) {
            console.error("Logout failed:", error);
          }
        };
  
        logoutAndNavigate();
      }
    }, [accessToken, refreshToken, logout]);
  
    useEffect(() => {
      const backAction = () => {
        if (canGoBack) {
          webViewRef.current.goBack();
          return true;
        } else {
          return false;
        }
      };
  
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
  
      return () => {
        backHandler.remove();
      };
    }, [canGoBack]);
  
    const handleNavigationStateChange = (navState: any) => {
      setCanGoBack(navState.canGoBack);
    };
  
    if (!isLoggedIn) {
      return null;
    }
  
    const injectedJS = `
    (function() {
    const currentUrl = '${url}';
      // Hide nav and footer
      const nav = document.querySelector('nav');
      const footer = document.querySelector('footer');
      if (currentUrl.toString().startsWith('https://biblophile.com')) {
        if (nav) nav.style.display = 'none';
        if (footer) footer.style.display = 'none';
      };
      
      // Add margin to body
      const body = document.querySelector('body');
      if (body) body.style.marginBottom = '100px';
      
      // Override fetch to include headers
      const originalFetch = window.fetch;
      window.fetch = function(url, options = {}) {
        if (currentUrl.toString().startsWith('https://biblophile.com')) {
          options.headers = {
            ...options.headers,
            'Authorization': 'Bearer ${accessToken}',
            'x-refresh-token': '${refreshToken}'
          };
        }
        return originalFetch(url, options);
      };
    })();
  `;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ 
          uri: url,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-refresh-token": refreshToken,
          },
        }}
        originWhitelist={["*"]}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScript={injectedJS}
        style={{ flex: 1 }} />
    </View>
  );
};

const styles = StyleSheet.create({});

export default CommonWebViewScreen;