# @tingee/sdk-ui

Bộ thư viện **Tingee UI SDK** chính thức dành cho ứng dụng Web Frontend — giúp đối tác tích hợp nhanh giao diện **Liên kết ngân hàng (Bank Link)** và **Cổng thanh toán (Payment Gateway)** của Tingee vào **React, Next.js, Vue 3, Nuxt, Angular** hoặc **JavaScript/TypeScript** thuần mà không cần nhúng thẻ `<script>` thủ công.

📖 **Tài liệu đầy đủ:** [developers.tingee.vn](https://developers.tingee.vn)

---

## Cài đặt

```bash
npm install @tingee/sdk-ui
```

Hoặc sử dụng `yarn` / `pnpm`:

```bash
yarn add @tingee/sdk-ui
# hoặc
pnpm add @tingee/sdk-ui
```

---

## Danh sách Module

Bạn sử dụng tính năng hoặc framework nào thì chỉ cần import đúng đường dẫn (subpath) tương ứng:

| Đường dẫn Import | Dành cho | Các thành phần cung cấp |
| :--- | :--- | :--- |
| `@tingee/sdk-ui/react` | **React / Next.js** | `useTingeeBankLink`, `useTingeeCheckout`, `<TingeeBankLinkEmbed />`, `<TingeeCheckoutEmbed />` |
| `@tingee/sdk-ui/vue` | **Vue 3 / Nuxt** | `useTingeeBankLink`, `useTingeeCheckout`, `<TingeeBankLinkEmbed />`, `<TingeeCheckoutEmbed />` |
| `@tingee/sdk-ui/angular` | **Angular (14+)** | `TingeeBankLinkService`, `TingeeCheckoutService`, `provideTingeeBankLink`, `provideTingeeCheckout` |
| `@tingee/sdk-ui` | **Vanilla JS / TS** | `TingeeBankLink`, `Tingee`, `openBankLink`, `openCheckout`, `openBankLinkAsync`, `openCheckoutAsync` |

---

## 1. Tích hợp SDK Liên kết Ngân hàng (Bank Link)

Trước khi mở giao diện trên Frontend, Backend của bạn cần gọi API [Tạo phiên liên kết (`/v1/create-bank-link-session`)](https://developers.tingee.vn/docs/bank-link/create-session) để lấy đường dẫn `url` bảo mật.

### 1.1. React / Next.js

#### Mở dạng Popup (Modal)
```tsx
'use client';
import React from 'react';
import { useTingeeBankLink } from '@tingee/sdk-ui/react';

export default function BankLinkButton() {
  const { open, isOpen } = useTingeeBankLink({
    environment: 'prod', // 'prod' | 'uat' (mặc định: 'prod')
    size: 'large',       // 'small' | 'medium' | 'large' | 'desktop' | 'wide' | 'xlarge' | 'full'
    theme: {
      primaryColor: '#1E88E5',
    },
    onSuccess: (data) => {
      console.log('Liên kết thành công:', data);
      // { status: 'success', bankName: 'BIDV', merchantAccountNumberId: 456, vaAccountNumber: '1234567890', shopId: 123 }
    },
    onFailed: (err) => {
      console.error('Liên kết thất bại:', err.errorCode, err.errorMessage);
    },
    onCancelled: () => {
      console.log('Khách hàng đã đóng cửa sổ liên kết');
    },
  });

  const handleStartLink = async () => {
    // Gọi API Backend của bạn để lấy session URL
    const response = await fetch('/api/bank-link/session', { method: 'POST' });
    const { url } = await response.json();

    open(url);
  };

  return (
    <button onClick={handleStartLink} disabled={isOpen}>
      {isOpen ? 'Đang xử lý...' : 'Liên kết tài khoản ngân hàng'}
    </button>
  );
}
```

#### Sử dụng với `async/await` (`openAsync`)
```tsx
const { openAsync } = useTingeeBankLink({ size: 'large' });

const handleStartLink = async () => {
  const response = await fetch('/api/bank-link/session', { method: 'POST' });
  const { url } = await response.json();

  const result = await openAsync(url);
  if (result.status === 'success') {
    console.log('Tài khoản VA:', result.vaAccountNumber);
  }
};
```

#### Nhúng trực tiếp lên trang (Inline Mode)
```tsx
import { TingeeBankLinkEmbed } from '@tingee/sdk-ui/react';

export function BankLinkInlinePage({ sessionUrl }: { sessionUrl: string }) {
  return (
    <TingeeBankLinkEmbed
      url={sessionUrl}
      style={{ width: '100%', height: '760px' }}
      theme={{ primaryColor: '#1E88E5' }}
      onSuccess={(data) => console.log('Liên kết thành công:', data)}
      onFailed={(err) => console.error('Lỗi:', err.errorMessage)}
      onCancelled={() => console.log('Đã hủy')}
    />
  );
}
```

---

### 1.2. Vue 3 / Nuxt

```vue
<script setup lang="ts">
import { useTingeeBankLink } from '@tingee/sdk-ui/vue';

const { open, isOpen } = useTingeeBankLink({
  environment: 'prod',
  size: 'large',
  theme: { primaryColor: '#1E88E5' },
  onSuccess: (data) => {
    console.log('Liên kết thành công:', data);
  },
  onFailed: (err) => {
    console.error('Liên kết thất bại:', err.errorMessage);
  },
  onCancelled: () => {
    console.log('Khách hàng đã đóng SDK');
  },
});

const startLinking = async () => {
  const response = await fetch('/api/bank-link/session', { method: 'POST' });
  const { url } = await response.json();
  open(url);
};
</script>

<template>
  <button :disabled="isOpen" @click="startLinking">
    Liên kết tài khoản ngân hàng
  </button>
</template>
```

---

### 1.3. Angular

**Bước 1:** Đăng ký provider trong `app.config.ts` (hoặc `AppModule`):

```ts
import { ApplicationConfig } from '@angular/core';
import { provideTingeeBankLink } from '@tingee/sdk-ui/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    ...provideTingeeBankLink({
      environment: 'prod',
      size: 'large',
      theme: { primaryColor: '#1E88E5' },
    }),
  ],
};
```

**Bước 2:** Sử dụng `TingeeBankLinkService` trong Component:

```ts
import { Component, inject } from '@angular/core';
import { TingeeBankLinkService } from '@tingee/sdk-ui/angular';

@Component({
  selector: 'app-bank-link',
  standalone: true,
  template: `
    <button (click)="startLinking()">Liên kết tài khoản ngân hàng</button>
  `,
})
export class BankLinkComponent {
  private bankLinkService = inject(TingeeBankLinkService);

  async startLinking() {
    const url = await this.myBackendService.createBankLinkSession();
    const result = await this.bankLinkService.openAsync(url);

    if (result.status === 'success') {
      console.log('Liên kết thành công:', result);
    }
  }
}
```

---

### 1.4. Vanilla JS / TypeScript

```ts
import { TingeeBankLink } from '@tingee/sdk-ui';

// Cấu hình mặc định
TingeeBankLink.Setup({
  size: 'large',
  theme: { primaryColor: '#1E88E5' },
  onSuccess: (data) => console.log('Liên kết thành công:', data),
  onFailed: (err) => console.error('Liên kết thất bại:', err.errorMessage),
  onCancelled: () => console.log('Khách hàng đóng SDK'),
});

// Mở popup khi có session URL từ Backend
TingeeBankLink.Url.Open('https://bank-link.tingee.vn?token=...');
```

---

## 2. Tích hợp SDK Cổng Thanh toán (Payment Gateway)

Trước khi mở popup thanh toán, Backend của bạn gọi API [Tạo link thanh toán](https://developers.tingee.vn/docs/payment-gateway/create-payment-link) để lấy `checkoutUrl`.

### 2.1. React / Next.js

```tsx
'use client';
import React from 'react';
import { useTingeeCheckout } from '@tingee/sdk-ui/react';

export default function CheckoutButton() {
  const { open, isOpen } = useTingeeCheckout({
    environment: 'prod', // 'prod' | 'uat'
    size: 'medium',      // 'small' | 'medium' | 'large'
    onSuccess: (data) => {
      console.log('Thanh toán thành công:', data);
      window.location.href = '/checkout/success';
    },
    onFailed: (err) => {
      console.error('Giao dịch thất bại hoặc hết hạn:', err);
    },
    onCancelled: () => {
      console.log('Khách hàng đã hủy thanh toán');
    },
  });

  const handlePayment = async () => {
    const response = await fetch('/api/create-payment', { method: 'POST' });
    const { checkoutUrl } = await response.json();

    open(checkoutUrl);
  };

  return (
    <button onClick={handlePayment} disabled={isOpen}>
      {isOpen ? 'Đang mở cổng thanh toán...' : 'Thanh toán ngay'}
    </button>
  );
}
```

---

### 2.2. Vue 3 / Nuxt

```vue
<script setup lang="ts">
import { useTingeeCheckout } from '@tingee/sdk-ui/vue';

const { open, isOpen } = useTingeeCheckout({
  size: 'medium',
  onSuccess: (data) => {
    console.log('Thanh toán thành công:', data);
  },
  onCancelled: () => {
    console.log('Khách hàng đã hủy thanh toán');
  },
});

const handlePayment = async () => {
  const response = await fetch('/api/create-payment', { method: 'POST' });
  const { checkoutUrl } = await response.json();
  open(checkoutUrl);
};
</script>

<template>
  <button :disabled="isOpen" @click="handlePayment">
    Thanh toán ngay
  </button>
</template>
```

---

### 2.3. Angular

```ts
// 1. Trong app.config.ts:
import { ApplicationConfig } from '@angular/core';
import { provideTingeeCheckout } from '@tingee/sdk-ui/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    ...provideTingeeCheckout({ size: 'medium' }),
  ],
};

// 2. Trong Component:
import { Component, inject } from '@angular/core';
import { TingeeCheckoutService } from '@tingee/sdk-ui/angular';

@Component({
  selector: 'app-checkout',
  standalone: true,
  template: `<button (click)="handlePayment()">Thanh toán ngay</button>`,
})
export class CheckoutComponent {
  private checkoutService = inject(TingeeCheckoutService);

  async handlePayment() {
    const checkoutUrl = await this.paymentService.createPaymentLink();
    const result = await this.checkoutService.openAsync(checkoutUrl);

    if (result.status === 'success') {
      console.log('Thanh toán thành công:', result);
    }
  }
}
```

---

### 2.4. Vanilla JS / TypeScript

```ts
import { Tingee } from '@tingee/sdk-ui';

Tingee.Setup({
  size: 'medium',
  onSuccess: (data) => console.log('Thanh toán thành công:', data),
  onFailed: (err) => console.error('Thanh toán thất bại:', err),
  onCancelled: () => console.log('Khách hàng hủy thanh toán'),
});

Tingee.Url.Open('https://pay.tingee.vn/checkout?token=...');
```

---

## 3. Tham số cấu hình (Configuration Options)

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `environment` | `'prod' \| 'uat'` | `'prod'` | Môi trường tích hợp (`'uat'` cho Sandbox/Test, `'prod'` cho Production). |
| `size` | `'small' \| 'medium' \| 'large' \| 'desktop' \| 'wide' \| 'xlarge' \| 'full' \| object` | `'medium'` | Kích thước cửa sổ Popup hoặc truyền object `{ width, height, maxWidth, maxHeight, borderRadius }`. |
| `theme` | `string \| { primaryColor?: string }` | `null` | Tùy chỉnh màu sắc chủ đạo của giao diện nhúng (ví dụ: `{ primaryColor: '#1E88E5' }`). |
| `container` | `HTMLElement \| null` | `null` | Phần tử DOM trực tiếp để nhúng giao diện ở chế độ Inline (thay vì mở Popup). |
| `containerId` | `string \| null` | `null` | ID của thẻ HTML để nhúng giao diện ở chế độ Inline. |
| `closeOnEscape` | `boolean` | `false` | Cho phép đóng Popup khi nhấn phím `Esc`. |
| `onSuccess` | `(data) => void` | — | Callback được gọi khi liên kết ngân hàng hoặc thanh toán thành công. |
| `onFailed` | `(error) => void` | — | Callback được gọi khi phát sinh lỗi nghiệp vụ hoặc giao dịch hết hạn. |
| `onCancelled` | `(data) => void` | — | Callback được gọi khi người dùng chủ động nhấn nút đóng (`X`) cửa sổ. |
| `onError` | `(error) => void` | — | Callback được gọi khi có lỗi hệ thống phát sinh trong SDK. |
| `onClose` | `() => void` | — | Callback luôn được gọi sau khi cửa sổ SDK đóng lại. |

---

## 4. Định dạng dữ liệu trả về (Callback Payloads)

### Khi Liên kết ngân hàng thành công (`onSuccess`)
```json
{
  "status": "success",
  "bankName": "BIDV",
  "merchantAccountNumberId": 456,
  "vaAccountNumber": "1234567890",
  "shopId": 123
}
```

### Khi thất bại (`onFailed`)
```json
{
  "status": "failed",
  "errorCode": "BANK_CONFIG_NOT_EXIST",
  "errorMessage": "Cấu hình ngân hàng không tồn tại"
}
```

### Khi người dùng chủ động đóng (`onCancelled`)
```json
{
  "status": "cancelled",
  "errorCode": "USER_CLOSED"
}
```

---

## Hỗ trợ & Liên hệ

- **Tài liệu OpenAPI & SDK:** [https://developers.tingee.vn](https://developers.tingee.vn)
- **Website chính thức:** [https://tingee.vn](https://tingee.vn)
- **Email hỗ trợ kỹ thuật:** [developer@heno.vn](mailto:developer@heno.vn)
- **Telegram:** [https://t.me/tingeesupport](https://t.me/tingeesupport)
- **GitHub:** [https://github.com/tingeehub](https://github.com/tingeehub)
