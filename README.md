# SEO Basic PRO — Chrome Extension (Manifest V3)

Extension audit SEO on-page theo dạng mini Ahrefs/SEOQuake: kiểm tra heading/meta/link/image/script, highlight lỗi trực tiếp trên DOM, đo Core Web Vitals cơ bản, phân tích third-party scripts, chấm điểm SEO Score 0–100, audit canonical/hreflang/favicon, preview SERP & Social Card, và export báo cáo JSON/TXT/CSV.

Tác giả: **Bin.Late**  
Website: [https://muabanquyen.com](https://muabanquyen.com)

## Tính năng chính

- Audit SEO theo nhóm `Error / Warning / OK`.
- Highlight trực tiếp trên trang:
  - viền đỏ: lỗi nghiêm trọng (`h1` dư/thiếu, ảnh thiếu alt, ...)
  - viền vàng: cảnh báo (`heading` nhảy cấp, ...)
  - nofollow: gạch ngang + tooltip `nofollow`, có thể bật/tắt và đổi màu nền.
- Core Web Vitals (basic):
  - LCP, CLS, INP (thay FID).
- Script optimization:
  - script thiếu `async/defer`
  - inline script > 500 ký tự
  - quá nhiều script (> 20)
- Third-party scripts:
  - phát hiện script từ domain ngoài
  - phân loại `Analytics / Ads / CDN / Other`
  - rule cảnh báo theo số lượng (<=5 OK, 6-10 Warning, >10 Error)
  - xem chi tiết domain trong tab `Perf`.
- Export report:
  - JSON, TXT hoặc CSV, tải trực tiếp về máy.
- SEO Score (v2.1.0):
  - điểm 0–100 + xếp loại A–F (mỗi error -15, mỗi warning -5)
  - hiển thị dạng vòng tròn trên panel và popup.
- Indexability & technical checks (v2.1.0):
  - HTTP status (4xx/5xx = lỗi, 3xx = redirect)
  - canonical: phát hiện thiếu/trùng/không tự tham chiếu
  - meta googlebot noindex
  - favicon
  - text-to-code ratio (<10% cảnh báo)
- Quốc tế (v2.1.0):
  - audit hreflang: cú pháp mã ngôn ngữ + kiểm tra x-default.
- Popup PRO (v2.1.0):
  - header SEO Score ring + đếm lỗi/cảnh báo/OK
  - 6 tab: Tổng quan / Lỗi / Headings / Links / Ảnh / Preview
  - Google SERP Preview + Social Card Preview (Open Graph)
  - Quick tools: GSC, PageSpeed, Rich Results, Wayback Machine.

## Cài đặt extension

1. Mở `chrome://extensions`.
2. Bật **Developer mode**.
3. Chọn **Load unpacked**.
4. Trỏ đến thư mục `seo-basic`.
5. Nhấn icon extension để mở popup.

## Cách dùng nhanh

1. Trong popup:
   - xem SEO Score + tổng quan kỹ thuật ngay khi mở.
   - chuyển tab để xem Lỗi / Headings / Links / Ảnh / Preview.
   - chọn chế độ hiển thị: `popup` hoặc `panel` (Cài đặt).
   - bật/tắt highlight nofollow và chỉnh màu nền (Cài đặt).
2. Nhấn `Quét lại` để re-audit.
3. Dùng nút `JSON` / `TXT` / `CSV` để export, hoặc menu `⬇ Export` trên panel.
4. Trong panel PRO (4 tab):
   - tab `Score`: vòng điểm + quick facts (HTTP, canonical, hreflang, text/code).
   - tab `SEO`: danh sách issue theo nhóm.
   - tab `Links/Images`: danh sách link (INT/EXT/nofollow) + ảnh thiếu alt.
   - tab `Perf`: Core Web Vitals + third-party scripts breakdown.
   - nút `ON/OFF`: bật/tắt extension runtime.
5. Quick tools mở trang hiện tại trên Google Search Console, PageSpeed Insights,
   Rich Results Test hoặc Wayback Machine chỉ với một cú click.

## Cấu trúc file PRO

- `manifest.json`: MV3 + permissions + content scripts theo thứ tự module.
- `defaults.js`: default settings dùng chung.
- `audit.js`: toàn bộ SEO checks (bao gồm indexability, hreflang, text/code ratio), DOM highlight, third-party script detection.
- `score.js`: module tính SEO Score 0–100 + xếp loại A–F.
- `performance.js`: Core Web Vitals observer + rating (LCP/CLS/INP).
- `ui.js`: panel UI (4 tab: Score/SEO/Links/Perf, actions, renderer).
- `content.js`: orchestrator (settings, observer, message handling, export JSON/TXT/CSV).
- `styles.css`: style cho panel Shadow DOM.
- `popup.html`, `popup.css`, `popup.js`: popup 6 tab với score ring, preview SERP/Social, quick tools + export.

## Checklist test thủ công

- Site thường (`https://...`) quét được và có issue.
- Panel mode hiển thị đúng 6 vị trí.
- Toggle `highlight nofollow` hoạt động, alpha = 0 thì không có nền.
- DOM thay đổi (SPA/Facebook) vẫn re-highlight.
- Third-party scripts:
  - có tổng số
  - breakdown đúng nhóm
  - list domain hiện trong tab `Perf`.
- Export JSON/TXT/CSV tải được và chứa: URL, title, description, issues, word count, web vitals, third-party details.
- SEO Score hiển thị đúng trên cả panel và popup; giảm đúng theo số error/warning.
- Tab Links/Images hiển thị danh sách link và ảnh thiếu alt.
- Tab Preview vẽ đúng SERP (title/description) và Social Card (og:image/title/description).
- Quick tools mở đúng URL trang hiện tại trên GSC/PageSpeed/Rich Results/Wayback.

## Lưu ý giới hạn

- Chrome chặn content script ở `chromewebstore.google.com`, `chrome://...` và một số trang nội bộ.
- INP có thể là `N/A` nếu trang chưa phát sinh interaction đủ điều kiện đo.
