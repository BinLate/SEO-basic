# SEO Cơ Bản - Chrome Extension

## Mô tả

**SEO Cơ Bản** là một tiện ích mở rộng Chrome được thiết kế để giúp các nhà phát triển web, SEO specialist và chủ website kiểm tra nhanh các yếu tố SEO cơ bản trên bất kỳ trang web nào. Extension này cung cấp phân tích tức thì về các thành phần SEO quan trọng mà không cần rời khỏi trang web hiện tại.

## Chức năng chính

### 🔍 Kiểm tra SEO Elements
- **Tiêu đề trang (Title)**: Hiển thị và kiểm tra thẻ `<title>` của trang
- **Meta Description**: Phân tích nội dung meta description
- **Thẻ H1**: Kiểm tra số lượng và nội dung các thẻ heading H1
- **Thẻ H2**: Liệt kê tất cả các thẻ heading H2
- **Robots.txt**: Kiểm tra sự tồn tại và truy cập file robots.txt

### 📊 Tính năng nổi bật
- **Phân tích tức thì**: Kết quả hiển thị ngay lập tức khi mở popup
- **Giao diện trực quan**: Màu sắc phân biệt rõ ràng giữa các trạng thái (có/không có)
- **Cảnh báo thông minh**: Thông báo khi phát hiện nhiều hơn 1 thẻ H1 (vi phạm SEO)
- **Truy cập robots.txt**: Link trực tiếp đến file robots.txt để kiểm tra chi tiết

## Cách sử dụng

1. **Cài đặt extension** từ Chrome Web Store
2. **Truy cập trang web** bạn muốn kiểm tra SEO
3. **Click vào icon extension** trên thanh công cụ Chrome
4. **Xem kết quả phân tích** trong popup hiển thị

## Đối tượng sử dụng

- **SEO Specialist**: Kiểm tra nhanh các yếu tố SEO cơ bản
- **Web Developer**: Đảm bảo trang web tuân thủ chuẩn SEO
- **Content Creator**: Kiểm tra cấu trúc heading và meta tags
- **Website Owner**: Theo dõi và cải thiện SEO của website

## Quyền truy cập

Extension yêu cầu các quyền sau:
- **activeTab**: Để đọc nội dung trang web hiện tại
- **scripting**: Để chạy script phân tích SEO trên trang
- **host_permissions**: Truy cập tất cả các trang web để kiểm tra robots.txt

## Chính sách quyền riêng tư

### Thu thập dữ liệu
Extension **KHÔNG** thu thập, lưu trữ hoặc truyền bất kỳ dữ liệu cá nhân nào của người dùng. Tất cả phân tích SEO được thực hiện cục bộ trên trình duyệt của bạn.

### Dữ liệu được xử lý
- **Tiêu đề trang**: Chỉ đọc và hiển thị, không lưu trữ
- **Meta tags**: Phân tích và hiển thị trong popup
- **Heading tags**: Đếm và liệt kê các thẻ H1, H2
- **Robots.txt**: Kiểm tra sự tồn tại, không đọc nội dung

### Không có tracking
- Không có analytics hoặc tracking code
- Không gửi dữ liệu đến server bên ngoài
- Không lưu trữ lịch sử duyệt web
- Không chia sẻ thông tin với bên thứ ba

### Bảo mật
Tất cả dữ liệu được xử lý hoàn toàn trên máy tính của bạn. Extension không có khả năng truy cập:
- Mật khẩu hoặc thông tin đăng nhập
- Dữ liệu cá nhân nhạy cảm
- Lịch sử duyệt web
- Cookies hoặc session data

## Cài đặt kỹ thuật

### Yêu cầu hệ thống
- Google Chrome phiên bản 88 trở lên
- Manifest V3 compatible

### Cấu trúc file
```
SEO-basic/
├── manifest.json          # Cấu hình extension
├── popup.html            # Giao diện popup
├── popup.js              # Logic popup
├── content.js            # Script phân tích SEO
├── styles.css            # CSS styling
└── icons/                # Icon extension
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Phát triển

### Cài đặt development
1. Clone repository
2. Mở Chrome và truy cập `chrome://extensions/`
3. Bật "Developer mode"
4. Click "Load unpacked" và chọn thư mục extension

### Đóng góp
Mọi đóng góp và phản hồi đều được chào đón. Vui lòng tạo issue hoặc pull request trên GitHub repository.

## Liên hệ

- **Tác giả**: Bin.Late
- **Website**: https://muabanquyen.com
- **Version**: 1.0.0

## License

Extension này được phát hành dưới giấy phép MIT. Bạn có thể tự do sử dụng, chỉnh sửa và phân phối.

---

**Lưu ý**: Extension này chỉ cung cấp phân tích SEO cơ bản. Để có phân tích SEO chuyên sâu, bạn nên sử dụng các công cụ SEO chuyên nghiệp như Google Search Console, SEMrush, hoặc Ahrefs.
