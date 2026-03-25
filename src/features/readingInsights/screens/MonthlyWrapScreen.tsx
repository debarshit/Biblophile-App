// MonthlyWrapScreen.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Share,
  Platform,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useStore } from '../../../store/store';
import { BORDERRADIUS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';

type BridgeMessage =
  | { type: 'WRAP_LOADED';    payload: { month: string; year: string } }
  | { type: 'WRAP_ERROR';     payload: { message: string } }
  | { type: 'DOWNLOAD_IMAGE'; payload: { imageUrl: string; filename: string; templateId: string; label: string } }
  | { type: 'DOWNLOAD_ERROR'; payload: { templateId: string; message: string } };

const WEB_BASE_URL = 'https://biblophile.com';

const MonthlyWrapScreen = ({ route, navigation }) => {
  const { monthNumber, monthName, year } = route.params as {
    monthNumber: number;
    monthName: string;
    year: string;
  };

  const userDetails = useStore(state => state.userDetails);
  const accessToken = userDetails[0]?.accessToken ?? '';

  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();

  const webViewRef = useRef<WebView>(null);

  const [pageLoading, setPageLoading]         = useState(true);
  const [downloading, setDownloading]         = useState<string | null>(null);
  const [lastSavedLabel, setLastSavedLabel]   = useState<string | null>(null);

  /* ── Build the URL with app-mode flag and injected token ── */
  const wrapUrl = useMemo(() => {
    const url = new URL(`${WEB_BASE_URL}/wrap/${userDetails[0].userUniqueUserName}/${year}/${monthNumber}`);
    url.searchParams.set('mode', 'app');
    // Pass the token as a query param so the Remix loader can authenticate
    // even without a cookie (WebView has no session cookie by default)
    if (accessToken) url.searchParams.set('token', accessToken);
    return url.toString();
  }, [year, monthNumber, accessToken]);

  /* ── Request media library permission once ── */
  const ensureMediaPermission = useCallback(async (): Promise<boolean> => {
    const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') return true;
    if (!canAskAgain) {
      Alert.alert(
        'Permission Required',
        'Please enable photo library access in Settings to save wrap images.',
        [{ text: 'OK' }],
      );
    }
    return false;
  }, []);

  /* ── Download an image URL and save to the device photo library ── */
  const downloadAndSave = useCallback(async (imageUrl: string, filename: string, label: string) => {
    const hasPermission = await ensureMediaPermission();
    if (!hasPermission) {
      // Tell the web page the download failed so it can unlock its UI
      webViewRef.current?.postMessage(JSON.stringify({ type: 'DOWNLOAD_ERROR', payload: { templateId: filename } }));
      setDownloading(null);
      return;
    }

    try {
      const localUri = `${FileSystem.cacheDirectory}${filename}`;

      const { status } = await FileSystem.downloadAsync(imageUrl, localUri);
      if (status !== 200) throw new Error(`HTTP ${status}`);

      await MediaLibrary.saveToLibraryAsync(localUri);

      // Clean up cache
      await FileSystem.deleteAsync(localUri, { idempotent: true });

      setLastSavedLabel(label);

      // ACK back to the web page
      webViewRef.current?.postMessage(
        JSON.stringify({ type: 'DOWNLOAD_COMPLETE', payload: { filename } }),
      );
    } catch (err) {
      console.error('Download failed:', err);
      Alert.alert('Save Failed', `Could not save ${label}. Please try again.`);
      webViewRef.current?.postMessage(
        JSON.stringify({ type: 'DOWNLOAD_ERROR', payload: { filename } }),
      );
    } finally {
      setDownloading(null);
    }
  }, [ensureMediaPermission]);

  /* ── Handle messages arriving from the web page ── */
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    let msg: BridgeMessage;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return; // ignore non-JSON
    }

    switch (msg.type) {
      case 'WRAP_LOADED':
        // Web page finished loading its data — dismiss RN's own spinner
        setPageLoading(false);
        break;

      case 'WRAP_ERROR':
        setPageLoading(false);
        Alert.alert('Error', msg.payload.message ?? 'Failed to load wrap.');
        break;

      case 'DOWNLOAD_IMAGE': {
        const { imageUrl, filename, templateId, label } = msg.payload;
        setDownloading(templateId);
        downloadAndSave(imageUrl, filename, label);
        break;
      }

      case 'DOWNLOAD_ERROR':
        setDownloading(null);
        Alert.alert('Download Error', msg.payload.message ?? 'Failed to prepare image.');
        break;
    }
  }, [downloadAndSave]);

  /* ── Native share — just shares the URL so anyone can open the web wrap ── */
  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out my ${monthName} ${year} reading wrap on Bibliophile!`,
        url: `${WEB_BASE_URL}/wrap/${userDetails[0].userUniqueUserName}/${year}/${monthNumber}`,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  }, [monthNumber, year]);

  /* ── Inject JS that wires window.postMessage into ReactNativeWebView.postMessage ──
     This handles the reverse direction too: RN → Web messages posted via
     webViewRef.current?.postMessage() land in window as MessageEvent. ── */
  const INJECTED_JS = `
    (function() {
      // Patch outgoing messages: web → RN
      if (window.ReactNativeWebView) return; // already bridged (reload guard)

      // Override so existing postToRN() calls in the page just work
      // (ReactNativeWebView is injected by the WebView component itself,
      //  this block is just a safety no-op guard)
    })();
    true; // required by Android
  `;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primaryWhiteHex} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {monthName} {year} Wrap
        </Text>

        <TouchableOpacity onPress={handleShare} style={styles.shareButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="share-social-outline" size={20} color={COLORS.primaryWhiteHex} />
        </TouchableOpacity>
      </View>
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: wrapUrl }}
          style={styles.webView}
          onMessage={handleMessage}
          injectedJavaScript={INJECTED_JS}
          setSupportMultipleWindows={false}
          bounces={false}
          scrollEnabled
          androidLayerType="hardware"
          onLoadStart={() => setPageLoading(true)}
          onLoadEnd={() => {
            setTimeout(() => setPageLoading(false), 3500);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error:', nativeEvent);
            setPageLoading(false);
            Alert.alert('Connection Error', 'Could not load your wrap. Check your connection and try again.');
          }}
        />

        {/* RN loading overlay — shown until WRAP_LOADED fires */}
        {pageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
            <Text style={styles.loadingText}>Generating your wrap…</Text>
          </View>
        )}

        {(downloading || lastSavedLabel) && (
          <View style={styles.toast} pointerEvents="none">
            {downloading ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.toastText}>Saving to Photos…</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#96E6A1" style={{ marginRight: 6 }} />
                <Text style={[styles.toastText, { color: '#96E6A1' }]}>
                  {lastSavedLabel} saved!
                </Text>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default MonthlyWrapScreen;

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080810',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_16,
    paddingBottom: SPACING.space_12,
    backgroundColor: COLORS.primaryBlackHex,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    marginHorizontal: SPACING.space_8,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS.primaryDarkGreyHex,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primaryDarkGreyHex,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.space_16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  toast: {
    position: 'absolute',
    bottom: SPACING.space_24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8,8,16,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: BORDERRADIUS.radius_15,
    paddingVertical: SPACING.space_10,
    paddingHorizontal: SPACING.space_16,
  },
  toastText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
  },
});