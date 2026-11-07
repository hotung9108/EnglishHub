# Kiến Trúc Kỹ Thuật & Hướng Dẫn Mở Rộng Framework (Architecture & Extending Guide)

Tài liệu này dành cho các Kỹ sư Đảm bảo Chất lượng (QA Engineer) và Lập trình viên muốn tìm hiểu sâu về kiến trúc nội tại của [`test_reborn`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn) hoặc muốn viết thêm các ca kiểm thử mới, mở rộng Page Objects và tích hợp thêm kịch bản API.

---

## 1. Kiến Trúc Mẫu Thiết Kế (Design Patterns)

Framework `test_reborn` được thiết kế theo các nguyên tắc kỹ thuật phần mềm chuẩn mực:

### 1.1. Page Object Model (POM)
Tách rời hoàn toàn giữa **Mã kịch bản kiểm thử (Test Logic)** và **Bộ định vị giao diện (UI Locators / Selectors)**:

```text
black-box/e2e/
├── common/pages/
│   ├── BasePage.js          # Chứa các phương thức cốt lõi: click, type, waitVisible, waitForUrl
│   └── LoginPage.js         # Màn hình đăng nhập đa vai trò (Admin / Teacher / Student)
├── admin/pages/
│   └── AdminPage.js         # Các thao tác quản trị: tìm kiếm user, tạo user, khóa tài khoản, tạo lớp
├── teacher/pages/
│   └── TeacherPage.js       # Các thao tác giáo viên: tạo bài tập 4 kỹ năng, publish, chấm điểm, sổ điểm
└── student/pages/
    └── StudentPage.js       # Các thao tác học viên: làm trắc nghiệm, nộp essay, upload audio, nộp lại
```

**Nguyên tắc**: Không bao giờ gọi trực tiếp `driver.findElement(By.css(...))` trong file kịch bản `.spec.js`. Mọi tương tác giao diện đều phải được đóng gói thành các hàm nghiệp vụ có ý nghĩa trên Page Object (ví dụ: `page.searchUser(keyword)`, `page.publishAssignment(id)`).

---

### 1.2. Browser Factory & Bảo Toàn NFR (Usability)
Tệp [`black-box/e2e/common/support/browser-factory.js`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/black-box/e2e/common/support/browser-factory.js) chịu trách nhiệm cấu hình phiên trình duyệt Chrome:

- **Giữ nguyên 100% hình ảnh & hiệu ứng chuyển cảnh**: Để thỏa mãn tiêu chuẩn kiểm thử Usability (USA-01..USA-06), tuyệt đối không dùng cờ `--blink-settings=imagesEnabled=false` hoặc tắt CSS animations.
- **Triệt tiêu cảnh báo pipe nền của Windows**: Bổ sung các cờ `--disable-component-update`, `--disable-background-networking`, `--log-level=3` và `excludeSwitches('enable-logging')` nhằm ngăn chặn các thông báo lỗi named pipe `0x5` của Chrome updater trên hệ điều hành Windows.
- **Tối ưu độ phân giải**: Chuẩn hóa cửa sổ trình duyệt ở kích thước `1440x900` để đảm bảo responsive mượt mà trên desktop.

---

### 1.3. Fixture Ledger & Tránh Race Condition
- **Fixtures Tĩnh**: [`fixtures/staging.json`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/fixtures/staging.json) lưu trữ sẵn các thông tin lớp học mẫu, mã bài tập đã khởi tạo trên Staging để các runner không phải khởi tạo lại từ đầu mỗi lần chạy.
- **Cô lập Phiên người dùng**: Các runner sử dụng tài khoản độc lập (`qa_admin_...`, `qa_teacher_...`, `qa_student_...`) tránh xung đột session khi chạy song song 3 vai trò cùng lúc.

---

## 2. Hướng Dẫn Thêm Một Test Case E2E Mới

Quy trình 3 bước chuẩn để thêm ca kiểm thử E2E:

### Bước 1: Khai báo phương thức tương tác trên Page Object
Mở tệp Page Object tương ứng (ví dụ: `black-box/e2e/teacher/pages/TeacherPage.js`) và thêm hành động UI:

```javascript
// Ví dụ: Thêm hàm lọc bài tập theo trạng thái
async filterAssignmentsByStatus(status) {
  const selectElem = await this.waitVisible(By.css('[data-testid="assignment-status-filter"]'));
  await selectElem.sendKeys(status);
  await this.waitApi('/api/v1/assignments'); // Đợi API trả về dữ liệu mới
}
```

### Bước 2: Thêm ca kiểm thử vào file kịch bản `.spec.js`
Mở file spec tương ứng (ví dụ: `black-box/e2e/teacher/cases/assignment-flow.spec.js`) và thêm vào mảng `teacherCases`:

```javascript
{
  id: 'TEA-052', // Đặt mã tiếp theo theo quy chuẩn ROLE-xxx
  title: 'Giáo viên lọc danh sách bài tập theo trạng thái CLOSED',
  required: ['className'],
  steps: 'Mở Danh sách Bài tập → chọn bộ lọc trạng thái CLOSED → kiểm tra danh sách kết quả.',
  expected: 'Chỉ các bài tập đã đóng mới hiển thị trên bảng.',
  run: async (page, data) => {
    await page.filterAssignmentsByStatus('CLOSED');
    // Thực hiện assert kết quả
  }
}
```

### Bước 3: Xác minh nhanh
Chạy kiểm tra cú pháp và thực thi riêng ca vừa viết:
```powershell
node black-box/e2e/teacher/run.js --case TEA-052 --headed
```

---

## 3. Hướng Dẫn Thêm Kịch Bản Kiểm Thử API Mới

1. **Tạo Collection Postman/Newman**: Xuất file `collection.json` từ Postman và đặt vào thư mục tương ứng trong `black-box/api/<role>/<feature>/`.
2. **Khai báo vào Catalog**: Mở tệp [`catalog.json`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/black-box/api/catalog.json) và đăng ký phân hệ mới:
   ```json
   {
     "id": "teacher-announcement",
     "role": "teacher",
     "suiteName": "Teacher Announcements API",
     "useCases": ["UC37"],
     "qaseSuiteId": 223,
     "collection": "teacher/announcement/collection.json",
     "environment": "teacher/announcement/environment.staging.json"
   }
   ```
3. **Chạy thử nghiệm**:
   ```powershell
   node black-box/api/run.cjs --suite teacher-announcement
   ```

---

## 4. Hướng Dẫn Ghi Nhận & Tái Hiện Bug Mới

Khi phát hiện lỗi nghiêm trọng trên Staging trong quá trình kiểm thử:

1. **Tạo thư mục Bug**: Tạo thư mục mới tại `bugs/active/BUG-<ID>-<slug>/` (ví dụ: `bugs/active/BUG-215-student-audio-playback/`).
2. **Soạn tài liệu mô tả**: Sao chép mẫu từ [`bugs/templates/BUG_REPORT_TEMPLATE.md`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/bugs/templates/BUG_REPORT_TEMPLATE.md) thành `README.md`.
3. **Đính kèm bằng chứng**: Đặt ảnh chụp màn hình, video hoặc network dump vào thư mục `evidence/`.
4. **Tạo script tái hiện độc lập**: Viết file `reproduce.js` mô phỏng tối giản các bước gây ra bug để Developer có thể chạy và sửa lỗi ngay lập tức.
