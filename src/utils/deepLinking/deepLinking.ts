import * as Linking from 'expo-linking';
import { linking } from './linking';
import { navigate } from './navigationRef';

function matchPattern(path: string, pattern: string) {
  const paramNames: string[] = [];
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  if (pattern === ':*') {
    return { '*': normalizedPath };
  }
  
  // Convert pattern to regex: replace :param with a capture group
  const regexString =
    '^' +
    pattern
      .split('/')
      .map((segment) => {
        if (segment === '*') {
          // Match everything for asterisk wildcard
          paramNames.push('*');
          return '(.*)';
        }
        if (segment.startsWith(':')) {
          const isOptional = segment.endsWith('?');
          const name = segment.replace(':', '').replace('?', '');
          paramNames.push(name);
          return isOptional ? '([^/]+)?' : '([^/]+)';
        }
        return segment;
      })
      .join('/') +
    '$';

  const regex = new RegExp(regexString);
  const match = normalizedPath.match(regex);

  if (!match) return null;

  const values = match.slice(1);
  const params: Record<string, string | undefined> = {};
  paramNames.forEach((name, i) => {
    params[name] = values[i];
  });

  return params;
}

/**
 * Navigate from any raw URL (works for notifications, QR, etc.)
 */
export function navigateFromUrl(url: string) {
  try {
    if (!url) return;

    const parsed = Linking.parse(url);
    let { path, queryParams } = parsed;

    console.log('[DeepLink] Parsed URL:', parsed);

    // Handle custom schemes where hostname is part of the path
    if (parsed.hostname && parsed.scheme !== 'https' && parsed.scheme !== 'http') {
      path = parsed.hostname + (path ? `/${path}` : '');
    }

    if (!path) {
      console.warn('[DeepLink] No path found in URL:', url);
      navigate('Tab'); // fallback
      return;
    }

    const screens = (linking.config as any).screens;
    
    // Sort screens to check specific patterns before wildcards
    const sortedScreens = Object.entries(screens).sort(([, a], [, b]) => {
      const patternA = typeof a === 'string' ? a : (a as { path: string }).path;
      const patternB = typeof b === 'string' ? b : (b as { path: string }).path;
      
      // Wildcard patterns should be checked last
      if (patternA === ':*') return 1;
      if (patternB === ':*') return -1;
      return 0;
    });

    for (const [screenName, screenConfig] of sortedScreens) {
      const pattern = typeof screenConfig === 'string' ? screenConfig : (screenConfig as { path: string }).path;
      if (!pattern) continue;

      const pathParams = matchPattern(path, pattern);
      
      if (pathParams) {
        const params = { ...pathParams, ...queryParams };
        console.log(`[DeepLink] Navigating to ${screenName} with`, params);
        navigate(screenName, params);
        return;
      }
    }

    let fullUrl = url;
    if (!url.startsWith('http')) {
      const queryString = url.includes('?') ? url.substring(url.indexOf('?')) : '';
      fullUrl = `https://biblophile.com/${path}${queryString}`;
    }
    navigate('Resources', { url: fullUrl });
  } catch (err) {
    console.error('[DeepLink] Failed to handle URL:', url, err);
  }
}