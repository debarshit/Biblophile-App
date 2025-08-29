import * as Linking from 'expo-linking';
import { linking } from './linking';
import { navigate } from './navigationRef';

function matchPattern(path: string, pattern: string) {
  const paramNames: string[] = [];

  // Convert pattern to regex: replace :param with a capture group
  const regexString =
    '^' +
    pattern
      .split('/')
      .map((segment) => {
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
  const match = path.match(regex);

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
    const { path, queryParams } = parsed;

    console.log('[DeepLink] Parsed URL:', parsed);

    if (!path) {
      console.warn('[DeepLink] No path found in URL:', url);
      navigate('Tab'); // fallback
      return;
    }

    const screens = (linking.config as any).screens;

    for (const [screenName, screenConfig] of Object.entries(screens)) {
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

    // Fallback if no match
    console.warn('[DeepLink] No route match for', path);
    navigate('Tab');
  } catch (err) {
    console.error('[DeepLink] Failed to handle URL:', url, err);
  }
}