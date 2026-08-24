# Changelog

## [2.1.0] - 2026-08-25

### Added

- **SEO Score engine** (`score.js`): điểm 0-100 với xếp loại A-F.
  Công thức: `100 - 15 x errors - 5 x warnings`, hiển thị dạng vòng tròn
  trên cả panel và popup.
- **Indexability & technical audit** (`audit.js`):
  - HTTP status detection qua `PerformanceNavigationTiming`
    (4xx/5xx = error, 3xx redirect = warning).
  - Canonical tag validation: thiếu, trùng lặp, hoặc không tự tham chiếu.
  - Hreflang audit: validate cú pháp mã ngôn ngữ và kiểm tra `x-default`.
  - Meta `googlebot` noindex detection.
  - Favicon presence check.
  - Text-to-code ratio (warning khi < 10%).
- **Popup redesign** (6 tab): Tổng quan / Lỗi / Headings / Links / Ảnh / Preview.
  - Google SERP Preview mô phỏng cách hiển thị trên kết quả tìm kiếm.
  - Social Card Preview từ Open Graph tags.
  - Quick tools: Google Search Console, PageSpeed Insights,
    Rich Results Test, Wayback Machine - mở trực tiếp URL hiện tại.
- **CSV export** (`content.js`): xuất báo cáo dạng CSV chuẩn RFC 4180
  kèm BOM UTF-8 (mở thẳng bằng Excel), song song JSON và TXT.
- **Panel UI v2** (`ui.js`): Shadow DOM 4 tab (Score | SEO | Links/Images | Perf),
  sửa lỗi panel bị cắt cụt của bản trước, menu Export dropdown.

### Changed

- `manifest.json`: version bump 2.1.0, thêm `score.js` vào content script chain.
- Popup settings gọn gàng hơn trong `<details>`.

### Notes

- Không thêm permission mới; extension vẫn chỉ dùng `storage`, `tabs`, `scripting`.
