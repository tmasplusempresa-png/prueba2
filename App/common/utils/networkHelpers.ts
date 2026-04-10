/**
 * Helpers para manejar errores de red y requests fallidas
 */

export const fetchWithTimeout = async (url: string, options: any = {}, timeout: number = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

export const safeJsonParse = (text: string, defaultValue: any = {}) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn('JSON parse error:', e);
    return defaultValue;
  }
};

export const isNetworkError = (error: any): boolean => {
  const message = error?.message?.toLowerCase() || '';
  return (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    message.includes('enotfound') ||
    message.includes('econnrefused')
  );
};
