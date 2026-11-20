# Ma trận Trường hợp Biên & Ngoại lệ (Edge Cases Matrix)

Bảng tổng hợp chi tiết các trường hợp biên, trường hợp kiểm thử âm tính (Negative Scenarios) và các lỗi thực tế đã được lập trình kiểm thử:

| Nhóm Phân hệ | Use Case | Tình huống Biên & Ngoại lệ | Hành vi Kỳ vọng (Expected) | Mã Issue / Bug |
| :--- | :--- | :--- | :--- | :--- |
| **Common (Auth)** | UC01, UC02 | Email có khoảng trắng đầu/cuối (`" user@test.com "`) | Tự động trim khoảng trắng hoặc báo lỗi validation, không gây 400 bất thường | Bug #262 |
| **Common (Auth)** | UC01 | Đăng nhập dồn dập (Double click nút Submit) | Debounce hoặc disable nút, chỉ gửi duy nhất 1 request mạng | Bug #216 |
| **Common (Auth)** | UC02 | Tài khoản bị xóa mềm nhưng token cũ còn hạn | Backend từ chối 401 Unauthorized ngay lập tức | Issue #222 |
| **Common (Profile)** | UC03 | Nhập số điện thoại vượt quá 20 ký tự | Form validation chặn submit, báo lỗi độ dài | Issue #228 |
| **Teacher (Assignment)**| UC12, UC13 | Đặt `closeDate` trước hoặc bằng `openDate` | Form chặn submit và hiển thị cảnh báo ngày đóng phải sau ngày mở | Bug #210 |
| **Teacher (Assignment)**| UC12 | Lệch múi giờ UTC/Local trên `datetime-local` | Hiển thị đúng theo múi giờ địa phương GMT+7 | Bug #211 |
| **Teacher (Assignment)**| UC12 | Tạo module con lỗi nhưng vẫn bấm Publish bài cha | Không cho phép phát hành bài tập không toàn vẹn | Bug #209 |
| **Teacher (Grading)** | UC24 | Nhập điểm âm, điểm > 10, hoặc bước chia điểm lẻ | Chặn nhập điểm không hợp lệ (thang điểm 0–10) | Bug #215 |
| **Teacher (Grading)** | UC24 | Bấm nút "Lưu nháp" điểm | Giữ trạng thái DRAFT, không chuyển nhầm thành COMPLETED | Bug #212 |
| **Teacher (Grading)** | UC25 | Yêu cầu AI chấm bài trắc nghiệm Reading/Listening | Backend từ chối 400 Bad Request theo quy định BE-19 | Quy tắc BE-19 |
| **Student (Taking)** | UC16 | Bài luận Writing rỗng (0 từ) hoặc toàn ký tự trắng | Vô hiệu hóa nút nộp bài, yêu cầu nhập nội dung | Bug #174 |
| **Student (Taking)** | UC16 | Nộp bài luận đính kèm file DOCX | Không làm sập server (500) do MIME type overflow | Bug #205 |
| **Student (Taking)** | UC17 | Nộp bài Nói nhưng file ghi âm 0 byte hoặc mic tắt | Báo lỗi mic và chặn nộp bài rỗng | Bug #176 |
| **Student (Taking)** | UC15 | Truy cập URL bài tập với ID không tồn tại | Điều hướng về trang 404, không âm thầm tải bài ID=1 | Bug #213 |
| **Student (Submission)**| UC21 | Mất kết nối mạng khi đang nộp bài | KHÔNG báo thành công giả, bảo lưu nguyên vẹn nháp | Bug #207, #208 |
| **Admin (Account)** | UC05 | Tạo tài khoản vai trò Admin | Hệ thống gán đúng vai trò Admin, không bị gán thành Student | Bug #195 |
| **Admin (Account)** | UC06, UC07 | Tìm kiếm học viên/giáo viên có dấu tiếng Việt | Kết quả tìm kiếm chính xác không phụ thuộc dấu và hoa/thường | Bug #189, #190 |
| **Admin (Account)** | UC07 | Bấm mở hồ sơ chi tiết học viên | URL và dữ liệu hồ sơ hiển thị đồng nhất, không hiển thị người khác | Bug #191 |
| **Admin (Classes)** | UC08, UC09 | Truy cập bài tập của lớp khác giáo viên quản lý | Trả lỗi 403 Forbidden đúng quyền thay vì báo lớp rỗng | Bug #192, #194 |
