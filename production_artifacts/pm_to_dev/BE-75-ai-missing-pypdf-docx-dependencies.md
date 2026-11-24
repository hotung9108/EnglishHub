# SPECIFICATION HANDOFF: [BE-75] Khắc phục thiếu dependencies pypdf và python-docx trong AI Service

> **Mã nhiệm vụ:** `[BE-75]`  
> **Trello Card:** [https://trello.com/c/RMH90gMu](https://trello.com/c/RMH90gMu)  
> **Người thực hiện:** Thái Sơn Đoàn (`@thaisndoan` / Git: `doanthaison2706`)  
> **Vai trò:** Backend Developer Primary (`@be-primary`)  
> **Nhánh Git:** `fix/BE-75-ai-missing-pypdf-docx-dependencies`  
> **Target Branch:** `develop`  
> **Hạn chót hoàn thành:** 23:30 09/11/2026  

---

## 1. Mô tả Vấn đề & Nguyên nhân Gốc rễ (Root Cause Analysis)

### 1.1. Bối cảnh
Trong module chấm bài Writing tự động của AI Service (`ai-service/app/services/text_analyzer.py`), phương thức `extract_text_from_document` hỗ trợ trích xuất văn bản từ 4 định dạng tệp: `.txt`, `.md`, `.pdf`, và `.docx`.
- Để đọc file `.pdf`, code thực hiện `import pypdf` (dòng 140).
- Để đọc file `.docx`, code thực hiện `import docx` (dòng 149 - từ thư viện `python-docx`).

### 1.2. Nguyên nhân Gốc rễ
Trong tệp `ai-service/requirements.txt`, hai thư viện `pypdf` và `python-docx` **chưa từng được khai báo**.
Khi triển khai môi trường Docker (hoặc môi trường sạch từ `ai-service/Dockerfile`), lệnh `pip install --no-cache-dir -r requirements.txt` không cài đặt hai thư viện này. Kết quả:
1. Khi học sinh nộp bài luận dạng PDF hoặc Word (.docx), AI Service cố gắng nạp thư viện và ném ngoại lệ `ModuleNotFoundError`.
2. Ngoại lệ này bị bắt ở `except Exception as e:` và chuyển thành `ValueError("Không thể đọc nội dung file...")`.
3. Endpoint `/api/v1/analyze/writing` bắt `ValueError` và trả về mã lỗi `HTTP 400 Bad Request`.
4. Phía Backend Spring Boot nhận lỗi 400 từ AI Service và đánh dấu lần chấm là thất bại (`GradingStatus.FAILED` / điểm không thể tính toán).

---

## 2. Quy Trình Khắc Phục (Step-by-step Protocol)

### Bước 1: Dựng lại Docker Image sạch để xác nhận lỗi (Verification of Bug)
Trước khi chỉnh sửa mã nguồn, lập trình viên cần xác nhận sự tồn tại của lỗi trên môi trường Docker sạch:
```bash
cd ai-service
docker build -t englishhub-ai-service:test-reproduce .
docker run --rm englishhub-ai-service:test-reproduce python -c "import pypdf, docx; print('OK')"
```
*Kỳ vọng trước khi sửa:* Lệnh sẽ vấp phải lỗi `ModuleNotFoundError: No module named 'pypdf'` hoặc `No module named 'docx'`.

### Bước 2: Khai báo Dependencies với Version Cố Định trong `requirements.txt`
Cập nhật `ai-service/requirements.txt`, bổ sung:
```text
pypdf==5.1.0
python-docx==1.1.2
```
*(Ghi chú: Giữ phiên bản cố định để tránh breaking changes trong các lần build tương lai).*

### Bước 3: Viết Bộ Test Tự Động Toàn Diện
Tạo mới hoặc bổ sung vào `ai-service/tests/test_text_analyzer_documents.py` (hoặc `test_writing_api.py`):
1. **Case 1 (DOCX hợp lệ):** Tạo một file docx mẫu trong bộ nhớ bằng `python-docx` chứa các đoạn văn bản luận chuẩn; kiểm tra `TextAnalyzer.extract_text_from_document` trích xuất đầy đủ câu chữ và API trả về metrics + điểm.
2. **Case 2 (PDF hợp lệ):** Tạo một file pdf mẫu trong bộ nhớ bằng `pypdf` chứa văn bản luận chuẩn; kiểm tra trích xuất chính xác.
3. **Case 3 (Corrupted / Broken bytes):** Truyền chuỗi bytes rác giả mạo file `.pdf` và `.docx`; kiểm tra code bắt `ValueError` graceful, không gây sập ứng dụng (không unhandled crash 500).
4. **Case 4 (File không có văn bản / Empty):** File PDF trang trắng không có text layer hoặc docx rỗng paragraph; kiểm tra hệ thống báo lỗi rõ ràng về nội dung bài viết không đủ độ dài.

### Bước 4: Dựng lại Docker Image & Kiểm tra Thực tế
Dựng lại image Docker với dependencies mới:
```bash
docker build -t englishhub-ai-service:latest .
docker run --rm englishhub-ai-service:latest python -c "import pypdf, docx; print('All document dependencies loaded successfully!')"
```
Chạy kiểm thử bên trong container hoặc qua test suite:
```bash
pytest tests/
```

---

## 3. Tiêu Chí Nghiệm Thu (Definition of Done)

- [ ] Lỗi `ModuleNotFoundError` được tái hiện thành công trên Docker image trước khi sửa.
- [ ] Khai báo `pypdf` và `python-docx` phiên bản cố định trong `ai-service/requirements.txt`.
- [ ] Kiểm thử thành công trích xuất văn bản từ file DOCX và PDF hợp lệ.
- [ ] Kiểm thử xử lý ngoại lệ an toàn cho file rỗng, file hỏng, và file không có văn bản.
- [ ] Dựng lại image Docker `englishhub-ai-service:latest` thành công, container khởi động và vượt qua bài test.
- [ ] Chạy Project Doctor (`/doctor`) và toàn bộ test suite của AI Service pass 100%.
- [ ] Tạo Pull Request chuẩn quy ước: `fix/BE-75-ai-missing-pypdf-docx-dependencies` trỏ vào `develop`.
- [ ] Chuyển thẻ Trello sang cột `Review` và gắn thẻ `@zawntsu` để nghiệm thu.
