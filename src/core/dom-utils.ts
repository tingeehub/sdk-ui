import type {
  ParentDisplayContext,
  ResolvedModalSize,
  TingeeCustomSize,
  TingeeSizeOption,
  TingeeThemeConfig,
} from './types';

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function resolveThemeConfig(
  options: Record<string, unknown>
): string | TingeeThemeConfig | null {
  if (typeof options.theme === 'string') {
    return options.theme;
  }

  const resolved: TingeeThemeConfig = Object.assign(
    {},
    options.theme && typeof options.theme === 'object'
      ? (options.theme as TingeeThemeConfig)
      : {}
  );

  const colorKeys = [
    'primaryColor',
    'primaryHoverColor',
    'primaryHover',
    'primarySoftColor',
    'primarySoft',
  ] as const;

  for (const key of colorKeys) {
    if (typeof options[key] === 'string' && !resolved[key]) {
      resolved[key] = options[key] as string;
    }
  }

  for (const key of Object.keys(options)) {
    if (key.indexOf('--') === 0 && typeof options[key] === 'string' && !resolved[key]) {
      resolved[key] = options[key] as string;
    }
  }

  return Object.keys(resolved).length > 0 ? resolved : null;
}

export function getParentDisplayContext(): ParentDisplayContext {
  if (!isBrowser()) {
    return {
      displayMode: 'desktop',
      isDesktopParent: true,
      isMobileParent: false,
      parentViewport: {
        width: 1024,
        height: 768,
        screenWidth: 1024,
        screenHeight: 768,
      },
    };
  }

  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const height = window.innerHeight || document.documentElement.clientHeight || 0;
  const screenWidth = window.screen?.width || width;
  const screenHeight = window.screen?.height || height;

  const isNarrowViewport = width > 0 && width < 768;
  const isCoarsePointer =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false;
  const isMobileUserAgent =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
    );
  const isSmallScreen =
    Math.min(screenWidth, screenHeight) > 0 && Math.min(screenWidth, screenHeight) < 768;

  const isMobileParent =
    isNarrowViewport || isMobileUserAgent || (isCoarsePointer && isSmallScreen);
  const displayMode = isMobileParent ? 'mobile' : 'desktop';

  return {
    displayMode,
    isDesktopParent: displayMode === 'desktop',
    isMobileParent,
    parentViewport: {
      width,
      height,
      screenWidth,
      screenHeight,
    },
  };
}

const DEFAULT_MODAL_SIZE: ResolvedModalSize = {
  width: '480px',
  height: '90%',
  maxHeight: '720px',
  maxWidth: 'calc(100vw - 32px)',
  borderRadius: '24px',
};

const PRESET_MODAL_SIZES: Record<string, Partial<ResolvedModalSize>> = {
  small: { width: '380px' },
  medium: { width: '480px' },
  large: { width: '600px' },
  desktop: { width: '768px', maxHeight: '760px' },
  wide: { width: '900px', height: '92%', maxHeight: '800px' },
  xlarge: { width: '960px', height: '92%', maxHeight: '820px' },
  full: {
    width: '100vw',
    height: '100vh',
    maxHeight: '100vh',
    maxWidth: '100vw',
    borderRadius: '0px',
  },
  fullscreen: {
    width: '100vw',
    height: '100vh',
    maxHeight: '100vh',
    maxWidth: '100vw',
    borderRadius: '0px',
  },
};

function toCssDimension(value: number | string | undefined | null): string | null {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return value || null;
}

export function resolveModalSize(options: {
  size?: TingeeSizeOption;
  modalWidth?: number | string | null;
  modalHeight?: number | string | null;
  modalMaxHeight?: number | string | null;
  modalMaxWidth?: number | string | null;
  modalBorderRadius?: number | string | null;
}): ResolvedModalSize {
  let preset: Partial<ResolvedModalSize> = {};
  let custom: TingeeCustomSize = {};

  const size = options.size ?? 'medium';

  if (typeof size === 'string') {
    const key = size.toLowerCase();
    preset = PRESET_MODAL_SIZES[key] || {};
    if (!PRESET_MODAL_SIZES[key]) {
      custom.width = size;
    }
  } else if (typeof size === 'number') {
    custom.width = size;
  } else if (size && typeof size === 'object') {
    custom = size;
  }

  return {
    width:
      toCssDimension(options.modalWidth || custom.width || preset.width) ||
      DEFAULT_MODAL_SIZE.width,
    height:
      toCssDimension(options.modalHeight || custom.height || preset.height) ||
      DEFAULT_MODAL_SIZE.height,
    maxHeight:
      toCssDimension(options.modalMaxHeight || custom.maxHeight || preset.maxHeight) ||
      DEFAULT_MODAL_SIZE.maxHeight,
    maxWidth:
      toCssDimension(options.modalMaxWidth || custom.maxWidth || preset.maxWidth) ||
      DEFAULT_MODAL_SIZE.maxWidth,
    borderRadius:
      toCssDimension(
        options.modalBorderRadius || custom.borderRadius || preset.borderRadius
      ) || DEFAULT_MODAL_SIZE.borderRadius,
  };
}

export function ensureModalStyles(styleId: string, innerClassName: string, cssVarPrefix: string): void {
  if (!isBrowser()) return;
  if (document.getElementById(styleId)) return;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.innerHTML = `
    .${innerClassName} {
      max-width: 100%;
    }
    @media (min-width: 640px) {
      .${innerClassName} {
        width: var(${cssVarPrefix}-width, 480px) !important;
        height: var(${cssVarPrefix}-height, 90%) !important;
        max-width: var(${cssVarPrefix}-max-width, calc(100vw - 32px)) !important;
        max-height: var(${cssVarPrefix}-max-height, 720px) !important;
        border-radius: var(${cssVarPrefix}-border-radius, 24px) !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

export function createCloseButton(onClick: () => void): HTMLButtonElement {
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close Tingee Dialog');
  closeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '12px';
  closeBtn.style.right = '12px';
  closeBtn.style.width = '28px';
  closeBtn.style.height = '28px';
  closeBtn.style.borderRadius = '50%';
  closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  closeBtn.style.border = 'none';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';
  closeBtn.style.color = '#4b5563';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.zIndex = '10';
  closeBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  closeBtn.style.transition = 'all 0.2s';
  closeBtn.onmouseover = () => {
    closeBtn.style.backgroundColor = '#fff';
    closeBtn.style.transform = 'scale(1.05)';
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    closeBtn.style.transform = 'scale(1)';
  };
  closeBtn.onclick = onClick;
  return closeBtn;
}
