import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../theme/theme';
import { sanitizeHTML } from '../utils/wysiwyg/sanitize';

type WysiwygEditorProps = {
  value?: string;
  onChange?: (html: string) => void;
  maxChars?: number;
};

export function WysiwygEditor({
  value = '',
  onChange,
  maxChars = 5000,
}: WysiwygEditorProps) {
  const webviewRef = useRef<WebView>(null);

  // Inject sanitized HTML into WebView and make content editable
  const injectedJS = `
    document.body.innerHTML = \`${sanitizeHTML(value)}\`;
    document.body.contentEditable = true;
    document.body.style.backgroundColor = '${COLORS.primaryBlackHex}';
    document.body.style.color = '${COLORS.primaryWhiteHex}';
    document.body.style.padding = '12px';
    true;
  `;

  const runCommand = (cmd: string) => {
    webviewRef.current?.injectJavaScript(`
      document.execCommand("${cmd}");
      window.ReactNativeWebView.postMessage(document.body.innerHTML);
      true;
    `);
  };

  const applySpoiler = () => {
    webviewRef.current?.injectJavaScript(`
      const sel = window.getSelection();
      if (!sel.rangeCount) true;
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.setAttribute('data-spoiler', 'true');
      span.style.backgroundColor = '${COLORS.secondaryBlackRGBA}';
      span.style.color = '${COLORS.primaryBlackHex}';
      span.style.borderRadius = '4px';
      span.style.padding = '0 2px';
      span.style.transition = 'all 0.2s';
      span.appendChild(range.extractContents());
      range.insertNode(span);
      window.ReactNativeWebView.postMessage(document.body.innerHTML);
      true;
    `);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Toolbar */}
      <ScrollView horizontal style={styles.toolbar} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={styles.btn} onPress={() => runCommand('bold')}>
          <Text style={styles.btnText}>B</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => runCommand('italic')}>
          <Text style={styles.btnText}>I</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => runCommand('strikeThrough')}>
          <Text style={styles.btnText}>S</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => runCommand('insertUnorderedList')}>
          <Text style={styles.btnText}>• List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => runCommand('insertOrderedList')}>
          <Text style={styles.btnText}>1. List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={applySpoiler}>
          <Text style={styles.btnText}>Spoiler</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Editor WebView */}
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: `<html><body></body></html>` }}
        injectedJavaScript={injectedJS}
        onMessage={event => onChange?.(event.nativeEvent.data)}
        style={{ flex: 1, backgroundColor: COLORS.primaryBlackHex }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    padding: SPACING.space_8,
    backgroundColor: COLORS.primaryGreyHex,
  },
  btn: {
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    marginRight: SPACING.space_8,
  },
  btnText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
  },
});