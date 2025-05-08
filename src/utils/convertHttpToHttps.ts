/**
 * Converts a URL from HTTP to HTTPS if it starts with 'http://'.
 * @param url - The URL to convert.
 * @returns The URL with 'https://' if originally 'http://', otherwise returns the original URL.
 */
export const convertHttpToHttps = (url: string): string => {
    return url && url.startsWith('http://') 
      ? url.replace('http://', 'https://') 
      : url;
  };
  