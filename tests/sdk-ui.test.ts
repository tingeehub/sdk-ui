// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Tingee,
  TingeeBankLink,
  TingeeBankLinkInstance,
  TingeeCheckoutInstance,
  openBankLinkAsync,
  openCheckoutAsync,
} from '../src/index';
import {
  TingeeBankLinkService,
  TingeeCheckoutService,
  provideTingeeSdkUi,
} from '../src/angular/index';

describe('@tingee/sdk-ui Core & Framework Wrappers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    TingeeBankLink.config = {};
    TingeeBankLink.activeInstance = null;
    Tingee.config = {};
    Tingee.activeInstance = null;
  });

  afterEach(() => {
    TingeeBankLink.close();
    Tingee.close();
  });

  describe('TingeeBankLink (Bank Link UI SDK)', () => {
    it('opens modal popup with embedded query params and custom size/theme', () => {
      const instance = TingeeBankLink.Url.Open(
        'https://uat-bank-link.tingee.vn?token=abc',
        {
          size: 'large',
          theme: { primaryColor: '#1E88E5' },
        }
      );

      expect(instance.isOpen).toBe(true);
      expect(instance.iframe).not.toBeNull();
      expect(instance.iframe?.src).toContain('tingeeEmbedded=1');
      expect(instance.iframe?.src).toContain('tingeeDisplayMode=');
      expect(instance.modalContainer).not.toBeNull();
      expect(document.body.contains(instance.modalContainer!)).toBe(true);
    });

    it('renders inline when container HTMLElement or containerId is provided', () => {
      const container = document.createElement('div');
      container.id = 'bank-link-inline';
      document.body.appendChild(container);

      const instance = new TingeeBankLinkInstance({
        url: 'https://bank-link.tingee.vn?token=xyz',
        container,
      }).open();

      expect(container.contains(instance.iframe!)).toBe(true);
      expect(instance.modalContainer).toBeNull();

      instance.close();
      expect(container.contains(instance.iframe)).toBe(false);
    });

    it('handles TINGEE_BANK_LINK_RESULT postMessage events and resolves openBankLinkAsync', async () => {
      const onSuccess = vi.fn();
      const promise = openBankLinkAsync('https://bank-link.tingee.vn?token=123', {
        onSuccess,
      });

      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'TINGEE_BANK_LINK_RESULT',
            data: {
              status: 'success',
              bankName: 'BIDV',
              merchantAccountNumberId: 456,
              vaAccountNumber: '1234567890',
              shopId: 123,
            },
          },
        })
      );

      const result = await promise;
      expect(result.status).toBe('success');
      expect(onSuccess).toHaveBeenCalledOnce();
      expect(TingeeBankLink.activeInstance?.isOpen).toBeFalsy();
    });

    it('filters AccountConfig resultAction properly', () => {
      const onSuccess = vi.fn();
      TingeeBankLink.AccountConfig.Open('https://bank-link.tingee.vn?token=cfg', {
        onSuccess,
      });

      // Normal bank-link message without account-config-register action should be ignored
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'TINGEE_BANK_LINK_RESULT',
            data: {
              status: 'success',
              bankName: 'VCB',
            },
          },
        })
      );
      expect(onSuccess).not.toHaveBeenCalled();

      // Matching action should trigger callback
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'TINGEE_BANK_LINK_RESULT',
            data: {
              status: 'success',
              action: 'account-config-register',
              bankName: 'VCB',
            },
          },
        })
      );
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  describe('TingeeCheckout (Payment Gateway UI SDK)', () => {
    it('opens checkout modal and handles TINGEE_PAYMENT_RESULT', async () => {
      const onSuccess = vi.fn();
      const promise = openCheckoutAsync('https://pay.tingee.vn/checkout?token=pay1', {
        size: 'medium',
        onSuccess,
      });

      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'TINGEE_PAYMENT_RESULT',
            data: {
              status: 'success',
              orderCode: 'ORD-001',
            },
          },
        })
      );

      const result = await promise;
      expect(result.status).toBe('success');
      expect(onSuccess).toHaveBeenCalledOnce();
    });

    it('renders checkout inline via direct container element', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const instance = new TingeeCheckoutInstance({
        url: 'https://pay.tingee.vn/checkout?token=inline1',
        container,
      }).open();

      expect(container.querySelector('iframe')).not.toBeNull();
      instance.close();
      expect(container.querySelector('iframe')).toBeNull();
    });
  });

  describe('Angular Services', () => {
    it('provides TingeeBankLinkService and TingeeCheckoutService', () => {
      const providers = provideTingeeSdkUi({
        bankLink: { size: 'large' },
        checkout: { size: 'small' },
      });
      expect(providers).toHaveLength(2);

      const bankLinkService = new TingeeBankLinkService();
      const checkoutService = new TingeeCheckoutService();

      const container = document.createElement('div');
      document.body.appendChild(container);

      const inst = bankLinkService.mountInline(
        { nativeElement: container },
        { url: 'https://bank-link.tingee.vn?token=ng' }
      );
      expect(inst.isOpen).toBe(true);
      inst.close();

      const checkoutInst = checkoutService.open('https://pay.tingee.vn/checkout?token=ng');
      expect(checkoutInst.isOpen).toBe(true);
      checkoutService.close();
    });
  });
});
