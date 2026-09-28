# Hướng dẫn cấu hình S3 Service Credentials

Dự án hỗ trợ hai cách cấu hình S3: **trực tiếp trong `application.properties`** hoặc **qua biến môi trường trong Docker Compose**.

---

## Các thuộc tính cấu hình

| Property | Env Variable | Mô tả | Mặc định |
|---|---|---|---|
| `app.storage.s3.enabled` | `STORAGE_S3_ENABLED` | Bật/tắt S3 storage | `false` |
| `app.storage.s3.endpoint` | `STORAGE_S3_ENDPOINT` | URL endpoint của S3/MinIO | `http://localhost:9000` |
| `app.storage.s3.region` | `STORAGE_S3_REGION` | Region của bucket | `auto` |
| `app.storage.s3.access-key-id` | `STORAGE_S3_ACCESS_KEY_ID` | Access Key ID | `minioadmin` |
| `app.storage.s3.secret-access-key` | `STORAGE_S3_SECRET_ACCESS_KEY` | Secret Access Key | `minioadmin` |
| `app.storage.s3.bucket` | `STORAGE_S3_BUCKET` | Tên bucket | `englishhub-dev` |
| `app.storage.s3.path-style` | `STORAGE_S3_PATH_STYLE` | Dùng path-style URL (cần cho MinIO) | `true` |

---

## Cách 1: Cấu hình trực tiếp trong `application.properties`

Ghi đè trực tiếp giá trị vào file — phù hợp cho môi trường **local dev** hoặc khi không dùng Docker.

```properties
# application.properties (hoặc application-dev.properties)

app.storage.s3.enabled=true
app.storage.s3.endpoint=http://localhost:9000
app.storage.s3.region=ap-southeast-1
app.storage.s3.access-key-id=your-access-key
app.storage.s3.secret-access-key=your-secret-key
app.storage.s3.bucket=englishhub-dev
app.storage.s3.path-style=true
```

> ⚠️ **Lưu ý:** Không commit credentials thật vào Git. Dùng cách này chỉ với giá trị local/test, hoặc kết hợp với Spring profiles (`application-local.properties`) và thêm file đó vào `.gitignore`.

---

## Cách 2: Cấu hình qua biến môi trường trong Docker Compose

Đây là cách được khuyến nghị cho môi trường **staging/production** hoặc khi chạy toàn bộ stack bằng Docker Compose.

### 2.1. Dùng `environment` block trực tiếp trong `docker-compose.yml`

```yaml
services:
  backend:
    image: your-backend-image
    environment:
      STORAGE_S3_ENABLED: "true"
      STORAGE_S3_ENDPOINT: "http://minio:9000"
      STORAGE_S3_REGION: "ap-southeast-1"
      STORAGE_S3_ACCESS_KEY_ID: "your-access-key"
      STORAGE_S3_SECRET_ACCESS_KEY: "your-secret-key"
      STORAGE_S3_BUCKET: "englishhub-dev"
      STORAGE_S3_PATH_STYLE: "true"
```

### 2.2. Dùng file `.env` (khuyến nghị)

Tách credentials ra file `.env` riêng để dễ quản lý và tránh lộ thông tin.

**Bước 1:** Tạo file `.env` cùng cấp với `docker-compose.yml`:

```dotenv
# .env

STORAGE_S3_ENABLED=true
STORAGE_S3_ENDPOINT=http://minio:9000
STORAGE_S3_REGION=ap-southeast-1
STORAGE_S3_ACCESS_KEY_ID=your-access-key
STORAGE_S3_SECRET_ACCESS_KEY=your-secret-key
STORAGE_S3_BUCKET=englishhub-dev
STORAGE_S3_PATH_STYLE=true
```

**Bước 2:** Trong `docker-compose.yml`, tham chiếu các biến từ `.env`:

```yaml
services:
  backend:
    image: your-backend-image
    env_file:
      - .env
    # hoặc khai báo từng biến rõ ràng:
    environment:
      STORAGE_S3_ENABLED: ${STORAGE_S3_ENABLED}
      STORAGE_S3_ENDPOINT: ${STORAGE_S3_ENDPOINT}
      STORAGE_S3_REGION: ${STORAGE_S3_REGION}
      STORAGE_S3_ACCESS_KEY_ID: ${STORAGE_S3_ACCESS_KEY_ID}
      STORAGE_S3_SECRET_ACCESS_KEY: ${STORAGE_S3_SECRET_ACCESS_KEY}
      STORAGE_S3_BUCKET: ${STORAGE_S3_BUCKET}
      STORAGE_S3_PATH_STYLE: ${STORAGE_S3_PATH_STYLE}
```

**Bước 3:** Thêm `.env` vào `.gitignore`:

```
# .gitignore
.env
```

> Commit file `.env.example` (không có credentials thật) để team biết cần khai báo những biến nào.

---

## Ví dụ: Stack với MinIO (local dev)

```yaml
# docker-compose.yml

services:
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

  backend:
    build: .
    ports:
      - "8080:8080"
    env_file:
      - .env
    depends_on:
      - minio

volumes:
  minio_data:
```

```dotenv
# .env (local MinIO)
STORAGE_S3_ENABLED=true
STORAGE_S3_ENDPOINT=http://minio:9000
STORAGE_S3_REGION=auto
STORAGE_S3_ACCESS_KEY_ID=minioadmin
STORAGE_S3_SECRET_ACCESS_KEY=minioadmin
STORAGE_S3_BUCKET=englishhub-dev
STORAGE_S3_PATH_STYLE=true
```

> **Lưu ý endpoint:** Khi backend chạy trong Docker, dùng tên service (`http://minio:9000`) thay vì `http://localhost:9000`.

---

## Ví dụ: Kết nối AWS S3 thật

```dotenv
# .env (production AWS)
STORAGE_S3_ENABLED=true
STORAGE_S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com
STORAGE_S3_REGION=ap-southeast-1
STORAGE_S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
STORAGE_S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STORAGE_S3_BUCKET=englishhub-prod
STORAGE_S3_PATH_STYLE=false
```

> Với AWS S3 thật, đặt `STORAGE_S3_PATH_STYLE=false` vì AWS dùng virtual-hosted-style URL (`bucket.s3.amazonaws.com`). Path-style chỉ cần cho MinIO hoặc các S3-compatible self-hosted.

---

## Thứ tự ưu tiên

Spring Boot áp dụng giá trị theo thứ tự ưu tiên từ cao đến thấp:

1. **Biến môi trường** (từ Docker, hệ điều hành)
2. **`application-{profile}.properties`** (ví dụ `application-prod.properties`)
3. **`application.properties`** (giá trị mặc định trong code)

Vì vậy, biến môi trường trong Docker Compose luôn ghi đè giá trị trong `application.properties`.
