# Chọn một image Node.js để làm base
FROM node:20

# Tạo thư mục làm việc trong Docker image
WORKDIR /app

# Sao chép file package.json và package-lock.json vào thư mục làm việc
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn vào thư mục làm việc
COPY . .

# Mở port (nếu app của bạn chạy trên port nào thì thay số)
EXPOSE 8080

# Chạy ứng dụng
CMD [ "npm", "start" ]
