---
name: convention-fe
description: Frontend coding conventions, component standards, styling guidelines, and state management rules for React 19 TypeScript frontend.
---

# EnglishHub Frontend Conventions (React 19 / TypeScript / Vite)

Tài liệu quy chuẩn phát triển Frontend cho dự án **EnglishHub**. Tất cả Frontend Agents (`@fe-primary`, `@fe-secondary`) và lập trình viên Frontend phải tuân thủ nghiêm ngặt các nguyên tắc dưới đây, đồng thời tuân thủ hợp đồng giao tiếp chung tại [.agents/rules/common-conventions.md](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/rules/common-conventions.md).


---

## 1. Công nghệ & Môi trường chuẩn
- **Library**: React 19.
- **Language**: TypeScript (Strict Mode).
- **Bundler**: Vite.
- **Routing**: React Router DOM (v7).
- **Icons**: Lucide React (`lucide-react`).
- **Styling**: Vanilla CSS sử dụng CSS Variables & Design Tokens tại `src/styles/`.
- **Linter & Formatter**: ESLint (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`).

---

## 2. Cấu trúc Thư mục Chuẩn (Project Structure)

Mọi mã nguồn Frontend nằm trong thư mục `src/`:

```text
src/
├── api/                # API Client và các hàm gọi API theo module (authApi, assignmentApi, ...)
├── assets/             # Hình ảnh, icons tĩnh, fonts
├── components/         # Các components dùng chung và chia theo domain
│   ├── common/         # Button, Input, Modal, Table, Loading, Badge (Reusable UI)
│   ├── layout/         # Header, Sidebar, Footer, MainLayout
│   ├── auth/           # ProtectedRoute, AuthForms
│   ├── classes/        # Components nghiệp vụ lớp học
│   └── assignments/    # Components tạo bài tập, chấm điểm, nộp bài
├── contexts/           # React Context (AuthContext, ThemeContext)
├── hooks/              # Custom React Hooks (useAuth, useFetch, useDebounce)
├── pages/              # Trang chính ánh xạ theo Route (Dashboard, Login, Assignments)
├── styles/             # CSS Variables, global reset, layout styles
│   ├── index.css       # Design tokens (colors, typography, spacing, shadows)
│   └── layout.css      # Grid, flex layout chung
├── types/              # TypeScript interfaces, types, enums (khớp với DTO backend)
└── utils/              # Helper functions (formatDate, formatScore, validateForm)
```

---

## 3. Quy chuẩn Đặt tên (Naming Conventions)

| Đối tượng | Quy tắc | Ví dụ |
| :--- | :--- | :--- |
| **Component Files** | PascalCase `.tsx` | `AssignmentList.tsx`, `SubmissionModal.tsx` |
| **Hook Files** | camelCase bắt đầu bằng `use` `.ts` | `useAssignment.ts`, `usePagination.ts` |
| **Context Files** | PascalCase kèm hậu tố `Context` `.tsx` | `AuthContext.tsx`, `NotificationContext.tsx` |
| **Utility / API Files** | camelCase `.ts` | `assignmentApi.ts`, `dateFormatter.ts` |
| **Type Files** | camelCase kèm hậu tố `.types.ts` hoặc trong `types/` | `assignment.types.ts`, `auth.types.ts` |
| **CSS Files** | kebab-case hoặc camelCase `.css` | `index.css`, `assignment-detail.css` |
| **TypeScript Interfaces/Types** | PascalCase | `AssignmentItem`, `CreateAssignmentRequest` |
| **Enum** | PascalCase, Giá trị UPPER_SNAKE_CASE | `UserRole.TEACHER`, `AssignmentStatus.OPEN` |

---

## 4. Quy tắc Viết Component & TypeScript

### 4.1. Functional Components & Type Props
- Luôn định nghĩa Interface/Type rõ ràng cho Props của từng component.
- Không sử dụng kiểu dữ liệu `any`. Nếu chưa xác định rõ hãy dùng `unknown` hoặc generic type.

```tsx
// Ví dụ chuẩn:
interface AssignmentCardProps {
  id: string;
  title: string;
  deadline: string;
  totalSubmissions: number;
  onOpenDetails: (id: string) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  id,
  title,
  deadline,
  totalSubmissions,
  onOpenDetails,
}) => {
  return (
    <div className="assignment-card">
      <h3 className="assignment-card-title">{title}</h3>
      <p className="assignment-card-deadline">Hạn nộp: {deadline}</p>
      <span className="assignment-badge">{totalSubmissions} bài nộp</span>
      <button 
        type="button" 
        className="btn-primary" 
        onClick={() => onOpenDetails(id)}
      >
        Xem chi tiết
      </button>
    </div>
  );
};
```

### 4.2. Quản lý State & Custom Hooks
- Đưa logic gọi API và side-effects phức tạp ra Custom Hook thay vì nhồi nhét trong Component view.
- Luôn xử lý đủ 3 trạng thái giao diện khi tải dữ liệu từ API:
  1. `isLoading`: Hiển thị Skeleton hoặc Spinner.
  2. `isError`: Hiển thị thông báo lỗi rõ ràng và nút Retry.
  3. `isEmpty`: Hiển thị Empty State đẹp mắt khi danh sách rỗng (tránh để màn hình trống trơn).

---

## 5. Styling & Giao diện (CSS & UI Design System)

- **Design System Tokens**: Bắt buộc dùng CSS Variables định nghĩa trong `src/styles/index.css` cho:
  - Màu sắc: `--primary-color`, `--background-color`, `--surface-color`, `--text-primary`, `--border-color`.
  - Khoảng cách & Bo góc: `--spacing-sm`, `--spacing-md`, `--radius-md`.
- **Tuyệt đối tránh inline style**: Không viết `style={{ margin: 20, color: 'red' }}` trừ trường hợp giá trị động bắt buộc tính bằng JavaScript.
- **Responsive**: Mọi giao diện phải hiển thị tốt trên Desktop (>= 1024px) và Tablet/Mobile (< 768px).
- **Hiệu ứng Micro-interactions**: Thêm hover transition (`transition: all 0.2s ease;`), hiệu ứng focus cho input và trạng thái active cho button.

---

## 6. Xử lý API & Routing

### 6.1. Tầng API Client
- Không gọi `fetch` hay `axios` trực tiếp trong Component. Gom nhóm vào thư mục `src/api/`.
- Tự động gắn Authorization Bearer Token từ storage/context vào headers của mỗi request.
- Định dạng dữ liệu trả về phải map khớp với `ApiResponse<T>` từ Backend:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
}
```

### 6.2. Phân quyền Routing (RBAC)
- Sử dụng component `ProtectedRoute` bao bọc các route nhạy cảm.
- Kiểm tra danh sách quyền `allowedRoles` (như `admin`, `teacher`, `student`) trước khi render giao diện tương ứng.
- Chuyển hướng người dùng về `/login` hoặc `/unauthorized` nếu không đủ quyền truy cập.
