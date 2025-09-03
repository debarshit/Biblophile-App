import React, { useRef, useState, useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../theme/theme';
import { sanitizeHTML } from '../../utils/wysiwyg/sanitize';

type WysiwygEditorProps = {
  value?: string;
  onChange?: (html: string) => void;
  maxChars?: number;
  style?: any;
};

export function WysiwygEditor({ value = '', onChange, maxChars = 5000 }: WysiwygEditorProps) {
  const webviewRef = useRef<WebView>(null);
  const [html, setHtml] = useState<string>(sanitizeHTML(value));
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});
  const remaining = useMemo(() => Math.max(0, maxChars - html.replace(/<[^>]*>/g, '').length), [html, maxChars]);

  const injectedJS = `
    document.body.innerHTML = \`${sanitizeHTML(value) || '<p><br/></p>'}\`;
    document.body.contentEditable = true;
    Object.assign(document.body.style, {
      backgroundColor: '${COLORS.primaryBlackHex}', color: '${COLORS.primaryWhiteHex}',
      padding: '12px', minHeight: '300px', outline: 'none', fontSize: '14px',
      lineHeight: '1.6', fontFamily: 'system-ui, -apple-system, sans-serif', margin: '0'
    });

    const style = document.createElement('style');
    style.textContent = \`
      h1 { font-size: 24px; font-weight: bold; margin: 24px 0 16px 0; color: ${COLORS.primaryWhiteHex}; }
      h2 { font-size: 20px; font-weight: 600; margin: 16px 0 12px 0; color: ${COLORS.primaryWhiteHex}; }
      blockquote { border-left: 4px solid ${COLORS.primaryOrangeHex}; padding: 8px 0 8px 16px; margin: 16px 0; font-style: italic; background: rgba(255,255,255,0.1); border-radius: 0 8px 8px 0; }
      ul, ol { padding-left: 24px; margin: 16px 0; } li { margin: 4px 0; } p { margin: 16px 0; }
      strong { font-weight: 600; } em { font-style: italic; } s, del, strike { text-decoration: line-through; color: rgba(255,255,255,0.6); }
      [data-spoiler] { filter: blur(4px); background: rgba(0,0,0,0.3); border-radius: 4px; padding: 0 4px; cursor: pointer; transition: all 0.2s; }
      [data-spoiler].revealed { filter: none; background: rgba(255,255,0,0.2); color: ${COLORS.primaryBlackHex}; }
    \`;
    document.head.appendChild(style);

    function toggleBlock(tag) {
      const current = document.queryCommandValue('formatBlock').toLowerCase();
      document.execCommand('formatBlock', false, current === tag.toLowerCase() ? 'P' : tag);
      updateActiveStates(); postContent();
    }
    function inline(cmd) { document.execCommand(cmd); updateActiveStates(); postContent(); }
    function clearFormatting() { document.execCommand('removeFormat'); document.execCommand('formatBlock', false, 'P'); updateActiveStates(); postContent(); }
    function applySpoiler() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (range.collapsed) return;
      
      let parent = range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentElement : range.commonAncestorContainer;
      let spoilerSpan = null, current = parent;
      while (current && current !== document.body) {
        if (current.hasAttribute && current.hasAttribute('data-spoiler')) { spoilerSpan = current; break; }
        current = current.parentElement;
      }
      
      if (spoilerSpan) {
        const fragment = document.createDocumentFragment();
        while (spoilerSpan.firstChild) fragment.appendChild(spoilerSpan.firstChild);
        spoilerSpan.parentNode.replaceChild(fragment, spoilerSpan);
        selection.removeAllRanges(); postContent(); return;
      }
      
      try {
        const contents = range.extractContents();
        const spoilerEl = document.createElement('span');
        spoilerEl.setAttribute('data-spoiler', 'true');
        spoilerEl.appendChild(contents);
        range.insertNode(spoilerEl);
        selection.removeAllRanges(); postContent();
      } catch (error) { console.warn('Spoiler application failed:', error); }
    }
    
    function updateActiveStates() {
      const states = {
        bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), strike: document.queryCommandState('strikeThrough'),
        h1: document.queryCommandValue('formatBlock').toLowerCase() === 'h1', h2: document.queryCommandValue('formatBlock').toLowerCase() === 'h2',
        blockquote: document.queryCommandValue('formatBlock').toLowerCase() === 'blockquote',
        ul: document.queryCommandState('insertUnorderedList'), ol: document.queryCommandState('insertOrderedList'),
      };
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'activeStates', data: states }));
    }
    function postContent() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'content', data: document.body.innerHTML }));
    }
    
    document.body.addEventListener('click', e => { if (e.target.hasAttribute('data-spoiler')) e.target.classList.toggle('revealed'); });
    document.body.addEventListener('input', postContent);
    document.addEventListener('selectionchange', updateActiveStates);
    
    window.toggleBlock = toggleBlock; window.inline = inline; window.clearFormatting = clearFormatting; window.applySpoiler = applySpoiler;
    updateActiveStates(); true;
  `;

  const runJS = (js: string) => webviewRef.current?.injectJavaScript(js);
  
  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'content') {
        const cleanHtml = sanitizeHTML(message.data);
        setHtml(cleanHtml); onChange?.(cleanHtml);
      } else if (message.type === 'activeStates') setActiveStates(message.data);
    } catch (error) {
      const cleanHtml = sanitizeHTML(event.nativeEvent.data);
      setHtml(cleanHtml); onChange?.(cleanHtml);
    }
  };

  const getStyle = (isActive?: boolean) => [styles.btn, isActive && styles.btnActive];
  const getTextStyle = (isActive?: boolean) => [styles.btnText, isActive && styles.btnTextActive];

  const buttons = [
    [
      { text: 'B', active: activeStates.bold, onPress: () => runJS('window.inline("bold");') },
      { text: 'I', active: activeStates.italic, onPress: () => runJS('window.inline("italic");'), style: { fontStyle: 'italic' } },
      { text: 'S', active: activeStates.strike, onPress: () => runJS('window.inline("strikeThrough");'), style: { textDecorationLine: 'line-through' } },
      { text: 'H1', active: activeStates.h1, onPress: () => runJS('window.toggleBlock("H1");') },
      { text: 'H2', active: activeStates.h2, onPress: () => runJS('window.toggleBlock("H2");') },
    ],
    [
      { text: 'Quote', active: activeStates.blockquote, onPress: () => runJS('window.toggleBlock("BLOCKQUOTE");') },
      { text: '• List', active: activeStates.ul, onPress: () => runJS('window.inline("insertUnorderedList");') },
      { text: '1. List', active: activeStates.ol, onPress: () => runJS('window.inline("insertOrderedList");') },
      { text: 'Spoiler', onPress: () => runJS('window.applySpoiler();') },
      { text: 'Clear', onPress: () => runJS('window.clearFormatting();') },
    ]
  ];

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        {buttons.map((row, i) => (
          <View key={i} style={styles.toolbarRow}>
            {row.map(({ text, active, onPress, style }) => (
              <TouchableOpacity key={text} style={getStyle(active)} onPress={onPress}>
                <Text style={[getTextStyle(active), style]}>{text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
      
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>` }}
        injectedJavaScript={injectedJS}
        onMessage={handleMessage}
        style={styles.webview}
        showsVerticalScrollIndicator={false}
      />
      
      <View style={styles.footer}>
        <Text style={styles.charCount}>{remaining} chars left</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 400, borderRadius: BORDERRADIUS.radius_10, borderWidth: 1, borderColor: COLORS.primaryGreyHex, overflow: 'hidden' },
  toolbar: { padding: SPACING.space_8, backgroundColor: COLORS.primaryGreyHex, borderBottomWidth: 1, borderBottomColor: COLORS.primaryGreyHex },
  toolbarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.space_4 },
  btn: { flex: 1, paddingVertical: SPACING.space_8, backgroundColor: COLORS.primaryGreyHex, borderRadius: BORDERRADIUS.radius_8, marginHorizontal: 1, borderWidth: 1, borderColor: COLORS.primaryGreyHex, alignItems: 'center', justifyContent: 'center' },
  btnActive: { backgroundColor: COLORS.primaryOrangeHex, borderColor: COLORS.primaryOrangeHex },
  btnText: { color: COLORS.secondaryLightGreyHex, fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_12, textAlign: 'center' },
  btnTextActive: { color: COLORS.secondaryDarkGreyHex },
  webview: { flex: 1, backgroundColor: COLORS.primaryBlackHex },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: SPACING.space_8, paddingVertical: SPACING.space_4, backgroundColor: COLORS.primaryGreyHex, borderTopWidth: 1, borderTopColor: COLORS.primaryGreyHex },
  charCount: { color: COLORS.secondaryLightGreyHex, fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_12 },
});