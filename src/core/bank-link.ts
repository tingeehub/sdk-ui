import {
  createCloseButton,
  ensureModalStyles,
  getParentDisplayContext,
  isBrowser,
  resolveModalSize,
  resolveThemeConfig,
} from './dom-utils';
import { preloadBankLinkScript } from './script-loader';
import type {
  TingeeBankLinkCancelledPayload,
  TingeeBankLinkConfig,
  TingeeBankLinkErrorPayload,
  TingeeBankLinkFailedPayload,
  TingeeBankLinkOptions,
  TingeeBankLinkResultPayload,
  TingeeBankLinkSuccessPayload,
  TingeeSizeOption,
  TingeeThemeConfig,
} from './types';

export class TingeeBankLinkInstance {
  public url: string;
  public size: TingeeSizeOption;
  public modalWidth: number | string | null;
  public modalHeight: number | string | null;
  public modalMaxHeight: number | string | null;
  public modalMaxWidth: number | string | null;
  public modalBorderRadius: number | string | null;
  public theme: string | TingeeThemeConfig | null;
  public containerId: string | null;
  public container: HTMLElement | null;
  public closeOnEscape: boolean;
  public onSuccess: ((data: TingeeBankLinkSuccessPayload) => void) | null;
  public onFailed: ((data: TingeeBankLinkFailedPayload) => void) | null;
  public onCancelled: ((data: TingeeBankLinkCancelledPayload) => void) | null;
  public onError: ((data: TingeeBankLinkErrorPayload) => void) | null;
  public onClose: (() => void) | null;
  public resultAction: string | null;
  public iframe: HTMLIFrameElement | null = null;
  public modalContainer: HTMLDivElement | null = null;

  private _messageListener: (event: MessageEvent) => void;
  private _keydownListener: (event: KeyboardEvent) => void;

  constructor(options: TingeeBankLinkOptions) {
    if (!options || !options.url) {
      throw new Error('TingeeBankLink: Missing required "url" parameter');
    }

    this.url = options.url;
    this.size = options.size || 'medium';
    this.modalWidth = options.width || options.modalWidth || null;
    this.modalHeight = options.height || options.modalHeight || null;
    this.modalMaxHeight = options.maxHeight || options.modalMaxHeight || null;
    this.modalMaxWidth = options.maxWidth || options.modalMaxWidth || null;
    this.modalBorderRadius = options.borderRadius || options.modalBorderRadius || null;
    this.theme = resolveThemeConfig(options as unknown as Record<string, unknown>);
    this.containerId = options.containerId || null;
    this.container = options.container || null;
    this.closeOnEscape = Boolean(options.closeOnEscape);
    this.onSuccess = options.onSuccess || null;
    this.onFailed = options.onFailed || null;
    this.onCancelled = options.onCancelled || null;
    this.onError = options.onError || null;
    this.onClose = options.onClose || null;
    this.resultAction = options.resultAction || null;

    this._messageListener = this._handleMessage.bind(this);
    this._keydownListener = this._handleKeydown.bind(this);
  }

  /**
   * Update callbacks on a live instance without recreating the iframe.
   */
  public updateCallbacks(
    callbacks: Pick<
      TingeeBankLinkConfig,
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

    const iframeUrl = this._buildIframeUrl(this.url);
    window.addEventListener('message', this._messageListener);

    const targetContainer =
      this.container ||
      (this.containerId ? document.getElementById(this.containerId) : null);

    if (this.container || this.containerId) {
      if (!targetContainer) {
        window.removeEventListener('message', this._messageListener);
        throw new Error(
          `TingeeBankLink: Container element ${
            this.containerId ? `with id "${this.containerId}" ` : ''
          }not found.`
        );
      }
      this.iframe = this._createIframe(iframeUrl);
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      this.iframe.style.border = 'none';
      targetContainer.appendChild(this.iframe);
    } else {
      if (this.closeOnEscape) {
        window.addEventListener('keydown', this._keydownListener);
      }
      this._createModal(iframeUrl);
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
      window.dispatchEvent(new CustomEvent('tingee-bank-link:closed'));
    }
  }

  public destroy(): void {
    this.close();
  }

  private _handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.modalContainer) {
      const payload: TingeeBankLinkCancelledPayload = {
        status: 'cancelled',
        errorCode: 'USER_CLOSED',
      };
      this.onCancelled?.(payload);
      window.dispatchEvent(
        new CustomEvent('tingee-bank-link:cancelled', { detail: payload })
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
        const ctx = getParentDisplayContext();
        this.iframe.contentWindow.postMessage(
          {
            type: 'TINGEE_CONFIG',
            payload: {
              displayMode: ctx.displayMode,
              isDesktopParent: ctx.isDesktopParent,
              isMobileParent: ctx.isMobileParent,
              parentViewport: ctx.parentViewport,
              isEmbedded: true,
              theme: this.theme || null,
            },
          },
          '*'
        );
      }
      return;
    }

    if (msg.type !== 'TINGEE_BANK_LINK_RESULT') return;

    const data = msg.data as TingeeBankLinkResultPayload | undefined;
    if (!data) return;

    if (this.resultAction) {
      if (data.action !== this.resultAction) return;
    } else if (data.action === 'account-config-register') {
      return;
    }

    switch (data.status) {
      case 'success':
        this.onSuccess?.(data);
        window.dispatchEvent(
          new CustomEvent('tingee-bank-link:success', { detail: data })
        );
        break;
      case 'failed':
        this.onFailed?.(data);
        window.dispatchEvent(
          new CustomEvent('tingee-bank-link:failed', { detail: data })
        );
        break;
      case 'cancelled':
        this.onCancelled?.(data);
        window.dispatchEvent(
          new CustomEvent('tingee-bank-link:cancelled', { detail: data })
        );
        break;
      case 'error':
        this.onError?.(data);
        window.dispatchEvent(
          new CustomEvent('tingee-bank-link:error', { detail: data })
        );
        break;
    }

    this.close();
  }

  private _createIframe(src: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.allow = 'payment; camera';
    return iframe;
  }

  private _buildIframeUrl(rawUrl: string): string {
    const parsed = new URL(rawUrl, isBrowser() ? window.location.origin : 'https://tingee.vn');
    const ctx = getParentDisplayContext();
    parsed.searchParams.set('tingeeEmbedded', '1');
    parsed.searchParams.set('tingeeDisplayMode', ctx.displayMode);
    return parsed.toString();
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
      const payload: TingeeBankLinkCancelledPayload = {
        status: 'cancelled',
        errorCode: 'USER_CLOSED',
      };
      this.onCancelled?.(payload);
      window.dispatchEvent(
        new CustomEvent('tingee-bank-link:cancelled', { detail: payload })
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
      'tingee-bank-link-styles',
      'tingee-bank-link-modal-inner',
      '--tingee-bank-link-modal'
    );

    inner.className = 'tingee-bank-link-modal-inner';
    inner.style.setProperty('--tingee-bank-link-modal-width', resolvedSize.width);
    inner.style.setProperty('--tingee-bank-link-modal-height', resolvedSize.height);
    inner.style.setProperty('--tingee-bank-link-modal-max-width', resolvedSize.maxWidth);
    inner.style.setProperty('--tingee-bank-link-modal-max-height', resolvedSize.maxHeight);
    inner.style.setProperty(
      '--tingee-bank-link-modal-border-radius',
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
    options: TingeeBankLinkConfig = {}
  ): TingeeBankLinkInstance | null {
    if (!isBrowser()) return null;
    const urlParam = new URLSearchParams(window.location.search).get('tingeeBankLinkUrl');
    if (!urlParam) return null;

    const instance = new TingeeBankLinkInstance(
      Object.assign({}, options, { url: urlParam })
    );

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => instance.open());
    } else {
      instance.open();
    }

    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('tingeeBankLinkUrl');
      window.history.replaceState({}, document.title, currentUrl.toString());
    } catch {
      // Ignore history replaceState errors in restricted environments
    }

    return instance;
  }
}

export interface TingeeBankLinkManager {
  config: TingeeBankLinkConfig;
   activeInstance: TingeeBankLinkInstance | null;
  Setup: (config: TingeeBankLinkConfig) => void;
  setup: (config: TingeeBankLinkConfig) => void;
  Url: {
    Open: (url: string, options?: TingeeBankLinkConfig) => TingeeBankLinkInstance;
    open: (url: string, options?: TingeeBankLinkConfig) => TingeeBankLinkInstance;
    OpenAsync: (
      url: string,
      options?: TingeeBankLinkConfig
    ) => Promise<TingeeBankLinkResultPayload>;
    openAsync: (
      url: string,
      options?: TingeeBankLinkConfig
    ) => Promise<TingeeBankLinkResultPayload>;
  };
  AccountConfig: {
    Open: (url: string, options?: TingeeBankLinkConfig) => TingeeBankLinkInstance;
    open: (url: string, options?: TingeeBankLinkConfig) => TingeeBankLinkInstance;
    OpenAsync: (
      url: string,
      options?: TingeeBankLinkConfig
    ) => Promise<TingeeBankLinkResultPayload>;
    openAsync: (
      url: string,
      options?: TingeeBankLinkConfig
    ) => Promise<TingeeBankLinkResultPayload>;
  };
  open: (url: string, options?: TingeeBankLinkConfig) => TingeeBankLinkInstance;
  openAsync: (
    url: string,
    options?: TingeeBankLinkConfig
  ) => Promise<TingeeBankLinkResultPayload>;
  openAccountConfig: (
    url: string,
    options?: TingeeBankLinkConfig
  ) => TingeeBankLinkInstance;
  openAccountConfigAsync: (
    url: string,
    options?: TingeeBankLinkConfig
  ) => Promise<TingeeBankLinkResultPayload>;
  close: () => void;
  initFromUrl: (options?: TingeeBankLinkConfig) => TingeeBankLinkInstance | null;
}

function createOpenPromise(
  openFn: (url: string, options?: TingeeBankLinkConfig) => TingeeBankLinkInstance,
  url: string,
  options: TingeeBankLinkConfig = {}
): Promise<TingeeBankLinkResultPayload> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (payload: TingeeBankLinkResultPayload) => {
      if (!settled) {
        settled = true;
        resolve(payload);
      }
    };

    openFn(
      url,
      Object.assign({}, options, {
        onSuccess: (data: TingeeBankLinkSuccessPayload) => {
          options.onSuccess?.(data);
          settle(data);
        },
        onFailed: (data: TingeeBankLinkFailedPayload) => {
          options.onFailed?.(data);
          settle(data);
        },
        onCancelled: (data: TingeeBankLinkCancelledPayload) => {
          options.onCancelled?.(data);
          settle(data);
        },
        onError: (data: TingeeBankLinkErrorPayload) => {
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

export const TingeeBankLink: TingeeBankLinkManager = {
  config: {},
  activeInstance: null,

  Setup(config: TingeeBankLinkConfig): void {
    this.config = Object.assign({}, this.config, config);
    if (this.config.preloadScript !== false) {
      void preloadBankLinkScript({
        environment: this.config.environment,
        scriptUrl: this.config.scriptUrl,
      });
    }
  },

  setup(config: TingeeBankLinkConfig): void {
    this.Setup(config);
  },

  Url: {
    Open(url: string, options: TingeeBankLinkConfig = {}): TingeeBankLinkInstance {
      if (!url) {
        throw new Error('TingeeBankLink: url is required');
      }
      if (TingeeBankLink.activeInstance && !options.containerId && !options.container) {
        TingeeBankLink.activeInstance.close();
      }
      const mergedOptions: TingeeBankLinkOptions = Object.assign(
        {},
        TingeeBankLink.config,
        options,
        { url }
      );
      if (mergedOptions.preloadScript !== false) {
        void preloadBankLinkScript({
          environment: mergedOptions.environment,
          scriptUrl: mergedOptions.scriptUrl,
          url,
        });
      }
      const instance = new TingeeBankLinkInstance(mergedOptions);
      if (!options.containerId && !options.container) {
        TingeeBankLink.activeInstance = instance;
      }
      return instance.open();
    },

    open(url: string, options: TingeeBankLinkConfig = {}): TingeeBankLinkInstance {
      return this.Open(url, options);
    },

    OpenAsync(
      url: string,
      options: TingeeBankLinkConfig = {}
    ): Promise<TingeeBankLinkResultPayload> {
      return createOpenPromise(this.Open.bind(this), url, options);
    },

    openAsync(
      url: string,
      options: TingeeBankLinkConfig = {}
    ): Promise<TingeeBankLinkResultPayload> {
      return this.OpenAsync(url, options);
    },
  },

  AccountConfig: {
    Open(url: string, options: TingeeBankLinkConfig = {}): TingeeBankLinkInstance {
      return TingeeBankLink.Url.Open(
        url,
        Object.assign({}, options, { resultAction: 'account-config-register' })
      );
    },

    open(url: string, options: TingeeBankLinkConfig = {}): TingeeBankLinkInstance {
      return this.Open(url, options);
    },

    OpenAsync(
      url: string,
      options: TingeeBankLinkConfig = {}
    ): Promise<TingeeBankLinkResultPayload> {
      return createOpenPromise(this.Open.bind(this), url, options);
    },

    openAsync(
      url: string,
      options: TingeeBankLinkConfig = {}
    ): Promise<TingeeBankLinkResultPayload> {
      return this.OpenAsync(url, options);
    },
  },

  open(url: string, options: TingeeBankLinkConfig = {}): TingeeBankLinkInstance {
    return this.Url.Open(url, options);
  },

  openAsync(
    url: string,
    options: TingeeBankLinkConfig = {}
  ): Promise<TingeeBankLinkResultPayload> {
    return this.Url.OpenAsync(url, options);
  },

  openAccountConfig(
    url: string,
    options: TingeeBankLinkConfig = {}
  ): TingeeBankLinkInstance {
    return this.AccountConfig.Open(url, options);
  },

  openAccountConfigAsync(
    url: string,
    options: TingeeBankLinkConfig = {}
  ): Promise<TingeeBankLinkResultPayload> {
    return this.AccountConfig.OpenAsync(url, options);
  },

  close(): void {
    if (this.activeInstance) {
      this.activeInstance.close();
      this.activeInstance = null;
    }
  },

  initFromUrl(options: TingeeBankLinkConfig = {}): TingeeBankLinkInstance | null {
    return TingeeBankLinkInstance.initFromUrl(
      Object.assign({}, this.config, options)
    );
  },
};

export function setupBankLink(config: TingeeBankLinkConfig): void {
  TingeeBankLink.Setup(config);
}

export function openBankLink(
  url: string,
  options?: TingeeBankLinkConfig
): TingeeBankLinkInstance {
  return TingeeBankLink.Url.Open(url, options);
}

export function openBankLinkAsync(
  url: string,
  options?: TingeeBankLinkConfig
): Promise<TingeeBankLinkResultPayload> {
  return TingeeBankLink.Url.OpenAsync(url, options);
}

export function openAccountConfig(
  url: string,
  options?: TingeeBankLinkConfig
): TingeeBankLinkInstance {
  return TingeeBankLink.AccountConfig.Open(url, options);
}

export function openAccountConfigAsync(
  url: string,
  options?: TingeeBankLinkConfig
): Promise<TingeeBankLinkResultPayload> {
  return TingeeBankLink.AccountConfig.OpenAsync(url, options);
}
