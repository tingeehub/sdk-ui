import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  TingeeBankLinkInstance,
  preloadBankLinkScript,
  preloadCheckoutScript,
  type TingeeBankLinkConfig,
  type TingeeBankLinkResultPayload,
  type TingeeCheckoutConfig,
  type TingeeCheckoutResultPayload,
  TingeeCheckoutInstance,
  type TingeeThemeConfig,
} from '../index';

export interface UseTingeeBankLinkOptions extends TingeeBankLinkConfig {
  /**
   * Automatically close the popup if the React component unmounts while open.
   * Default: true.
   */
  closeOnUnmount?: boolean;
}

export interface UseTingeeBankLinkReturn {
  /**
   * Open the Bank Link popup (or inline container if configured).
   */
  open: (url: string, overrideOptions?: TingeeBankLinkConfig) => TingeeBankLinkInstance;
  /**
   * Open the Bank Link popup and return a Promise that resolves with the result payload.
   */
  openAsync: (
    url: string,
    overrideOptions?: TingeeBankLinkConfig
  ) => Promise<TingeeBankLinkResultPayload>;
  /**
   * Open the Account Configuration flow (`resultAction: 'account-config-register'`).
   */
  openAccountConfig: (
    url: string,
    overrideOptions?: TingeeBankLinkConfig
  ) => TingeeBankLinkInstance;
  /**
   * Open the Account Configuration flow and return a Promise that resolves with the result payload.
   */
  openAccountConfigAsync: (
    url: string,
    overrideOptions?: TingeeBankLinkConfig
  ) => Promise<TingeeBankLinkResultPayload>;
  /**
   * Close the currently active Bank Link instance opened by this hook.
   */
  close: () => void;
  /**
   * Whether the Bank Link modal/iframe opened by this hook is currently open.
   */
  isOpen: boolean;
}

/**
 * React Hook for Tingee Bank Link UI SDK.
 */
export function useTingeeBankLink(
  defaultOptions: UseTingeeBankLinkOptions = {}
): UseTingeeBankLinkReturn {
  const [isOpen, setIsOpen] = useState(false);
  const instanceRef = useRef<TingeeBankLinkInstance | null>(null);
  const optionsRef = useRef<UseTingeeBankLinkOptions>(defaultOptions);
  optionsRef.current = defaultOptions;

  const close = useCallback(() => {
    if (instanceRef.current) {
      instanceRef.current.close();
      instanceRef.current = null;
      setIsOpen(false);
    }
  }, []);

  const open = useCallback(
    (url: string, overrideOptions: TingeeBankLinkConfig = {}): TingeeBankLinkInstance => {
      if (instanceRef.current) {
        instanceRef.current.close();
      }

      const currentDefaults = optionsRef.current;
      const merged: TingeeBankLinkConfig = {
        ...currentDefaults,
        ...overrideOptions,
      };

      const instance = new TingeeBankLinkInstance({
        ...merged,
        url,
        onSuccess: (data) => {
          overrideOptions.onSuccess
            ? overrideOptions.onSuccess(data)
            : optionsRef.current.onSuccess?.(data);
        },
        onFailed: (data) => {
          overrideOptions.onFailed
            ? overrideOptions.onFailed(data)
            : optionsRef.current.onFailed?.(data);
        },
        onCancelled: (data) => {
          overrideOptions.onCancelled
            ? overrideOptions.onCancelled(data)
            : optionsRef.current.onCancelled?.(data);
        },
        onError: (data) => {
          overrideOptions.onError
            ? overrideOptions.onError(data)
            : optionsRef.current.onError?.(data);
        },
        onClose: () => {
          setIsOpen(false);
          instanceRef.current = null;
          overrideOptions.onClose
            ? overrideOptions.onClose()
            : optionsRef.current.onClose?.();
        },
      });

      instanceRef.current = instance;
      setIsOpen(true);
      return instance.open();
    },
    []
  );

  const openAsync = useCallback(
    (
      url: string,
      overrideOptions: TingeeBankLinkConfig = {}
    ): Promise<TingeeBankLinkResultPayload> => {
      return new Promise((resolve) => {
        let settled = false;
        const settle = (res: TingeeBankLinkResultPayload) => {
          if (!settled) {
            settled = true;
            resolve(res);
          }
        };

        open(url, {
          ...overrideOptions,
          onSuccess: (data) => {
            overrideOptions.onSuccess
              ? overrideOptions.onSuccess(data)
              : optionsRef.current.onSuccess?.(data);
            settle(data);
          },
          onFailed: (data) => {
            overrideOptions.onFailed
              ? overrideOptions.onFailed(data)
              : optionsRef.current.onFailed?.(data);
            settle(data);
          },
          onCancelled: (data) => {
            overrideOptions.onCancelled
              ? overrideOptions.onCancelled(data)
              : optionsRef.current.onCancelled?.(data);
            settle(data);
          },
          onError: (data) => {
            overrideOptions.onError
              ? overrideOptions.onError(data)
              : optionsRef.current.onError?.(data);
            settle(data);
          },
          onClose: () => {
            overrideOptions.onClose
              ? overrideOptions.onClose()
              : optionsRef.current.onClose?.();
            settle({ status: 'cancelled', errorCode: 'USER_CLOSED' });
          },
        });
      });
    },
    [open]
  );

  const openAccountConfig = useCallback(
    (url: string, overrideOptions: TingeeBankLinkConfig = {}): TingeeBankLinkInstance => {
      return open(url, {
        ...overrideOptions,
        resultAction: 'account-config-register',
      });
    },
    [open]
  );

  const openAccountConfigAsync = useCallback(
    (
      url: string,
      overrideOptions: TingeeBankLinkConfig = {}
    ): Promise<TingeeBankLinkResultPayload> => {
      return openAsync(url, {
        ...overrideOptions,
        resultAction: 'account-config-register',
      });
    },
    [openAsync]
  );

  useEffect(() => {
    if (optionsRef.current.preloadScript !== false) {
      void preloadBankLinkScript({
        environment: optionsRef.current.environment,
        scriptUrl: optionsRef.current.scriptUrl,
      });
    }
    return () => {
      if (optionsRef.current.closeOnUnmount !== false && instanceRef.current) {
        instanceRef.current.close();
        instanceRef.current = null;
      }
    };
  }, []);

  return {
    open,
    openAsync,
    openAccountConfig,
    openAccountConfigAsync,
    close,
    isOpen,
  };
}

export interface UseTingeeCheckoutOptions extends TingeeCheckoutConfig {
  /**
   * Automatically close the popup if the React component unmounts while open.
   * Default: true.
   */
  closeOnUnmount?: boolean;
}

export interface UseTingeeCheckoutReturn {
  /**
   * Open the Payment Gateway Checkout popup.
   */
  open: (url: string, overrideOptions?: TingeeCheckoutConfig) => TingeeCheckoutInstance;
  /**
   * Open the Payment Gateway Checkout popup and return a Promise that resolves with the result payload.
   */
  openAsync: (
    url: string,
    overrideOptions?: TingeeCheckoutConfig
  ) => Promise<TingeeCheckoutResultPayload>;
  /**
   * Close the currently active Checkout instance opened by this hook.
   */
  close: () => void;
  /**
   * Whether the Checkout modal/iframe opened by this hook is currently open.
   */
  isOpen: boolean;
}

/**
 * React Hook for Tingee Payment Gateway Checkout UI SDK.
 */
export function useTingeeCheckout(
  defaultOptions: UseTingeeCheckoutOptions = {}
): UseTingeeCheckoutReturn {
  const [isOpen, setIsOpen] = useState(false);
  const instanceRef = useRef<TingeeCheckoutInstance | null>(null);
  const optionsRef = useRef<UseTingeeCheckoutOptions>(defaultOptions);
  optionsRef.current = defaultOptions;

  const close = useCallback(() => {
    if (instanceRef.current) {
      instanceRef.current.close();
      instanceRef.current = null;
      setIsOpen(false);
    }
  }, []);

  const open = useCallback(
    (url: string, overrideOptions: TingeeCheckoutConfig = {}): TingeeCheckoutInstance => {
      if (instanceRef.current) {
        instanceRef.current.close();
      }

      const currentDefaults = optionsRef.current;
      const merged: TingeeCheckoutConfig = {
        ...currentDefaults,
        ...overrideOptions,
      };

      const instance = new TingeeCheckoutInstance({
        ...merged,
        url,
        onSuccess: (data) => {
          overrideOptions.onSuccess
            ? overrideOptions.onSuccess(data)
            : optionsRef.current.onSuccess?.(data);
        },
        onFailed: (data) => {
          overrideOptions.onFailed
            ? overrideOptions.onFailed(data)
            : optionsRef.current.onFailed?.(data);
        },
        onCancelled: (data) => {
          overrideOptions.onCancelled
            ? overrideOptions.onCancelled(data)
            : optionsRef.current.onCancelled?.(data);
        },
        onError: (data) => {
          overrideOptions.onError
            ? overrideOptions.onError(data)
            : optionsRef.current.onError?.(data);
        },
        onClose: () => {
          setIsOpen(false);
          instanceRef.current = null;
          overrideOptions.onClose
            ? overrideOptions.onClose()
            : optionsRef.current.onClose?.();
        },
      });

      instanceRef.current = instance;
      setIsOpen(true);
      return instance.open();
    },
    []
  );

  const openAsync = useCallback(
    (
      url: string,
      overrideOptions: TingeeCheckoutConfig = {}
    ): Promise<TingeeCheckoutResultPayload> => {
      return new Promise((resolve) => {
        let settled = false;
        const settle = (res: TingeeCheckoutResultPayload) => {
          if (!settled) {
            settled = true;
            resolve(res);
          }
        };

        open(url, {
          ...overrideOptions,
          onSuccess: (data) => {
            overrideOptions.onSuccess
              ? overrideOptions.onSuccess(data)
              : optionsRef.current.onSuccess?.(data);
            settle(data);
          },
          onFailed: (data) => {
            overrideOptions.onFailed
              ? overrideOptions.onFailed(data)
              : optionsRef.current.onFailed?.(data);
            settle(data);
          },
          onCancelled: (data) => {
            overrideOptions.onCancelled
              ? overrideOptions.onCancelled(data)
              : optionsRef.current.onCancelled?.(data);
            settle(data);
          },
          onError: (data) => {
            overrideOptions.onError
              ? overrideOptions.onError(data)
              : optionsRef.current.onError?.(data);
            settle(data);
          },
          onClose: () => {
            overrideOptions.onClose
              ? overrideOptions.onClose()
              : optionsRef.current.onClose?.();
            settle({ status: 'cancelled', errorCode: 'USER_CLOSED' });
          },
        });
      });
    },
    [open]
  );

  useEffect(() => {
    if (optionsRef.current.preloadScript !== false) {
      void preloadCheckoutScript({
        environment: optionsRef.current.environment,
        scriptUrl: optionsRef.current.scriptUrl,
      });
    }
    return () => {
      if (optionsRef.current.closeOnUnmount !== false && instanceRef.current) {
        instanceRef.current.close();
        instanceRef.current = null;
      }
    };
  }, []);

  return {
    open,
    openAsync,
    close,
    isOpen,
  };
}

export interface TingeeBankLinkEmbedProps
  extends Pick<
    TingeeBankLinkConfig,
    'theme' | 'resultAction' | 'onSuccess' | 'onFailed' | 'onCancelled' | 'onError' | 'onClose'
  > {
  /**
   * Secure Bank Link Session URL returned by Tingee OpenAPI.
   */
  url: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Inline Embed Component for Tingee Bank Link UI SDK.
 * Renders the Bank Link iframe directly inside a managed container element.
 */
export function TingeeBankLinkEmbed({
  url,
  theme,
  resultAction,
  onSuccess,
  onFailed,
  onCancelled,
  onError,
  onClose,
  className,
  style,
}: TingeeBankLinkEmbedProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<TingeeBankLinkInstance | null>(null);
  const callbacksRef = useRef({ onSuccess, onFailed, onCancelled, onError, onClose });
  callbacksRef.current = { onSuccess, onFailed, onCancelled, onError, onClose };

  const themeKey = typeof theme === 'string' ? theme : JSON.stringify(theme || null);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    const instance = new TingeeBankLinkInstance({
      url,
      container: containerRef.current,
      theme: theme as string | TingeeThemeConfig | null,
      resultAction,
      onSuccess: (d) => callbacksRef.current.onSuccess?.(d),
      onFailed: (d) => callbacksRef.current.onFailed?.(d),
      onCancelled: (d) => callbacksRef.current.onCancelled?.(d),
      onError: (d) => callbacksRef.current.onError?.(d),
      onClose: () => callbacksRef.current.onClose?.(),
    });

    instanceRef.current = instance;
    instance.open();

    return () => {
      instance.close();
      instanceRef.current = null;
    };
  }, [url, themeKey, resultAction]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '760px', ...style }}
    />
  );
}

export interface TingeeCheckoutEmbedProps
  extends Pick<
    TingeeCheckoutConfig,
    'theme' | 'immediateResult' | 'onSuccess' | 'onFailed' | 'onCancelled' | 'onError' | 'onClose'
  > {
  /**
   * Secure Checkout URL returned by Tingee Payment Gateway API.
   */
  url: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Inline Embed Component for Tingee Payment Gateway Checkout UI SDK.
 */
export function TingeeCheckoutEmbed({
  url,
  theme,
  immediateResult,
  onSuccess,
  onFailed,
  onCancelled,
  onError,
  onClose,
  className,
  style,
}: TingeeCheckoutEmbedProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<TingeeCheckoutInstance | null>(null);
  const callbacksRef = useRef({ onSuccess, onFailed, onCancelled, onError, onClose });
  callbacksRef.current = { onSuccess, onFailed, onCancelled, onError, onClose };

  const themeKey = typeof theme === 'string' ? theme : JSON.stringify(theme || null);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    const instance = new TingeeCheckoutInstance({
      url,
      container: containerRef.current,
      theme: theme as string | TingeeThemeConfig | null,
      immediateResult,
      onSuccess: (d) => callbacksRef.current.onSuccess?.(d),
      onFailed: (d) => callbacksRef.current.onFailed?.(d),
      onCancelled: (d) => callbacksRef.current.onCancelled?.(d),
      onError: (d) => callbacksRef.current.onError?.(d),
      onClose: () => callbacksRef.current.onClose?.(),
    });

    instanceRef.current = instance;
    instance.open();

    return () => {
      instance.close();
      instanceRef.current = null;
    };
  }, [url, themeKey, immediateResult]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '720px', ...style }}
    />
  );
}

export * from '../index';
