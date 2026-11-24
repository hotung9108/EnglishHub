# UC001 — Đăng nhập

Suite Qase: 275.

| Case | Nội dung | Vai trò fixture | Source | Qase |
|---|---|---|---|---|
| LOGIN_001 | Đăng nhập thành công (email đúng, mật khẩu đúng, tài khoản hoạt động) | shared | [auth.cases.js](auth.cases.js) | EAM-4819 |
| LOGIN_002 | Email đúng, mật khẩu sai | shared | [auth.cases.js](auth.cases.js) | EAM-4820 |
| LOGIN_003 | Email chưa đăng ký | shared | [auth.cases.js](auth.cases.js) | EAM-4821 |
| LOGIN_004 | Tài khoản bị khóa | shared | [auth.cases.js](auth.cases.js) | EAM-4822 |
| LOGIN_005 | Để trống cả hai trường | shared | [auth.cases.js](auth.cases.js) | EAM-4823 |
| LOGIN_006 | Chỉ trống email | shared | [auth.cases.js](auth.cases.js) | EAM-4824 |
| LOGIN_007 | Chỉ trống mật khẩu | shared | [auth.cases.js](auth.cases.js) | EAM-4825 |
| LOGIN_008 | Email sai định dạng - thiếu @ | shared | [auth.cases.js](auth.cases.js) | EAM-4826 |
| LOGIN_009 | Email sai định dạng - thiếu tên miền | shared | [auth.cases.js](auth.cases.js) | EAM-4827 |
| LOGIN_010 | Email có khoảng trắng đầu/cuối | shared | [auth.cases.js](auth.cases.js) | EAM-4828 |
| LOGIN_011 | Email viết hoa/thường khác nhau | shared | [auth.cases.js](auth.cases.js) | EAM-4829 |
| LOGIN_012 | Mật khẩu phân biệt hoa/thường | shared | [auth.cases.js](auth.cases.js) | EAM-4830 |
| LOGIN_013 | Mật khẩu rất dài (256 ký tự) | shared | [auth.cases.js](auth.cases.js) | EAM-4831 |
| LOGIN_014 | Mật khẩu 1 ký tự | shared | [auth.cases.js](auth.cases.js) | EAM-4832 |
| LOGIN_015 | SQL Injection tại trường email | shared | [auth.cases.js](auth.cases.js) | EAM-4833 |
| LOGIN_016 | XSS tại trường email | shared | [auth.cases.js](auth.cases.js) | EAM-4834 |
| LOGIN_017 | Nhấn Enter để đăng nhập | shared | [auth.cases.js](auth.cases.js) | EAM-4835 |
| LOGIN_018 | Mật khẩu được che; nút hiện/ẩn mật khẩu (nếu có) | shared | [auth.cases.js](auth.cases.js) | EAM-4836 |
| LOGIN_019 | Nút đăng nhập bị vô hiệu hóa khi đang xử lý | admin | [auth.cases.js](auth.cases.js) | EAM-4837 |
| LOGIN_020 | Trường nhập có nhãn hiển thị, placeholder không thay nhãn | shared | [auth.cases.js](auth.cases.js) | EAM-4838 |
| LOGIN_021 | Truy cập trang yêu cầu đăng nhập khi chưa xác thực | shared | [auth.cases.js](auth.cases.js) | EAM-4839 |
| LOGIN_022 | Duy trì phiên sau khi tải lại trang | shared | [auth.cases.js](auth.cases.js) | EAM-4840 |
| LOGIN_023 | Đăng nhập Giáo viên điều hướng đúng không gian | shared | [auth.cases.js](auth.cases.js) | EAM-4841 |
| LOGIN_024 | Đăng nhập Học viên điều hướng đúng không gian | shared | [auth.cases.js](auth.cases.js) | EAM-4842 |
| LOGIN_025 | Đăng nhập Quản lý điều hướng đúng không gian | shared | [auth.cases.js](auth.cases.js) | EAM-4843 |
