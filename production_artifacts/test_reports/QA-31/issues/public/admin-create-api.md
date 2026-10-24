# [BE][Admin Users] API tạo tài khoản từ chối role ADMIN hợp lệ bằng HTTP 400

Issue: https://github.com/hotung9108/EnglishHub/issues/196

Nguồn: **QA-31 — kiểm thử Admin trên staging**, ngày 20/10/2026. Testcase: **QA31-036** (liên quan; diagnostic API độc lập).
Mức độ đề xuất: **High**. Một issue mô tả một hành vi lỗi.

## Tiền điều kiện

Admin được tạo Admin theo yêu cầu nghiệp vụ đã xác nhận; có phiên Admin hợp lệ, email QA chưa tồn tại và dữ liệu hợp lệ.

Dùng fixture QA riêng; các giá trị `<...>` là placeholder cần thay bằng dữ liệu QA của lần tái hiện. Không dùng dữ liệu người dùng thật.

## Các bước tái hiện

1. Gửi POST /api/v1/admin/users với fullName, email QA mới, password hợp lệ và role ADMIN.
2. Ghi status và response, không đưa token/password vào báo cáo công khai.
3. GET /api/v1/admin/users?q=<email>&limit=100 bằng cùng phiên Admin.
4. Kiểm tra có user tương ứng và role ADMIN hay không.

## Kết quả mong đợi

API chấp nhận dữ liệu hợp lệ để tạo ADMIN theo yêu cầu nghiệp vụ, trả thành công và lưu đúng role.

## Kết quả thực tế và bằng chứng đã quan sát

Diagnostic API độc lập nhận HTTP 400; GET tìm đúng email trả 200 với danh sách rỗng. Không có response body lỗi chi tiết trong artifact.

Nguồn kiểm chứng: diagnostic API độc lập đã lưu; không cộng vào thống kê Selenium.

Bản công khai đã lược URL môi trường, tên/email tài khoản, ID dữ liệu thực và artifact thô. Không đính kèm thông tin đăng nhập. Report/evidence gốc được bàn giao riêng cho nhóm dự án; các quan sát ở trên không phải kết quả chạy mới.

## Phạm vi và ảnh hưởng

Đây là API diagnostic bổ sung liên quan QA31-036, không cộng thêm một Selenium Fail. Không khẳng định thông báo lỗi hay nguyên nhân bên trong khi evidence chưa có.

## Tiêu chí hoàn tất và retest

- [ ] Tạo ADMIN thành công và đọc lại đúng role.
- [ ] Email trùng/dữ liệu sai vẫn bị validate; Teacher/Student không hồi quy.

<!-- QA31-issue-key:admin-create-api -->
