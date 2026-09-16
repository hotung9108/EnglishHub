# syntax=docker/dockerfile:1

# ==========================================
# Stage 1: Base & Development Environment
# ==========================================
FROM node:22-alpine AS development

WORKDIR /app

# Cài đặt dependencies trước để tối ưu hóa Docker layer caching
COPY package*.json ./
RUN npm install

# Sao chép toàn bộ mã nguồn frontend
COPY . .

# Port mặc định của Vite Dev Server
EXPOSE 5173

# Chạy Vite Dev Server với cờ host để cho phép kết nối từ bên ngoài container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# ==========================================
# Stage 2: Production Build
# ==========================================
FROM development AS builder

RUN npm run build

# ==========================================
# Stage 3: Production Nginx Runtime
# ==========================================
FROM nginx:alpine AS production

# Sao chép file cấu hình Nginx phục vụ SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Sao chép static files đã build từ builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
