# Danh Sách Tài Khoản Hệ Thống EnglishHub (Role Accounts & Credentials)

> **Mật khẩu dùng chung cho toàn bộ tài khoản thực tế**: `Password123!`  
> **API Đăng nhập**: `POST http://localhost:8080/api/v1/auth/login`  
> **Giao diện Web**: `http://localhost:5173/login`  
> **Cơ sở dữ liệu**: PostgreSQL container `englishhub-postgres` (Database: `appdb`, User: `devuser`)

---

## 1. Tài khoản Truy cập Nhanh (Khuyên Dùng / Quick Access)

Dưới đây là các tài khoản tiêu biểu có đầy đủ dữ liệu hoạt động (lớp học, bài tập mở, bài tập chờ chấm) phù hợp nhất để kiểm thử hoặc thao tác:

| Vai trò | Email đăng nhập | Mật khẩu | Họ và tên | Mã số / Lớp liên kết | Mục đích sử dụng khuyên dùng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@englishhub.com` | `Password123!` | Admin EnglishHub | Quản trị toàn hệ thống | Quản lý người dùng, phân quyền, xem log kiểm toán (Audit Logs), báo cáo hệ thống |
| **Quản trị viên (Admin)** | `hoang.thanh.ngan@utc-polyglot.edu.vn` | `Password123!` | Hoàng Thanh Ngân | Admin UTC Polyglot | Quản trị viên theo chuẩn email trường đại học |
| **Giáo viên (Teacher)** | `pham.dieu.anh@gmail.com` | `Password123!` | Phạm Diệu Anh | Phụ trách Lớp 2 (A1) & Lớp 4 (B1) | Xem dashboard lớp học, chấm bài Writing/Speaking, quản lý tiến độ học tập, xuất bảng điểm |
| **Giáo viên (Teacher)** | `teacher@englishhub.com` | `Password123!` | Teacher EnglishHub | Giáo viên dùng chung | Tạo bài tập mới, cấu hình module Reading/Listening/Writing/Speaking |
| **Học sinh (Student)** | `hoang.anh.long@gmail.com` | `Password123!` | Hoàng Anh Long | `SV000019` (Lớp 2 - Cơ bản A1) | Làm bài tập, làm bài kiểm tra trắc nghiệm, nộp bài viết |
| **Học sinh (Student)** | `cao.gia.bao@gmail.com` | `Password123!` | Cao Gia Bảo | `SV000008` (Lớp 4 - B1) | Nộp bài tập kỹ năng B1, xem nhận xét và chấm điểm của giáo viên |
| **Học sinh (Student)** | `student@englishhub.com` | `Password123!` | Student EnglishHub | `SV999999` (Học sinh dùng chung) | Kiểm thử luồng học sinh cơ bản |

---

## 2. Toàn bộ Tài khoản Quản trị viên (Admin)

Tất cả các tài khoản Admin đều có trạng thái `ACTIVE` và quyền truy cập không giới hạn:

| ID | Email | Họ và tên | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1 | `hoang.thanh.ngan@utc-polyglot.edu.vn` | Hoàng Thanh Ngân | `ACTIVE` |
| 2 | `ngo.hoang.vinh@utc-polyglot.edu.vn` | Ngô Hoàng Vinh | `ACTIVE` |
| 3 | `dinh.minh.huy@utc-polyglot.edu.vn` | Đinh Minh Huy | `ACTIVE` |
| 92 | `admin@englishhub.com` | Admin EnglishHub | `ACTIVE` |

---

## 3. Toàn bộ Tài khoản Giáo viên (Teacher) & Lớp học Phụ trách

| ID | Email | Họ và tên | Lớp học phụ trách | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 4 | `pham.dieu.anh@gmail.com` | Phạm Diệu Anh | **Lớp 2**: Tiếng Anh Giao Tiếp Cơ Bản A1 (18 SV)<br>**Lớp 4**: Tiếng Anh Tổng Quát B1 (16 SV) | `ACTIVE` |
| 11 | `tran.anh.thang@gmail.com` | Trần Anh Thắng | **Lớp 1**: IELTS Foundation K1 (22 SV) | `ACTIVE` |
| 9 | `nguyen.duc.tuan@gmail.com` | Nguyễn Đức Tuấn | **Lớp 3**: IELTS Intensive 6.5+ (17 SV) | `ACTIVE` |
| 6 | `huynh.bao.thao@gmail.com` | Huỳnh Bảo Thảo | **Lớp 5**: TOEIC Pre-Intermediate A2 (20 SV) | `ACTIVE` |
| 5 | `cao.ngoc.thao@gmail.com` | Cao Ngọc Thảo | *(Dự phòng / Chưa gán lớp)* | `ACTIVE` |
| 7 | `hoang.duc.tuan@gmail.com` | Hoàng Đức Tuấn | *(Dự phòng / Chưa gán lớp)* | `ACTIVE` |
| 8 | `duong.quynh.han@gmail.com` | Dương Quỳnh Hân | *(Dự phòng / Chưa gán lớp)* | `ACTIVE` |
| 10 | `ta.van.tuan@gmail.com` | Tạ Văn Tuấn | *(Dự phòng / Chưa gán lớp)* | `ACTIVE` |
| 93 | `teacher@englishhub.com` | Teacher EnglishHub | *(Giáo viên dùng chung)* | `ACTIVE` |

---

## 4. Danh sách Học sinh Tiêu biểu theo Lớp học (Student)

### 4.1. Học sinh thuộc Lớp 4 (Tiếng Anh Tổng Quát B1 - Cô Diệu Anh phụ trách)
Lớp này có sẵn các bài tập: `Assignment 1 - Everyday English Checkpoint` (PUBLISHED), `Assignment 2 - Mid-course Skills Assessment` (PUBLISHED), `Assignment 3` (CLOSED):

| ID | Email | Họ và tên | Mã sinh viên | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| 19 | `cao.gia.bao@gmail.com` | Cao Gia Bảo | `SV000008` | `ACTIVE` |
| 20 | `le.mai.ngan@gmail.com` | Lê Mai Ngân | `SV000009` | `ACTIVE` |
| 24 | `bui.thanh.nam@gmail.com` | Bùi Thanh Nam | `SV000013` | `ACTIVE` |
| 26 | `phan.quoc.phuc@gmail.com` | Phan Quốc Phúc | `SV000015` | `ACTIVE` |
| 28 | `nguyen.thi.nhu@gmail.com` | Nguyễn Thị Như | `SV000017` | `ACTIVE` |
| 29 | `tran.hoang.khang@gmail.com` | Trần Hoàng Khang | `SV000018` | `ACTIVE` |
| 34 | `ta.quoc.viet@gmail.com` | Tạ Quốc Việt | `SV000023` | `ACTIVE` |
| 38 | `bui.khanh.my@gmail.com` | Bùi Khánh My | `SV000027` | `ACTIVE` |
| 44 | `ly.gia.khoi@gmail.com` | Lý Gia Khôi | `SV000033` | `ACTIVE` |
| 52 | `do.my.chi@gmail.com` | Đỗ Mỹ Chi | `SV000041` | `ACTIVE` |
| 56 | `ly.huu.bao@gmail.com` | Lý Hữu Bảo | `SV000045` | `ACTIVE` |
| 73 | `vu.thanh.kien@gmail.com` | Vũ Thanh Kiên | `SV000062` | `ACTIVE` |
| 75 | `hoang.minh.dung@gmail.com` | Hoàng Minh Dũng | `SV000064` | `ACTIVE` |
| 83 | `do.huu.an@gmail.com` | Đỗ Hữu An | `SV000072` | `ACTIVE` |
| 85 | `hoang.van.minh@gmail.com` | Hoàng Văn Minh | `SV000074` | `ACTIVE` |

### 4.2. Học sinh thuộc Lớp 2 (Tiếng Anh Giao Tiếp Cơ Bản A1 - Cô Diệu Anh phụ trách)
Lớp này có sẵn bài tập: `Assignment 2 - Mid-course Skills Assessment` (PUBLISHED):

| ID | Email | Họ và tên | Mã sinh viên | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| 17 | `tran.quoc.kien@gmail.com` | Trần Quốc Kiên | `SV000006` | `ACTIVE` |
| 30 | `hoang.anh.long@gmail.com` | Hoàng Anh Long | `SV000019` | `ACTIVE` |
| 31 | `trinh.gia.long@gmail.com` | Trịnh Gia Long | `SV000020` | `ACTIVE` |
| 32 | `vo.nhat.bao@gmail.com` | Võ Nhật Bảo | `SV000021` | `ACTIVE` |
| 41 | `duong.khanh.phuong@gmail.com` | Dương Khánh Phương | `SV000030` | `ACTIVE` |
| 42 | `mai.khanh.hanh@gmail.com` | Mai Khánh Hạnh | `SV000031` | `ACTIVE` |
| 45 | `ngo.duc.phuc@gmail.com` | Ngô Đức Phúc | `SV000034` | `ACTIVE` |
| 47 | `ta.ngoc.nhu@gmail.com` | Tạ Ngọc Như | `SV000036` | `ACTIVE` |
| 53 | `dang.hoang.son@gmail.com` | Đặng Hoàng Sơn | `SV000042` | `ACTIVE` |
| 54 | `dinh.gia.minh@gmail.com` | Đinh Gia Minh | `SV000043` | `ACTIVE` |

### 4.3. Tài khoản Kiểm thử Trạng thái Đặc biệt (Security / Negative Testing)

| ID | Email | Mật khẩu | Trạng thái | Use Case kiểm thử |
| :---: | :--- | :--- | :---: | :--- |
| 27 | `phan.quoc.tung@gmail.com` | `Password123!` | `LOCKED` | Kiểm tra hệ thống từ chối đăng nhập với tài khoản bị khóa (`401/403 Account Locked`). |

---

## 5. Hướng Dẫn Kịch Bản Kiểm Thử Theo Role

### 5.1. Kịch bản Giáo viên (Teacher)
1. Đăng nhập bằng `pham.dieu.anh@gmail.com` / `Password123!`.
2. Truy cập **Bảng điều khiển** (`/teacher/dashboard`):
   - Xem thống kê số lượng học viên, bài tập đã giao và số lượng bài nộp cần chấm.
   - Thao tác trong hàng đợi chấm bài: Bấm vào bài nộp của học sinh để chấm điểm và nhận xét.
3. Truy cập **Tiến độ học tập** (`/teacher/progress`):
   - Xem tỷ lệ hoàn thành, điểm trung bình lớp, danh sách học sinh cần hỗ trợ.
   - Sử dụng bộ lọc trạng thái: *Tất cả*, *Vượt trội*, *Đạt chuẩn*, *Cần hỗ trợ*.
   - Xuất dữ liệu bảng điểm học viên ra file CSV.
4. Truy cập **Quản lý lớp học** (`/teacher/classes`):
   - Xem danh sách thẻ lớp học phụ trách, số lượng thành viên, bài đã giao.

### 5.2. Kịch bản Học sinh (Student)
1. Đăng nhập bằng `hoang.anh.long@gmail.com` hoặc `cao.gia.bao@gmail.com` / `Password123!`.
2. Truy cập **Bảng điều khiển Học sinh** (`/student/dashboard`):
   - Xem danh sách bài tập đang mở cần nộp và hạn chót.
3. Truy cập **Làm bài tập** (`/student/assignments`):
   - Chọn bài tập `Assignment 2 - Mid-course Skills Assessment`.
   - Làm phần Đọc (Reading): trả lời câu hỏi trắc nghiệm, bấm *Hoàn thành & Nộp phần Đọc*.
   - Làm phần Viết (Writing): nhập bài viết, kiểm tra số từ, bấm *Nộp bài Viết*.
   - Làm phần Nghe/Nói (Listening/Speaking): nghe audio hoặc ghi âm nộp bài.
4. Xem kết quả và phản hồi từ giáo viên/AI sau khi bài nộp được chấm.

### 5.3. Kịch bản Quản trị viên (Admin)
1. Đăng nhập bằng `admin@englishhub.com` / `Password123!`.
2. Truy cập **Quản lý tài khoản** (`/admin/users`):
   - Tìm kiếm, lọc theo vai trò (Admin, Teacher, Student) hoặc trạng thái (Active, Locked).
   - Thêm tài khoản mới, chỉnh sửa thông tin hoặc khóa tài khoản.
3. Truy cập **Lịch sử chấm điểm** (`/admin/grading-logs`):
   - Xem nhật ký các lượt chấm điểm của giáo viên và AI.
