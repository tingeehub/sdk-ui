import { isBrowser } from './dom-utils';

export type TingeeEnvironment = 'prod' | 'uat';

export const BANK_LINK_SCRIPT_URLS: Record<TingeeEnvironment, string> = {
  prod: 'https://bank-link.tingee.vn/js/tingee-bank-link.js',
  uat: 'https://uat-bank-link.tingee.vn/js/tingee-bank-link.js',
};

export const CHECKOUT_SCRIPT_URLS: Record<TingeeEnvironment, string> = {
  prod: 'https://payment-gateway.tingee.vn/js/tingee.js',
  uat: 'https://uat-payment-gateway.tingee.vn/js/tingee.js',
};

const scriptPromises = new Map<string, Promise<boolean>>();

/**
 * Detect environment ('uat' | 'prod') from a session/checkout URL or explicit environment string.
 */
export function detectEnvironment(
  envOrUrl?: TingeeEnvironment | string | null
): TingeeEnvironment {
  if (!envOrUrl) return 'prod';
  const lower = envOrUrl.toLowerCase();
  if (lower === 'uat' || lower.includes('uat-') || lower.includes('.uat.')) {
    return 'uat';
  }
  return 'prod';
}

/**
 * Inject a <script> tag into document.head once and return a Promise that resolves
 * to `true` when loaded, or `false` if network fails / times out (never rejects so fallback works).
 */
export function loadScriptOnce(src: string, timeoutMs = 3000): Promise<boolean> {
  if (!isBrowser()) {
    return Promise.resolve(false);
  }

  const existingPromise = scriptPromises.get(src);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = new Promise<boolean>((resolve) => {
    // Check if script tag already exists in DOM
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`
    );
    if (existingScript) {
      if (existingScript.getAttribute('data-tingee-loaded') === 'true') {
        resolve(true);
        return;
      }
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;

    const timer = setTimeout(() => {
      // Network is slow ("mạng lỏ") — resolve false so built-in fallback can open immediately
      resolve(false);
    }, timeoutMs);

    script.onload = () => {
      clearTimeout(timer);
      script.setAttribute('data-tingee-loaded', 'true');
      resolve(true);
    };

    script.onerror = () => {
      clearTimeout(timer);
      scriptPromises.delete(src);
      resolve(false);
    };

    document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}

/**
 * Preload `tingee-bank-link.js` in the background when a page/component using Bank Link mounts.
 */
export function preloadBankLinkScript(options?: {
  environment?: TingeeEnvironment;
  scriptUrl?: string;
  url?: string;
}): Promise<boolean> {
  if (!isBrowser()) return Promise.resolve(false);
  const env = detectEnvironment(options?.environment || options?.url);
  const src = options?.scriptUrl || BANK_LINK_SCRIPT_URLS[env];
  return loadScriptOnce(src);
}

/**
 * Preload `tingee.js` in the background when a page/component using Checkout mounts.
 */
export function preloadCheckoutScript(options?: {
  environment?: TingeeEnvironment;
  scriptUrl?: string;
  url?: string;
}): Promise<boolean> {
  if (!isBrowser()) return Promise.resolve(false);
  const env = detectEnvironment(options?.environment || options?.url);
  const src = options?.scriptUrl || CHECKOUT_SCRIPT_URLS[env];
  return loadScriptOnce(src);
}
