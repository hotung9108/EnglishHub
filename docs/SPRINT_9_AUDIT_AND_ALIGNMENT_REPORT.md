# BÁO CÁO TOÀN DIỆN: ĐỐI SOÁT & CHUẨN HÓA TIẾN ĐỘ 10 SPRINTS, NHÃN & SUBTASKS (TRELLO vs OVERLEAF vs CODEBASE)

> **Dự án**: EnglishHub — Nền tảng Quản lý Bài tập và Chấm chữa Bài tiếng Anh Thông minh  
> **Tài liệu**: Báo cáo Kiểm toán và Đồng bộ hóa Sprint 9  
> **Ngày thực hiện**: **09/11/2026**  
> **Người thực hiện**: AI Architecture & PM Support Agent  
> **Trello Board**: `Project1` (ID: `6a7f2e4b7b1d207eee516457`)  
> **Overleaf Project**: `Project_1` (ID: `6a8d98489e5b4896f3515c11`)  

---

## 1. TỔNG QUAN VỀ HIỆN TRẠNG TIẾN ĐỘ VÀ SPRINT HIỆN TẠI

### 1.1. Xác định Sprint hiện tại và Mốc thời gian
Sau khi đối soát chéo 4 nguồn dữ liệu: Báo cáo Kế hoạch dự án (`02_PP` - `Chapter_06.tex`), Báo cáo Kế hoạch kiểm thử (`03_TP` - `11.tex`), Báo cáo Tổng kết dự án (`04_FR` - `Chapter_04.tex`), và bảng Trello:
- Toàn bộ dự án tuân theo chu kỳ phát triển Scrum **10 Sprints độc lập (09/09/2026 – 22/11/2026)**.
- **Hôm nay là 09/11/2026**: Dự án đang ở **Sprint 9 (07/11/2026 – 13/11/2026)**, cụ thể là **ngày thứ 3 của Sprint 9**.
- **Sprint 8** đã kết thúc vào ngày **06/11/2026**.
- **Sprint 10 (Sprint cuối)** sẽ diễn ra từ **14/11/2026 – 22/11/2026** (Đóng gói Production, Smoke Test, Bảo vệ đồ án).

### 1.2. Bảng phân bố 10 Sprints chuẩn
| Sprint | Thời gian | Trọng tâm công việc | Trạng thái |
| :--- | :---: | :--- | :---: |
| **Sprint 1** | 09/09 – 15/09/2026 | Khởi tạo dự án, Kiến trúc DDD/Monorepo, SRS & CI/CD cơ bản | **Hoàn thành** |
| **Sprint 2** | 16/09 – 22/09/2026 | Xác thực tài khoản (JWT/Auth), Quản lý Lớp học & Phân quyền | **Hoàn thành** |
| **Sprint 3** | 23/09 – 29/09/2026 | Ngân hàng câu hỏi, Quản lý bài tập (Assignment Management) | **Hoàn thành** |
| **Sprint 4** | 30/09 – 07/10/2026 | Giao diện làm bài học sinh (Listening/Reading/Writing/Speaking) | **Hoàn thành** |
| **Sprint 5** | 08/10 – 15/10/2026 | Tích hợp AI Grading Engine (Gemini / Whisper / TTS), Chấm tự động | **Hoàn thành** |
| **Sprint 6** | 16/10 – 23/10/2026 | Quản lý Chấm chữa bài Giáo viên, Phản hồi thủ công, Bảng điểm | **Hoàn thành** |
| **Sprint 7** | 24/10 – 30/10/2026 | Kiểm thử tự động (Vitest, Pytest, Playwright E2E), Cloudflare Tunnel | **Hoàn thành** |
| **Sprint 8** | 31/10 – 06/11/2026 | Tối ưu hóa UI/UX, Sửa lỗi bảo mật, Token soft-delete, Presigned S3 | **Hoàn thành** |
| **Sprint 9** | **07/11 – 13/11/2026** | **Tối ưu trải nghiệm Giáo viên, Audio Presigned, Hide Draft, Đóng gói AI** | **ĐANG DIỄN RA (Ngày 3)** |
| **Sprint 10** | 14/11 – 22/11/2026 | Hoàn thiện Báo cáo, Đóng gói Production, Smoke Test, Nghiệm thu | *Kế hoạch sắp tới* |

---

## 2. HIỆN THỰC HÓA QUY TRÌNH 2 TẦNG NGHIỆM THU: CỘT `TESTING` TRƯỚC `REVIEW`

### 2.1. Phân tích đề xuất từ User (PM)
Ý tưởng bổ sung một cột **`Testing`** ngay trước cột **`Review`** đã được đánh giá là **cực kỳ hợp lý và giải quyết triệt để vấn đề nút thắt cổ chai (bottleneck)**:
1. **Phân tách rạch ròi 2 tầng nghiệm thu**:
   - **Tầng 1 - Kỹ thuật & Chức năng (Tester `@Zawn-Tsu`)**: Kiểm thử trên môi trường Staging, kiểm tra responsive, console error, tính năng âm thanh/video, xử lý file... Nếu phát hiện bug, Tester kéo về `Ongoing`/`Blocked`. Nếu đạt, Tester xác nhận pass và chuyển sang cột `Review`.
   - **Tầng 2 - Nghiệp vụ & Phạm vi (PM `@hotung9108`)**: Xem xét tổng thể sản phẩm theo Acceptance Criteria, UX, tài liệu, trước khi quyết định merge và kéo thẻ sang `Done (Sprint X)`.
2. **Quy trình luân chuyển thẻ chuẩn (Kanban Flow)**:
   $$\text{Sprint Backlog} \longrightarrow \text{Ongoing (Dev)} \longrightarrow \mathbf{\text{Testing (Tester)}} \longrightarrow \mathbf{\text{Review (PM)}} \longrightarrow \text{Done (Sprint X)}$$

### 2.2. Các hành động đã thực thi
1. **Tạo cột `Testing` trên Trello board `Project1`**: Đặt chính xác tại vị trí giữa `Ongoing` và `Review` (pos: `6000.0`).
2. **Di chuyển 15 thẻ PR tính năng từ `Review` sang `Testing`**:
   - `[FE-79] Thêm nút tải tệp bài làm của học viên (Document & Audio) trên giao diện Frontend`
   - `[OPS-46] Cập nhật Audio Smoke Test trong CD Staging tương thích kiến trúc Presigned URL`
   - `[FE-77] Xử lý trích xuất văn bản bài viết Writing học sinh`
   - `[FE-76] Phát audio đề Listening Presigned URL và file nộp Speaking`
   - `[FE-75] Tái thiết kế toàn diện UI/UX và chuẩn hóa logic toàn bộ Website EnglishHub`
   - `[BE-69] Chuẩn hóa định dạng thời gian ISO UTC`
   - `[BE-75] API download file nộp của học sinh`
   - `[OPS-35] Staging sync và health-check endpoint`
   - `[FE-59] Tối ưu hóa hiệu năng Frontend & Khắc phục nghẽn mạng Staging`
   - `[BE-76] Ngăn chặn mock fallback khi thiếu API key`
   - `[BE-74] Chuyển đổi Presigned URL giữa Backend và AI Service`
   - `[FE-81] Chuẩn hóa trải nghiệm Giáo viên và Quiz refinements`
   - `[FE-80] Tự động parse aiTranscript thành JSON an toàn`
   - `[FE-73] Hook useFileUpload 3 bước`
   - `[FE-74] Đóng gói bài viết Writing học sinh`
3. **Cập nhật CI/CD Bot ([`.github/workflows/trello-sync.yml`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/.github/workflows/trello-sync.yml))**:
   - Khi Developer mở Pull Request, GitHub Actions tự động tìm kiếm danh sách `Testing` đầu tiên, chuyển thẻ vào `Testing`, và gắn thẻ `@zawntsu` vào kiểm thử trên Staging.
4. **Cập nhật Báo cáo Kế hoạch Dự án ([`reports/02_Chapters/Chapter_06.tex`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/overleaf_reports/Project_1/final/reports/02_Chapters/Chapter_06.tex))**:
   - Đã cập nhật mục 6.2.2 để liệt kê đầy đủ 21 danh sách Trello, trong đó nêu rõ mục đích của cột `Testing` dành cho Tester và cột `Review` dành cho Product Manager.
   - Đã đồng bộ thành công lên Overleaf Cloud (`Project_1` - ID `6a8d98489e5b4896f3515c11`).

---

## 3. TÁI CẤU TRÚC DANH SÁCH TRELLO BOARD (21 CỘT CANONICAL)

Toàn bộ 21 danh sách trên board `Project1` đã được sắp xếp lại theo đúng thứ tự logic công việc và thứ tự đảo ngược thời gian của các Sprint Done:

| STT | Tên Danh Sách Trello | Vị trí (pos) | Chức năng / Ý nghĩa |
| :---: | :--- | :---: | :--- |
| 1 | **Docs** | 1000 | Tài liệu kiến trúc, đặc tả, quy định dự án |
| 2 | **Product Backlog** | 2000 | Danh mục tính năng chung của sản phẩm chưa phân bổ vào Sprint |
| 3 | **Sprint Backlog** | 3000 | Các công việc được lên kế hoạch cho Sprint hiện tại |
| 4 | **Blocked** | 4000 | Các tác vụ gặp trở ngại, lỗi môi trường hoặc thiếu tài nguyên |
| 5 | **Ongoing** | 5000 | Developer đang tích cực lập trình |
| 6 | **Testing** *(Mới tạo)* | 6000 | Tester (@Zawn-Tsu) đang kiểm thử tính năng trên Staging |
| 7 | **Review** | 7000 | PM (@hotung9108) nghiệm thu tính năng và duyệt merge |
| 8 | **Done (Sprint 10)** *(Mới tạo)* | 7500 | Tác vụ hoàn thành trong Sprint 10 |
| 9 | **Done (Sprint 9)** *(Mới tạo)* | 8000 | Tác vụ hoàn thành trong Sprint 9 |
| 10 | **Done (Sprint 8)** *(Đã sửa tên)* | 9000 | Tác vụ hoàn thành trong Sprint 8 (Sửa lỗi chính tả từ `Srpint 8`) |
| 11 | **Done (Sprint 7)** *(Đã sửa tên)* | 10000 | Tác vụ hoàn thành trong Sprint 7 (Đổi từ `Sprint 7`) |
| 12 | **Done (Sprint 6)** | 11000 | Tác vụ hoàn thành trong Sprint 6 |
| 13 | **Done (Sprint 5)** | 12000 | Tác vụ hoàn thành trong Sprint 5 |
| 14 | **Done (Sprint 4)** | 13000 | Tác vụ hoàn thành trong Sprint 4 |
| 15 | **Done (Sprint 3)** | 14000 | Tác vụ hoàn thành trong Sprint 3 |
| 16 | **Done (Sprint 2)** | 15000 | Tác vụ hoàn thành trong Sprint 2 |
| 17 | **Done (Sprint 1)** | 16000 | Tác vụ hoàn thành trong Sprint 1 |
| 18 | **03. TP** | 17000 | Thẻ theo dõi bàn giao Báo cáo Kế hoạch Kiểm thử |
| 19 | **02. PP** | 18000 | Thẻ theo dõi bàn giao Báo cáo Kế hoạch Dự án |
| 20 | **01. SRS** | 19000 | Thẻ theo dõi bàn giao Đặc tả Yêu cầu Phần mềm |
| 21 | **00. PI** | 20000 | Thẻ theo dõi thông tin khởi tạo dự án |

---

## 4. KẾT QUẢ GÁN NHÃN CHO TOÀN BỘ 81 TASKS THIẾU NHÃN

Trước khi kiểm toán, board có 81 thẻ không có bất kỳ nhãn nào, gây khó khăn cho việc lọc và thống kê theo role.
Kịch bản [`scripts/assign_missing_labels.py`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/scripts/assign_missing_labels.py) đã thực hiện gán tự động dựa trên mã định danh và nội dung thẻ:
- **Nhãn `Frontend` (Màu Vàng)**: Gán cho toàn bộ các thẻ có prefix `[FE-*]` thiếu nhãn.
- **Nhãn `Backend` (Màu Xanh lá)**: Gán cho toàn bộ các thẻ có prefix `[BE-*]` thiếu nhãn.
- **Nhãn `Devops` (Màu Hồng)**: Gán cho toàn bộ các thẻ có prefix `[OPS-*]` thiếu nhãn.
- **Nhãn `Tester` (Màu Tím)**: Gán cho toàn bộ các thẻ có prefix `[QA-*]` thiếu nhãn.
- **Nhãn `Docs` (Màu Xanh dương)**: Gán cho các thẻ `[DOC-*]` và các tài liệu kỹ thuật.
- **Nhãn `Bug` (Màu Cam)**: Gán bổ sung cho các thẻ issue sửa lỗi phần mềm.

**Kết quả kiểm tra lại qua [`scripts/verify_trello_state.py`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/scripts/verify_trello_state.py) và [`scripts/deep_audit_goal.py`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/scripts/deep_audit_goal.py)**:
- **Tổng số cards trên board**: 257 cards.
- **Tổng số cards thiếu nhãn**: **0 cards** (Đạt tỷ lệ gắn nhãn 100%).

---

## 5. KẾT QUẢ RÀ SOÁT VÀ CHUẨN HÓA SUBTASKS (CHECKLISTS)

### 5.1. Tích bù hoàn thành cho các Subtasks đã làm xong (False Incomplete)
1. **Trong các cột `Done (Sprint 1..8)`**:
   - Đã kiểm tra và **tích hoàn thành 188 check items** trên 49 thẻ.
   - Điển hình:
     - `[FE-16]`, `[FE-17]`, `[FE-18]`, `[FE-21]`, `[FE-27]`, `[FE-28]`: Tích 100% checklist tương ứng với các Service/Hook và luồng Admin đã hoạt động.
     - `[BE-16]`, `[BE-18]`, `[BE-23]`, `[BE-25]`, `[BE-26]`: Tích 100% checklist API và AI Engine chấm tự động.
     - `[OPS-18]`, `[OPS-19]`: Tích 100% checklist Docker Compose và Cloudflare Tunnel.
     - `[QA-10]` đến `[QA-18]`: Tích 100% checklist kiểm thử các API đã pass.
     - `[QA-28] Thiết lập Vitest`: Tích 100% (6/6 subtasks) và chuyển về đúng danh sách `Done (Sprint 7)`.
2. **Trong danh sách `Testing` (Các tính năng đã code & merge)**:
   - Đã kiểm tra và **tích hoàn thành bổ sung 38 subtasks** cho 4 thẻ đã merge code vào nhánh `develop`:
     - `[FE-79]`: Tích hoàn thành 7/7 Scope và 7/7 DoD (PR #304 đã merge).
     - `[FE-74]`: Tích hoàn thành 5/5 DoD (PR #286 đã merge).
     - `[FE-75]`: Tích hoàn thành 6/6 Scope và 5/5 Dev DoD (PR #298 / #302 đã merge; bảo lưu 01 mục kiểm thử thực tế trên Staging cho Tester).
     - `[FE-59]`: Tích hoàn thành 8/8 DoD (PR #283 đã merge).
3. **Tổng kết check items toàn board**:
   - Tổng số cards có checklist: 142 cards.
   - Tổng số check items: 667 items.
   - **Số check items đã hoàn thành: 514 items** (Tăng từ 288 lên 514 sau khi chuẩn hóa 226 items).
   - **Số check items incomplete trong các danh sách `Done (*)`: 0 items** (100% các task Done đều có checklist hoàn tất).

### 5.2. Phát hiện và xử lý "Subtask bị thiếu nhưng vẫn tích" & Cập nhật Due Date
- **Phát hiện**: Các thẻ `[FE-48]`, `[FE-47]`, `[FE-46]`, `[BE-49]`, `[BE-61]`, `[OPS-36]`, `[OPS-45]`, `[FE-49]` trong Sprint 8: Checklist nghiệm thu đã tích xong nhưng thuộc tính checkbox hạn chót (`dueComplete`) của thẻ Trello chưa được đánh dấu hoàn thành.
- **Xử lý**: Đã cập nhật `dueComplete = True` cho tất cả các thẻ đã hoàn tất trong Sprint 8. Hiện tại không còn thẻ Done nào có Due Date bị bỏ sót.
- **Cập nhật Due Dates cho Sprint 9**: Đã thiết lập mốc hoàn thành chuẩn xác trong khung thời gian Sprint 9 (07/11 – 13/11/2026) cho các thẻ đang diễn ra:
  - `[FE-76]`: Due date 09/11/2026.
  - `[FE-78]`, `[BE-77]`, `[FE-79]`, `[BE-76]`, `[FE-81]`: Due date 10/11/2026.
  - `[QA-30]`: Due date 11/11/2026.
  - `[QA-31]`: Due date 12/11/2026.

---

## 6. ĐỒNG BỘ VỚI BÁO CÁO TRÊN OVERLEAF CLOUD

- Tệp báo cáo [`reports/02_Chapters/Chapter_06.tex`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/overleaf_reports/Project_1/final/reports/02_Chapters/Chapter_06.tex) tại mục 6.2.2 đã được cập nhật mô tả cấu trúc 21 danh sách Kanban bao gồm cột `Testing`.
- Kịch bản [`scripts/sync_chapter_06_to_overleaf.py`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/scripts/sync_chapter_06_to_overleaf.py) đã tải tệp này lên Overleaf Cloud (`Project_1` - Project ID: `6a8d98489e5b4896f3515c11`).
- Kịch bản [`scripts/verify_overleaf_cloud_ch06.py`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/scripts/verify_overleaf_cloud_ch06.py) đã tải về và kiểm chứng: **100% nội dung trên Cloud đã khớp với bản địa phương**.

---

## 7. BẢNG TỔNG KẾT KIỂM TOÁN TỪNG MỤC CỦA KẾ HOẠCH (COMPLIANCE MATRIX)

| STT | Hạng mục theo Kế hoạch (`sprint_alignment_audit_and_fix_plan.md`) | Kết quả kiểm toán thực tế | Trạng thái |
| :---: | :--- | :--- | :---: |
| **1.1** | Tạo danh sách `Testing` giữa `Ongoing` và `Review` | Đã tạo tại pos `6000.0`, nằm chính xác giữa `Ongoing` (5000) và `Review` (7000) | **PASS 100%** |
| **1.2** | Đổi tên `Sprint 7` $\longrightarrow$ `Done (Sprint 7)` | Đã đổi tên chuẩn mực tại pos `10000.0` | **PASS 100%** |
| **1.3** | Sửa chính tả `Srpint 8` $\longrightarrow$ `Done (Sprint 8)` | Đã sửa tên chuẩn mực tại pos `9000.0` | **PASS 100%** |
| **1.4** | Tạo mới `Done (Sprint 9)` và `Done (Sprint 10)` | Đã tạo `Done (Sprint 9)` (pos `8000`) và `Done (Sprint 10)` (pos `7500`) | **PASS 100%** |
| **1.5** | Sắp xếp toàn bộ 21 cột Trello theo thứ tự chuẩn Kanban | Đối soát khớp 100% cấu trúc 21 cột (từ `Docs` đến `00. PI`) | **PASS 100%** |
| **2.1** | Gán nhãn cho 81 thẻ thiếu nhãn theo role chuẩn | 81 thẻ đã được gán đúng nhãn (`Frontend`, `Backend`, `Devops`, `Tester`, `Docs`, `Bug`) | **PASS 100%** |
| **2.2** | Kiểm tra tỷ lệ gắn nhãn toàn bộ 257 thẻ | 0 thẻ thiếu nhãn (257/257 thẻ có nhãn) | **PASS 100%** |
| **3.1** | Tích bù checklist cho các task trong `Done (Sprint 1..8)` | 188 subtasks trên 49 thẻ đã được tích complete; 0 incomplete item trong Done lists | **PASS 100%** |
| **3.2** | Tích bù checklist cho các tính năng đã merge trong `Testing` | 38 subtasks trên 4 thẻ (`FE-79`, `FE-74`, `FE-75`, `FE-59`) đã được tích hoàn tất | **PASS 100%** |
| **3.3** | Chuyển `[QA-28]` về `Done (Sprint 7)` và tích 6/6 subtasks | Đã tích 6/6 subtasks và nằm tại `Done (Sprint 7)` | **PASS 100%** |
| **3.4** | Cập nhật Due Dates chuẩn Sprint 9 (07/11 - 13/11) | Đã cập nhật cho 8 thẻ đang chạy (`FE-76`, `FE-78`, `FE-79`, `FE-81`, `BE-76`, `BE-77`, `QA-30`, `QA-31`) | **PASS 100%** |
| **3.5** | Xử lý `dueComplete` cho các thẻ Sprint 8 | Đã cập nhật `dueComplete = True` cho toàn bộ thẻ Done có hạn chót | **PASS 100%** |
| **3.6** | Phân loại 15 thẻ PR từ `Review` sang `Testing` | Cột `Testing` có 15 thẻ, cột `Review` có 0 thẻ (sẵn sàng chờ Tester) | **PASS 100%** |
| **4.1** | Cập nhật Báo cáo `Chapter_06.tex` mục 6.2.2 về cột `Testing` | Đã cập nhật văn bản mô tả 21 cột và cột `Testing` | **PASS 100%** |
| **4.2** | Đồng bộ hóa `Chapter_06.tex` lên Overleaf Cloud | Đã tải lên Cloud và kiểm chứng nội dung tải về trùng khớp 100% | **PASS 100%** |
| **4.3** | Cập nhật CI/CD Workflow `.github/workflows/trello-sync.yml` | Đã bổ sung logic tự động đưa PR vào cột `Testing` và gọi `@zawntsu` | **PASS 100%** |
