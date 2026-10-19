# Changelog

## [1.0.0] - 2026-10-19

### Added

- **Core SDK (`@tingee/sdk-ui`)**:
  - Tích hợp **Tingee Bank Link UI SDK** (`TingeeBankLink.Setup`, `open`, `close`, `destroy`) hỗ trợ cả 2 chế độ **Modal (Popup)** và **Embed (Nhúng trực tiếp vào container)**.
  - Tích hợp **Tingee Payment Gateway Checkout UI SDK** (`Tingee.Checkout`, `open`, `embed`, `close`, `destroy`) hỗ trợ cả 2 chế độ **Modal** và **Embed**.
  - Cơ chế **Smart Preload & Fallback Engine**: Tự động tải trước script CDN (`preloadBankLinkScript`, `preloadCheckoutScript`) ngay khi khởi tạo và dự phòng sẵn engine nội bộ, đảm bảo giao diện mở mượt ngay cả khi kết nối mạng chậm hoặc CDN bị gián đoạn.
  - Tự động chuẩn hóa URL, tự động điền `baseUrl` mặc định theo môi trường, chống XSS/clickjacking và kiểm tra `event.origin` an toàn cho `postMessage`.
  - Hỗ trợ đầy đủ **TypeScript Definitions (`.d.ts`, `.d.cts`)** cho cả ESM và CommonJS.
- **React / Next.js (`@tingee/sdk-ui/react`)**:
  - Cung cấp hooks `useTingeeBankLink`, `useTingeeCheckout` (SSR-safe, tự động preload script khi mount và dọn dẹp khi unmount).
  - Cung cấp components nhúng trực tiếp `<TingeeBankLinkEmbed />` và `<TingeeCheckoutEmbed />`.
- **Vue 3 / Nuxt 3 (`@tingee/sdk-ui/vue`)**:
  - Cung cấp composables `useTingeeBankLink`, `useTingeeCheckout` với reactive state (`isReady`, `isOpen`, `error`).
  - Cung cấp components `<TingeeBankLinkEmbed />` và `<TingeeCheckoutEmbed />`.
- **Angular 14+ (`@tingee/sdk-ui/angular`)**:
  - Cung cấp DI Services `TingeeBankLinkService`, `TingeeCheckoutService` và standalone providers (`provideTingeeBankLink`, `provideTingeeCheckout`, `provideTingeeSdkUi`).
- **CDN / Script Tag Bundle**:
  - Đóng gói sẵn file IIFE (`tingee-bank-link.global.js` và `tingee.global.js`) cho các website HTML/PHP/WordPress truyền thống.
