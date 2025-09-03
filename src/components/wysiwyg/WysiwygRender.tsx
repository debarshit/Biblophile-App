import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import RenderHtml, { HTMLContentModel } from 'react-native-render-html';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../theme/theme';

type WysiwygRenderProps = {
  html: string;
  maxWidth?: number;
};

export function WysiwygRender({ html, maxWidth = 400 }: WysiwygRenderProps) {
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [processedHtml, setProcessedHtml] = useState<string>('');

  useEffect(() => {
    // Reset revealed spoilers when HTML content changes
    setRevealedIds(new Set());
    
    // Process HTML to add unique IDs to spoiler elements
    let idCounter = 0;
    const content = html.replace(/<([^>]*data-spoiler="true"[^>]*)>/g, (match, attributes) => {
      const currentId = idCounter++;
      if (attributes.includes('data-id=')) {
        // Replace existing data-id
        return `<${attributes.replace(/data-id="[^"]*"/, `data-id="${currentId}"`)}>`;
      } else {
        // Add new data-id
        return `<${attributes} data-id="${currentId}">`;
      }
    });
    
    setProcessedHtml(content);
  }, [html]);

  const renderers = {
    span: ({ TDefaultRenderer, ...props }: any) => {
      const attributes = props?.tnode?.attributes || {};
      const id = Number(attributes['data-id']);
      const isSpoiler = attributes['data-spoiler'] === 'true';
      
      if (!isSpoiler) return <TDefaultRenderer {...props} />;
      
      const revealed = revealedIds.has(id);
      const textContent = props?.tnode?.children?.[0]?.data || '';

      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setRevealedIds(prev => {
              const newSet = new Set(prev);
              if (revealed) {
                newSet.delete(id);
              } else {
                newSet.add(id);
              }
              return newSet;
            });
          }}
          style={styles.spoilerContainer}
        >
          <Text
            style={[
              styles.spoiler,
              revealed && styles.revealed,
            ]}
          >
            {textContent}
          </Text>
        </TouchableOpacity>
      );
    },
  };

  return (
    <View style={styles.container}>
      <RenderHtml
        contentWidth={maxWidth}
        source={{ html: processedHtml }}
        tagsStyles={tagsStyles}
        renderers={renderers}
        defaultTextProps={{
          selectable: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryBlackHex,
  },
  spoilerContainer: {
    alignSelf: 'flex-start',
  },
  spoiler: {
    backgroundColor: COLORS.secondaryBlackRGBA,
    color: 'transparent', // Hide text initially like blur effect
    borderRadius: BORDERRADIUS.radius_4,
    paddingHorizontal: SPACING.space_4,
    paddingVertical: SPACING.space_2,
    textShadow: '0px 0px 5px rgba(255,255,255,0.5)', // Simulate blur effect
    minWidth: 20,
    minHeight: 20,
  },
  revealed: {
    backgroundColor: COLORS.primaryOrangeHex,
    color: COLORS.primaryBlackHex,
    textShadow: 'none',
  },
});

const tagsStyles = {
  body: {
    backgroundColor: COLORS.primaryBlackHex,
    color: COLORS.primaryWhiteHex,
  },
  p: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    marginBottom: SPACING.space_16,
    lineHeight: FONTSIZE.size_14 * 1.5,
  },
  h1: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_28,
    marginTop: SPACING.space_24,
    marginBottom: SPACING.space_16,
  },
  h2: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_24,
    marginTop: SPACING.space_16,
    marginBottom: SPACING.space_12,
  },
  blockquote: {
    color: COLORS.primaryBlackHex,
    backgroundColor: '#f9f9f9',
    fontStyle: 'italic',
    paddingLeft: SPACING.space_16,
    paddingRight: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryOrangeHex,
    borderTopRightRadius: BORDERRADIUS.radius_8,
    borderBottomRightRadius: BORDERRADIUS.radius_8,
    marginVertical: SPACING.space_8,
  },
  ul: {
    paddingLeft: SPACING.space_24,
    marginBottom: SPACING.space_16,
  },
  ol: {
    paddingLeft: SPACING.space_24,
    marginBottom: SPACING.space_16,
  },
  li: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    marginBottom: SPACING.space_4,
    lineHeight: FONTSIZE.size_14 * 1.4,
  },
  strong: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  em: {
    fontStyle: 'italic',
  },
  s: {
    textDecorationLine: 'line-through',
    color: COLORS.secondaryLightGreyHex,
  },
  del: {
    textDecorationLine: 'line-through',
    color: COLORS.secondaryLightGreyHex,
  },
  strike: {
    textDecorationLine: 'line-through',
    color: COLORS.secondaryLightGreyHex,
  },
};