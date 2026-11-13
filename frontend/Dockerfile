# ========================================================
# GIAI ĐOẠN 1: Build ứng dụng React 19 với Node.js
# ========================================================
FROM node:22-alpine AS builder
WORKDIR /app

# Nhận các biến môi trường cấu hình URL lúc build (build args)
ARG VITE_API_URL=http://localhost:8080
ARG VITE_WS_URL=ws://localhost:8080
ARG VITE_KEYCLOAK_URL=http://localhost:8081
ARG VITE_KEYCLOAK_REALM=booking-salon-realm
ARG VITE_KEYCLOAK_CLIENT_ID=booking-salon-client

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

# Cài đặt thư viện trước để cache layer
COPY package*.json ./
RUN npm ci

# Copy mã nguồn và đóng gói bản phát hành
COPY . .
RUN npm run build

# ========================================================
# GIAI ĐOẠN 2: Máy chủ Nginx phục vụ tệp tĩnh SPA
# ========================================================
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Xóa trang mặc định của Nginx
RUN rm -rf ./*

# Copy thư mục build từ Giai đoạn 1
COPY --from=builder /app/dist .

# Copy tệp cấu hình Nginx riêng cho React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]