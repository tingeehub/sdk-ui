import { TingeeBankLink } from '../core/bank-link';
import { isBrowser } from '../core/dom-utils';

if (isBrowser()) {
  window.TingeeBankLink = TingeeBankLink;

  const autoInit = () => {
    TingeeBankLink.initFromUrl();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    setTimeout(autoInit, 0);
  }
}
