import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import RenderHtml, { HTMLContentModel } from 'react-native-render-html';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../theme/theme';

type WysiwygRenderProps = {
  html: string;
  maxWidth?: number;
};

export function WysiwygRender({ html, maxWidth = 400 }: WysiwygRenderProps) {
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());

  // Wrap spoiler with unique ID
  const content = html.replace(/<span data-spoiler="true">/g, (_, i) => {
    return `<span data-spoiler="true" data-id="${i}">`;
  });

  const renderers = {
    span: ({ TDefaultRenderer, ...props }: any) => {
      const id = Number(props?.tnode?.attributes['data-id']);
      const isSpoiler = props?.tnode?.attributes['data-spoiler'] === 'true';
      if (!isSpoiler) return <TDefaultRenderer {...props} />;
      const revealed = revealedIds.has(id);

      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setRevealedIds(prev => {
              const copy = new Set(prev);
              if (revealed) copy.delete(id);
              else copy.add(id);
              return copy;
            });
          }}
        >
          <Text
            style={[
              styles.spoiler,
              revealed ? styles.revealed : {},
            ]}
          >
            {props?.tnode?.children[0]?.data || ''}
          </Text>
        </TouchableOpacity>
      );
    },
  };

  return (
    <View>
      <RenderHtml
        contentWidth={maxWidth}
        source={{ html: content }}
        tagsStyles={styles.tagsStyles}
        renderers={renderers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  spoiler: {
    backgroundColor: COLORS.secondaryBlackRGBA,
    color: COLORS.primaryBlackHex,
    borderRadius: BORDERRADIUS.radius_4,
    paddingHorizontal: SPACING.space_2,
  },
  revealed: {
    backgroundColor: COLORS.primaryOrangeHex,
    color: COLORS.primaryBlackHex,
  },
  tagsStyles: {
    p: { color: COLORS.primaryWhiteHex, fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_14, marginBottom: SPACING.space_8 },
    h1: { color: COLORS.primaryWhiteHex, fontFamily: FONTFAMILY.poppins_bold, fontSize: FONTSIZE.size_28, marginVertical: SPACING.space_12 },
    h2: { color: COLORS.primaryWhiteHex, fontFamily: FONTFAMILY.poppins_semibold, fontSize: FONTSIZE.size_24, marginVertical: SPACING.space_10 },
    blockquote: { color: COLORS.primaryOrangeHex, fontStyle: 'italic', paddingLeft: SPACING.space_8, borderLeftWidth: 4, borderLeftColor: COLORS.primaryOrangeHex },
    li: { color: COLORS.primaryWhiteHex, fontFamily: FONTFAMILY.poppins_regular, fontSize: FONTSIZE.size_14, marginBottom: SPACING.space_4 },
  },
});