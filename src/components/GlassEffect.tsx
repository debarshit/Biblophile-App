import React from 'react';
import { View, StyleSheet, Platform, ViewProps, ViewStyle, StyleProp } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, GlassStyle } from 'expo-glass-effect';
import { BlurView, BlurTint } from 'expo-blur';

export interface GlassEffectProps extends ViewProps {
  glassStyle?: GlassStyle;
  isInteractive?: boolean;
  intensity?: number;
  tint?: BlurTint;
  borderRadius?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const isLiquidGlassSupported = () => {
  return Platform.OS === 'ios' && typeof isGlassEffectAPIAvailable === 'function' && isGlassEffectAPIAvailable();
};

export const GlassEffect: React.FC<GlassEffectProps> = ({
  glassStyle = 'clear',
  isInteractive = true,
  intensity = 35,
  tint = 'dark',
  borderRadius = 0,
  children,
  style,
  ...rest
}) => {
  const supportsGlass = isLiquidGlassSupported();

  if (supportsGlass) {
    return (
      <GlassView
        glassEffectStyle={glassStyle}
        isInteractive={isInteractive}
        colorScheme="auto"
        style={[{ borderRadius, overflow: 'hidden' }, style]}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[{ borderRadius, overflow: 'hidden' }, style]}
      {...rest}
    >
      {children}
    </BlurView>
  );
};

export const GlassBackground: React.FC<GlassEffectProps> = ({
  glassStyle = 'clear',
  isInteractive = true,
  intensity = 25,
  tint = 'dark',
  style,
}) => {
  const supportsGlass = isLiquidGlassSupported();

  if (supportsGlass) {
    return (
      <GlassView
        glassEffectStyle={glassStyle}
        isInteractive={isInteractive}
        colorScheme="auto"
        style={[StyleSheet.absoluteFillObject, style]}
      />
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: 'rgba(12, 15, 20, 0.45)' },
        style,
      ]}
    />
  );
};

export default GlassEffect;