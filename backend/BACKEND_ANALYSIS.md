# Phân tích Backend UCPC Register

Ngày cập nhật: 2026-03-12

## 1) Tổng quan kiến trúc

Backend được tổ chức theo mô hình 3 lớp rõ ràng:

- Routes: [src/Routes/apiRoutes.js](src/Routes/apiRoutes.js)
- Controllers: [src/controllers/apiController.js](src/controllers/apiController.js)
- Services: [src/services/apiService.js](src/services/apiService.js)

Entry point và middleware:

- Khởi tạo server: [src/server.js](src/server.js)
- JWT và phân quyền: [src/controllers/JWTActions.js](src/controllers/JWTActions.js)
- CORS: [src/configs/configCORS.js](src/configs/configCORS.js)
- Kết nối DB: [src/configs/dbConnection.js](src/configs/dbConnection.js)

ORM và quan hệ dữ liệu (Sequelize):

- User 1-1 Team: [src/models/user.js](src/models/user.js), [src/models/team.js](src/models/team.js)
- Team 1-n Participant, 1-1 Process, 1-n Request: [src/models/team.js](src/models/team.js)
- Các model phụ trợ email/reset: [src/models/template.js](src/models/template.js), [src/models/settemplate.js](src/models/settemplate.js), [src/models/pin.js](src/models/pin.js), [src/models/whitelist.js](src/models/whitelist.js)

Đánh giá nhanh:

- Điểm mạnh: Tách lớp rõ ràng, dễ bảo trì.
- Điểm cần cải thiện: Kiểm soát quyền truy cập theo tài nguyên (resource-level authorization), xử lý lỗi runtime, quản lý secret.

## 2) Vấn đề nghiêm trọng (Critical)

### C1. Route xóa help request bị mở public

- Public route đang có deleteHelpRequest: [src/controllers/JWTActions.js](src/controllers/JWTActions.js#L2)
- Route thực tế: [src/Routes/apiRoutes.js](src/Routes/apiRoutes.js#L55)
- Service xóa theo id trực tiếp, không check owner/role: [src/services/apiService.js](src/services/apiService.js#L758), [src/services/apiService.js](src/services/apiService.js#L772)

Tác động:

- Có thể xóa request trái phép nếu đoán được id.

Khuyến nghị:

- Bỏ deleteHelpRequest khỏi publicRoutes.
- USER chỉ được xóa request của team mình.
- ADMIN có quyền xóa toàn bộ.

### C2. Lộ secret trong file cấu hình

- Password DB hard-code: [src/configs/config.json](src/configs/config.json#L4), [src/configs/config.json](src/configs/config.json#L13)

Tác động:

- Rủi ro rò rỉ credential, bị truy cập DB trái phép.

Khuyến nghị:

- Đưa toàn bộ secret vào biến môi trường.
- Rotate ngay các password đã lộ.

### C3. IDOR ở endpoint lấy help theo user id

- USER route cho phép getHelpByUser/:id: [src/controllers/JWTActions.js](src/controllers/JWTActions.js#L4), [src/Routes/apiRoutes.js](src/Routes/apiRoutes.js#L54)
- Middleware hiện tại chỉ check path, không đối chiếu id với token: [src/controllers/JWTActions.js](src/controllers/JWTActions.js#L55)

Tác động:

- USER có thể xem dữ liệu help request của user khác.

Khuyến nghị:

- Token nên mang userId.
- Nếu role USER thì bắt buộc req.params.id phải bằng userId trong token.

## 3) Vấn đề lớn (High)

### H1. Crash trong luồng reset password theo PIN

- Không check null trước khi dùng checkPIN.PINToken: [src/services/apiService.js](src/services/apiService.js#L1665)
- Gọi res.status trong service (service không có res): [src/services/apiService.js](src/services/apiService.js#L1668)

Tác động:

- Dễ phát sinh TypeError/ReferenceError khi PIN không tồn tại hoặc hết hạn.

Khuyến nghị:

- Nếu không tìm thấy PIN record thì return object lỗi chuẩn.
- Không dùng res trong service; để controller trả HTTP response.

### H2. Null dereference khi tạo team mới

- Trong update info: tạo team xong vẫn dùng team.id cũ (null): [src/services/apiService.js](src/services/apiService.js#L405), [src/services/apiService.js](src/services/apiService.js#L414)
- Trong update user by admin: team có thể null nhưng vẫn dùng team.id: [src/services/apiService.js](src/services/apiService.js#L1353), [src/services/apiService.js](src/services/apiService.js#L1360)

Tác động:

- Gây crash hoặc ghi dữ liệu sai.

Khuyến nghị:

- Sau create Team phải lấy lại team vừa tạo trước khi dùng team.id.

### H3. Update participant sai logic

- Vòng lặp từng participant nhưng query update theo teamId, dễ gây ghi đè cùng tập participant nhiều lần: [src/services/apiService.js](src/services/apiService.js#L1376), [src/services/apiService.js](src/services/apiService.js#L1385)

Tác động:

- Dữ liệu participant không đúng kỳ vọng.

Khuyến nghị:

- Update theo participant id.
- Hoặc xóa danh sách cũ rồi tạo lại theo payload.

## 4) Vấn đề vừa (Medium)

### M1. Chưa có transaction cho thao tác nhiều bảng

- Các flow đăng ký, cập nhật team/participant/process, xóa user liên quan nhiều bảng trong [src/services/apiService.js](src/services/apiService.js)

Tác động:

- Dễ rơi vào trạng thái dữ liệu không đồng bộ khi lỗi giữa chừng.

Khuyến nghị:

- Dùng Sequelize transaction cho các thao tác create/update/delete liên bảng.

### M2. Chuẩn mã lỗi HTTP chưa đồng nhất

- Nhiều trường hợp lỗi business nhưng vẫn trả 200 (controller pattern hiện tại): [src/controllers/apiController.js](src/controllers/apiController.js)

Tác động:

- Frontend khó xử lý theo HTTP semantics.

Khuyến nghị:

- Chuẩn hóa: 2xx cho thành công, 4xx/5xx cho lỗi.

### M3. Có dấu hiệu logic check thừa/không cần thiết

- Ví dụ check teamData với nhiều điều kiện trùng lặp trong login flow: [src/services/apiService.js](src/services/apiService.js)

Khuyến nghị:

- Giảm branch phức tạp, viết helper để readability tốt hơn.

## 5) Điểm tốt hiện tại

- Tách route/controller/service rõ, dễ mở rộng và test.
- Quan hệ model phù hợp bài toán đội thi.
- Có cơ chế whitelist sau reset password: [src/controllers/checkWhiteList.js](src/controllers/checkWhiteList.js)

## 6) Kế hoạch xử lý đề xuất (ưu tiên)

1. Khóa route xóa request và thêm ownership check.
2. Gỡ bỏ secret khỏi source, rotate credential.
3. Sửa reset password flow (null check, không dùng res trong service).
4. Sửa bug team null và participant update.
5. Bổ sung transaction cho các flow nhiều bảng.
6. Chuẩn hóa status code và bộ test cho auth/permission.

## 7) Test cases nên bổ sung

Auth và permission:

- USER không được xóa request khác team.
- USER không được đọc getHelpByUser với id không phải của mình.
- Token hết hạn trả về đúng mã lỗi.

Reset password:

- Email không tồn tại.
- PIN không tồn tại.
- PIN hết hạn.
- PIN sai.
- Reset thành công và token cũ bị chặn bởi whitelist.

Data consistency:

- Update info lần đầu thành công, lần hai bị chặn.
- Flow update user by admin không làm mất dữ liệu participant.
- Xóa user không để lại dữ liệu mồ côi.

---

Tài liệu này được tạo từ kết quả đọc trực tiếp code backend trong workspace hiện tại.
