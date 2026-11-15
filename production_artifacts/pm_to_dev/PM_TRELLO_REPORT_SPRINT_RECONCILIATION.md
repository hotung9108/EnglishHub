# BÁO CÁO ĐỐI SOÁT VÀ TỐI ƯU TOÀN DIỆN TRELLO BOARD THEO ĐỒ ÁN TỐT NGHIỆP
**Dự án**: EnglishHub - Nền Tảng Quản Lý Bài Tập & Hỗ Trợ Chấm Điểm Tiếng Anh Đa Kỹ Năng  
**Thời điểm đối soát & thực thi**: 15/11/2026 (Chính thức bước vào Sprint 10)  
**Trạng thái thực thi**: **ĐÃ THỰC THI THÀNH CÔNG 100% VÀ ĐÃ XÁC MINH TRÊN TRELLO REST API**  
**Cơ sở dữ liệu đối soát**: 3 nguồn chân lý độc lập:
1. **Báo cáo Đồ án tốt nghiệp** (`overleaf_reports/Project_1/final_2/reports/02_Chapters/Chapter_06.tex`, `03_Chapters/11.tex`, `01_SRS.tex`)
2. **Lịch sử Git & PR Merges** (538 commits, 202 PR merges trên nhánh `develop` và `staging`)
3. **Trello Board `Project1`** (282 thẻ thuộc 21 danh sách)

---

## PHẦN 1: TỔNG QUAN HIỆN TRẠNG VÀ PHÁT HIỆN SAI LỆCH CỐT LÕI

### 1.1. Khung Thời Gian 10 Sprint Chuẩn Hóa Theo Báo Cáo
| Sprint | Khoảng Thời Gian | Chủ Đề & Trọng Tâm Theo Báo Cáo | Trạng Thái Thực Tế |
| :--- | :--- | :--- | :--- |
| **Sprint 0** | 26/08 – 27/08/2026 | Khởi động dự án, thiết lập hạ tầng, hồ sơ PI & SRS, Master Test Plan | Đã hoàn thành (14 thẻ Docs) |
| **Sprint 1** | 09/09 – 16/09/2026 | Nền tảng định danh, xác thực JWT, hồ sơ cá nhân & phân quyền vai trò | Đã hoàn thành (14 thẻ Done) |
| **Sprint 2** | 17/09 – 23/09/2026 | Quản trị lớp học, thành viên & biên soạn bài tập đa kỹ năng cơ bản | Đã hoàn thành (11 thẻ Done) |
| **Sprint 3** | 24/09 – 30/09/2026 | Luồng làm bài và nộp bài 4 kỹ năng (Nghe, Nói, Đọc, Viết) | Đã hoàn thành (25 thẻ Done) |
| **Sprint 4** | 01/10 – 08/10/2026 | Chấm tự động trắc nghiệm (Reading/Listening) & Tích hợp AI Service | Đã hoàn thành (20 thẻ Done) |
| **Sprint 5** | 09/10 – 15/10/2026 | Teacher Grading Studio, AI chấm Speaking/Writing, sổ điểm | Đã hoàn thành (22 thẻ Done) |
| **Sprint 6** | 16/10 – 23/10/2026 | Báo cáo thống kê Admin, tối ưu hóa truy vấn CSDL, audit log | Đã hoàn thành (23 thẻ Done) |
| **Sprint 7** | 24/10 – 30/10/2026 | Trải nghiệm thi liên hoàn 4 kỹ năng, hạ tầng lưu trữ S3 Presigned | Đã hoàn thành (15 thẻ Done) |
| **Sprint 8** | 31/10 – 06/11/2026 | Ổn định hóa hệ thống, sửa 14 lỗi nghiêm trọng P0, quản lý bài nháp DRAFT | Đã hoàn thành (44 thẻ Done) |
| **Sprint 9** | 07/11 – 13/11/2026 | Kiểm định toàn diện 36 UCs, regression test, chuẩn hóa UI/UX toàn hệ thống | **Đã hoàn thành phát triển; Đang nghiệm thu Staging (PR #330)** |
| **Sprint 10** | 14/11 – 22/11/2026 | Đóng gói sản phẩm, tối ưu hiệu năng/bảo mật, tài liệu hóa & bảo vệ đồ án | **HIỆN TẠI ĐANG THỰC HIỆN (18 thẻ Backlog, 4 thẻ Ongoing, 6 thẻ Review)** |

---

## PHẦN 2: PHÂN BỔ THÀNH VIÊN VÀ TRÁCH NHIỆM TESTER (VĂN TÚ)

Toàn bộ các thẻ có yêu cầu kiểm thử trên Staging, các thẻ chuẩn bị bàn giao kiểm thử (Review), và các thẻ QA/Load testing đã được cập nhật thành viên **Văn Tú (`zawntsu` / `@Zawn-Tsu`)**:

### 2.1. Danh Sách Thẻ Tại `Testing` (100% Có Mặt Văn Tú)
- **#526 [FE-87]**: UI Quản lý thành viên lớp học (UC009) -> `@Maloque18705`, `@Zawn-Tsu`
- **#527 [FE-88]**: Điều chuyển học viên giữa các lớp (UC009) -> `@Maloque18705`, `@Zawn-Tsu`
- **#528 [FE-89]**: Xuất báo cáo thống kê CSV Admin (UC035) -> `@Maloque18705`, `@Zawn-Tsu`
- **#529 [FE-90]**: Modal Điều chỉnh điểm kèm Audit reason note (UC030) -> `@Maloque18705`, `@Zawn-Tsu`
- **#530 [FE-91]**: Tải tệp âm thanh ghi sẵn cho bài Nói (UC017) -> `@Maloque18705`, `@Zawn-Tsu`
- **#504 [OPS-45]**: CI tự động đồng bộ Trello & nạp Secrets -> `@hotung9108`, `@Zawn-Tsu`

### 2.2. Danh Sách Thẻ Tại `Review` (Chuẩn Bị Nghiệm Thu Staging)
- **#522 [FE-83]**: Fix xuất Excel danh sách bài nộp Giáo viên -> `@tuanpham21105`, `@Zawn-Tsu`
- **#533 [FE-92]**: Modal Admin Đổi Mật Khẩu nối API thật -> `@Maloque18705`, `@Zawn-Tsu`
- **#536 [FE-93]**: Nối API Admin Settings loại bỏ LocalStorage -> `@Maloque18705`, `@Zawn-Tsu`
- **#537 [FE-94]**: Rich Text Toolbar hoạt động thật -> `@Maloque18705`, `@Zawn-Tsu`
- **#539 [OPS-83]**: Spring Boot Actuator & Prometheus Metrics -> `@Maloque18705`, `@Zawn-Tsu`
- **#544 [FE-95]**: Tab Xem Bài Chữa & Đối Chiếu Đáp Án Chi Tiết -> `@Maloque18705`, `@Zawn-Tsu`

### 2.3. Danh Sách Thẻ Kiểm Thử Tại `Ongoing` & `Sprint Backlog`
- **#531 [QA-33]** (`Ongoing`): Nghiệm thu toàn diện 5 tính năng sai lệch final_2 -> Phụ trách: `@Zawn-Tsu`
- **#538 [OPS-48]** (`Sprint Backlog`): Kịch bản k6 Performance & Load Test CI/CD -> Phụ trách: `@tuanpham21105`, `@Zawn-Tsu`
- **#541 [QA-34]** (`Sprint Backlog`): Bổ sung Vitest Coverage >= 80% -> Phụ trách: `@Zawn-Tsu`
