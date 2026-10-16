import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
  type Ref,
} from 'vue';
import {
  TingeeBankLinkInstance,
  TingeeCheckoutInstance,
  preloadBankLinkScript,
  preloadCheckoutScript,
  type TingeeBankLinkCancelledPayload,
  type TingeeBankLinkConfig,
  type TingeeBankLinkErrorPayload,
  type TingeeBankLinkFailedPayload,
  type TingeeBankLinkResultPayload,
  type TingeeBankLinkSuccessPayload,
  type TingeeCheckoutCancelledPayload,
  type TingeeCheckoutConfig,
  type TingeeCheckoutErrorPayload,
  type TingeeCheckoutFailedPayload,
  type TingeeCheckoutResultPayload,
  type TingeeCheckoutSuccessPayload,
  type TingeeThemeConfig,
} from '../index';

export interface UseVueTingeeBankLinkReturn {
  open: (url: string, overrideOptions?: TingeeBankLinkConfig) => TingeeBankLinkInstance;
  openAsync: (
    url: string,
    overrideOptions?: TingeeBankLinkConfig
  ) => Promise<TingeeBankLinkResultPayload>;
  openAccountConfig: (
    url: string,
    overrideOptions?: TingeeBankLinkConfig
  ) => TingeeBankLinkInstance;
  openAccountConfigAsync: (
    url: string,
    overrideOptions?: TingeeBankLinkConfig
  ) => Promise<TingeeBankLinkResultPayload>;
  close: () => void;
  isOpen: Ref<boolean>;
}

/**
 * Vue 3 Composable for Tingee Bank Link UI SDK.
 */
export function useTingeeBankLink(
  defaultOptions: TingeeBankLinkConfig & { closeOnUnmount?: boolean } = {}
): UseVueTingeeBankLinkReturn {
  const isOpen = ref(false);
  let activeInstance: TingeeBankLinkInstance | null = null;

  const close = () => {
    if (activeInstance) {
      activeInstance.close();
      activeInstance = null;
      isOpen.value = false;
    }
  };

  const open = (
    url: string,
    overrideOptions: TingeeBankLinkConfig = {}
  ): TingeeBankLinkInstance => {
    if (activeInstance) {
      activeInstance.close();
    }

    const merged: TingeeBankLinkConfig = {
      ...defaultOptions,
      ...overrideOptions,
    };

    const instance = new TingeeBankLinkInstance({
      ...merged,
      url,
      onSuccess: (data) => {
        overrideOptions.onSuccess
          ? overrideOptions.onSuccess(data)
          : defaultOptions.onSuccess?.(data);
      },
      onFailed: (data) => {
        overrideOptions.onFailed
          ? overrideOptions.onFailed(data)
          : defaultOptions.onFailed?.(data);
      },
      onCancelled: (data) => {
        overrideOptions.onCancelled
          ? overrideOptions.onCancelled(data)
          : defaultOptions.onCancelled?.(data);
      },
      onError: (data) => {
        overrideOptions.onError
          ? overrideOptions.onError(data)
          : defaultOptions.onError?.(data);
      },
      onClose: () => {
        isOpen.value = false;
        activeInstance = null;
        overrideOptions.onClose
          ? overrideOptions.onClose()
          : defaultOptions.onClose?.();
      },
    });

    activeInstance = instance;
    isOpen.value = true;
    return instance.open();
  };

  const openAsync = (
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
            : defaultOptions.onSuccess?.(data);
          settle(data);
        },
        onFailed: (data) => {
          overrideOptions.onFailed
            ? overrideOptions.onFailed(data)
            : defaultOptions.onFailed?.(data);
          settle(data);
        },
        onCancelled: (data) => {
          overrideOptions.onCancelled
            ? overrideOptions.onCancelled(data)
            : defaultOptions.onCancelled?.(data);
          settle(data);
        },
        onError: (data) => {
          overrideOptions.onError
            ? overrideOptions.onError(data)
            : defaultOptions.onError?.(data);
          settle(data);
        },
        onClose: () => {
          overrideOptions.onClose
            ? overrideOptions.onClose()
            : defaultOptions.onClose?.();
          settle({ status: 'cancelled', errorCode: 'USER_CLOSED' });
        },
      });
    });
  };

  const openAccountConfig = (
    url: string,
    overrideOptions: TingeeBankLinkConfig = {}
  ): TingeeBankLinkInstance => {
    return open(url, {
      ...overrideOptions,
      resultAction: 'account-config-register',
    });
  };

  const openAccountConfigAsync = (
    url: string,
    overrideOptions: TingeeBankLinkConfig = {}
  ): Promise<TingeeBankLinkResultPayload> => {
    return openAsync(url, {
      ...overrideOptions,
      resultAction: 'account-config-register',
    });
  };

  onMounted(() => {
    if (defaultOptions.preloadScript !== false) {
      void preloadBankLinkScript({
        environment: defaultOptions.environment,
        scriptUrl: defaultOptions.scriptUrl,
      });
    }
  });

  onBeforeUnmount(() => {
    if (defaultOptions.closeOnUnmount !== false) {
      close();
    }
  });

  return {
    open,
    openAsync,
    openAccountConfig,
    openAccountConfigAsync,
    close,
    isOpen,
  };
}

export interface UseVueTingeeCheckoutReturn {
  open: (url: string, overrideOptions?: TingeeCheckoutConfig) => TingeeCheckoutInstance;
  openAsync: (
    url: string,
    overrideOptions?: TingeeCheckoutConfig
  ) => Promise<TingeeCheckoutResultPayload>;
  close: () => void;
  isOpen: Ref<boolean>;
}

/**
 * Vue 3 Composable for Tingee Payment Gateway Checkout UI SDK.
 */
export function useTingeeCheckout(
  defaultOptions: TingeeCheckoutConfig & { closeOnUnmount?: boolean } = {}
): UseVueTingeeCheckoutReturn {
  const isOpen = ref(false);
  let activeInstance: TingeeCheckoutInstance | null = null;

  const close = () => {
    if (activeInstance) {
      activeInstance.close();
      activeInstance = null;
      isOpen.value = false;
    }
  };

  const open = (
    url: string,
    overrideOptions: TingeeCheckoutConfig = {}
  ): TingeeCheckoutInstance => {
    if (activeInstance) {
      activeInstance.close();
    }

    const merged: TingeeCheckoutConfig = {
      ...defaultOptions,
      ...overrideOptions,
    };

    const instance = new TingeeCheckoutInstance({
      ...merged,
      url,
      onSuccess: (data) => {
        overrideOptions.onSuccess
          ? overrideOptions.onSuccess(data)
          : defaultOptions.onSuccess?.(data);
      },
      onFailed: (data) => {
        overrideOptions.onFailed
          ? overrideOptions.onFailed(data)
          : defaultOptions.onFailed?.(data);
      },
      onCancelled: (data) => {
        overrideOptions.onCancelled
          ? overrideOptions.onCancelled(data)
          : defaultOptions.onCancelled?.(data);
      },
      onError: (data) => {
        overrideOptions.onError
          ? overrideOptions.onError(data)
          : defaultOptions.onError?.(data);
      },
      onClose: () => {
        isOpen.value = false;
        activeInstance = null;
        overrideOptions.onClose
          ? overrideOptions.onClose()
          : defaultOptions.onClose?.();
      },
    });

    activeInstance = instance;
    isOpen.value = true;
    return instance.open();
  };

  const openAsync = (
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
            : defaultOptions.onSuccess?.(data);
          settle(data);
        },
        onFailed: (data) => {
          overrideOptions.onFailed
            ? overrideOptions.onFailed(data)
            : defaultOptions.onFailed?.(data);
          settle(data);
        },
        onCancelled: (data) => {
          overrideOptions.onCancelled
            ? overrideOptions.onCancelled(data)
            : defaultOptions.onCancelled?.(data);
          settle(data);
        },
        onError: (data) => {
          overrideOptions.onError
            ? overrideOptions.onError(data)
            : defaultOptions.onError?.(data);
          settle(data);
        },
        onClose: () => {
          overrideOptions.onClose
            ? overrideOptions.onClose()
            : defaultOptions.onClose?.();
          settle({ status: 'cancelled', errorCode: 'USER_CLOSED' });
        },
      });
    });
  };

  onMounted(() => {
    if (defaultOptions.preloadScript !== false) {
      void preloadCheckoutScript({
        environment: defaultOptions.environment,
        scriptUrl: defaultOptions.scriptUrl,
      });
    }
  });

  onBeforeUnmount(() => {
    if (defaultOptions.closeOnUnmount !== false) {
      close();
    }
  });

  return {
    open,
    openAsync,
    close,
    isOpen,
  };
}

/**
 * Vue 3 Component for Inline Tingee Bank Link Embed.
 */
export const TingeeBankLinkEmbed = defineComponent({
  name: 'TingeeBankLinkEmbed',
  props: {
    url: {
      type: String,
      required: true,
    },
    theme: {
      type: [String, Object] as PropType<string | TingeeThemeConfig | null>,
      default: null,
    },
    resultAction: {
      type: String as PropType<string | null>,
      default: null,
    },
    height: {
      type: String,
      default: '760px',
    },
  },
  emits: {
    success: (_payload: TingeeBankLinkSuccessPayload) => true,
    failed: (_payload: TingeeBankLinkFailedPayload) => true,
    cancelled: (_payload: TingeeBankLinkCancelledPayload) => true,
    error: (_payload: TingeeBankLinkErrorPayload) => true,
    close: () => true,
  },
  setup(props, { emit }) {
    const containerRef = ref<HTMLElement | null>(null);
    let instance: TingeeBankLinkInstance | null = null;

    const mountIframe = () => {
      if (instance) {
        instance.close();
        instance = null;
      }
      if (!props.url || !containerRef.value) return;

      instance = new TingeeBankLinkInstance({
        url: props.url,
        container: containerRef.value,
        theme: props.theme,
        resultAction: props.resultAction,
        onSuccess: (data) => emit('success', data),
        onFailed: (data) => emit('failed', data),
        onCancelled: (data) => emit('cancelled', data),
        onError: (data) => emit('error', data),
        onClose: () => emit('close'),
      });
      instance.open();
    };

    onMounted(mountIframe);
    watch(() => [props.url, props.theme, props.resultAction], mountIframe);
    onBeforeUnmount(() => {
      if (instance) {
        instance.close();
        instance = null;
      }
    });

    return () =>
      h('div', {
        ref: containerRef,
        style: { width: '100%', height: props.height },
      });
  },
});

/**
 * Vue 3 Component for Inline Tingee Checkout Embed.
 */
export const TingeeCheckoutEmbed = defineComponent({
  name: 'TingeeCheckoutEmbed',
  props: {
    url: {
      type: String,
      required: true,
    },
    theme: {
      type: [String, Object] as PropType<string | TingeeThemeConfig | null>,
      default: null,
    },
    immediateResult: {
      type: Boolean,
      default: false,
    },
    height: {
      type: String,
      default: '720px',
    },
  },
  emits: {
    success: (_payload: TingeeCheckoutSuccessPayload) => true,
    failed: (_payload: TingeeCheckoutFailedPayload) => true,
    cancelled: (_payload: TingeeCheckoutCancelledPayload) => true,
    error: (_payload: TingeeCheckoutErrorPayload) => true,
    close: () => true,
  },
  setup(props, { emit }) {
    const containerRef = ref<HTMLElement | null>(null);
    let instance: TingeeCheckoutInstance | null = null;

    const mountIframe = () => {
      if (instance) {
        instance.close();
        instance = null;
      }
      if (!props.url || !containerRef.value) return;

      instance = new TingeeCheckoutInstance({
        url: props.url,
        container: containerRef.value,
        theme: props.theme,
        immediateResult: props.immediateResult,
        onSuccess: (data) => emit('success', data),
        onFailed: (data) => emit('failed', data),
        onCancelled: (data) => emit('cancelled', data),
        onError: (data) => emit('error', data),
        onClose: () => emit('close'),
      });
      instance.open();
    };

    onMounted(mountIframe);
    watch(() => [props.url, props.theme, props.immediateResult], mountIframe);
    onBeforeUnmount(() => {
      if (instance) {
        instance.close();
        instance = null;
      }
    });

    return () =>
      h('div', {
        ref: containerRef,
        style: { width: '100%', height: props.height },
      });
  },
});

export * from '../index';
