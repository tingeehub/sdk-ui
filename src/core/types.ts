/**
 * Preset modal sizes supported by Tingee UI SDKs.
 */
export type TingeeSizePreset =
  | 'small'
  | 'medium'
  | 'large'
  | 'desktop'
  | 'wide'
  | 'xlarge'
  | 'full'
  | 'fullscreen';

/**
 * Custom modal dimension configuration.
 */
export interface TingeeCustomSize {
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  borderRadius?: number | string;
}

/**
 * Size configuration accepted by Tingee UI SDKs.
 */
export type TingeeSizeOption = TingeeSizePreset | TingeeCustomSize | number | string;

/**
 * Theme customization options passed to embedded Tingee UI via postMessage.
 */
export interface TingeeThemeConfig {
  primaryColor?: string;
  primaryHoverColor?: string;
  primaryHover?: string;
  primarySoftColor?: string;
  primarySoft?: string;
  [cssVariable: `--${string}`]: string | undefined;
  [key: string]: unknown;
}

// ============================================================================
// 1. Bank Link UI SDK Types
// ============================================================================

export interface TingeeBankLinkSuccessPayload {
  status: 'success';
  bankName?: string;
  merchantAccountNumberId?: number | string;
  vaAccountNumber?: string;
  shopId?: number | string;
  action?: string;
  [key: string]: unknown;
}

export interface TingeeBankLinkFailedPayload {
  status: 'failed';
  errorCode?: string;
  errorMessage?: string;
  action?: string;
  [key: string]: unknown;
}

export interface TingeeBankLinkCancelledPayload {
  status: 'cancelled';
  errorCode?: string;
  action?: string;
  [key: string]: unknown;
}

export interface TingeeBankLinkErrorPayload {
  status: 'error';
  errorCode?: string;
  errorMessage?: string;
  action?: string;
  [key: string]: unknown;
}

export type TingeeBankLinkResultPayload =
  | TingeeBankLinkSuccessPayload
  | TingeeBankLinkFailedPayload
  | TingeeBankLinkCancelledPayload
  | TingeeBankLinkErrorPayload;

/**
 * Global / shared configuration options for TingeeBankLink.
 */
export interface TingeeBankLinkConfig {
  /**
   * Modal size preset ('small' | 'medium' | 'large' | 'desktop' | 'wide' | 'xlarge' | 'full' | 'fullscreen')
   * or custom dimensions object. Default: 'medium'.
   */
  size?: TingeeSizeOption;
  width?: number | string;
  modalWidth?: number | string;
  height?: number | string;
  modalHeight?: number | string;
  maxWidth?: number | string;
  modalMaxWidth?: number | string;
  maxHeight?: number | string;
  modalMaxHeight?: number | string;
  borderRadius?: number | string;
  modalBorderRadius?: number | string;
  /**
   * Theme name or custom color object (e.g. `{ primaryColor: '#1E88E5' }`).
   */
  theme?: string | TingeeThemeConfig | null;
  primaryColor?: string;
  primaryHoverColor?: string;
  primaryHover?: string;
  primarySoftColor?: string;
  primarySoft?: string;
  /**
   * ID of an existing HTML element to render the SDK inline instead of a modal popup.
   */
  containerId?: string | null;
  /**
   * Direct HTMLElement reference to render the SDK inline (ideal for React/Vue/Angular refs).
   */
  container?: HTMLElement | null;
  /**
   * Filter result events by action (e.g. 'account-config-register').
   */
  resultAction?: string | null;
  /**
   * Close modal when user presses Escape key. Default: false (preserves legacy behavior unless enabled).
   */
  closeOnEscape?: boolean;
  /**
   * Target environment ('prod' | 'uat') used to preload the official Tingee script when the page/component initializes.
   * Default: 'prod' (or auto-detected from session URL).
   */
  environment?: 'prod' | 'uat';
  /**
   * Optional custom script URL override for preloading.
   */
  scriptUrl?: string;
  /**
   * Automatically preload `tingee-bank-link.js` in the background when the component/page initializes.
   * If the network is slow or offline when `open()` is clicked, the built-in engine is used as an instant fallback.
   * Default: true.
   */
  preloadScript?: boolean;
  /**
   * Callback fired when bank linking succeeds.
   */
  onSuccess?: (data: TingeeBankLinkSuccessPayload) => void;
  /**
   * Callback fired when bank linking fails due to a business/bank error.
   */
  onFailed?: (data: TingeeBankLinkFailedPayload) => void;
  /**
   * Callback fired when the user actively closes or cancels the flow.
   */
  onCancelled?: (data: TingeeBankLinkCancelledPayload) => void;
  /**
   * Callback fired when an unexpected system error occurs inside the SDK.
   */
  onError?: (data: TingeeBankLinkErrorPayload) => void;
  /**
   * Callback fired whenever the SDK modal/iframe is closed.
   */
  onClose?: () => void;
  [cssVariable: `--${string}`]: string | undefined;
}

/**
 * Options for instantiating or opening a specific Bank Link session.
 */
export interface TingeeBankLinkOptions extends TingeeBankLinkConfig {
  /**
   * Secure Bank Link Session URL returned by Tingee OpenAPI (`/v1/create-bank-link-session`).
   */
  url: string;
}

// ============================================================================
// 2. Payment Gateway (Checkout) UI SDK Types
// ============================================================================

export interface TingeeCheckoutSuccessPayload {
  status: 'success';
  orderCode?: string;
  transactionId?: string | number;
  amount?: number;
  [key: string]: unknown;
}

export interface TingeeCheckoutFailedPayload {
  status: 'failed' | 'expired';
  errorCode?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

export interface TingeeCheckoutCancelledPayload {
  status: 'cancelled';
  errorCode?: string;
  [key: string]: unknown;
}

export interface TingeeCheckoutErrorPayload {
  status: 'error';
  errorCode?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

export type TingeeCheckoutResultPayload =
  | TingeeCheckoutSuccessPayload
  | TingeeCheckoutFailedPayload
  | TingeeCheckoutCancelledPayload
  | TingeeCheckoutErrorPayload;

/**
 * Global / shared configuration options for TingeeCheckout (`window.Tingee`).
 */
export interface TingeeCheckoutConfig {
  /**
   * Modal size preset ('small' | 'medium' | 'large' | 'desktop' | 'wide' | 'xlarge' | 'full' | 'fullscreen')
   * or custom dimensions object. Default: 'medium'.
   */
  size?: TingeeSizeOption;
  width?: number | string;
  modalWidth?: number | string;
  height?: number | string;
  modalHeight?: number | string;
  maxWidth?: number | string;
  modalMaxWidth?: number | string;
  maxHeight?: number | string;
  modalMaxHeight?: number | string;
  borderRadius?: number | string;
  modalBorderRadius?: number | string;
  /**
   * Theme name or custom color object.
   */
  theme?: string | TingeeThemeConfig | null;
  /**
   * Whether the embedded checkout should emit result immediately without showing its internal result screen.
   */
  immediateResult?: boolean;
  /**
   * ID of an existing HTML element to render the checkout inline instead of a modal popup.
   */
  containerId?: string | null;
  /**
   * Direct HTMLElement reference to render the checkout inline (ideal for React/Vue/Angular refs).
   */
  container?: HTMLElement | null;
  /**
   * Close modal when user presses Escape key. Default: false.
   */
  closeOnEscape?: boolean;
  /**
   * Target environment ('prod' | 'uat') used to preload `tingee.js` when the page/component initializes.
   * Default: 'prod' (or auto-detected from checkout URL).
   */
  environment?: 'prod' | 'uat';
  /**
   * Optional custom script URL override for preloading.
   */
  scriptUrl?: string;
  /**
   * Automatically preload `tingee.js` in the background when the component/page initializes.
   * If the network is slow or offline when `open()` is clicked, the built-in engine is used as an instant fallback.
   * Default: true.
   */
  preloadScript?: boolean;
  /**
   * Callback fired when payment succeeds.
   */
  onSuccess?: (data: TingeeCheckoutSuccessPayload) => void;
  /**
   * Callback fired when payment fails or expires.
   */
  onFailed?: (data: TingeeCheckoutFailedPayload) => void;
  /**
   * Callback fired when the user actively cancels or closes the checkout popup.
   */
  onCancelled?: (data: TingeeCheckoutCancelledPayload) => void;
  /**
   * Callback fired when an unexpected error occurs inside the checkout SDK.
   */
  onError?: (data: TingeeCheckoutErrorPayload) => void;
  /**
   * Callback fired whenever the checkout modal/iframe is closed.
   */
  onClose?: () => void;
}

/**
 * Options for instantiating or opening a specific Checkout session.
 */
export interface TingeeCheckoutOptions extends TingeeCheckoutConfig {
  /**
   * Secure Checkout URL returned by Tingee Payment Gateway API.
   */
  url: string;
}

export interface ParentDisplayContext {
  displayMode: 'mobile' | 'desktop';
  isDesktopParent: boolean;
  isMobileParent: boolean;
  parentViewport: {
    width: number;
    height: number;
    screenWidth: number;
    screenHeight: number;
  };
}

export interface ResolvedModalSize {
  width: string;
  height: string;
  maxHeight: string;
  maxWidth: string;
  borderRadius: string;
}
