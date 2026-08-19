import React from 'react';
import { Text, TextProps } from 'react-native';

/**
 * Temporary workaround for a React Native Android text rendering bug
 * (RN issue #53286) where text can get horizontally clipped on Android 15+.
 *
 * Appending a trailing space to plain string children prevents the clipping
 * without affecting the visible UI. Remove this component and switch back to
 * <Text> once the React Native version containing the upstream fix is adopted.
 */
export const SafeText = ({
  children,
  ...props
}: React.PropsWithChildren<TextProps>) => (
  <Text {...props}>
    {typeof children === 'string' ? `${children} ` : children}
  </Text>
);