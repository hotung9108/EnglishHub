# QA-28 — Bàn giao Selenium Framework cho PM review

Framework dùng chung tại `test/selenium/`, theo config/utils/pages/tests với các luồng Auth/Giáo viên/Học viên/Admin. Test login chọn role trước khi nhập tài khoản, xác nhận dashboard và role từ `eh_user`. Có Chrome/Edge/Grid, timeout, report HTML/JSON và screenshot.

| DoD | Bằng chứng |
| --- | --- |
| Selenium kết nối staging | Run người dùng thực hiện trên `https://staging.hotung9108.me`, Chrome 154.0.8037.98 |
| POM dễ mở rộng | `test/selenium/pages/BasePage.js`, `pages/auth/LoginPage.js`, pages/tests theo luồng |
| Login mẫu thành công | [summary.json](summary.json): smoke và login Giáo viên Passed |
| README chạy và thêm case | [README framework](../../../test/selenium/README.md) |

## Bằng chứng và giới hạn

Run gốc `run-2026-10-11T11-19-45-366Z`, từ 18:19:45 đến 18:19:49 ngày 11/10/2026 giờ Việt Nam, do người dùng thực hiện. [Report](report.html), [smoke screenshot](QA28-SMOKE-001.png), [login screenshot](QA28-LOGIN-TEACHER.png). JSON/HTML/ảnh được chép nguyên từ run standalone trước khi tích hợp.

Bản tích hợp giữ các bước Page Object đã chạy đạt, đổi bố cục/import, tách case khỏi runner và đổi prefix cấu hình QA28 thành SELENIUM. Không chạy lại Selenium/test tự động theo yêu cầu người dùng. Chỉ kiểm tra tĩnh cú pháp/import/package và nguyên vẹn bằng chứng. PM có thể chạy lại theo README để nghiệm thu checkout mới. Chưa đo coverage, không tuyên bố >80% coverage theo guideline chung.

Không suy ra Admin/Học viên, tất cả luồng UI, usability hay maintainability đã Passed. Vấn đề truy cập trực tiếp `/login` vẫn cần FE/OPS kiểm tra riêng; framework đi qua URL gốc.

Tài khoản chỉ nằm trong `.env` local, không thuộc commit; `.env.example` trống tài khoản. Thư mục `legacy/` giữ scaffold cũ chưa chạy được để tham khảo; runner mới không import legacy.

## Nội dung dán vào Trello

QA-28 đã có Selenium Framework dùng chung theo POM tại test/selenium, WebDriver Chrome/Edge, cấu hình staging, smoke/login theo role, report HTML/JSON/screenshot và README hướng dẫn mở rộng. Run người dùng thực hiện ngày 11/10/2026 lúc 18:19:45–18:19:49 có 2/2 case Passed (smoke + login Giáo viên). Đã tách case tại tests/auth để các task sau dùng chung. Không chạy lại sau tích hợp theo yêu cầu người dùng; đính kèm bằng chứng run gốc và source branch để PM review.
