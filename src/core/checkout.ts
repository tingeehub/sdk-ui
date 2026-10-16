import {
  createCloseButton,
  ensureModalStyles,
  isBrowser,
  resolveModalSize,
  resolveThemeConfig,
} from './dom-utils';
import { preloadCheckoutScript } from './script-loader';
import type {
  TingeeCheckoutCancelledPayload,
  TingeeCheckoutConfig,
  TingeeCheckoutErrorPayload,
  TingeeCheckoutFailedPayload,
  TingeeCheckoutOptions,
  TingeeCheckoutResultPayload,
  TingeeCheckoutSuccessPayload,
  TingeeSizeOption,
  TingeeThemeConfig,
} from './types';

export class TingeeCheckoutInstance {
  public url: string;
  public size: TingeeSizeOption;
  public modalWidth: number | string | null;
  public modalHeight: number | string | null;
  public modalMaxHeight: number | string | null;
  public modalMaxWidth: number | string | null;
  public modalBorderRadius: number | string | null;
  public theme: string | TingeeThemeConfig | null;
  public immediateResult: boolean;
  public containerId: string | null;
  public container: HTMLElement | null;
  public closeOnEscape: boolean;
  public onSuccess: ((data: TingeeCheckoutSuccessPayload) => void) | null;
  public onFailed: ((data: TingeeCheckoutFailedPayload) => void) | null;
  public onCancelled: ((data: TingeeCheckoutCancelledPayload) => void) | null;
  public onError: ((data: TingeeCheckoutErrorPayload) => void) | null;
  public onClose: (() => void) | null;
  public iframe: HTMLIFrameElement | null = null;
  public modalContainer: HTMLDivElement | null = null;

  private _messageListener: (event: MessageEvent) => void;
  private _keydownListener: (event: KeyboardEvent) => void;

  constructor(options: TingeeCheckoutOptions) {
    if (!options || !options.url) {
      throw new Error('TingeeCheckout: Missing required "url" parameter');
    }

    this.url = options.url;
    this.size = options.size || 'medium';
    this.modalWidth = options.width || options.modalWidth || null;
    this.modalHeight = options.height || options.modalHeight || null;
    this.modalMaxHeight = options.maxHeight || options.modalMaxHeight || null;
    this.modalMaxWidth = options.maxWidth || options.modalMaxWidth || null;
    this.modalBorderRadius = options.borderRadius || options.modalBorderRadius || null;
    this.theme =
      resolveThemeConfig(options as unknown as Record<string, unknown>) ||
      options.theme ||
      null;
    this.immediateResult = Boolean(options.immediateResult);
    this.containerId = options.containerId || null;
    this.container = options.container || null;
    this.closeOnEscape = Boolean(options.closeOnEscape);
    this.onSuccess = options.onSuccess || null;
    this.onFailed = options.onFailed || null;
    this.onCancelled = options.onCancelled || null;
    this.onError = options.onError || null;
    this.onClose = options.onClose || null;

    this._messageListener = this._handleMessage.bind(this);
    this._keydownListener = this._handleKeydown.bind(this);
  }

  /**
   * Update callbacks on a live instance without recreating the iframe.
   */
  public updateCallbacks(
    callbacks: Pick<
      TingeeCheckoutConfig,
      'onSuccess' | 'onFailed' | 'onCancelled' | 'onError' | 'onClose'
    >
  ): void {
    if (callbacks.onSuccess !== undefined) this.onSuccess = callbacks.onSuccess || null;
    if (callbacks.onFailed !== undefined) this.onFailed = callbacks.onFailed || null;
    if (callbacks.onCancelled !== undefined) this.onCancelled = callbacks.onCancelled || null;
    if (callbacks.onError !== undefined) this.onError = callbacks.onError || null;
    if (callbacks.onClose !== undefined) this.onClose = callbacks.onClose || null;
  }

  public get isOpen(): boolean {
    return Boolean(this.iframe || this.modalContainer);
  }

  public open(): this {
    if (!isBrowser()) return this;
    if (this.iframe || this.modalContainer) return this;

    const parsedUrl = new URL(
      this.url,
      isBrowser() ? window.location.origin : 'https://tingee.vn'
    ).toString();
    window.addEventListener('message', this._messageListener);

    const targetContainer =
      this.container ||
      (this.containerId ? document.getElementById(this.containerId) : null);

    if (this.container || this.containerId) {
      if (!targetContainer) {
        window.removeEventListener('message', this._messageListener);
        throw new Error(
          `TingeeCheckout: Container element ${
            this.containerId ? `with id "${this.containerId}" ` : ''
          }not found.`
        );
      }
      this.iframe = this._createIframe(parsedUrl);
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      this.iframe.style.border = 'none';
      targetContainer.appendChild(this.iframe);
    } else {
      if (this.closeOnEscape) {
        window.addEventListener('keydown', this._keydownListener);
      }
      this._createModal(parsedUrl);
    }

    return this;
  }

  public close(): void {
    if (!isBrowser()) return;

    const targetContainer =
      this.container ||
      (this.containerId ? document.getElementById(this.containerId) : null);

    if (this.iframe && targetContainer && targetContainer.contains(this.iframe)) {
      targetContainer.removeChild(this.iframe);
    }

    if (this.modalContainer && document.body.contains(this.modalContainer)) {
      document.body.removeChild(this.modalContainer);
    }

    const wasOpen = Boolean(this.iframe || this.modalContainer);
    this.iframe = null;
    this.modalContainer = null;

    window.removeEventListener('message', this._messageListener);
    window.removeEventListener('keydown', this._keydownListener);

    if (wasOpen) {
      this.onClose?.();
      window.dispatchEvent(new CustomEvent('tingee:closed'));
    }
  }

  public destroy(): void {
    this.close();
  }

  private _handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.modalContainer) {
      const payload: TingeeCheckoutCancelledPayload = {
        status: 'cancelled',
        errorCode: 'USER_CLOSED',
      };
      this.onCancelled?.(payload);
      window.dispatchEvent(
        new CustomEvent('tingee:cancelled', { detail: payload })
      );
      this.close();
    }
  }

  private _handleMessage(event: MessageEvent): void {
    if (
      this.iframe &&
      this.iframe.contentWindow &&
      event.source &&
      event.source !== this.iframe.contentWindow
    ) {
      return;
    }

    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'TINGEE_READY') {
      if (this.iframe && this.iframe.contentWindow) {
        const isInline = Boolean(this.containerId || this.container);
        this.iframe.contentWindow.postMessage(
          {
            type: 'TINGEE_CONFIG',
            payload: {
              isDesktopParent: isInline ? false : window.innerWidth >= 640,
              immediateResult: this.immediateResult || false,
              isEmbedded: true,
              theme: this.theme || null,
            },
          },
          '*'
        );
      }
      return;
    }

    if (msg.type !== 'TINGEE_PAYMENT_RESULT') return;

    const data = msg.data as TingeeCheckoutResultPayload | undefined;
    if (!data) return;

    switch (data.status) {
      case 'success':
        this.onSuccess?.(data);
        window.dispatchEvent(new CustomEvent('tingee:success', { detail: data }));
        break;
      case 'failed':
      case 'expired':
        this.onFailed?.(data);
        window.dispatchEvent(
          new CustomEvent(`tingee:${data.status}`, { detail: data })
        );
        break;
      case 'cancelled':
        this.onCancelled?.(data);
        window.dispatchEvent(
          new CustomEvent('tingee:cancelled', { detail: data })
        );
        break;
      case 'error':
        this.onError?.(data);
        window.dispatchEvent(new CustomEvent('tingee:error', { detail: data }));
        break;
    }

    this.close();
  }

  private _createIframe(src: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.allow = 'payment';
    return iframe;
  }

  private _createModal(iframeUrl: string): void {
    this.modalContainer = document.createElement('div');
    this.modalContainer.style.position = 'fixed';
    this.modalContainer.style.top = '0';
    this.modalContainer.style.left = '0';
    this.modalContainer.style.width = '100%';
    this.modalContainer.style.height = '100%';
    this.modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
    this.modalContainer.style.display = 'flex';
    this.modalContainer.style.alignItems = 'center';
    this.modalContainer.style.justifyContent = 'center';
    this.modalContainer.style.zIndex = '999999';
    this.modalContainer.style.backdropFilter = 'blur(2px)';
    this.modalContainer.style.opacity = '0';
    this.modalContainer.style.transition = 'opacity 0.2s ease';

    setTimeout(() => {
      if (this.modalContainer) {
        this.modalContainer.style.opacity = '1';
      }
    }, 10);

    const inner = document.createElement('div');
    inner.style.position = 'relative';
    inner.style.width = '100%';
    inner.style.height = '100%';
    inner.style.backgroundColor = '#f3f4f6';
    inner.style.borderRadius = '0px';
    inner.style.overflow = 'hidden';
    inner.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
    inner.style.display = 'flex';
    inner.style.flexDirection = 'column';
    inner.style.transform = 'translateY(20px)';
    inner.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

    setTimeout(() => {
      inner.style.transform = 'translateY(0)';
    }, 10);

    const closeBtn = createCloseButton(() => {
      const payload: TingeeCheckoutCancelledPayload = {
        status: 'cancelled',
        errorCode: 'USER_CLOSED',
      };
      this.onCancelled?.(payload);
      window.dispatchEvent(
        new CustomEvent('tingee:cancelled', { detail: payload })
      );
      this.close();
    });

    const resolvedSize = resolveModalSize({
      size: this.size,
      modalWidth: this.modalWidth,
      modalHeight: this.modalHeight,
      modalMaxHeight: this.modalMaxHeight,
      modalMaxWidth: this.modalMaxWidth,
      modalBorderRadius: this.modalBorderRadius,
    });

    ensureModalStyles(
      'tingee-checkout-styles',
      'tingee-modal-inner',
      '--tingee-modal'
    );

    inner.className = 'tingee-modal-inner';
    inner.style.setProperty('--tingee-modal-width', resolvedSize.width);
    inner.style.setProperty('--tingee-modal-height', resolvedSize.height);
    inner.style.setProperty('--tingee-modal-max-width', resolvedSize.maxWidth);
    inner.style.setProperty('--tingee-modal-max-height', resolvedSize.maxHeight);
    inner.style.setProperty(
      '--tingee-modal-border-radius',
      resolvedSize.borderRadius
    );

    this.iframe = this._createIframe(iframeUrl);
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    this.iframe.style.flex = '1';
    this.iframe.style.backgroundColor = '#f3f4f6';

    inner.appendChild(closeBtn);
    inner.appendChild(this.iframe);
    this.modalContainer.appendChild(inner);
    document.body.appendChild(this.modalContainer);
  }

  public static initFromUrl(
    options: TingeeCheckoutConfig = {}
  ): TingeeCheckoutInstance | null {
    if (!isBrowser()) return null;
    const urlParam = new URLSearchParams(window.location.search).get('tingeePaymentUrl');
    if (!urlParam) return null;

    const instance = new TingeeCheckoutInstance(
      Object.assign({}, options, { url: urlParam })
    );

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => instance.open());
    } else {
      instance.open();
    }

    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('tingeePaymentUrl');
      window.history.replaceState({}, document.title, currentUrl.toString());
    } catch {
      // Ignore history replaceState errors in restricted environments
    }

    return instance;
  }
}

export interface TingeeCheckoutManager {
  config: TingeeCheckoutConfig;
  activeInstance: TingeeCheckoutInstance | null;
  Setup: (config: TingeeCheckoutConfig) => void;
  setup: (config: TingeeCheckoutConfig) => void;
  Url: {
    Open: (url: string, options?: TingeeCheckoutConfig) => TingeeCheckoutInstance;
    open: (url: string, options?: TingeeCheckoutConfig) => TingeeCheckoutInstance;
    OpenAsync: (
      url: string,
      options?: TingeeCheckoutConfig
    ) => Promise<TingeeCheckoutResultPayload>;
    openAsync: (
      url: string,
      options?: TingeeCheckoutConfig
    ) => Promise<TingeeCheckoutResultPayload>;
  };
  open: (url: string, options?: TingeeCheckoutConfig) => TingeeCheckoutInstance;
  openAsync: (
    url: string,
    options?: TingeeCheckoutConfig
  ) => Promise<TingeeCheckoutResultPayload>;
  close: () => void;
  initFromUrl: (options?: TingeeCheckoutConfig) => TingeeCheckoutInstance | null;
}

function createCheckoutPromise(
  openFn: (url: string, options?: TingeeCheckoutConfig) => TingeeCheckoutInstance,
  url: string,
  options: TingeeCheckoutConfig = {}
): Promise<TingeeCheckoutResultPayload> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (payload: TingeeCheckoutResultPayload) => {
      if (!settled) {
        settled = true;
        resolve(payload);
      }
    };

    openFn(
      url,
      Object.assign({}, options, {
        onSuccess: (data: TingeeCheckoutSuccessPayload) => {
          options.onSuccess?.(data);
          settle(data);
        },
        onFailed: (data: TingeeCheckoutFailedPayload) => {
          options.onFailed?.(data);
          settle(data);
        },
        onCancelled: (data: TingeeCheckoutCancelledPayload) => {
          options.onCancelled?.(data);
          settle(data);
        },
        onError: (data: TingeeCheckoutErrorPayload) => {
          options.onError?.(data);
          settle(data);
        },
        onClose: () => {
          options.onClose?.();
          settle({ status: 'cancelled', errorCode: 'USER_CLOSED' });
        },
      })
    );
  });
}

export const Tingee: TingeeCheckoutManager = {
  config: {},
  activeInstance: null,

  Setup(config: TingeeCheckoutConfig): void {
    this.config = Object.assign({}, this.config, config);
    if (this.config.preloadScript !== false) {
      void preloadCheckoutScript({
        environment: this.config.environment,
        scriptUrl: this.config.scriptUrl,
      });
    }
  },

  setup(config: TingeeCheckoutConfig): void {
    this.Setup(config);
  },

  Url: {
    Open(url: string, options: TingeeCheckoutConfig = {}): TingeeCheckoutInstance {
      if (!url) {
        throw new Error('Tingee: url is required');
      }
      if (Tingee.activeInstance && !options.containerId && !options.container) {
        Tingee.activeInstance.close();
      }
      const mergedOptions: TingeeCheckoutOptions = Object.assign(
        {},
        Tingee.config,
        options,
        { url }
      );
      if (mergedOptions.preloadScript !== false) {
        void preloadCheckoutScript({
          environment: mergedOptions.environment,
          scriptUrl: mergedOptions.scriptUrl,
          url,
        });
      }
      const instance = new TingeeCheckoutInstance(mergedOptions);
      if (!options.containerId && !options.container) {
        Tingee.activeInstance = instance;
      }
      return instance.open();
    },

    open(url: string, options: TingeeCheckoutConfig = {}): TingeeCheckoutInstance {
      return this.Open(url, options);
    },

    OpenAsync(
      url: string,
      options: TingeeCheckoutConfig = {}
    ): Promise<TingeeCheckoutResultPayload> {
      return createCheckoutPromise(this.Open.bind(this), url, options);
    },

    openAsync(
      url: string,
      options: TingeeCheckoutConfig = {}
    ): Promise<TingeeCheckoutResultPayload> {
      return this.OpenAsync(url, options);
    },
  },

  open(url: string, options: TingeeCheckoutConfig = {}): TingeeCheckoutInstance {
    return this.Url.Open(url, options);
  },

  openAsync(
    url: string,
    options: TingeeCheckoutConfig = {}
  ): Promise<TingeeCheckoutResultPayload> {
    return this.Url.OpenAsync(url, options);
  },

  close(): void {
    if (this.activeInstance) {
      this.activeInstance.close();
      this.activeInstance = null;
    }
  },

  initFromUrl(options: TingeeCheckoutConfig = {}): TingeeCheckoutInstance | null {
    return TingeeCheckoutInstance.initFromUrl(
      Object.assign({}, this.config, options)
    );
  },
};

export const TingeeCheckout = Tingee;

export function setupCheckout(config: TingeeCheckoutConfig): void {
  Tingee.Setup(config);
}

export function openCheckout(
  url: string,
  options?: TingeeCheckoutConfig
): TingeeCheckoutInstance {
  return Tingee.Url.Open(url, options);
}

export function openCheckoutAsync(
  url: string,
  options?: TingeeCheckoutConfig
): Promise<TingeeCheckoutResultPayload> {
  return Tingee.Url.OpenAsync(url, options);
}
