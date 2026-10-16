import { Tingee } from '../core/checkout';
import { isBrowser } from '../core/dom-utils';

if (isBrowser()) {
  window.Tingee = Tingee;
  window.TingeeCheckout = Tingee;

  const autoInit = () => {
    Tingee.initFromUrl();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    setTimeout(autoInit, 0);
  }
}
