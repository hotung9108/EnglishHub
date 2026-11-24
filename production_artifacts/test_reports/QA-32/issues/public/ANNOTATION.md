Nguồn: QA-32 DoD yêu cầu kiểm thử thao tác bấm duyệt annotation. Người dùng đã chọn chỉ ghi nhận phần chức năng thiếu, không bổ sung ứng dụng trong task QA.

## Phạm vi kiểm tra

Đối chiếu source TeacherSubmissionDetails trên develop e8e85a4 và chạy các test component. API client có thao tác review annotation, nhưng màn hình này chưa có danh sách/nút duyệt annotation. Không khẳng định đã tái hiện qua staging.

## Các bước đối chiếu

1. Đọc TeacherSubmissionDetails và contract AiGradingSuggestionResponse.annotations.
2. Đối chiếu answer-annotation.service và yêu cầu QA-32.
3. Kiểm tra luồng màn hình hiện có: nhập điểm, nhận xét và gửi điểm; không có thao tác duyệt annotation.

## Mong đợi

Có UI trình bày annotation và thao tác duyệt theo thiết kế được chốt; phản hồi trạng thái, lỗi và chống thao tác lặp.

## Thực tế

Chưa có thao tác để thực hiện acceptance test. Ca này giữ it.todo, không tính Pass hoặc coverage từ một UI giả.

## Tiêu chí hoàn tất

- [ ] Chốt thiết kế/phân quyền và contract review.
- [ ] Implement UI, thêm test pending → accepted; xử lý request thất bại và pending.
- [ ] Retest tích hợp và bỏ todo QA-32.

<!-- QA32-issue-key:annotation -->
