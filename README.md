# 🚌 BusTech Pulse - Cổng Tin Tức Tự Động Về Công Nghệ Xe Bus Toàn Cầu

Hệ thống website tự động thu thập, phân loại và cập nhật tin tức về công nghệ xe buýt & giải pháp giao thông công cộng thông minh trên toàn cầu mỗi ngày.

---

## 🌟 Tính Năng Nổi Bật

1. **Tự động hóa hoàn toàn 100% (Zero Server Cost)**:
   - Sử dụng **GitHub Actions** chạy lịch trình cron hàng ngày (07:00 sáng giờ VN).
   - Không tốn tiền thuê máy chủ VPS, không phụ thuộc vào hạ tầng trả phí.
   - Hỗ trợ chạy tự động trên Windows qua **Task Scheduler**.

2. **Nguồn tin quốc tế uy tín & đa dạng**:
   - **Sustainable Bus**: Chuyên trang xe bus điện & giao thông công cộng số 1 thế giới.
   - **Intelligent Transport**: Tin tức ITS, vé điện tử, giải pháp phần mềm quản lý đội xe.
   - **Google News Transit Tech Network**: Bộ lọc thông minh theo dõi công nghệ xe bus tự hành (L4/L5), pin thể rắn, xe bus chạy pin nhiên liệu Hydro (H2), siêu trạm sạc megawatt (MCS).
   - **Tin tức khu vực Châu Á - Thái Bình Dương**: VinFast, BYD, Yutong, King Long, v.v.

3. **Phân loại chuyên mục thông minh**:
   - ⚡ **Xe Buýt Điện (Electric Bus)**
   - 🤖 **Xe Tự Hành & AI (Autonomous & Shuttles)**
   - 🔋 **Hydro & Pin Nhiên Liệu (Hydrogen & Fuel Cell)**
   - 📡 **Quản Lý Đội Xe & ITS (Fleet & Smart Transit)**
   - 📊 **Thị Trường & Dự Án (Market, Tenders & Procurement)**

4. **Giao diện hiện đại (Modern Web UI)**:
   - Giao diện Transit Tech tối ưu trên cả Mobile & Desktop.
   - Tìm kiếm thời gian thực (Real-time live search).
   - Tích hợp nút **Dịch nhanh sang Tiếng Việt** qua Google Translate.
   - Chế độ Dark / Light Mode.
   - Lưu bài viết yêu thích (Bookmarks bằng LocalStorage).

---

## 🚀 Hướng Dẫn Sử Dụng & Triển Khai

### Cách 1: Chạy trực tiếp trên máy tính Windows (Nhanh nhất)
1. Nhấp đúp vào file `run-local.bat`:
   - Hệ thống sẽ tự động quét tin mới nhất từ các nguồn quốc tế và lưu vào `data/news.json`.
   - Trình duyệt sẽ tự động mở trang web `index.html`.
2. Để tự động quét mỗi ngày lúc 07:00 sáng trên máy tính:
   - Nhấp chuột phải vào `setup-windows-task.bat` chọn **Run as administrator**.

---

### Cách 2: Triển khai Website miễn phí lên GitHub Pages (Khuyên Dùng)
Để website chạy trực tuyến 24/7 trên internet hoàn toàn miễn phí:
1. Tạo một repository mới trên GitHub (ví dụ: `bus-tech-news`).
2. Đẩy toàn bộ mã nguồn thư mục này lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "Khởi tạo website tin tức công nghệ xe bus"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan-cua-ban>/bus-tech-news.git
   git push -u origin main
   ```
3. Bật **GitHub Pages**:
   - Vào **Settings** của Repository -> **Pages**.
   - Tại mục **Build and deployment** > Source chọn: **Deploy from a branch** -> chọn branch `main` và thư mục `/ (root)`.
   - Bấm **Save**.
4. Bật **Quyền tự động ghi cho GitHub Actions**:
   - Vào **Settings** -> **Actions** -> **General** -> mục **Workflow permissions** chọn:
     **"Read and write permissions"** -> Bấm **Save**.
5. **Hoàn tất!** File `.github/workflows/daily-update.yml` sẽ tự động chạy mỗi sáng lúc 07:00 (giờ VN) để cập nhật tin mới mà bạn không cần phải làm gì thêm!

---

## 📂 Cấu Trúc Dự Án

```
global-bus-tech-news/
├── .github/
│   └── workflows/
│       └── daily-update.yml    # Workflow chạy tự động mỗi ngày trên GitHub
├── data/
│   └── news.json               # Kho dữ liệu bài báo (tự động cập nhật)
├── index.html                  # Giao diện chính của website
├── app.js                      # Logic hiển thị, tìm kiếm, lọc danh mục
├── fetch_news.py               # Script cào tin chuẩn Python (dùng cho GitHub Actions / Linux)
├── update-news.ps1             # Script cào tin chuẩn PowerShell (dùng cho Windows)
├── run-local.bat               # File chạy nhanh 1-click trên máy tính
├── setup-windows-task.bat      # Cài đặt lịch tự động vào Windows Task Scheduler
└── README.md                   # Hướng dẫn chi tiết
```
