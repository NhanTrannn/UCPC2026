# FE Architecture Overview - cs-box

## 1. Mục tiêu tài liệu
Tài liệu này mô tả tổng quan kiến trúc Frontend của dự án `cs-box`, bao gồm:
- Tech stack và lý do lựa chọn
- Cấu trúc thư mục và vai trò từng khu vực
- Luồng chạy ứng dụng từ bootstrap đến render trang
- Routing, Guards, Layout theo role
- Quản lý trạng thái (Redux + Zustand)
- Hệ thống Core Components
- Quy ước styling và design tokens
- Utilities/Hooks dùng chung
- Những điểm mạnh, rủi ro kỹ thuật, hướng cải tiến

---

## 2. Tech Stack

| Nhóm | Công nghệ |
|---|---|
| Build Tool | Vite 7 |
| Framework | React 19 + TypeScript |
| Routing | react-router-dom v6 |
| State | Redux Toolkit + redux-persist + Zustand |
| UI Kit | Ant Design 5 |
| Headless UI | Radix UI (Dialog, Popover, Select, Slot, Tooltip) |
| Data Table | @tanstack/react-table v8 |
| Notifications | sonner |
| Date Handling | dayjs + Antd DatePicker |
| Styling | SCSS + CSS Variables |
| Icons | lucide-react |

### Điểm nổi bật stack
- Kết hợp Antd và Core Components tự xây (`CS*`) để vừa tăng tốc phát triển vừa giữ khả năng tùy biến.
- Tách rõ state: Redux cho auth/global state, Zustand cho business actions nhanh gọn.
- SCSS + CSS variables giúp đồng bộ theme và mở rộng dễ.

---

## 3. Cấu trúc thư mục

```text
src/
  app/
    guards/            # Route guard (Guest, Protected)
    layouts/           # Public/User/Admin layout
    redux/             # Redux store + slices + persist
    router/            # Route configs + AppRouter + menu config
    store/             # Zustand stores (auth actions)

  components/
    core/              # Bộ component dùng chung toàn app (CSButton, CSInput, ...)

  hooks/               # Custom hooks (title, date utils)
  modules/             # Feature modules theo domain (users, study, profile, ...)
  pages/               # Trang cấp cao (landing, login, register, ...)
  styles/              # Design system (variables, css vars, global styles)
  types/               # Shared types
  utils/               # Helper/validation/constants
```

### Tư duy tổ chức
- `modules/` chứa màn hình/feature theo business domain.
- `components/core/` chứa design-system components tái sử dụng.
- `app/router/configs/` cho phép thêm route theo module, tránh file route monolithic.

---

## 4. Luồng khởi động ứng dụng

### 4.1 Entry point
`src/main.tsx` bọc app theo thứ tự:
1. `Provider` (Redux store)
2. `PersistGate` (hydrate state từ local storage)
3. `ToastProvider` (global toast)
4. `App`

### 4.2 App shell
`src/App.tsx`:
1. Bọc toàn bộ bằng `BrowserRouter`
2. Dùng `LayoutSwitch` để chọn layout theo trạng thái auth/role
3. Render `AppRouter` cho toàn bộ route

---

## 5. Routing Architecture

## 5.1 Route source of truth
`src/app/router/routes.tsx` là nơi tập hợp route chính:
- Public: `/`, `/login`, `/register`, `/unauthorized`
- Protected base routes: `/dashboard`, `profileRoutes`, `studyRoutes`, `userRoutes`, `coreGuideRoutes`
- Catch-all: `*` -> `NotFoundPage`

## 5.2 Route module hóa
Các route con được tách tại:
- `src/app/router/configs/user.routes.tsx`
- `src/app/router/configs/study.routes.tsx`
- `src/app/router/configs/profile.routes.tsx`
- `src/app/router/configs/core-guide.routes.tsx`

Mỗi route có thể khai báo:
- `path`
- `element`
- `isProtected`
- `allowedRoles`
- `menuLabel`
- `children`

## 5.3 Guard flow
- `GuestRoute`: nếu đã đăng nhập thì chuyển hướng theo role (`redirectByRole`).
- `ProtectedRoute`: chặn user chưa login hoặc không đúng quyền.

## 5.4 AppRouter và flatten
`src/app/router/AppRouter.tsx` hiện đang flatten cây route trước khi map thành `<Route />`.
- Ưu điểm: map đơn giản, dễ bọc guard.
- Hạn chế: nested routing với `<Outlet />` có nguy cơ không hoạt động đúng như kỳ vọng nếu phụ thuộc tree route thực sự.

---

## 6. Layout theo Role

## 6.1 LayoutSwitch
`src/app/layouts/LayoutSwitch.tsx` quyết định layout:
- Chưa auth: `PublicLayout`
- Role USER: `UserLayout`
- Role ADMIN/STAFF: `AdminLayout`

## 6.2 AdminLayout
`src/app/layouts/AdminLayout.tsx` cung cấp:
- Sidebar menu động theo role
- Breadcrumb (`AppBreadcrumb`)
- Route progress (`RouteProgress`)
- Logout action

## 6.3 UserLayout
`src/app/layouts/UserLayout.tsx` cung cấp:
- Top navbar (`UserNavbar`)
- Route progress
- Khu vực nội dung

## 6.4 PublicLayout
`src/app/layouts/PublicLayout.tsx` hiện tối giản, chỉ render children.

---

## 7. State Management

## 7.1 Redux (global auth state)
- File chính: `src/app/redux/store.ts`, `src/app/redux/auth.slice.ts`
- State auth gồm:
  - `isAuthenticated`
  - `user`
- Persist qua `redux-persist` (storage local).

## 7.2 Zustand (business actions)
- File: `src/app/store/auth.store.ts`
- Chứa action:
  - `login`
  - `register`
  - `logout`
- Sau khi xử lý logic, Zustand dispatch sang Redux để đồng bộ state UI.

## 7.3 Nhận xét kiến trúc state
- Cách chia này linh hoạt cho demo/prototype.
- Với production, nên chuẩn hóa một nguồn sự thật rõ ràng hơn (thường Redux Toolkit + RTK Query hoặc Zustand toàn phần), tránh phân mảnh logic.

---

## 8. Core Component System (`components/core`)

Mẫu cấu trúc mỗi component:
- Component chính (`*.tsx`)
- Barrel export (`index.ts`)
- SCSS style (`styles.scss`)
- README hướng dẫn dùng

### 8.1 Danh mục thành phần chính
- `CSButton`: variant/color/size/loading, hỗ trợ `asChild`.
- `CSInput`: format number, icon, password toggle, unit selector.
- `CSSelect`: single/multiple, grouped options, searchable.
- `CSModal`: dialog dựa trên Radix, hỗ trợ size/color/footer.
- `CSDatePicker` + `CSRangePicker`: wrapper cho Antd picker theo design system.
- `CSTable` + `CSPagination`: bảng dữ liệu với sorting/selection/paging.
- `CSToast`: context wrapper quanh Sonner.

### 8.2 Mục đích module `admin-guide`
`src/modules/admin-guide` là playground + docs runtime:
- Preview trực tiếp behavior của từng core component.
- Render README markdown trong app.
- Hữu ích cho onboarding dev và QA check nhanh.

---

## 9. Styling & Design Tokens

## 9.1 Hệ thống style
- `src/styles/abstracts/_colors.scss`: color scales
- `src/styles/abstracts/_variables.scss`: spacing, typography, radius, z-index
- `src/styles/abstracts/_css-vars.scss`: map SCSS variables -> CSS custom properties
- `src/styles/base/_global.scss`: reset cơ bản
- `src/styles/main.scss`: entry style toàn app

## 9.2 Quy ước
- Component style theo BEM (`.cs-btn__...`, `.cs-input__...`).
- Dùng `var(--color-...)` để đồng nhất theme.
- Hạn chế hardcode màu tại component (dù hiện vẫn còn một số vị trí inline style).

---

## 10. Hooks & Utilities

### 10.1 Hooks
- `usePageTitle`: tự động cập nhật `document.title` theo route config.
- `useDateUtils`: format date/range date, chuyển dữ liệu picker sang payload API.

### 10.2 Utilities
- `role.ts`: định nghĩa hằng role và type `Role`.
- `redirectByRole.ts`: map role -> trang mặc định sau login.
- `router.helper.ts`: tìm route config theo pathname (hỗ trợ dynamic route).
- `validation.ts`: bộ hàm validate mạnh (email, phone, password, URL, anti-script...).
- `date-formats.ts`: constants định dạng ngày.

---

## 11. Luồng nghiệp vụ Auth hiện tại

1. User submit login/register ở `pages/`.
2. Action từ Zustand (`useAuthStore`) xử lý mock user list.
3. Thành công -> dispatch `loginSuccess` vào Redux.
4. Guard/Layout đọc Redux state để quyết định điều hướng + giao diện.
5. Toast hiển thị trạng thái thành công/thất bại.

### Lưu ý
- Auth hiện là mock in-memory trong runtime, không có backend thật.
- Refresh trang vẫn giữ auth do Redux Persist, nhưng data mock user không có persistence backend chuẩn.

---

## 12. Điểm mạnh kiến trúc

- Cấu trúc rõ ràng, tách domain tốt.
- Dễ mở rộng route theo module.
- Có design system nội bộ (`CS*`) và trang preview/documentation ngay trong app.
- Tận dụng role-based layout + menu config từ route metadata.
- Có sẵn utility layer khá đầy đủ cho validation/date/router helper.

---

## 13. Rủi ro kỹ thuật & đề xuất cải tiến

## 13.1 Nested route + Outlet
- Hiện có dùng `<Outlet />` trong một số module, nhưng router đang flatten route.
- Đề xuất: chuyển sang route tree render trực tiếp để nested route hoạt động chuẩn.

## 13.2 Trạng thái hydrate
- Có check `isAuthenticated === undefined` ở vài nơi, trong khi initial state đang là `false`.
- Đề xuất: dùng cờ hydrate riêng nếu cần loading-state trước khi guard quyết định.

## 13.3 Chuẩn hóa state layer
- Đang dùng cả Redux và Zustand cho auth flow.
- Đề xuất: thống nhất boundary rõ ràng:
  - Cách A: Redux cho tất cả auth + async
  - Cách B: Zustand toàn auth + persist riêng

## 13.4 API integration
- Auth mock chưa phù hợp production.
- Đề xuất:
  - Tách service API layer (`src/services/*`)
  - Thêm interceptors axios
  - Token refresh + centralized error handling

## 13.5 Test coverage
- Chưa thấy test setup/coverage trong cấu trúc hiện tại.
- Đề xuất: thêm unit test cho utils/hooks/components core, và smoke test cho routing/guards.

---

## 14. Quy trình mở rộng feature khuyến nghị

1. Tạo module mới trong `src/modules/<feature>`.
2. Tạo page/component cần thiết.
3. Thêm route config vào `src/app/router/configs`.
4. Khai báo `menuLabel`, `allowedRoles` nếu cần hiển thị menu.
5. Thêm styles theo token (`var(--...)`), tránh hardcode.
6. Bổ sung validation/helpers nếu có logic dùng chung.
7. Viết README ngắn nếu là core component/feature phức tạp.

---

## 15. File quan trọng cần nắm đầu tiên

- `src/main.tsx`
- `src/App.tsx`
- `src/app/router/routes.tsx`
- `src/app/router/AppRouter.tsx`
- `src/app/layouts/LayoutSwitch.tsx`
- `src/app/redux/store.ts`
- `src/app/redux/auth.slice.ts`
- `src/app/store/auth.store.ts`
- `src/styles/main.scss`
- `src/styles/abstracts/_css-vars.scss`

---

## 16. Kết luận
Kiến trúc hiện tại phù hợp tốt cho template nội bộ và dự án FE vừa/nhỏ cần tốc độ phát triển nhanh, có role-based UI và bộ component dùng chung. Nền tảng đang khá tốt để scale, nhưng cần ưu tiên chuẩn hóa routing lồng nhau, thống nhất state boundary, và thêm API + testing strategy để sẵn sàng production.
