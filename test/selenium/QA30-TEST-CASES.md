# QA30 — Test case Học viên

45 case từ registry thực thi. Mỗi case có browser session mới và đăng nhập đúng role STUDENT. Fixture API chỉ tạo dữ liệu QA và đọc lại kết quả; thao tác nghiệp vụ chạy bằng Selenium.

Xem [QA30-README.md](QA30-README.md) để cấu hình/chạy và report thực tế. Số case không đồng nghĩa bao phủ 100% chức năng.

| ID | Nội dung | Bước thực hiện | Kỳ vọng |
| --- | --- | --- | --- |
| QA30-001 | Đăng nhập Học viên và dashboard | Đăng nhập qua URL gốc, kiểm tra dashboard và role. | URL /student/dashboard, role STUDENT, có nội dung chính. |
| QA30-002 | Xem và tìm đúng lớp đã ghi danh | Mở Lớp học; tìm tên lớp QA30. | Đúng một thẻ lớp QA30 đã ghi danh, khớp API. |
| QA30-003 | Tìm lớp không tồn tại | Mở lớp; nhập chuỗi không tồn tại. | Không còn thẻ lớp; có trạng thái rỗng. |
| QA30-004 | Chi tiết lớp và danh sách bài | Bấm Xem lớp trên lớp QA30. | Đúng URL/tiêu đề lớp và các bài đã xuất bản. |
| QA30-005 | Tìm bài tập theo tiêu đề | Mở Bài tập; tìm chính xác bài Writing QA30. | Chỉ một thẻ bài đúng tiêu đề. |
| QA30-006 | Tìm bài không tồn tại | Mở danh sách bài, nhập chuỗi không tồn tại. | Không còn thẻ bài; có trạng thái rỗng. |
| QA30-007 | Tổng quan bài và số lượt | Danh sách bài tập → tìm Writing → Tổng quan; cuộn đến ô số lượt và nút bắt đầu, không bấm làm bài. | Đúng tên/mã bài; số lượt khớp API, chưa có lượt làm; nút Bắt đầu được bật. |
| QA30-008 | Bắt đầu lượt Writing | Bắt đầu Writing từ Overview. | Có editor; API tạo lượt IN_PROGRESS gắn đúng module. |
| QA30-009 | Validation Writing trống | Mở editor; xóa nội dung rồi bấm Nộp bài. | UI báo phải nhập/tải file; API vẫn IN_PROGRESS, không có bài nộp mới. |
| QA30-010 | Lưu nháp Writing và mở lại | Nhập nội dung, Lưu nháp; đi qua sidebar rồi mở lại bài. | Editor giữ nguyên nội dung; chưa nộp API. |
| QA30-011 | Writing văn bản: đối chiếu khả năng lưu nội dung | Mở Writing ESSAY hợp lệ; nhập bài luận không đính kèm file, nộp bằng UI và đọc lại đúng lượt API. | UI cho nộp text thì nội dung phải được giữ. ESSAY hiện chỉ lưu file: mất text ghi CONTRACT_GAP_REVIEW để review FE/BE, không tính Pass. |
| QA30-012 | Nộp Writing đính kèm PDF | Mở Writing ESSAY, chọn PDF mẫu, kiểm tra tên file rồi nộp qua UI. | Module/submission đã nộp và tài liệu READY trong API; không yêu cầu API lưu text của ESSAY. |
| QA30-013 | Nộp Reading đáp án đúng | Mở Reading, nhập daily practice, hoàn thành và nộp. | Đáp án lưu đúng, trạng thái đã nộp; auto score 10/10. |
| QA30-014 | Nộp Reading đáp án sai | Nhập incorrect answer và nộp qua UI. | Lưu câu trả lời sai; auto score 0/10, không biến điểm 0 thành thiếu điểm. |
| QA30-015 | Nộp Listening câu trả lời ngắn | Mở Listening, điền daily practice và nộp. | Đáp án đúng được lưu, module/submission đã nộp. Không đánh giá chất lượng audio. |
| QA30-016 | Speaking: ghi âm và nộp bản ghi thật | Bắt đầu/dừng recorder, bấm Nộp bài; đối chiếu trạng thái và audio API. | Bài đã nộp và audioStorageKey/audioUploadStatus READY. Recorder mô phỏng không được tính Pass. |
| QA30-017 | Mở kết quả bài đã chấm | Từ đúng dòng Bảng điểm, bấm xem kết quả bài fixture. | Đúng submissionId, tiêu đề và ô điểm 7.5. |
| QA30-018 | Điểm thô khớp thang điểm API | Tìm bài Reading đã chấm trong Bảng điểm; đối chiếu maxScoreSnapshot. | Điểm thô phải là 7.5/10, không hiển thị sai mẫu số 100. |
| QA30-019 | Lọc Bảng điểm theo kỹ năng Reading | Tải bảng điểm; chọn Reading, kiểm tra các dòng hiển thị, độc lập việc tìm tiêu đề fixture. | Bộ lọc được chọn Reading; mọi dòng dữ liệu có nhãn READING. Bảng rỗng dù API có bài Reading cần review mapping. |
| QA30-020 | Xem đánh giá định kỳ đúng nội dung | Mở Nhận xét; tìm nội dung đánh giá QA30. | Đúng nội dung và lớp đã ghi trong API evaluation. |
| QA30-021 | Đánh giá định kỳ: lọc giáo viên và mở lớp | Tìm evaluation; chọn Từ Giảng viên rồi bấm nút hành động của chính thẻ đánh giá định kỳ. | Đánh giá vẫn hiện; hành động phải mở lớp QA30, không mở kết quả bài nộp không liên quan. |
| QA30-022 | Nhận xét chấm bài chính thức | Mở Nhận xét và tìm finalFeedback của bài fixture. | Nhận xét chính thức từ API hiển thị nguyên nội dung. |
| QA30-023 | Tìm nhận xét không tồn tại | Sau khi tải feedback, tìm chuỗi không có. | Không có thẻ feedback, hiện trạng thái rỗng. |
| QA30-024 | Lịch sử lượt nộp bài đã chấm | Lớp học → đúng bài đã chấm → Overview; so lịch sử với API, độc lập nút Bảng điểm. | Số dòng, số lượt và điểm của lượt fixture phải khớp API. |
| QA30-025 | Reading MCQ: đáp án đúng, điểm 10 | Chọn đáp án 1 trong câu MCQ, nộp qua UI, đọc lại đúng lượt. | Đáp án 1 lưu đúng questionId; module/submission đã nộp và auto score 10/10. |
| QA30-026 | Reading MCQ: đáp án sai, điểm 0 | Chọn đáp án 2 trong câu MCQ, nộp qua UI, đọc lại đúng lượt. | Đáp án 2 lưu đúng questionId; module/submission đã nộp và auto score 0/10. |
| QA30-027 | Listening MCQ: đáp án đúng, điểm 10 | Chọn đáp án 1 trong câu MCQ, nộp qua UI, đọc lại đúng lượt. | Đáp án 1 lưu đúng questionId; module/submission đã nộp và auto score 10/10. |
| QA30-028 | Bảng điểm gắn đúng tên bài, kỹ năng và trạng thái | Tìm dòng bài chấm sẵn và so metadata với fixture/API. | Đúng tên bài Reading và trạng thái đã có điểm; không dùng tên thay thế hoặc Writing. |
| QA30-029 | Lọc lớp đang học và đã hoàn thành | Tìm lớp QA30; chọn Đang diễn ra, rồi Đã hoàn thành. | Lớp ACTIVE chỉ xuất hiện ở bộ lọc đang học; không lọt vào lớp hoàn thành. |
| QA30-030 | Lọc bài theo lớp và trạng thái đã chấm | Lọc đúng lớp QA30, tìm bài đã chấm; chọn Đã có kết quả, rồi Chưa bắt đầu. | Bài GRADED xuất hiện đúng tab kết quả và không xuất hiện trong tab chưa bắt đầu. |
| QA30-031 | Bảng điểm: tìm kiếm không có kết quả | Tải Bảng điểm rồi tìm chuỗi không tồn tại. | Không còn dòng dữ liệu, có thông báo rỗng; không hiển thị dòng cũ. |
| QA30-032 | Bảng điểm: lọc theo nhãn lớp | Tải bảng điểm; chọn lớp QA30, kiểm tra nhãn lớp các dòng hiển thị; không phụ thuộc tìm tên bài. | Dropdown nhận đúng giá trị lớp và mọi dòng hiển thị mang nhãn lớp đã chọn. Mapping bài/lớp theo API kiểm tra riêng ở 028. |
| QA30-033 | Nhận xét: bộ lọc kỹ năng | Tải các nhận xét; lần lượt chọn Reading và Writing, kiểm tra nhãn kỹ năng các thẻ hiển thị. | Bộ lọc chọn đúng và không giữ thẻ khác kỹ năng. Sự hiện diện finalFeedback kiểm tra riêng ở 022. |
| QA30-034 | Nhận xét bài nộp: mở đúng bài làm | Tìm nhận xét chính thức; bấm nút xem bài của chính thẻ đó. | Đi tới đúng /student/submissions/{submissionId}, không mở bài khác. |
| QA30-035 | Lịch sử: mở kết quả đúng lượt | Lớp QA30 → bài đã chấm → dòng lịch sử đúng số lần → Xem. | URL chứa đúng submissionId, đúng tên bài và điểm 7.5. |
| QA30-036 | Kết quả: tab nhận xét của giáo viên | Mở kết quả từ lịch sử; chọn tab nhận xét giáo viên. | Tab được chọn và hiển thị finalFeedback chính thức từ API. |
| QA30-037 | Kết quả: chuyển về Bảng điểm | Mở kết quả từ lịch sử rồi bấm nút Xem bảng điểm. | Đi đúng /student/grades và tải được bảng. |
| QA30-038 | Writing: từ chối file sai định dạng | Mở editor, chọn file TXT qua input tải bài. | Hiện lỗi chỉ nhận PDF/DOCX, không gắn file TXT; lượt vẫn IN_PROGRESS. |
| QA30-039 | Speaking: chưa ghi âm không được nộp | Mở Speaking mới, chưa bấm thu âm. | Nút Nộp bài bị vô hiệu hóa; chưa có audio và lượt chưa nộp. |
| QA30-040 | Writing: đếm từ và xóa nội dung | Nhập 5 từ vào editor, kiểm tra bộ đếm rồi xóa về rỗng. | Đếm 5 rồi 0; nội dung chưa bị nộp. |
| QA30-041 | Tổng quan: nút quay về danh sách bài | Mở Overview bài navigation; bấm Quay lại danh sách bài tập ở đầu trang. | Đi đúng /student/assignments; sidebar vẫn hoạt động. |
| QA30-042 | Chi tiết lớp: nút mở đúng bài chưa làm | Mở lớp QA30; tìm đúng thẻ navigation, bấm Bắt đầu làm bài trên thẻ. | Đi tới Overview đúng assignmentId; chưa tự tạo lượt trước khi bấm CTA Overview. |
| QA30-043 | Dashboard: nút xem bài tập và lớp học | Từ Dashboard bấm Xem tất cả bài tập; quay lại Dashboard rồi bấm Tất cả lớp học. | Hai nút đi đúng danh sách tương ứng, không trỏ trang giả. |
| QA30-044 | Reading: hủy xác nhận nộp bài trắng | Mở MCQ mới; chưa chọn đáp án, bấm Hoàn thành & Nộp bài; hủy hộp xác nhận. | Có cảnh báo chưa trả lời; vẫn ở editor, cùng lượt IN_PROGRESS, không tạo lượt/nộp mới. |
| QA30-045 | Hết lượt: không được bắt đầu lần mới | Mở Overview bài đã chấm có maxSubmissions=1 và một lượt đã hoàn tất. | Số lượt khớp API, không còn nút bắt đầu được bật; không tạo thêm lượt. |
