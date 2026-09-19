import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { ReadingTwinStoryTemplateProps, StoryVariant } from './readingTwinStory/types';
import VariantACircles from './readingTwinStory/VariantACircles';
import VariantBMinimal from './readingTwinStory/VariantBMinimal';
import VariantCGradientSticker from './readingTwinStory/VariantCGradientSticker';

export type { StoryVariant, ReadingTwinStoryTemplateProps };

/**
 * ============================================================================
 * A/B/C TEST CONFIGURATION
 * ============================================================================
 * Set ACTIVE_WINNER to lock in a winner once testing concludes:
 * - null: Dynamic A/B/C variant assigned via props / PostHog (Active Test)
 * - 'variant_a_circles': Lock to Variant A (Glow Circles)
 * - 'variant_b_minimal': Lock to Variant B (Dark Editorial Minimalist)
 * - 'variant_c_gradient_sticker': Lock to Variant C (Gradient + Sticker)
 *
 * TO REMOVE LOSERS LATER:
 * Simply set ACTIVE_WINNER below, or delete the 2 losing files in
 * src/components/readingTwinStory/ and return the winner directly.
 * ============================================================================
 */
export const ACTIVE_WINNER: StoryVariant | null = null;

const ReadingTwinStoryTemplate = forwardRef<View, ReadingTwinStoryTemplateProps>(
  (props, ref) => {
    const activeVariant: StoryVariant =
      ACTIVE_WINNER || props.variant || 'variant_c_gradient_sticker';

    switch (activeVariant) {
      case 'variant_a_circles':
        return <VariantACircles ref={ref} {...props} />;
      case 'variant_b_minimal':
        return <VariantBMinimal ref={ref} {...props} />;
      case 'variant_c_gradient_sticker':
      default:
        return <VariantCGradientSticker ref={ref} {...props} />;
    }
  }
);

export default ReadingTwinStoryTemplate;
