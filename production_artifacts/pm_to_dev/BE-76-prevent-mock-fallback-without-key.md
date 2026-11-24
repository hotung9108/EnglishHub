# SPECIFICATION HANDOFF: [BE-76] Khắc Phục Lỗi AI Service Tự Động Fallback Trả Kết Quả Mock Khi MOCK_MODE=false Nhưng Thiếu API Key

> **Mã nhiệm vụ:** `[BE-76]`  
> **Trello Card:** [https://trello.com/c/K8en1hsA](https://trello.com/c/K8en1hsA)  
> **Người thực hiện:** Thái Sơn Đoàn (`@thaisndoan` / Git: `doanthaison2706`)  
> **Vai trò:** Backend Developer Primary (`@be-primary`)  
> **Nhánh Git:** `fix/BE-76-ai-service-prevent-unauthorized-mock-fallback`  
> **Target Branch:** `develop`  
> **Tài liệu đặc tả:** [`docs/features/BE-76-prevent-mock-fallback-without-key.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/features/BE-76-prevent-mock-fallback-without-key.md)  

---

## 1. MÔ TẢ VẤN ĐỀ VÀ PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ

### 1.1. Hiện tượng
Khi `MOCK_MODE=false` mà không cấu hình API Key cho provider AI (OpenRouter hoặc Gemini), AI Service vẫn trả về `HTTP 200 OK` với kết quả Mock (điểm 6.5 cố định). Phía Backend nhận response thành công và lưu điểm này vào cơ sở dữ liệu như kết quả chấm thật của học sinh.

### 1.2. Vị trí mã nguồn gây lỗi
Tại tệp `ai-service/app/services/gemini_service.py`:
- Dòng 132 (`analyze_speaking`):
  ```python
  if settings.MOCK_MODE or (not use_openrouter and not use_gemini):
      return cls._generate_qa21_benchmark_response(...)
  ```
- Dòng 851 (`analyze_writing`):
  ```python
  if settings.MOCK_MODE or (not use_openrouter and not use_gemini):
      return cls._generate_qa21_writing_benchmark_response(...)
  ```
Khi `settings.MOCK_MODE == False` nhưng cả hai biến `use_openrouter` và `use_gemini` đều là `False` (do thiếu API Key), điều kiện `(not use_openrouter and not use_gemini)` trở thành `True`, kích hoạt việc trả về kết quả Mock.

---

## 2. QUY TRÌNH THỰC HIỆN DÀNH CHO BACKEND DEVELOPER

### Bước 1: Tạo nhánh Git làm việc
```bash
git checkout develop
git pull origin develop
git checkout -b fix/BE-76-ai-service-prevent-unauthorized-mock-fallback
```

### Bước 2: Tái hiện lỗi trên môi trường local
Chạy thử nghiệm API với cấu hình không có key và `MOCK_MODE=false`:
```bash
cd ai-service
python -c "
import os
os.environ['MOCK_MODE'] = 'false'
os.environ['OPENROUTER_API_KEY'] = ''
os.environ['GEMINI_API_KEY'] = ''
from app.services.gemini_service import GeminiService
import asyncio
res = asyncio.run(GeminiService.analyze_writing(1, 'This is a sample student essay with more than twenty words to test mock fallback bug.'))
print('Model used:', res.modelUsed, 'Score:', res.overallScore)
"
```
*Hiện tượng trước khi sửa:* Kết quả in ra `Score: 6.5` và `Model used: mock` (chứng minh lỗi tồn tại).

### Bước 3: Cập nhật mã nguồn `gemini_service.py`
Cập nhật cả hai hàm `analyze_speaking` và `analyze_writing`:
```python
is_explicit_mock = settings.MOCK_MODE or provider == "mock"
if not use_openrouter and not use_gemini:
    if not is_explicit_mock:
        logger.error(
            "AI Provider misconfiguration: requested provider '%s' has no API key and MOCK_MODE is false.",
            provider
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI Provider '{provider}' is not configured or missing API key while MOCK_MODE is disabled."
        )
    
    logger.info(
        "Running in QA-21 Benchmark / Mock Mode for submissionModuleId: %s (model: %s, provider: %s)",
        submission_module_id,
        cleaned_model or "default",
        provider
    )
    resolved_mock_model = cleaned_model or (target_openrouter_model if provider == "openrouter" else target_gemini_model)
    return cls._generate_qa21_benchmark_response(...) # hoặc _generate_qa21_writing_benchmark_response
```

### Bước 4: Bổ sung Unit Test Pytest
Tạo hoặc cập nhật testcase trong `ai-service/tests/test_speaking_api.py` và `test_writing_api.py`:
1. Testcase kiểm tra `MOCK_MODE=false` và không có API key -> Gọi endpoint `/api/v1/analyze/speaking` và `/api/v1/analyze/writing` phải nhận mã `HTTP 503`.
2. Testcase kiểm tra `MOCK_MODE=true` -> Vẫn trả về kết quả benchmark bình thường.

### Bước 5: Chạy kiểm thử tự động
```bash
cd ai-service
pytest tests/ -v
```

### Bước 6: Mở Pull Request
Mở PR vào nhánh `develop` với tiêu đề chuẩn:
`fix(BE-76): prevent unauthorized mock fallback when missing api key`

---

## 3. CHECKLIST NGHIỆM THU (DOD)
- [ ] Tái hiện và kiểm chứng lỗi trên môi trường local.
- [ ] Bổ sung điều kiện chặn trong `gemini_service.py`, trả về HTTP 503 khi thiếu key và MOCK_MODE=false.
- [ ] Viết bộ test tự động Pytest trong `test_speaking_api.py` và `test_writing_api.py` kiểm chứng HTTP 503.
- [ ] Đảm bảo khi `MOCK_MODE=true` hoặc `aiProvider="mock"`, hệ thống vẫn trả kết quả benchmark bình thường.
- [ ] Kiểm tra Backend `GradingAiAnalysisServiceImpl` bắt được lỗi HTTP 503 và đánh dấu trạng thái `FAILED`.
- [ ] Mở PR vào `develop` tuân thủ PR convention linter `fix(BE-76): ...`.
- [ ] Đội Tester (`@Zawn-Tsu`) kiểm thử thực tế và nghiệm thu trên Staging.
