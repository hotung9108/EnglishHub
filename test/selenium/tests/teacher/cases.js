import { expandedCases } from './expanded-cases.js';
export const teacherCases = [
  {
    id: 'QA29-001', title: 'Đăng nhập Giáo viên và xác nhận vai trò', required: [],
    steps: 'Mở URL gốc → nhập tài khoản Giáo viên (chọn tab nếu UI có tab) → đăng nhập → kiểm tra dashboard và role.',
    expected: 'Dashboard /teacher/dashboard; role teacher.',
    run: async () => {}, // Runner logs in and asserts the role for every case.
  },
  {
    id: 'QA29-002', title: 'Danh sách lớp: tìm kiếm đúng lớp và không có kết quả', required: ['className'],
    steps: 'Mở Lớp học → tìm tên lớp QA → tìm chuỗi không tồn tại → tìm lại lớp QA.',
    expected: 'Một lớp đúng tên; tìm chuỗi không tồn tại trả danh sách rỗng; xóa bộ lọc khôi phục kết quả.',
    run: (page, data) => page.searchClass(data.className),
  },
  {
    id: 'QA29-003', title: 'Sổ điểm và báo cáo chi tiết học viên', required: ['className', 'studentName'],
    steps: 'Mở lớp QA → Tiến độ & Bảng điểm → tìm học viên QA → mở chi tiết → đóng.',
    expected: 'Đúng học viên; sổ điểm và drawer có đủ Writing/Speaking/Reading/Listening; đóng được drawer.',
    run: async (page, data) => { await page.openClass(data.className); await page.studentReport(data.studentName); },
  },
  {
    id: 'QA29-004', title: 'Mở báo cáo phân tích bốn kỹ năng của lớp', required: ['className'],
    steps: 'Mở lớp QA → chọn Phân tích 4KN & AI Insights.',
    expected: 'Hiển thị bốn thẻ phân tích kỹ năng. Case này không xác minh độ chính xác số liệu.',
    run: async (page, data) => { await page.openClass(data.className); await page.analytics(); },
  },
  {
    id: 'QA29-005', title: 'Tìm bài tập và mở chi tiết', required: ['assignmentTitle'],
    steps: 'Mở Bài tập → tìm tiêu đề bài QA → chờ đúng bài mẫu xuất hiện (giới hạn chờ dữ liệu riêng) → mở chi tiết.',
    expected: 'Trang chi tiết hiển thị đúng tiêu đề được chọn.',
    run: (page, data) => page.openAssignment(data.assignmentTitle),
  },
  {
    id: 'QA29-006', title: 'Giao bài: từ chối tiêu đề trống', required: ['className'],
    steps: 'Mở Giao bài tập mới → chọn lớp QA → để trống tiêu đề → Giao bài tập.',
    expected: 'Báo Title cannot be empty; vẫn ở form tạo bài.',
    run: async (page, data) => { await page.createForm(data.className); await page.emptyTitle(); },
  },
  ...[false, true].map((publish, index) => ({
    id: `QA29-00${7 + index}`,
    title: publish ? 'Giao bài Writing: xuất bản và kiểm tra dữ liệu đã lưu' : 'Giao bài Writing: lưu nháp và kiểm tra dữ liệu đã lưu',
    required: ['className'],
    steps: 'Mở Giao bài mới → chọn lớp QA → nhập tiêu đề/nội dung Writing và lịch mở/hạn nộp → lưu → tìm lại bài → mở chi tiết → chỉnh sửa.',
    expected: `Đúng tiêu đề, trạng thái ${publish ? 'Open' : 'DRAFT'} và nội dung module Writing khi đọc lại từ server.`,
    run: async (page, data, result) => {
      const title = `QA29-${publish ? 'PUBLISH' : 'DRAFT'}-${data.runId}`;
      result.createdAssignmentTitle = title; // Keep this even if creation partially fails.
      await page.createForm(data.className);
      await page.createWriting(title, data.prompt, publish);
    },
  })),
  {
    id: 'QA29-009', title: 'Chấm bài: từ chối điểm ngoài thang', required: ['assignmentTitle', 'studentName'],
    steps: 'Mở bài QA → mở bài nộp học viên QA → nhập 11 → Lưu & Gửi điểm.',
    expected: 'Báo điểm không hợp lệ; vẫn ở editor chấm bài.',
    run: async (page, data) => { await page.openSubmission(data.assignmentTitle, data.studentName); await page.invalidScore(); },
  },
  {
    id: 'QA29-010', title: 'Lưu và trả điểm/nhận xét; mở lại kiểm tra', required: ['assignmentTitle', 'studentName'],
    steps: 'Mở bài QA → mở bài nộp học viên QA → nhập điểm và nhận xét có mã run → Lưu & Gửi điểm → mở lại cùng bài nộp.',
    expected: 'Điểm chính thức và nguyên văn nhận xét đã lưu hiển thị lại sau khi mở bài nộp.',
    needsApi: true,
    run: async (page, data, result) => {
      await page.openSubmission(data.assignmentTitle, data.studentName);
      await page.grade(data.score, data.feedback);
      const saved = await data.api.get('teacher', `/gradings/${data.fixture.gradingId}`);
      result.readback = { finalScore: saved.finalScore, expectedScore: data.score, feedbackMatches: saved.finalFeedback === data.feedback };
      await page.openSubmission(data.assignmentTitle, data.studentName);
      try { await page.assertGrade(data.score, data.feedback); }
      catch (error) { if (result.readback.feedbackMatches && saved.finalScore === data.score) error.code = 'QA29_PRODUCT_CANDIDATE'; throw error; }
    },
  },
  ...expandedCases,
];
