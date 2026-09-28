# Frontend Environment Configuration Rules

## 1. Mục tiêu

Project sử dụng một file configuration trong source code để quản lý các giá trị cấu hình dùng chung thay vì để services, hooks, API modules hoặc components tự hard-code configuration.

Mục tiêu:

- Tập trung configuration.
- Không hard-code API URL ở nhiều nơi.
- Service/Hook/API sử dụng configuration thống nhất.
- Dễ thay đổi configuration theo môi trường.
- Giảm coupling giữa application code và configuration.
- Dễ maintain và code review.

> **Configuration dùng chung phải đi qua `config/environment.ts`.**

---

## 2. Cấu trúc thư mục

Khuyến nghị:

```text
src/
├── config/
│   ├── environment.ts
│   ├── development.ts
│   ├── staging.ts
│   └── production.ts
│
├── api/
│   ├── client.ts
│   ├── auth.api.ts
│   ├── user.api.ts
│   └── dashboard.api.ts
│
├── services/
├── hooks/
├── lib/
├── components/
└── app/
```

Project nhỏ có thể bắt đầu:

```text
src/
└── config/
    └── environment.ts
```

---

## 3. Environment Config là gì?

`environment.ts` là application configuration, **không phải secret storage**.

Ví dụ:

```ts
export const environment = {
  api: {
    baseUrl: "http://localhost:8080/api/v1",
    timeout: 10000,
  },

  app: {
    name: "My Application",
    version: "1.0.0",
  },

  auth: {
    accessTokenKey: "access_token",
    refreshTokenKey: "refresh_token",
  },
} as const;
```

Các layer khác sử dụng:

```ts
import { environment } from "@/config/environment";
```

---

## 4. Không hard-code configuration

### Không được

```ts
axios.create({
  baseURL: "http://localhost:8080/api/v1",
});
```

hoặc:

```ts
fetch("http://localhost:8080/api/v1/users");
```

### Phải

```ts
import { environment } from "@/config/environment";

axios.create({
  baseURL: environment.api.baseUrl,
});
```

---

## 5. Axios phải sử dụng Environment Config

```ts
// api/client.ts

import axios from "axios";
import { environment } from "@/config/environment";

export const apiClient = axios.create({
  baseURL: environment.api.baseUrl,
  timeout: environment.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});
```

Axios không được tự định nghĩa lại API URL, timeout hoặc token key nếu các giá trị này đã có trong configuration.

---

## 6. Service không hard-code configuration

### Không được

```ts
export const userService = {
  async getUser() {
    return fetch(
      "http://localhost:8080/api/v1/users/me"
    );
  },
};
```

### Phải

```ts
import { userApi } from "@/api/user.api";

export const userService = {
  getCurrentUser() {
    return userApi.getMe();
  },
};
```

API layer sử dụng shared Axios client:

```ts
import { apiClient } from "./client";

export const userApi = {
  async getMe() {
    const response = await apiClient.get("/users/me");

    return response.data;
  },
};
```

---

## 7. Hook không chứa Environment Configuration

### Không được

```ts
export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: () =>
      fetch("http://localhost:8080/api/v1/users/me"),
  });
}
```

### Phải

```ts
import { userService } from "@/services/user.service";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: userService.getCurrentUser,
  });
}
```

Flow:

```text
Hook
 ↓
Service
 ↓
API
 ↓
Axios
 ↓
Environment Config
```

---

## 8. Component không gọi API trực tiếp

Component không nên tự đọc `environment.api.baseUrl` rồi gọi API.

Component chỉ nên làm việc với:

- Hook
- UI state
- User interaction
- Presentation

Ví dụ:

```tsx
const { data } = useUser();
```

---

## 9. Configuration theo Environment

Nếu project có:

```text
development
staging
production
```

nên tách:

```text
src/config/
├── environment.ts
├── development.ts
├── staging.ts
└── production.ts
```

### Development

```ts
export const developmentConfig = {
  api: {
    baseUrl: "http://localhost:8080/api/v1",
    timeout: 10000,
  },
} as const;
```

### Staging

```ts
export const stagingConfig = {
  api: {
    baseUrl: "https://staging-api.example.com/api/v1",
    timeout: 10000,
  },
} as const;
```

### Production

```ts
export const productionConfig = {
  api: {
    baseUrl: "https://api.example.com/api/v1",
    timeout: 10000,
  },
} as const;
```

---

## 10. Environment Entry Point

Application code chỉ nên import:

```ts
import { environment } from "@/config/environment";
```

Không import trực tiếp:

```ts
@/config/development
@/config/staging
@/config/production
```

Ví dụ:

```ts
// config/environment.ts

import { developmentConfig } from "./development";

export const environment = developmentConfig;
```

Mục tiêu:

```text
Application
     ↓
environment.ts
     ↓
development / staging / production
```

---

## 11. Configuration phải immutable

Khuyến nghị sử dụng:

```ts
export const environment = {
  api: {
    baseUrl: "...",
    timeout: 10000,
  },
} as const;
```

Không được mutate:

```ts
environment.api.baseUrl = "another-url";
```

Configuration phải được xem là immutable trong runtime.

---

## 12. Public Configuration vs Secret

Đây là rule bắt buộc.

Frontend code được gửi xuống browser. Vì vậy mọi giá trị trong frontend configuration phải được xem là **PUBLIC**.

### Có thể chứa

```text
API base URL
Application name
Application version
Public API key
Public feature flag
Timeout
Token storage key
Public configuration
```

### Tuyệt đối không chứa

```text
Database password
JWT signing secret
Private key
AWS secret key
API secret
Backend credential
Admin password
Encryption private key
```

Ví dụ sai:

```ts
export const environment = {
  databasePassword: "super-secret",
  jwtSecret: "secret",
  awsSecretKey: "xxxx",
};
```

Người dùng có thể inspect frontend bundle và lấy các giá trị này.

> **Frontend config không phải secret storage.**

---

## 13. API URL không phải Secret

Có thể cấu hình:

```ts
api: {
  baseUrl: "https://api.example.com",
}
```

Nhưng:

```text
API URL ≠ API credential
```

Không được nhầm hai khái niệm.

---

## 14. Token Key

Có thể cấu hình:

```ts
auth: {
  accessTokenKey: "access_token",
  refreshTokenKey: "refresh_token",
}
```

Token storage:

```ts
import { environment } from "@/config/environment";

export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem(
      environment.auth.accessTokenKey
    );
  },

  setAccessToken(token: string) {
    localStorage.setItem(
      environment.auth.accessTokenKey,
      token
    );
  },

  clear() {
    localStorage.removeItem(
      environment.auth.accessTokenKey
    );
  },
};
```

Không hard-code token key ở nhiều nơi.

---

## 15. Environment không chứa Business Logic

Environment chỉ chứa configuration.

### Không được

```ts
export const environment = {
  isAdmin: true,

  shouldRedirectUser: () => {
    // business logic
  },

  calculatePrice: () => {
    // business logic
  },
};
```

Environment không phải service.

---

## 16. Environment không chứa API Call

### Không được

```ts
export const environment = {
  getUser() {
    return axios.get("/users/me");
  },
};
```

API call thuộc API layer.

---

## 17. Environment không chứa React Logic

Không được:

```ts
export const environment = {
  useUser() {
    // React hook
  },
};
```

Environment không được phụ thuộc React.

---

## 18. Dependency Direction

Dependency direction nên đi theo:

```text
Configuration
      ↓
Infrastructure
      ↓
API
      ↓
Service
      ↓
Hook
      ↓
Component
```

Application layer không nên tạo hoặc mutate configuration.

---

## 19. Naming Convention

Nên dùng tên rõ ràng:

```ts
environment.api.baseUrl
environment.api.timeout

environment.app.name
environment.app.version

environment.auth.accessTokenKey
environment.auth.refreshTokenKey
```

Không nên:

```ts
environment.url
environment.timeout1
environment.token
environment.x
```

Configuration phải self-documenting.

---

## 20. Ví dụ hoàn chỉnh

### `config/environment.ts`

```ts
export const environment = {
  api: {
    baseUrl: "http://localhost:8080/api/v1",
    timeout: 10000,
  },

  app: {
    name: "Student Management",
    version: "1.0.0",
  },

  auth: {
    accessTokenKey: "access_token",
    refreshTokenKey: "refresh_token",
  },
} as const;
```

### `api/client.ts`

```ts
import axios from "axios";
import { environment } from "@/config/environment";

export const apiClient = axios.create({
  baseURL: environment.api.baseUrl,
  timeout: environment.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});
```

### `api/user.api.ts`

```ts
import { apiClient } from "./client";

export interface User {
  id: number;
  name: string;
  email: string;
}

export const userApi = {
  async getMe(): Promise<User> {
    const response =
      await apiClient.get<User>("/users/me");

    return response.data;
  },
};
```

### `services/user.service.ts`

```ts
import { userApi } from "@/api/user.api";

export const userService = {
  getCurrentUser() {
    return userApi.getMe();
  },
};
```

### `hooks/useUser.ts`

```ts
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";

export function useUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: userService.getCurrentUser,
  });
}
```

---

## 21. Architecture

```text
┌─────────────────────────────┐
│        Component            │
│                             │
│       useUser()             │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│           Hook              │
│                             │
│      useQuery(...)          │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│         Service             │
│                             │
│   userService.getUser()     │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│            API              │
│                             │
│      userApi.getMe()        │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│       Axios Client          │
│                             │
│      apiClient.get()        │
└──────────────┬──────────────┘
               │
               │ reads
               ↓
┌─────────────────────────────┐
│   config/environment.ts     │
│                             │
│   api.baseUrl               │
│   api.timeout               │
│   auth.tokenKey             │
└─────────────────────────────┘
```

---

## 22. Code Review Checklist

### Configuration

- [ ] Configuration nằm trong `src/config/`?
- [ ] Không hard-code API URL?
- [ ] Import từ `@/config/environment`?
- [ ] Không mutate configuration runtime?
- [ ] Tên configuration rõ ràng?
- [ ] Sử dụng `as const`?

### API

- [ ] Axios client sử dụng `environment.api`?
- [ ] API module không hard-code backend URL?
- [ ] API module không chứa UI logic?
- [ ] API module không chứa React logic?

### Services

- [ ] Service không hard-code configuration?
- [ ] Business logic nằm đúng layer?
- [ ] Service không xử lý rendering/UI?

### Hooks

- [ ] Hook không tự tạo Axios?
- [ ] Hook không hard-code API URL?
- [ ] Hook gọi service/API abstraction?

### Security

- [ ] Không có secret trong frontend config?
- [ ] Không có private key?
- [ ] Không có database credential?
- [ ] Không có JWT signing secret?
- [ ] Không có backend API secret?

---

## 23. Rules bắt buộc cho Frontend Team

```text
1. Không hard-code API URL trong Component/Hook/Service.

2. Không tạo Axios instance trong Service hoặc Hook.

3. Tất cả shared configuration phải đi qua:
   @/config/environment

4. environment.ts chỉ chứa configuration.

5. environment.ts không chứa business logic.

6. environment.ts không chứa API call.

7. environment.ts không chứa React logic.

8. Không mutate environment runtime.

9. Không lưu secret trong frontend configuration.

10. Axios client đọc configuration từ environment.

11. API layer không tự định nghĩa backend base URL.

12. Service không phụ thuộc trực tiếp vào Axios nếu không cần thiết.

13. Hook không biết backend URL.

14. Component không gọi Axios trực tiếp.

15. Mọi giá trị trong frontend config phải được xem là PUBLIC.
```

---

## 24. Nguyên tắc cuối cùng

> **Environment Config là Single Source of Truth cho frontend configuration.**

> **Configuration không phải Business Logic.**

> **Frontend configuration không phải Secret Storage.**

Kiến trúc mong muốn:

```text
Configuration
      ↓
Infrastructure
      ↓
API
      ↓
Service
      ↓
Hook
      ↓
Component
```

Mục tiêu:

```text
Không hard-code
Không duplicate config
Không coupling
Không secret trong frontend
Dễ đổi environment
Dễ test
Dễ maintain
```
