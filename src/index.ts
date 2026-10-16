export * from './core/types';
export {
  BANK_LINK_SCRIPT_URLS,
  CHECKOUT_SCRIPT_URLS,
  type TingeeEnvironment,
  detectEnvironment,
  loadScriptOnce,
  preloadBankLinkScript,
  preloadCheckoutScript,
} from './core/script-loader';
export {
  TingeeBankLinkInstance,
  TingeeBankLink,
  type TingeeBankLinkManager,
  setupBankLink,
  openBankLink,
  openBankLinkAsync,
  openAccountConfig,
  openAccountConfigAsync,
} from './core/bank-link';
export {
  TingeeCheckoutInstance,
  Tingee,
  TingeeCheckout,
  type TingeeCheckoutManager,
  setupCheckout,
  openCheckout,
  openCheckoutAsync,
} from './core/checkout';

import type { TingeeBankLinkManager } from './core/bank-link';
import type { TingeeCheckoutManager } from './core/checkout';

declare global {
  interface Window {
    TingeeBankLink?: TingeeBankLinkManager;
    Tingee?: TingeeCheckoutManager;
    TingeeCheckout?: TingeeCheckoutManager;
  }
}
