# BE-76: Khắc Phục Lỗi AI Service Tự Động Fallback Trả Kết Quả Mock Khi MOCK_MODE=false Nhưng Thiếu API Key

> **Mã tính năng:** `BE-76`  
> **Dự án:** EnglishHub  
> **Vai trò phụ trách:** Backend Primary Developer (`@doanthaison2706` / `thaisndoan`)  
> **Tài liệu bàn giao:** `production_artifacts/pm_to_dev/BE-76-prevent-mock-fallback-without-key.md`  
> **Nhánh Git dự kiến:** `fix/BE-76-ai-service-prevent-unauthorized-mock-fallback`  
> **Nhánh đích (Target):** `develop`  

---

## 1. BỐI CẢNH VÀ NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE)

### 1.1. Hiện Trạng Lỗi
Trong hệ thống EnglishHub, `ai-service` hỗ trợ hai chế độ vận hành:
- **Mock Mode (`MOCK_MODE=true`)**: Trả kết quả định chuẩn (deterministic benchmark response) với điểm số cố định (ví dụ 6.5 cho Speaking và Writing) phục vụ việc chạy Unit test, tích hợp CI và kiểm thử tự động không tốn quota API.
- **Real AI Mode (`MOCK_MODE=false`)**: Gọi các nhà cung cấp mô hình ngôn ngữ lớn (LLM Provider: OpenRouter hoặc Gemini) để đánh giá thực tế bài làm của học sinh.

Tuy nhiên, trong `ai-service/app/services/gemini_service.py` (tại phương thức `analyze_speaking` - dòng 132 và `analyze_writing` - dòng 851), logic kiểm tra điều kiện kích hoạt Mock Mode đang được viết như sau:

```python
use_openrouter = (provider == "openrouter" and has_openrouter) or (provider == "auto" and has_openrouter)
use_gemini = (provider == "gemini" and has_gemini) or (provider == "auto" and not use_openrouter and has_gemini)

if settings.MOCK_MODE or (not use_openrouter and not use_gemini):
    # Fallback tự động trả kết quả Mock benchmark!
    return cls._generate_qa21_benchmark_response(...)
```

### 1.2. Hậu Quả Nghiêm Trọng
1. Khi triển khai trên Staging hoặc Production (`MOCK_MODE=false`), nếu API Key (`OPENROUTER_API_KEY` hoặc `GEMINI_API_KEY`) bị bỏ trống, hết hạn, hoặc bị thu hồi:
   - Điều kiện `(not use_openrouter and not use_gemini)` sẽ có giá trị `True`.
   - `ai-service` âm thầm trả về kết quả Mock với mã `HTTP 200 OK`.
2. Phía Backend Spring Boot (`GradingAiAnalysisServiceImpl`):
   - Nhận được `HTTP 200 OK` nên hiểu rằng việc phân tích AI đã thành công.
   - Lưu trữ điểm số giả (6.5) và feedback mẫu vào CSDL như điểm thật của học sinh.
3. Giáo viên và học sinh nhận kết quả điểm sai lệch mà hệ thống không đưa ra bất kỳ cảnh báo lỗi kỹ thuật nào.

---

## 2. QUY CHUẨN KIẾN TRÚC & GIẢI PHÁP (FAIL-FAST ARCHITECTURE)

Hệ thống phải tuân thủ nguyên tắc **Fail-Fast**:
1. **Chỉ cho phép trả kết quả Mock khi**:
   - `settings.MOCK_MODE == True` (được cấu hình tường minh từ biến môi trường của môi trường dev/test), HOẶC
   - Tham số request có `aiProvider == "mock"`.
2. **Khi `settings.MOCK_MODE == False`**:
   - Nếu provider được yêu cầu không có API Key hợp lệ (cả OpenRouter và Gemini đều không sẵn sàng):
   - **BẮT BUỘC** ném ngoại lệ `HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="AI Provider is not configured or missing API key while MOCK_MODE is disabled.")`.
3. Phía Backend Spring Boot khi nhận mã lỗi `503 Service Unavailable`:
   - Bắt ngoại lệ trong khối `catch (Exception e)` của `GradingAiAnalysisServiceImpl`.
   - Đánh dấu trạng thái bài chấm là `GradingStatus.FAILED` để bảo lưu bài làm và sẵn sàng cho cơ chế retry sau khi bổ sung key, không lưu điểm mock vào DB.

---

## 3. TIÊU CHUẨN HOÀN THÀNH (DEFINITION OF DONE - DOD)
- [ ] Tái hiện và kiểm chứng lỗi trên môi trường local: Chạy AI Service với `MOCK_MODE=false` không key, gọi API và ghi nhận mã trả về.
- [ ] Bổ sung điều kiện chặn trong `gemini_service.py` (`analyze_speaking` và `analyze_writing`), trả về HTTP 503 khi thiếu key và MOCK_MODE=false.
- [ ] Viết bộ test tự động Pytest trong `test_speaking_api.py` và `test_writing_api.py` kiểm chứng mã HTTP 503 khi thiếu key và MOCK_MODE=false.
- [ ] Đảm bảo khi `MOCK_MODE=true` hoặc `aiProvider="mock"`, hệ thống vẫn trả kết quả benchmark bình thường cho bộ test CI.
- [ ] Kiểm tra Backend `GradingAiAnalysisServiceImpl` bắt được lỗi HTTP 503 và đánh dấu trạng thái `FAILED`, không lưu điểm giả.
- [ ] Mở Pull Request vào nhánh `develop` tuân thủ PR convention linter `fix(BE-76): prevent unauthorized mock fallback when missing api key`.
- [ ] Đội Tester (`@Zawn-Tsu`) kiểm thử thực tế và nghiệm thu trên Staging.
