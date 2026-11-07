# Trung tâm Quản lý & Tái hiện Lỗi (Bug Tracking Repository)

Thư mục này là nơi Tester lưu trữ tài liệu, kịch bản cô lập và bằng chứng (ảnh chụp màn hình, logs, payload) của mọi lỗi phát hiện được trong quá trình kiểm thử tự động và thủ công.

## Cấu trúc thư mục

```text
test_reborn/bugs/
├── active/                            # Các lỗi đang mở (Open / In Progress), chờ dev sửa hoặc đang retest
│   └── BUG-<ID>-<slug>/
│       ├── README.md                  # Tài liệu mô tả lỗi, các bước tái hiện chi tiết
│       ├── reproduce.spec.js          # (Tùy chọn) Script tự động cô lập để tái hiện
│       └── evidence/                  # Thư mục chứa bằng chứng đầy đủ
│           ├── screenshot-error.png   # Ảnh chụp màn hình giao diện khi lỗi xảy ra
│           ├── network-payload.json   # Payload Request/Response API gây lỗi
│           └── browser-console.log    # Log console hoặc server stack trace
│
├── resolved/                          # Các lỗi đã được sửa và Tester đã xác nhận PASS
│   └── BUG-<ID>-<slug>/               # Chuyển từ active/ sang khi nghiệm thu xong
│
├── references/                        # Bảng tổng hợp lịch sử bug & review DB của dự án
│   └── Bug_List_DB_Review.xlsx
│
└── templates/
    └── BUG_REPORT_TEMPLATE.md         # Mẫu form chuẩn để ghi nhận bug mới
```

## Quy trình ghi nhận Bug sau mỗi lần chạy Test

1. **Khi phát hiện lỗi**:
   - Tạo thư mục mới tại `active/BUG-<ID>-<tên-ngắn>/` (lấy ID theo GitHub Issue hoặc số tăng dần).
   - Tạo thư mục con `evidence/`.
   - Chụp ảnh màn hình giao diện lỗi lưu vào `evidence/screenshot-error.png`.
   - Copy payload mạng hoặc console log vào `evidence/`.
   - Copy mẫu từ `templates/BUG_REPORT_TEMPLATE.md` vào `README.md` và điền thông tin.
2. **Khi Dev đã sửa xong (Retest)**:
   - Chạy lại test tái hiện hoặc retest bằng script E2E/API.
   - Nếu Passed: Cập nhật kết quả vào `README.md` và di chuyển thư mục bug từ `active/` sang `resolved/`.
