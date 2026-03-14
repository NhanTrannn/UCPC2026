# Hướng Dẫn Tích Hợp FE-BE (UCPC2026)

## Trạng thái hiện tại

Frontend đã kết nối backend cho luồng đăng ký đội thi.

Luồng đang chạy:

- Form frontend submit -> `PUT /api/v1/update-info`
- Các file phía frontend liên quan:
  - `frontend/src/services/http.ts`
  - `frontend/src/services/team-registration.service.ts`
  - `frontend/src/pages/User/Form/Form.jsx`

## 1) Cấu hình môi trường

### Frontend

Tạo file `frontend/.env` từ template:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Lưu ý:

- `VITE_API_BASE_URL` đang được dùng trong `frontend/src/services/http.ts`.
- Nếu thiếu biến môi trường, frontend sẽ fallback về `http://localhost:8080`.

### Backend

Thiết lập tối thiểu trong `backend/.env`:

```env
PORT=8080
REACT_APP_API_URL=http://localhost:5173
```

Lưu ý:

- CORS của backend hiện đang cho phép đúng origin trong `REACT_APP_API_URL`.
- Nếu frontend chạy cổng khác (ví dụ `5174`) thì phải sửa lại `REACT_APP_API_URL` tương ứng.

## 2) Chạy backend

Trong thư mục `backend`:

```bash
npm install
npm start
```

Kỳ vọng: backend chạy tại `http://localhost:8080`.

## 3) Chạy frontend

Trong thư mục `frontend`:

```bash
npm install
npm run dev
```

Dùng đúng URL Vite in ra terminal (thường là `http://localhost:5173`).

## 4) Kiểm tra FE-BE đã nối đúng chưa

1. Mở frontend trên trình duyệt.
2. Vào trang đăng ký (`/user`) theo chính sách guard hiện tại.
3. Điền form và submit.
4. Mở tab Network để kiểm tra request:
   - Method: `PUT`
   - URL: `http://localhost:8080/api/v1/update-info`
5. Kiểm tra log backend hoặc dữ liệu DB đã được cập nhật.

## 5) Lỗi thường gặp và cách xử lý

### Lỗi CORS trên trình duyệt

- Dấu hiệu: trình duyệt báo bị chặn bởi CORS policy.
- Cách xử lý:
  - Đảm bảo `REACT_APP_API_URL` của backend trùng đúng origin frontend thực tế.
  - Restart backend sau khi sửa `.env`.

### Frontend gọi sai host/port API

- Dấu hiệu: request đi sai URL.
- Cách xử lý:
  - Kiểm tra `frontend/.env` với `VITE_API_BASE_URL`.
  - Restart frontend sau khi đổi env.

### API trả 404 với `/api/v1/update-info`

- Dấu hiệu: endpoint không tồn tại.
- Cách xử lý:
  - Kiểm tra route backend đã đăng ký endpoint này chưa.
  - Xác nhận backend đang chạy đúng port mong muốn.

### Lệch cổng (`5173` và `5174`)

- Dấu hiệu: backend cho phép 1 origin nhưng frontend đang chạy origin khác.
- Cách xử lý:
  - Dùng đúng URL Vite hiển thị trong terminal.
  - Cập nhật `REACT_APP_API_URL` của backend cho khớp.

## 6) Đề xuất cải thiện tiếp theo

- Đổi tên biến backend `REACT_APP_API_URL` thành tên rõ nghĩa hơn như `FRONTEND_ORIGIN`.
- Duy trì một file hướng dẫn tích hợp chung cho team (file này) để onboarding nhanh hơn.
