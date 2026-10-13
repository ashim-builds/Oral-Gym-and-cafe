import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Platform,
  ImageResizeMode,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { resolveImageUrl } from '../services/image.service';

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: StyleProp<ViewStyle | ImageStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  aspectRatio?: number;
  fallbackUri?: string;
  borderRadius?: number;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  imageStyle,
  resizeMode = 'cover',
  aspectRatio,
  fallbackUri,
  borderRadius,
  fallbackIcon = 'barbell-outline',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  // Determine actual image source
  let effectiveSource: any = null;
  if (typeof source === 'number') {
    effectiveSource = source;
  } else if (typeof source === 'object' && source !== null && 'uri' in source) {
    const rawUri = source.uri?.trim();
    if (rawUri) {
      const resolved = resolveImageUrl(rawUri);
      if (resolved) {
        effectiveSource = { uri: resolved };
      }
    } else if (fallbackUri?.trim()) {
      const resolvedFallback = resolveImageUrl(fallbackUri.trim());
      if (resolvedFallback) {
        effectiveSource = { uri: resolvedFallback };
      }
    }
  }

  // Pulse skeleton loop while image is loading
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isLoading && effectiveSource && !hasError) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.75,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    }

    return () => {
      if (loop) loop.stop();
    };
  }, [isLoading, effectiveSource, hasError, pulseAnim]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const webProps =
    Platform.OS === 'web'
      ? {
          loading: 'lazy' as const,
          decoding: 'async' as const,
        }
      : {};

  const containerStyle: any = [
    styles.container,
    aspectRatio ? { aspectRatio } : null,
    borderRadius !== undefined ? { borderRadius, overflow: 'hidden' } : null,
    style,
  ];

  const showPlaceholder = !effectiveSource || hasError;

  return (
    <View style={containerStyle}>
      {/* Animated Skeleton Pulse Placeholder */}
      {isLoading && !showPlaceholder && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.skeleton,
            { opacity: pulseAnim },
            borderRadius !== undefined ? { borderRadius } : null,
          ]}
        />
      )}

      {/* Main Image */}
      {!showPlaceholder ? (
        <Image
          source={effectiveSource}
          style={[
            styles.image,
            imageStyle,
            borderRadius !== undefined ? { borderRadius } : null,
          ]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          {...webProps}
        />
      ) : (
        <View style={styles.fallbackContainer}>
          <Ionicons name={fallbackIcon as any} size={24} color={COLORS.textMuted} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#161616',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeleton: {
    backgroundColor: '#262626',
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1b1d22',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OptimizedImage;

