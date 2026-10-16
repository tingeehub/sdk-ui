import {
  Tingee,
  TingeeBankLink,
  TingeeBankLinkInstance,
  TingeeCheckoutInstance,
  preloadBankLinkScript,
  preloadCheckoutScript,
  type TingeeBankLinkConfig,
  type TingeeBankLinkOptions,
  type TingeeBankLinkResultPayload,
  type TingeeCheckoutConfig,
  type TingeeCheckoutOptions,
  type TingeeCheckoutResultPayload,
} from '../index';

/**
 * Angular-compatible service for Tingee Bank Link UI SDK.
 * Works across all Angular versions (14 - 19+) without requiring Ivy metadata compilation,
 * and can be provided via `{ provide: TingeeBankLinkService, useClass: TingeeBankLinkService }`
 * or instantiated directly.
 */
export class TingeeBankLinkService {
  constructor() {
    if (TingeeBankLink.config.preloadScript !== false) {
      void preloadBankLinkScript({
        environment: TingeeBankLink.config.environment,
        scriptUrl: TingeeBankLink.config.scriptUrl,
      });
    }
  }

  /**
   * Configure global default options and callbacks for Bank Link.
   */
  public setup(config: TingeeBankLinkConfig): void {
    TingeeBankLink.Setup(config);
  }

  /**
   * Open the Bank Link popup or inline container.
   */
  public open(url: string, options: TingeeBankLinkConfig = {}): TingeeBankLinkInstance {
    return TingeeBankLink.Url.Open(url, options);
  }

  /**
   * Open the Bank Link popup and return a Promise that resolves when the flow completes or closes.
   */
  public openAsync(
    url: string,
    options: TingeeBankLinkConfig = {}
  ): Promise<TingeeBankLinkResultPayload> {
    return TingeeBankLink.Url.OpenAsync(url, options);
  }

  /**
   * Open the Bank Account Configuration flow (`resultAction: 'account-config-register'`).
   */
  public openAccountConfig(
    url: string,
    options: TingeeBankLinkConfig = {}
  ): TingeeBankLinkInstance {
    return TingeeBankLink.AccountConfig.Open(url, options);
  }

  /**
   * Open the Bank Account Configuration flow and return a Promise that resolves with the result.
   */
  public openAccountConfigAsync(
    url: string,
    options: TingeeBankLinkConfig = {}
  ): Promise<TingeeBankLinkResultPayload> {
    return TingeeBankLink.AccountConfig.OpenAsync(url, options);
  }

  /**
   * Mount the Bank Link UI inline inside an Angular `ElementRef.nativeElement` or `HTMLElement`.
   */
  public mountInline(
    container: HTMLElement | { nativeElement: HTMLElement },
    options: TingeeBankLinkOptions
  ): TingeeBankLinkInstance {
    const element = 'nativeElement' in container ? container.nativeElement : container;
    const instance = new TingeeBankLinkInstance({
      ...TingeeBankLink.config,
      ...options,
      container: element,
    });
    return instance.open();
  }

  /**
   * Close the currently active Bank Link modal.
   */
  public close(): void {
    TingeeBankLink.close();
  }
}

/**
 * Angular-compatible service for Tingee Payment Gateway Checkout UI SDK.
 */
export class TingeeCheckoutService {
  constructor() {
    if (Tingee.config.preloadScript !== false) {
      void preloadCheckoutScript({
        environment: Tingee.config.environment,
        scriptUrl: Tingee.config.scriptUrl,
      });
    }
  }

  /**
   * Configure global default options and callbacks for Checkout.
   */
  public setup(config: TingeeCheckoutConfig): void {
    Tingee.Setup(config);
  }

  /**
   * Open the Payment Gateway Checkout popup or inline container.
   */
  public open(url: string, options: TingeeCheckoutConfig = {}): TingeeCheckoutInstance {
    return Tingee.Url.Open(url, options);
  }

  /**
   * Open the Payment Gateway Checkout popup and return a Promise that resolves with the result.
   */
  public openAsync(
    url: string,
    options: TingeeCheckoutConfig = {}
  ): Promise<TingeeCheckoutResultPayload> {
    return Tingee.Url.OpenAsync(url, options);
  }

  /**
   * Mount the Checkout UI inline inside an Angular `ElementRef.nativeElement` or `HTMLElement`.
   */
  public mountInline(
    container: HTMLElement | { nativeElement: HTMLElement },
    options: TingeeCheckoutOptions
  ): TingeeCheckoutInstance {
    const element = 'nativeElement' in container ? container.nativeElement : container;
    const instance = new TingeeCheckoutInstance({
      ...Tingee.config,
      ...options,
      container: element,
    });
    return instance.open();
  }

  /**
   * Close the currently active Checkout modal.
   */
  public close(): void {
    Tingee.close();
  }
}

/**
 * Helper to provide only TingeeBankLinkService in Angular.
 */
export function provideTingeeBankLink(config?: TingeeBankLinkConfig) {
  if (config) {
    TingeeBankLink.Setup(config);
  }
  return [
    {
      provide: TingeeBankLinkService,
      useFactory: () => new TingeeBankLinkService(),
    },
  ];
}

/**
 * Helper to provide only TingeeCheckoutService in Angular.
 */
export function provideTingeeCheckout(config?: TingeeCheckoutConfig) {
  if (config) {
    Tingee.Setup(config);
  }
  return [
    {
      provide: TingeeCheckoutService,
      useFactory: () => new TingeeCheckoutService(),
    },
  ];
}

/**
 * Helper to provide Tingee services in Angular `ApplicationConfig` or `@NgModule.providers`.
 */
export function provideTingeeSdkUi(config?: {
  bankLink?: TingeeBankLinkConfig;
  checkout?: TingeeCheckoutConfig;
}) {
  return [
    ...provideTingeeBankLink(config?.bankLink),
    ...provideTingeeCheckout(config?.checkout),
  ];
}

export * from '../index';
