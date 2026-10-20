# QA-31 — 50 test case Admin, quy trình chi tiết

Sinh từ registry và procedures.js. Mọi case dùng browser mới và đăng nhập Admin qua UI. Setup API tạo dữ liệu QA được ghi riêng trong bước, không thay hành vi Admin đang kiểm thử. Không ghi mật khẩu vào tài liệu/report.

Full run r6 ngày 20/10/2026: 35 Pass / 9 Fail / 6 Blocked. Bản r7 sửa phân loại case 050 và bổ sung liên kết issue; chưa chạy staging r7. Bước sau điểm Fail/Blocked chỉ là quy trình dự kiến, chưa xác minh thực hiện. Report gốc được giữ nguyên trong artifacts local.

## QA31-001 — Đăng nhập đúng vai trò Admin

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Mở form đăng nhập staging trong browser mới.
2. Nhập tài khoản Admin từ cấu hình và bấm đăng nhập; chờ LoginPage xác minh vai trò.
3. Kiểm tra URL /admin/dashboard, các link quản trị và không có lỗi quyền.

**Kết quả mong đợi:** URL /admin/dashboard; vai trò ADMIN; có các liên kết quản trị.


## QA31-002 — Điều hướng các màn Admin qua sidebar

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin trong browser mới.
2. Lần lượt bấm sidebar: Quản lý tài khoản → Quản lý Lớp học → Giáo viên → Học viên → Báo cáo & Thống kê → Lịch Sử Chấm Điểm.
3. Ở mỗi màn, chờ tải xong, kiểm tra đúng URL và không có thông báo lỗi quyền/không thể tải.

**Kết quả mong đợi:** Mỗi link mở đúng URL, tải xong và không báo lỗi quyền.


## QA31-003 — Accounts tìm tài khoản QA vừa tạo

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: teacher. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup API tạo Teacher QA riêng; đọc lại đúng ID/email và lưu readback.
2. Đăng nhập Admin; bấm Quản lý tài khoản.
3. Nhập toàn bộ email Teacher QA vào ô tìm kiếm trong nội dung trang; chờ tải ổn định.
4. Yêu cầu một dòng đúng email và role TEACHER; không tìm thấy thì Fail, không chọn tài khoản khác.

**Kết quả mong đợi:** Một dòng đúng email và TEACHER, đối chiếu API.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [Accounts search](https://github.com/hotung9108/EnglishHub/issues/189)

## QA31-004 — Accounts tìm không có kết quả

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Quản lý tài khoản.
2. Tìm email missing-qa31-<timestamp>@example.invalid.
3. Chờ tải ổn định; kiểm tra trạng thái Không tìm thấy/Không có tài khoản.

**Kết quả mong đợi:** Không có dòng tài khoản và có thông báo rỗng.


## QA31-005 — Accounts lọc Teacher

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Quản lý tài khoản.
2. Bấm bộ lọc Teacher; chờ tải xong và yêu cầu có dữ liệu để kiểm tra.
3. Đọc cột role của từng dòng đang hiển thị; tất cả phải là TEACHER.

**Kết quả mong đợi:** Có dữ liệu; mọi role là TEACHER.


## QA31-006 — Accounts hủy chỉnh sửa không lưu

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: teacher. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup Teacher QA riêng; API đọc họ tên ban đầu.
2. Đăng nhập Admin; vào Quản lý tài khoản, tìm đúng email. Không có dòng thì Blocked phụ thuộc 003.
3. Xác minh ownership, bấm Sửa trên đúng dòng và kiểm tra email trong drawer.
4. Đổi họ tên thành QA Cancelled Name rồi bấm Hủy.
5. API đọc lại đúng ID/email; họ tên phải bằng giá trị trước thao tác.

**Kết quả mong đợi:** API fullname không thay đổi.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [Accounts search](https://github.com/hotung9108/EnglishHub/issues/189)

## QA31-007 — Accounts sửa họ tên và lưu

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: teacher. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup Teacher QA riêng; đăng nhập Admin, vào Quản lý tài khoản và tìm đúng email.
2. Không có dòng thì Blocked phụ thuộc 003. Nếu có, xác minh ownership, bấm Sửa và kiểm tra email drawer.
3. Thêm Updated vào họ tên rồi bấm Lưu tài khoản/Lưu thay đổi.
4. API chờ tên mới được lưu; mở lại drawer đúng tài khoản và kiểm tra input vẫn là tên mới.

**Kết quả mong đợi:** API và input sau mở lại cùng là tên QA mới.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [Accounts search](https://github.com/hotung9108/EnglishHub/issues/189)

## QA31-008 — Accounts khóa rồi mở lại tài khoản QA

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: teacher. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup Teacher QA riêng; xác minh ID/email/role thuộc ledger.
2. Đăng nhập Admin; vào Quản lý tài khoản, tìm đúng email. Không có dòng thì Blocked phụ thuộc 003.
3. Bấm Khóa trên đúng dòng, xác nhận nếu có; API chờ trạng thái LOCKED.
4. Tìm lại và xác minh đúng QA; bấm Mở khóa, xác nhận nếu có; API chờ ACTIVE.
5. Trong finally của luồng khóa, chỉ khôi phục ACTIVE cho QA đã xác minh. Không thao tác người khác để chạy tiếp.

**Kết quả mong đợi:** Hai thay đổi lưu thật; finally khôi phục ACTIVE chỉ trên QA đã xác minh.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [Accounts search](https://github.com/hotung9108/EnglishHub/issues/189)

## QA31-009 — Teacher form chặn thiếu dữ liệu

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Giáo viên, bấm Thêm giáo viên/giảng viên.
2. Giữ trống họ tên và email.
3. Kiểm tra nút Tiếp theo bị khóa; không gửi tạo tài khoản.

**Kết quả mong đợi:** Nút tiếp theo bị khóa; không gửi tạo user.


## QA31-010 — Teacher tạo tài khoản qua wizard

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Sinh email Teacher UI riêng, tên có hậu tố UI và mật khẩu QA trong bộ nhớ.
2. Đăng nhập Admin; vào Giáo viên, bấm Thêm giáo viên/giảng viên.
3. Điền tên, email và mật khẩu QA; bấm Tiếp theo qua wizard, giữ mặc định các trường khác.
4. Bấm hoàn tất ở bước cuối; chờ quay về /admin/teachers.
5. API tìm email vừa nhập; kiểm tra ID tồn tại, role TEACHER, tên khớp và lưu ledger.

**Kết quả mong đợi:** API có tài khoản đúng email, họ tên và role TEACHER.


## QA31-011 — Teachers tìm và mở hồ sơ QA

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: teacher. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup Teacher QA riêng; đăng nhập Admin và vào Giáo viên.
2. Tìm toàn bộ email QA; bấm Xem chi tiết trên kết quả.
3. Chờ tải xong; kiểm tra URL /admin/teachers/<teacherId>, tên và email đúng QA.

**Kết quả mong đợi:** URL đúng ID; hồ sơ đúng email và họ tên.


## QA31-012 — Student form chặn thiếu dữ liệu

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Học viên, bấm Thêm học viên.
2. Giữ trống tên/email.
3. Kiểm tra Tiếp theo bị khóa; không gửi tạo tài khoản.

**Kết quả mong đợi:** Nút tiếp theo bị khóa.


## QA31-013 — Student tạo tài khoản qua wizard

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Sinh email Student UI riêng và tên có hậu tố UI.
2. Đăng nhập Admin; vào Học viên, bấm Thêm học viên; điền tên/email/mật khẩu QA.
3. Bấm Tiếp theo qua wizard; giữ mặc định ghi danh, không chọn lớp; bấm hoàn tất.
4. Chờ /admin/students; API kiểm tra đúng email, ID, role STUDENT và tên; lưu ledger.

**Kết quả mong đợi:** API có STUDENT đúng email/họ tên.


## QA31-014 — Students tìm học viên QA mới

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: student. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup API tạo Student QA riêng; API xác minh lại đúng ID/email.
2. Đăng nhập Admin; bấm Học viên ở sidebar.
3. Tìm toàn bộ email Student QA và chờ có dòng chứa đúng email.
4. Không thấy trong timeout thì Fail, giữ readback để đối chiếu; không thay bằng học viên khác.

**Kết quả mong đợi:** Một dòng chính xác; không nhầm học viên khác.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [Students search](https://github.com/hotung9108/EnglishHub/issues/190)

## QA31-015 — Classes tìm và mở đúng lớp QA

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: baseClass. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup baseClass có Teacher QA và một Student QA đã ghi danh.
2. Đăng nhập Admin; vào Quản lý Lớp học, tìm toàn bộ tên lớp QA.
3. Bấm Quản lý lớp trên đúng thẻ; chờ tải xong.
4. Kiểm tra URL đúng classId, tên lớp và tên Teacher; lưu API chi tiết lớp để đối chiếu.

**Kết quả mong đợi:** Đúng ID, tên lớp, teacher/member từ API.


## QA31-016 — Classes tìm không tồn tại

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Quản lý Lớp học.
2. Tìm QA31-Missing-<timestamp>; chờ tải ổn định.
3. Kiểm tra trạng thái không có lớp và không có nút Quản lý lớp trong kết quả.

**Kết quả mong đợi:** Hiện trạng thái không có lớp; không có nút quản lý lớp.


## QA31-017 — Tạo lớp chặn thiếu tên

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Quản lý Lớp học, bấm Tạo lớp học mới.
2. Kiểm tra tên lớp đang trống; nếu Tiếp theo bị khóa thì xác minh chặn tại đây.
3. Nếu vẫn đi tiếp được, bấm Tiếp theo qua các bước hiện có.
4. Ở bước cuối, nút submit phải bị khóa vì thiếu tên; không gửi tạo lớp.

**Kết quả mong đợi:** Không thể hoàn tất tạo lớp khi thiếu tên.


## QA31-018 — Tạo lớp qua đủ các bước

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: teacher. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup Teacher QA riêng để gán cho lớp.
2. Đăng nhập Admin; vào Quản lý Lớp học, bấm Tạo lớp học mới.
3. Nhập QA31-UI-Class-<tag>, chọn Trung cấp (B1-B2); kiểm tra ngày bắt đầu mặc định không trống.
4. Bấm Tiếp theo, chọn Teacher QA theo ID, bấm Tiếp theo rồi tạo lớp ở bước cuối.
5. API kiểm tra tên/level/Teacher ID; mở lại lớp mới qua danh sách để kiểm tra URL/tên. Chưa có assertion riêng cho sĩ số/lịch học.

**Kết quả mong đợi:** API lưu đúng tên, level và teacherId; mở được lớp mới.


## QA31-019 — Danh sách học viên trong lớp đối chiếu API

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: baseClass. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup baseClass và ghi danh Student QA bằng API.
2. Đăng nhập Admin; tìm lớp và bấm Quản lý lớp.
3. Trong Danh sách học viên, tìm đúng tên Student QA.
4. API GET members của lớp; kiểm tra có studentId đúng QA.

**Kết quả mong đợi:** UI hiển thị đúng tên; API membership đúng studentId.


## QA31-020 — Mở hồ sơ từ học viên trong lớp

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: baseClass. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup baseClass có Student QA; API đọc danh tính Student và lưu readback.
2. Đăng nhập Admin; vào Quản lý Lớp học, tìm lớp QA và bấm Quản lý lớp.
3. Tại Danh sách học viên, tìm đúng tên QA rồi bấm Hồ sơ trên chính dòng đó.
4. Chờ tải; kiểm tra URL /admin/students/<studentId>, email và tên đúng Student QA.
5. Sai danh tính thì Fail và dừng; không bấm Khóa/Đặt lại mật khẩu.

**Kết quả mong đợi:** URL đúng Student ID; hồ sơ đúng email/họ tên, không fallback người khác.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [Student identity](https://github.com/hotung9108/EnglishHub/issues/191)

## QA31-021 — Admin xem nội dung bài tập trong lớp

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: content. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup baseClass và bài Reading có câu hỏi; Teacher API công bố PUBLISHED, xác minh lại.
2. Đăng nhập Admin; tìm lớp QA, bấm Quản lý lớp rồi tab Bài tập & Điểm số.
3. Chờ tải; Admin API GET assignments của lớp. Nếu 403 ghi API_ACCESS_REVIEW, cần xác nhận contract quyền.
4. Nếu API cho đọc, kiểm tra có đúng assignmentId và tiêu đề trên UI. Nếu dừng ở 403, bước này chưa được kiểm tra.

**Kết quả mong đợi:** Bài PUBLISHED QA xuất hiện đúng tiêu đề; nếu Admin API trả 403 cần review contract quyền.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [Assignments error state](https://github.com/hotung9108/EnglishHub/issues/192)

## QA31-022 — Lưu cài đặt lớp và kiểm tra bền vững

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: editClass. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup editClass riêng; xác minh classId/tên trong ledger.
2. Đăng nhập Admin; tìm editClass, bấm Quản lý lớp rồi Cài đặt lớp học.
3. Nhập mô tả QA31 updated description <tag>, bấm Lưu; API chờ giá trị được lưu.
4. Rời trang, tìm/mở lại lớp qua danh sách; vào Cài đặt lớp học, kiểm tra textarea giữ mô tả mới.

**Kết quả mong đợi:** API và textarea sau mở lại cùng chứa mô tả mới.


## QA31-023 — Kho lưu trữ tìm lớp COMPLETED

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: archiveClass. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup archiveClass riêng bằng API, chuyển COMPLETED.
2. Đăng nhập Admin; vào Quản lý Lớp học, bấm Kho Lưu Trữ.
3. Tìm tên đầy đủ archiveClass, kiểm tra đúng dòng.
4. API đọc chi tiết và xác minh trạng thái COMPLETED.

**Kết quả mong đợi:** Lớp QA xuất hiện, trạng thái API COMPLETED.


## QA31-024 — Mở lại lớp đã hoàn thành qua UI

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: archiveClass. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup archiveClass COMPLETED và xác minh ownership.
2. Đăng nhập Admin; vào Quản lý Lớp học → Kho Lưu Trữ, tìm đúng tên QA.
3. Bấm Mở lại đúng dòng, xác nhận nếu có; API chờ ACTIVE.
4. Về danh sách lớp, tìm và mở Quản lý lớp để xác minh lớp hoạt động.

**Kết quả mong đợi:** API ACTIVE; lớp tìm được ở danh sách lớp.


## QA31-025 — Reports lọc chính xác lớp QA, đối chiếu số liệu

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: baseClass. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup baseClass riêng; đăng nhập Admin và vào Báo cáo & Thống kê.
2. Giữ các bộ lọc khác mặc định; chờ dropdown Lớp học có option rồi chọn đúng tên/ID QA.
3. Chờ tải; tìm đúng dòng QA và API lấy reports/classes của cùng classId.
4. Đối chiếu mã/tên, số bài (chấp nhận đơn vị bài/hw), điểm trung bình và tỷ lệ nộp.
5. Kiểm tra bảng chỉ còn một dòng lớp đã chọn; lưu API, ô UI và số dòng trước assertions. Run r2 dừng ở so đơn vị; bước lọc chờ retest r3.

**Kết quả mong đợi:** Tên, số bài, điểm trung bình và tỷ lệ nộp khớp API.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [Reports class filter](https://github.com/hotung9108/EnglishHub/issues/193)

## QA31-026 — Reports lọc giáo viên QA

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: baseClass. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup baseClass thuộc Teacher QA riêng.
2. Đăng nhập Admin; vào Báo cáo & Thống kê, chờ option Giáo viên phụ trách và chọn đúng Teacher ID.
3. API GET reports/classes?teacherId=<id>; yêu cầu có baseClass và UI có dữ liệu.
4. Kiểm tra mỗi dòng UI đang hiển thị thuộc danh sách lớp API của Teacher. Chưa duyệt toàn bộ trang.

**Kết quả mong đợi:** Chỉ hiển thị các lớp từ API reports/classes của giáo viên đó.


## QA31-027 — Reports mở chi tiết tiến độ lớp QA

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: baseClass. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup baseClass; đăng nhập Admin, vào Báo cáo & Thống kê và chọn đúng lớp QA.
2. Chờ tải, tìm đúng dòng lớp và bấm Chi tiết; chờ drawer hết loading.
3. Admin API đọc progress của classId; kiểm tra drawer không có lỗi quyền/tải.
4. Đọc riêng Sĩ số, Đã có điểm, Tỷ lệ hoàn thành, Dưới trung bình; đối chiếu từng trường API.

**Kết quả mong đợi:** Sĩ số, đã có điểm, tỷ lệ hoàn thành và dưới trung bình khớp từng trường API.


## QA31-028 — Reports xóa bộ lọc

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: baseClass. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup baseClass; đăng nhập Admin và vào Báo cáo & Thống kê.
2. Chọn lớp QA trong dropdown Lớp học; chờ tải.
3. Bấm Xóa bộ lọc; chờ tải xong.
4. Kiểm tra value các select Class/Teacher trở về rỗng/ALL. Case chưa đặt hoặc kiểm tra reset ngày.

**Kết quả mong đợi:** Class và Teacher select trở về giá trị rỗng/ALL.


## QA31-029 — Audit tìm mã chấm điểm và đối chiếu API

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: audit. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup bài QA riêng, Student nộp qua API, Teacher QA chấm 7.5 rồi sửa thành 8.
2. Admin API lấy đúng gradingId fixture từ danh sách, lưu readback.
3. Đăng nhập Admin; vào Lịch Sử Chấm Điểm, tìm GR-<gradingId>.
4. Đối chiếu mã GR, trạng thái và điểm chốt trên đúng từng ô với API; không sửa điểm bằng Admin.

**Kết quả mong đợi:** Một dòng đúng ID, finalScore/status khớp API; Admin không sửa grading.


## QA31-030 — Audit tìm mã không tồn tại

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Lịch Sử Chấm Điểm.
2. Tìm GR-999999999999; chờ tải ổn định.
3. Kiểm tra thông báo Không tìm thấy/Không có bản ghi/kết quả/dữ liệu.

**Kết quả mong đợi:** Không có dòng grading; trạng thái rỗng rõ ràng.


## QA31-031 — Audit chi tiết và lịch sử sửa điểm

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: audit. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup grading QA có lịch sử 7.5 thành 8, ghi chú riêng và ID trong ledger.
2. Đăng nhập Admin; vào Lịch Sử Chấm Điểm, tìm GR-<gradingId>.
3. Bấm Xem lịch sử sửa điểm trên đúng dòng; chờ drawer hết loading.
4. Admin API đọc độc lập detail/change-logs; lưu kết quả thành công hoặc lỗi của cả hai.
5. Nếu API lỗi, ghi Fail tại đây; chưa kiểm tra được render lịch sử.
6. Nếu cả hai thành công, kiểm tra gradingId/điểm chốt; logs không rỗng và có lần sửa 7.5 thành 8 đúng note.
7. So số dòng và từng cặp điểm cũ/mới/ghi chú trên cùng dòng drawer với API.

**Kết quả mong đợi:** Admin đọc được detail/logs; lịch sử không rỗng, đúng điểm cũ/mới/ghi chú trên cùng dòng.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [Audit detail access](https://github.com/hotung9108/EnglishHub/issues/194)

## QA31-032 — Settings hồ sơ Admin chỉ đọc

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập bằng Admin cấu hình.
2. Bấm Cài đặt, chờ /admin/settings.
3. Đọc ô email và so với email Admin đăng nhập; không nhập/lưu thay đổi.

**Kết quả mong đợi:** Email hiển thị đúng; không lưu hồ sơ hoặc đổi mật khẩu.


## QA31-033 — Settings bảo mật có trường mật khẩu

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Cài đặt → Bảo mật tài khoản.
2. Chờ tải; yêu cầu ít nhất hai input kiểu password, giá trị rỗng.
3. Không nhập/gửi mật khẩu; case chỉ xác minh form hiện diện.

**Kết quả mong đợi:** Có input password được che; không gửi đổi mật khẩu.


## QA31-034 — Teacher từ chối tên chứa chữ số

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Giáo viên, bấm Thêm giáo viên/giảng viên.
2. Nhập QA Invalid 123 và email QA hợp lệ riêng; bấm Tiếp theo.
3. Kiểm tra vẫn có input họ tên ở bước thông tin và có thông báo tên không hợp lệ/chứa số. Không hoàn tất tạo tài khoản.

**Kết quả mong đợi:** Giữ bước thông tin và báo lỗi họ tên; không tạo tài khoản.


## QA31-035 — Student từ chối email sai định dạng

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Học viên, bấm Thêm học viên.
2. Nhập tên QA hợp lệ, email qa31-<tag>-bad-address và mật khẩu QA hợp lệ để cô lập lỗi email.
3. Đọc native validity của input email và xác minh sai định dạng.
4. Bấm Tiếp theo; nếu trì hoãn validation, đi đến bước cuối và bấm hoàn tất.
5. Yêu cầu vẫn ở /admin/students/create, có banner lỗi riêng/native validation; không tính preview là lỗi.
6. Admin API tìm email sai, kiểm tra không có tài khoản đó và lưu kết quả.

**Kết quả mong đợi:** Không tạo được tài khoản; lỗi email hoặc native validity được ghi nhận.


## QA31-036 — Accounts tạo Admin phải lưu đúng vai trò ADMIN

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Quản lý tài khoản, bấm Thêm tài khoản mới.
2. Chờ drawer; nhập tên QA Accounts ADMIN <tag chữ>, email qa31-<tag>-admin-accounts-ui@example.invalid và mật khẩu QA hợp lệ.
3. Trong Vai trò chọn ADMIN; kiểm tra value của select vẫn là ADMIN trước khi lưu.
4. Bấm Lưu tài khoản đúng drawer; chờ API readback tìm được email hoặc UI hiển thị lỗi lưu.
5. API tìm đúng email vừa yêu cầu; lưu ID/tên/role thực tế và thông báo UI. Có tài khoản mới thì ghi ledger kể cả khi role sai.
6. Yêu cầu có user đúng họ tên/email và role ADMIN theo yêu cầu nghiệp vụ người dùng. Nếu thành STUDENT hoặc bị từ chối thì Fail; không gọi API tạo Admin thay UI để làm test Pass.

**Kết quả mong đợi:** Có tài khoản đúng email/họ tên với role ADMIN; không âm thầm tạo STUDENT.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [UI role mapping](https://github.com/hotung9108/EnglishHub/issues/195), [Related API diagnostic](https://github.com/hotung9108/EnglishHub/issues/196)

## QA31-037 — Accounts tạo Teacher phải lưu đúng vai trò TEACHER

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Quản lý tài khoản, bấm Thêm tài khoản mới.
2. Nhập QA Accounts TEACHER <tag chữ>, email qa31-<tag>-teacher-accounts-ui@example.invalid và mật khẩu QA hợp lệ.
3. Chọn Vai trò TEACHER, xác minh select trước khi bấm Lưu tài khoản.
4. Chờ có user theo API hoặc lỗi UI; lưu readback/ledger.
5. Kiểm tra đúng họ tên/email và role TEACHER; đây là drawer Accounts, khác wizard Giáo viên ở case 010.

**Kết quả mong đợi:** Có tài khoản đúng email/họ tên, role TEACHER; không chỉ kiểm tra toast.


## QA31-038 — Accounts tạo Student phải lưu đúng vai trò STUDENT

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Đăng nhập Admin; vào Quản lý tài khoản, bấm Thêm tài khoản mới.
2. Nhập QA Accounts STUDENT <tag chữ>, email qa31-<tag>-student-accounts-ui@example.invalid và mật khẩu QA hợp lệ.
3. Chọn Vai trò STUDENT, xác minh select trước khi bấm Lưu tài khoản.
4. Chờ có user theo API hoặc lỗi UI; lưu readback/ledger.
5. Kiểm tra đúng họ tên/email và role STUDENT; đây là drawer Accounts, khác wizard Học viên ở case 013.

**Kết quả mong đợi:** Có tài khoản đúng email/họ tên, role STUDENT; không chỉ kiểm tra toast.


## QA31-039 — Accounts tìm tài khoản có sẵn độc lập bước tạo

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. API chỉ đọc trang đầu danh sách tài khoản để chọn một Teacher/Student có sẵn, loại toàn bộ user do run hiện tại tạo theo ledger. Không tạo fixture user.
2. Đăng nhập Admin; vào Quản lý tài khoản.
3. Tìm email đầy đủ của tài khoản đã chọn; chờ dòng đúng email và kiểm tra họ tên khớp.
4. Xóa từ khóa, tìm lại bằng họ tên; trong kết quả phải có dòng đúng email/tên tài khoản đó.
5. Chỉ đọc, không sửa/khóa. Pass chỉ chứng minh search cơ bản trên dữ liệu có sẵn; không thay kết quả case 003 về tài khoản mới.

**Kết quả mong đợi:** Tìm được đúng tài khoản có sẵn; không tạo/sửa/khóa tài khoản.


## QA31-040 — Students tìm học viên có sẵn độc lập bước tạo

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. API chỉ đọc trang đầu danh sách STUDENT; chọn Student có sẵn không nằm trong ledger user của run. Không tạo fixture user.
2. Đăng nhập Admin; vào Học viên.
3. Tìm email đầy đủ, kiểm tra dòng đúng email và họ tên.
4. Xóa từ khóa, tìm lại theo họ tên; kiểm tra vẫn có đúng dòng email/tên đó.
5. Chỉ đọc, không đổi danh tính test nếu thiếu dữ liệu. Pass không chứng minh tìm được Student nằm ngoài tập đã tải và không thay case 014.

**Kết quả mong đợi:** Tìm được đúng Student có sẵn; không phụ thuộc wizard hoặc API tạo tài khoản.


## QA31-041 — Students khóa rồi mở khóa QA từ danh sách

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: student. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup Student QA riêng, xác minh ID/email/role trong ledger và ACTIVE qua API.
2. Admin vào Học viên, tìm đúng email; chỉ tiếp tục nếu đúng một dòng và tên QA khớp. Nếu không thấy, Blocked phụ thuộc 014.
3. Bấm Khóa đúng dòng, xác nhận nếu có; API phải LOCKED và UI hiện Bị khóa.
4. Xác minh ownership lần nữa, bấm Mở khóa; API phải ACTIVE.
5. Reload danh sách, tìm lại email và xác minh Hoạt động. Nếu đã vào luồng mutation, finally khôi phục ACTIVE chỉ trên QA đã xác minh.

**Kết quả mong đợi:** Đúng user chuyển LOCKED rồi ACTIVE; không tìm thấy QA thì Blocked, không dùng người khác.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [Students search](https://github.com/hotung9108/EnglishHub/issues/190)

## QA31-042 — Student profile khóa rồi mở khóa đúng danh tính QA

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: baseClass. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup lớp QA và Student QA đã ghi danh; xác minh ownership bằng API.
2. Admin tìm lớp, mở Quản lý lớp; bấm Hồ sơ trên đúng dòng Student QA.
3. Đối chiếu URL/studentId, tên và email trước bấm nút. Nếu sai người, Blocked phụ thuộc 020, không mutation.
4. Khóa tài khoản, xác nhận nếu có; API phải LOCKED; xác minh lại danh tính trước Mở khóa.
5. Mở khóa, API phải ACTIVE; reload và kiểm tra đúng hồ sơ/nút Khóa hiện lại. Finally khôi phục ACTIVE trên đúng QA nếu đã vào luồng mutation.

**Kết quả mong đợi:** Đúng QA chuyển LOCKED/ACTIVE; hồ sơ sai người thì Blocked trước mutation.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [Student identity](https://github.com/hotung9108/EnglishHub/issues/191)

## QA31-043 — Reports lọc ngày có chứa bài QA đã chấm

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: audit. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup lớp riêng với một bài PUBLISHED, Student QA nộp, Teacher chấm 8/10.
2. Admin vào Reports, chọn Teacher và lớp QA.
3. Nhập Từ ngày = hôm nay UTC trừ 2 ngày, Đến ngày = cộng 2 ngày bằng input UI; xác minh value ISO đúng, không bypass bằng API.
4. Đọc API overview/classes có from/to; kỳ vọng nghiệp vụ riêng bài QA phải 80% và hoàn thành 100%.
5. Chờ KPI theo nhãn khớp API; đối chiếu đúng dòng lớp: mã/tên/số bài/điểm/tỷ lệ. Không thay thế case 025 về số dòng sau class filter.

**Kết quả mong đợi:** Bài 8/10 được tính 80%/100%, KPI và dòng lớp khớp API có from/to.


## QA31-044 — Reports lọc ngày tương lai loại bài QA hiện tại

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: audit. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup lớp/bài QA đã chấm 8/10 như 043.
2. Admin vào Reports, chọn Teacher và lớp QA.
3. Nhập từ hôm nay UTC cộng 30 ngày đến cộng 31 ngày; xác minh value ngày đúng.
4. API overview phải loại bài hiện tại: điểm và tỷ lệ 0; lỗi API cũng phải Fail, không chỉ so UI với API.
5. Chờ bốn KPI UI khớp API và đối chiếu dòng lớp theo cùng from/to.

**Kết quả mong đợi:** Không tính bài hiện tại: điểm/tỷ lệ 0; UI khớp API theo khoảng ngày.


## QA31-045 — Reports reset cả ngày Teacher và lớp

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: baseClass. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup lớp QA; Admin vào Reports, chọn Teacher và lớp QA.
2. Nhập cả Từ ngày và Đến ngày, xác minh giá trị trước reset.
3. Bấm Xóa bộ lọc, chờ tải xong.
4. Kiểm tra cả hai ngày rỗng, Teacher/Class về mặc định; đối chiếu KPI với API overview không có filter.

**Kết quả mong đợi:** Hai ngày rỗng, select mặc định; KPI theo API overview không filter.


## QA31-046 — Audit lọc trạng thái COMPLETED

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: audit. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Setup grading QA COMPLETED/8 và đọc tập gradings hiện tại bằng API.
2. Admin vào Lịch Sử Chấm Điểm, bấm Đã hoàn tất.
3. Yêu cầu dòng GR của QA xuất hiện; không Pass vì không có dữ liệu.
4. Đối chiếu ID/trạng thái/điểm của mọi dòng đang hiển thị với API; tất cả phải COMPLETED. Chưa tuyên bố duyệt mọi trang.

**Kết quả mong đợi:** Có GR QA; mọi dòng đúng COMPLETED/điểm/API, không Pass vì bảng rỗng.


## QA31-047 — Audit lọc trạng thái PENDING

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. API chỉ đọc gradings có sẵn, yêu cầu có ít nhất một PENDING trong tập UI tải; không có thì Blocked vì tiền điều kiện dữ liệu.
2. Admin vào Lịch Sử Chấm Điểm, bấm Chờ duyệt.
3. Yêu cầu có dòng GR PENDING đối chứng xuất hiện.
4. Đối chiếu ID/status/score của mọi dòng hiển thị với API; từ chối trường hợp bảng rỗng hoặc lẫn trạng thái khác.

**Kết quả mong đợi:** Có dữ liệu đúng PENDING; không có dữ liệu tiền điều kiện thì Blocked.


## QA31-048 — Admin truy cập được cấu hình hệ thống FE23

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Admin vào Cài đặt qua sidebar.
2. Tìm trường Mô hình chấm Writing/Writing Evaluation Model theo yêu cầu FE-23.
3. Kiểm tra có ít nhất hai lựa chọn model và nút Lưu thay đổi cài đặt/Khôi phục mặc định.
4. Nếu chỉ có hồ sơ/bảo mật cá nhân thì Fail vì thiếu form hệ thống, không coi 032/033 là đã bao phủ. Không nhập API key.

**Kết quả mong đợi:** Có form cấu hình hệ thống; form hồ sơ cá nhân không thay thế yêu cầu FE23.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [System settings](https://github.com/hotung9108/EnglishHub/issues/197)

## QA31-049 — Cấu hình hệ thống lưu sau reload và reset

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Admin vào Cài đặt; nếu thiếu form hệ thống thì Blocked phụ thuộc 048, chưa kiểm tra lưu/reset.
2. Trong browser QA mới, ghi model mặc định; chọn model khác rồi Lưu.
3. Reload, kiểm tra model mới vẫn giữ.
4. Bấm Khôi phục mặc định, xác nhận nếu có; reload, kiểm tra model về giá trị mặc định trước thay đổi.
5. Finally chọn/lưu lại giá trị ban đầu qua UI; không nhập API key, không sửa hồ sơ hoặc tài khoản.

**Kết quả mong đợi:** Model giữ sau reload; Reset về mặc định. Thiếu form thì Blocked phụ thuộc 048.

**Issue đã review (gồm lỗi phụ thuộc/liên quan):** [System settings](https://github.com/hotung9108/EnglishHub/issues/197)

## QA31-050 — Xác định điểm vào quản lý nội dung Admin

**Tiền điều kiện/dữ liệu:** Admin test; fixture cần: không cần fixture API. ID/tên/email cụ thể xem fixture-ledger.json và Readback/API của từng run.

**Các bước:**

1. Admin đăng nhập, đọc và lưu menu sidebar cùng route.
2. Nhận diện entry nội dung/ngân hàng/bài tập/học liệu thuộc Admin; không bắt buộc nghiệp vụ phải có menu riêng, vì có thể truy cập qua lớp.
3. Nếu chưa xác định được entry/luồng, ghi Blocked/SCOPE_REVIEW, cần đặc tả nội dung và đường đi; không suy ra thiếu chức năng chỉ từ sidebar.
4. Nếu có entry đã nhận diện, mở và kiểm tra đúng URL/role, tải xong không 404. Chỉ smoke truy cập, chưa đại diện CRUD; kết quả r6 cũ vẫn giữ nguyên và đọc kèm review.

**Kết quả mong đợi:** Entry đã nhận diện tải đúng role; chưa xác định luồng thì Blocked/SCOPE_REVIEW, không kết luận thiếu chức năng từ sidebar.


Xem QA31-README.md về coverage gap, guard và phân biệt Fail/Blocked/bug.
