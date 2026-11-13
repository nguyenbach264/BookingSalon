# Hướng dẫn Đóng gói Toàn bộ Dự án BookingSalon vào Docker (Chạy Đa Nền Tảng)

> **Mục tiêu**: Đóng gói hoàn chỉnh dự án BookingSalon (Frontend React 19, Backend Spring Boot 3.5.3, MySQL 8, Redis, Keycloak) vào Docker Container để có thể copy sang **bất kỳ máy nào (Windows, MacOS, Linux/VPS)** là chạy ngay chỉ bằng **1 lệnh duy nhất** (`docker compose up -d`).  
> **Nguyên tắc**: Không thay đổi code logic lõi, hướng dẫn đầy đủ từ cấu trúc Dockerfile, Docker Compose, cách export/import mang đi máy khác, và xử lý lỗi thực tế.

---

## MỤC LỤC

1. [Tổng quan Kiến trúc Đóng gói Docker](#1-tổng-quan-kiến-trúc-đóng-gói-docker)
2. [Những Thách thức Đặc thù của BookingSalon cần Xử lý](#2-những-thách-thức-đặc-thù-của-bookingsalon-cần-xử-lý)
3. [Chi tiết Các File Cần Tạo trong Dự án](#3-chi-tiết-các-file-cần-tạo-trong-dự-án)
   - 3.1. `backend/Dockerfile` (Multi-stage build cho Spring Boot)
   - 3.2. `backend/.dockerignore`
   - 3.3. `frontend/Dockerfile` (Multi-stage build Vite + Nginx)
   - 3.4. `frontend/nginx.conf`
   - 3.5. `frontend/.dockerignore`
   - 3.6. `docker-compose.yml` (Điều phối toàn bộ hệ thống)
   - 3.7. `.env.docker` (Biến môi trường mẫu)
4. [Quy trình Khởi chạy Lần Đầu trên Máy Hiện Tại](#4-quy-trình-khởi-chạy-lần-đầu-trên-máy-hiện-tại)
5. [Quy trình Đóng gói Mang Đi Máy Khác (2 Cách Phổ Biến)](#5-quy-trình-đóng-gói-mang-đi-máy-khác-2-cách-phổ-biến)
   - Cách 1: Đóng gói Source Code + Docker Compose (Khuyên dùng khi cần chỉnh sửa)
   - Cách 2: Đóng gói Pre-built Docker Images thành file `.tar` (Offline 100%, không cần build lại)
6. [Quy trình Thiết lập tại Máy Mới](#6-quy-trình-thiết-lập-tại-máy-mới)
7. [Xử lý Dữ liệu Database & Khởi tạo Keycloak Realm](#7-xử-lý-dữ-liệu-database--khởi-tạo-keycloak-realm)
8. [Các Lỗi Thường Gặp & Cách Khắc Phục (Troubleshooting)](#8-các-lỗi-thường-gặp--cách-khắc-phục-troubleshooting)
9. [Bảng Lệnh Docker Bỏ Túi Cần Nhớ](#9-bảng-lệnh-docker-bỏ-túi-cần-nhớ)

---

## 1. Tổng quan Kiến trúc Đóng gói Docker

Khi đóng gói dự án BookingSalon lên Docker, chúng ta sẽ có **5 dịch vụ chính** chạy trong cùng một mạng ảo (`bookingsalon-net`):

```
                                  [ TRÌNH DUYỆT / CLIENT ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │ Port 80 (hoặc 5173)                       │ Port 8080
                       ▼                                           ▼
             ┌───────────────────┐                       ┌───────────────────┐
             │ frontend (Nginx)  │                       │  backend (Java)   │
             │ React 19 SPA      │                       │ Spring Boot 3.5.3 │
             └───────────────────┘                       └─────────┬─────────┘
                                                                   │
                       ┌──────────────────────┬────────────────────┼───────────────────┐
                       │                      │                    │                   │
                       ▼                      ▼                    ▼                   ▼
             ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────┐  ┌───────────────────┐
             │    mysql:8.0      │  │   redis:7-alpine  │  │   keycloak:26    │  │   Cloudinary/     │
             │   Port 3306       │  │    Port 6379      │  │    Port 8081     │  │   VNPay / Mail    │
             │ Volume: mysql_data│  │ Volume: redis_data│  │ (Realm Seeder)   │  │ (External APIs)   │
             └───────────────────┘  └───────────────────┘  └──────────────────┘  └───────────────────┘
```

### Tại sao nên dùng Docker Compose?
- **Độc lập môi trường**: Máy mới chỉ cần cài đúng **Docker & Docker Compose**. Không cần cài Java 21, Maven, Node.js, MySQL Server, Redis thủ công.
- **Tự động liên kết mạng**: Các container giao tiếp với nhau bằng **tên service** (`mysql`, `redis`, `backend`, `keycloak`) thay vì `localhost` hay IP động.
- **Tách biệt dữ liệu**: Dữ liệu MySQL và Redis được lưu vào Docker Volumes, không lo mất khi tắt container.

---

## 2. Những Thách thức Đặc thù của BookingSalon cần Xử lý

Trước khi viết file Docker, cần hiểu rõ 4 vấn đề đặc thù của dự án:

1. **Vấn đề `localhost` vs Docker Network**:
   - Khi chạy ở máy cá nhân, Backend kết nối MySQL qua `localhost:3306`, Redis qua `localhost:6379`.
   - Trong Docker, mỗi container là một máy ảo nhỏ riêng biệt. Nếu Backend gọi `localhost:3306`, nó sẽ tìm MySQL ngay trong container Backend (nơi không có MySQL). Do đó, URL phải chuyển thành `mysql:3306` và `redis:6379`.
2. **Thứ tự khởi động (Startup Order & Healthcheck)**:
   - Backend phụ thuộc vào MySQL, Redis và Keycloak. Nếu Backend khởi động trước khi MySQL sẵn sàng nhận kết nối, Flyway Migration sẽ báo lỗi và crash app. Ta cần cấu hình `healthcheck` và `depends_on: service_healthy`.
3. **Keycloak Realm & Client Secret**:
   - Backend có `KeycloakSeeder` tự động seed tài khoản admin/stylist, nhưng Keycloak cần khởi động hoàn tất và có realm `booking-salon-realm`.
4. **Vite SPA Routing trên Frontend**:
   - React Router sử dụng HTML5 History API (các đường dẫn như `/services`, `/booking`, `/admin`). Nếu dùng Nginx mặc định mà reload trang sẽ bị lỗi `404 Not Found`. Phải cấu hình Nginx `try_files $uri $uri/ /index.html;`.

---

## 3. Chi tiết Các File Cần Tạo trong Dự án

Dưới đây là nội dung chi tiết các file bạn cần tạo trong repository để Docker hóa toàn bộ dự án.

### 3.1. `backend/Dockerfile`
Tạo file `backend/Dockerfile` với cơ chế **Multi-stage build** (Stage 1 build JAR, Stage 2 chạy với JRE Alpine nhẹ, bảo mật, tối ưu dung lượng từ ~1GB xuống ~250MB):

```dockerfile
# ==========================================
# STAGE 1: Build source code thành file JAR
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build

# Cache dependencies trước để tăng tốc build cho các lần sau
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
# Nếu có mvnw thì cấp quyền, nếu dùng maven cài sẵn thì có thể bỏ qua
RUN chmod +x mvnw 2>/dev/null || true

# Tải trước các thư viện phụ thuộc (Dependencies)
RUN apk add --no-cache maven && mvn dependency:go-offline -B

# Copy toàn bộ source code backend vào
COPY src ./src

# Build file JAR, bỏ qua test để tăng tốc
RUN mvn clean package -DskipTests -B

# ==========================================
# STAGE 2: Runtime Image (Siêu nhẹ)
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Tạo user không có quyền root để bảo mật hệ thống
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Cài đặt curl để phục vụ docker healthcheck
RUN apk add --no-cache curl tzdata

# Đồng bộ múi giờ Việt Nam
ENV TZ=Asia/Ho_Chi_Minh
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy file jar từ builder stage
COPY --from=builder /build/target/*.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

# Cấu hình JVM tối ưu bộ nhớ container
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Duser.timezone=Asia/Ho_Chi_Minh", \
  "-jar", "app.jar"]
```

---

### 3.2. `backend/.dockerignore`
Tạo file `backend/.dockerignore` để tránh copy rác vào container:

```ignore
target/
*.class
.git
.gitignore
.idea
.vscode
*.iml
*.log
.env
```

---

### 3.3. `frontend/Dockerfile`
Tạo file `frontend/Dockerfile` sử dụng Node.js 22 để build Vite, sau đó đưa file tĩnh vào **Nginx Alpine** (chỉ tốn ~25MB RAM khi chạy):

```dockerfile
# ==========================================
# STAGE 1: Build React 19 Vite App
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

# Khai báo argument để truyền URL backend lúc build
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

# Copy package info và cài đặt
COPY package*.json ./
RUN npm ci

# Copy source code và build
COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Nginx Web Server phục vụ file tĩnh
# ==========================================
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Xóa trang html mặc định của nginx
RUN rm -rf ./*

# Copy file build từ Stage 1
COPY --from=builder /app/dist .

# Copy cấu hình Nginx custom hỗ trợ React Router SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

### 3.4. `frontend/nginx.conf`
Tạo file `frontend/nginx.conf` cùng thư mục với `frontend/Dockerfile` để hỗ trợ điều hướng SPA và nén Gzip:

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html index.htm;

    # Kích hoạt Gzip nén dữ liệu cho web mượt mà
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Cấu hình quan trọng cho React Router:
    # Nếu không tìm thấy file, fallback về index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache file tĩnh (ảnh, css, js) để tải nhanh hơn
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Báo lỗi 50x
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

---

### 3.5. `frontend/.dockerignore`
Tạo file `frontend/.dockerignore`:

```ignore
node_modules/
dist/
.git
.gitignore
.idea
.vscode
*.log
.env.local
```

---

### 3.6. `docker-compose.yml` (Nằm ở thư mục gốc `BookingSalon/`)
Tạo file `docker-compose.yml` tại thư mục gốc của dự án:

```yaml
services:
  # ===================================================
  # 1. DATABASE: MySQL 8.0
  # ===================================================
  mysql:
    image: mysql:8.0
    container_name: bookingsalon_mysql
    restart: unless-stopped
    command: >
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --default-time-zone=+07:00
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-Bach@vt05}
      MYSQL_DATABASE: ${DB_NAME:-bookingsalondb}
      TZ: Asia/Ho_Chi_Minh
    ports:
      - "${DB_PORT:-3306}:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      # Tùy chọn: mount file backup initData.sql nếu có
      # - ./initData.sql:/docker-entrypoint-initdb.d/initData.sql:ro
    networks:
      - bookingsalon_net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_PASSWORD:-Bach@vt05}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # ===================================================
  # 2. CACHE & LOCK: Redis 7
  # ===================================================
  redis:
    image: redis:7-alpine
    container_name: bookingsalon_redis
    restart: unless-stopped
    command: >
      redis-server
      --requirepass "${REDIS_PASSWORD:-}"
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    networks:
      - bookingsalon_net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # ===================================================
  # 3. IAM / AUTH: Keycloak 26
  # ===================================================
  keycloak:
    image: quay.io/keycloak/keycloak:26.0.5
    container_name: bookingsalon_keycloak
    restart: unless-stopped
    command: start-dev --http-port=8081
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_HEALTH_ENABLED: "true"
      KC_METRICS_ENABLED: "true"
    ports:
      - "8081:8081"
    volumes:
      - keycloak_data:/opt/keycloak/data
    networks:
      - bookingsalon_net
    healthcheck:
      test: ["CMD-SHELL", "exec 3<>/dev/tcp/127.0.0.1/8081; echo -e 'GET /health/ready HTTP/1.1\\r\\nHost: localhost\\r\\nConnection: close\\r\\n\\r\\n' >&3; grep -q '200 OK' <&3"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 40s

  # ===================================================
  # 4. BACKEND: Spring Boot 3.5.3 (BFF)
  # ===================================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: bookingsalon-backend:latest
    container_name: bookingsalon_backend
    restart: unless-stopped
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
      keycloak:
        condition: service_healthy
    environment:
      # Database connection (gọi sang container mysql)
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${DB_NAME:-bookingsalondb}
      DB_USERNAME: ${DB_USERNAME:-root}
      DB_PASSWORD: ${DB_PASSWORD:-Bach@vt05}
      JPA_DDL_AUTO: validate

      # Redis connection (gọi sang container redis)
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-}

      # Keycloak connection
      KEYCLOAK_SERVER_URL: http://keycloak:8081
      KEYCLOAK_PUBLIC_URL: http://localhost:8081
      KEYCLOAK_REALM: booking-salon-realm
      KEYCLOAK_CLIENT_ID: booking-salon-admin
      KEYCLOAK_CLIENT_SECRET: ${KEYCLOAK_CLIENT_SECRET}
      KEYCLOAK_FRONTEND_CLIENT_ID: booking-salon-client
      KEYCLOAK_IDP_GOOGLE_ENABLED: "true"
      KEYCLOAK_IDP_GOOGLE_CLIENT_ID: ${KEYCLOAK_IDP_GOOGLE_CLIENT_ID}
      KEYCLOAK_IDP_GOOGLE_CLIENT_SECRET: ${KEYCLOAK_IDP_GOOGLE_CLIENT_SECRET}

      # External Services
      VNPAY_TMN_CODE: ${VNPAY_TMN_CODE}
      VNPAY_HASH_SECRET: ${VNPAY_HASH_SECRET}
      VNPAY_PAY_URL: ${VNPAY_PAY_URL}
      VNPAY_RETURN_URL: ${VNPAY_RETURN_URL}
      VNPAY_NOTIFY_URL: ${VNPAY_NOTIFY_URL}

      SEPAY_MERCHANT_ID: ${SEPAY_MERCHANT_ID}
      SEPAY_SECRET_KEY: ${SEPAY_SECRET_KEY}
      SEPAY_API_BASE_URL: ${SEPAY_API_BASE_URL}
      SEPAY_WEBHOOK_API_KEY: ${SEPAY_WEBHOOK_API_KEY}
      SEPAY_ENV: ${SEPAY_ENV:-sandbox}

      PAYMENT_BANK_BIN: ${PAYMENT_BANK_BIN}
      PAYMENT_BANK_ACCOUNT: ${PAYMENT_BANK_ACCOUNT}
      PAYMENT_WEBHOOK_SECRET: ${PAYMENT_WEBHOOK_SECRET}
      PAYMENT_EXPIRE_MINUTES: 15

      MAIL_HOST: ${MAIL_HOST}
      MAIL_PORT: ${MAIL_PORT}
      MAIL_USERNAME: ${MAIL_USERNAME}
      MAIL_PASSWORD: ${MAIL_PASSWORD}

      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}

      # CORS
      CORS_ALLOWED_ORIGINS: http://localhost,http://localhost:80,http://localhost:5173
      FRONTEND_URL: http://localhost
    ports:
      - "8080:8080"
    networks:
      - bookingsalon_net

  # ===================================================
  # 5. FRONTEND: React 19 + Nginx
  # ===================================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost:8080
        VITE_WS_URL: ws://localhost:8080
        VITE_KEYCLOAK_URL: http://localhost:8081
        VITE_KEYCLOAK_REALM: booking-salon-realm
        VITE_KEYCLOAK_CLIENT_ID: booking-salon-client
    image: bookingsalon-frontend:latest
    container_name: bookingsalon_frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:80"      # Chạy thẳng cổng 80 chuẩn web (hoặc đổi thành 5173:80 nếu muốn)
      - "5173:80"    # Mở song song cổng 5173 để tương thích URL dev cũ
    networks:
      - bookingsalon_net

# ===================================================
# VOLUMES: Lưu trữ dữ liệu bền vững
# ===================================================
volumes:
  mysql_data:
    name: bookingsalon_mysql_data
  redis_data:
    name: bookingsalon_redis_data
  keycloak_data:
    name: bookingsalon_keycloak_data

# ===================================================
# NETWORKS: Mạng cầu nối nội bộ
# ===================================================
networks:
  bookingsalon_net:
    name: bookingsalon_network
    driver: bridge
```

---

### 3.7. `.env.example` (Biến môi trường mẫu)
Tạo file `.env.example` tại thư mục gốc để người ở máy khác biết cần điền gì:

```env
# Database
DB_NAME=bookingsalondb
DB_USERNAME=root
DB_PASSWORD=Bach@vt05
DB_PORT=3306

# Redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Keycloak
KEYCLOAK_CLIENT_SECRET=Nrys6AchVUk9UNPFGqUFkkLYZxhbURqgAulOFZbcjalgVD9cYpwUV51CzjryrYHjqcZxojqkte4PJ87j0m5Rza
KEYCLOAK_IDP_GOOGLE_CLIENT_ID=your_google_client_id
KEYCLOAK_IDP_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Payments & Services
VNPAY_TMN_CODE=U8WZ0T3L
VNPAY_HASH_SECRET=UCPHPNWGQPJLWGDIAFMGICJPTDGBKPXL
VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:8080/api/v1/payments/webhooks/vnpay/callback
VNPAY_NOTIFY_URL=http://localhost:8080/api/v1/payments/webhook/vnpay

SEPAY_MERCHANT_ID=your_merchant_id
SEPAY_SECRET_KEY=your_secret_key
SEPAY_API_BASE_URL=https://pgapi.sepay.vn
SEPAY_WEBHOOK_API_KEY=your_api_key
SEPAY_ENV=sandbox

PAYMENT_BANK_BIN=123456
PAYMENT_BANK_ACCOUNT=0866429205
PAYMENT_WEBHOOK_SECRET=your_webhook_secret

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

CLOUDINARY_CLOUD_NAME=bzlhomeu
CLOUDINARY_API_KEY=866635999876245
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

---

## 4. Quy trình Khởi chạy Lần Đầu trên Máy Hiện Tại

Sau khi đã tạo đủ các file ở Mục 3, thực hiện theo các bước sau:

### Bước 1: Chuẩn bị file `.env`
Đảm bảo file `.env` ở thư mục gốc có đầy đủ các biến như trong file `.env.example`.

### Bước 2: Build các Docker Image và khởi động dịch vụ
Mở PowerShell tại `e:\Projects\BookingSalon` và chạy:

```powershell
# Build toàn bộ images và khởi chạy background (-d)
docker compose up -d --build
```

### Bước 3: Kiểm tra trạng thái containers
```powershell
docker compose ps
```
Nếu thấy cả 5 container đều hiển thị status **Up** (hoặc `healthy`), hệ thống đã chạy thành công!

### Bước 4: Xem log nếu cần debug
```powershell
# Xem log toàn bộ hệ thống
docker compose logs -f

# Hoặc xem riêng log backend
docker compose logs -f backend
```

### Bước 5: Truy cập kiểm tra trên trình duyệt
- **Frontend App**: `http://localhost` hoặc `http://localhost:5173`
- **Backend API Docs (Swagger)**: `http://localhost:8080/swagger-ui/index.html`
- **Keycloak Admin**: `http://localhost:8081` (Tài khoản: `admin` / `admin`)

---

## 5. Quy trình Đóng gói Mang Đi Máy Khác (2 Cách Phổ Biến)

Tùy vào nhu cầu sử dụng ở máy mới, bạn chọn 1 trong 2 cách sau:

---

### CÁCH 1: Đóng gói Code + Docker Compose (Khuyên Dùng - Gọn nhẹ, dễ update)
Cách này phù hợp khi máy mới có kết nối Internet để tải các base image ban đầu.

#### Bước 1: Nén thư mục dự án
Bạn nén toàn bộ thư mục `BookingSalon`, **LOẠI BỎ** các thư mục nặng không cần thiết:
- Bỏ thư mục `frontend/node_modules`
- Bỏ thư mục `backend/target`
- Bỏ thư mục `.git` (nếu không cần git history)

*Lệnh PowerShell nén nhanh loại trừ rác:*
```powershell
# Tạo file zip gọn nhẹ
Compress-Archive -Path backend, frontend, docker-compose.yml, .env, initData.md -DestinationPath BookingSalon_Docker_Package.zip
```
File nén này sẽ chỉ nặng khoảng **10 - 20 MB**.

#### Bước 2: Chép sang máy mới và giải nén.

---

### CÁCH 2: Đóng gói Pre-built Docker Images thành file `.tar` (Offline 100%, Không Cần Build Lại)
Cách này cực kỳ hữu ích khi mang sang máy **không có Internet** hoặc máy yếu không muốn tốn thời gian build Java/Vite.

#### Bước 1: Build hoàn tất trên máy hiện tại
```powershell
docker compose build
```

#### Bước 2: Xuất toàn bộ Docker Images ra file `.tar`
Chạy lệnh sau trên PowerShell:
```powershell
# Lưu cả 5 Docker Images vào 1 file duy nhất
docker save -o bookingsalon_images.tar `
  bookingsalon-backend:latest `
  bookingsalon-frontend:latest `
  mysql:8.0 `
  redis:7-alpine `
  quay.io/keycloak/keycloak:26.0.5
```
*(File `bookingsalon_images.tar` sẽ nặng khoảng 1.5 - 2 GB).*

#### Bước 3: Gom các file cần mang đi sang máy mới
Chỉ cần copy vào USB / Google Drive:
1. File `bookingsalon_images.tar`
2. File `docker-compose.yml`
3. File `.env`
4. File `initData.md` (hoặc `initData.sql` dùng backup DB)

---

## 6. Quy trình Thiết lập tại Máy Mới

Khi mang bộ cài sang máy mới (chưa có gì ngoài Docker):

### Bước 1: Cài đặt Docker trên máy mới
- **Nếu là Windows / Mac**: Tải và cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/). Bật Docker Desktop lên.
- **Nếu là Ubuntu / Linux Server**: Cài Docker engine:
  ```bash
  sudo apt update && sudo apt install -y docker.io docker-compose-v2
  sudo usermod -aG docker $USER
  ```

### Bước 2: Nạp Images và chạy (Tùy theo cách bạn mang đi)

#### Nếu dùng CÁCH 1 (Code + Docker Compose):
1. Giải nén thư mục `BookingSalon`.
2. Mở terminal tại thư mục đó.
3. Chạy lệnh:
   ```bash
   docker compose up -d --build
   ```
   Docker sẽ tự động tải các base image, build code và khởi chạy hệ thống.

#### Nếu dùng CÁCH 2 (File Images `.tar` Offline):
1. Mở terminal tại thư mục chứa file `.tar`.
2. Load images vào Docker của máy mới:
   ```bash
   docker load -i bookingsalon_images.tar
   ```
3. Sau khi nạp xong, khởi chạy ngay mà không cần build:
   ```bash
   docker compose up -d
   ```

---

## 7. Xử lý Dữ liệu Database & Khởi tạo Keycloak Realm

Khi chạy ở máy mới, database MySQL và Keycloak là **database mới tinh**.

### 7.1. Đối với MySQL Database (Flyway vs Backup)
Dự án đã tích hợp **Flyway Migration (V1 -> V6)**:
- Ngay khi container `backend` khởi động, Flyway sẽ tự động chạy toàn bộ cấu trúc bảng (DDL) vào MySQL.
- Nếu bạn muốn có sẵn dữ liệu mẫu thực tế (Salons, Stylists, Services, Users):
  Mở terminal chạy lệnh nạp file `initData.md` (đã được lưu thành `initData.sql`):
  ```powershell
  # Đẩy data vào container MySQL đang chạy:
  Get-Content initData.sql | docker exec -i bookingsalon_mysql mysql -u root -pBach@vt05 bookingsalondb
  ```

### 7.2. Đối với Keycloak (Cấu hình Realm)
- Khi Keycloak khởi động lần đầu, truy cập `http://localhost:8081`.
- Đăng nhập tài khoản quản trị: `admin` / `admin`.
- Tạo realm mới tên: `booking-salon-realm`.
- Tạo Client `booking-salon-client` (Public client cho React Frontend).
- Tạo Client `booking-salon-admin` (Confidential client cho Spring Boot Backend).
- Lấy `Client Secret` của `booking-salon-admin` dán vào file `.env` biến `KEYCLOAK_CLIENT_SECRET`.
- Restart lại backend:
  ```bash
  docker compose restart backend
  ```
  Lúc này, `KeycloakSeeder` trong backend sẽ tự động tạo các tài khoản mẫu (`admin`, `stylist`, `user`) vào Keycloak với mật khẩu mặc định `BachBarber@2026`.

---

## 8. Các Lỗi Thường Gặp & Cách Khắc Phục (Troubleshooting)

### Lỗi 1: Port 3306 hoặc 8080 đã bị chiếm dụng trên máy mới
- **Hiện tượng**: Báo lỗi `bind: address already in use` khi chạy `docker compose up`.
- **Nguyên nhân**: Máy mới đã có cài sẵn MySQL cục bộ hoặc phần mềm khác đang chiếm cổng 3306 / 8080 / 80.
- **Cách khắc phục**:
  Đổi cổng bên ngoài máy host trong file `docker-compose.yml` (chỉ đổi số cổng bên trái dấu `:`):
  ```yaml
  ports:
    - "3307:3306"  # Đổi 3306 -> 3307 ở máy host
    - "8082:8080"  # Đổi 8080 -> 8082 ở máy host
  ```

### Lỗi 2: Backend báo lỗi kết nối MySQL (`Communications link failure`)
- **Hiện tượng**: Backend liên tục restart hoặc crash.
- **Nguyên nhân**: Trong file cấu hình backend vẫn còn ghi `DB_HOST=localhost` thay vì `DB_HOST=mysql`.
- **Cách khắc phục**: Kiểm tra mục `environment` của service `backend` trong `docker-compose.yml`, chắc chắn rằng `DB_HOST` có giá trị là `mysql` và `REDIS_HOST` là `redis`.

### Lỗi 3: Frontend tải được trang chủ nhưng click vào link con reload lại bị 404
- **Hiện tượng**: Vào `http://localhost/` bình thường, nhưng vào `http://localhost/services` hoặc reload trang con thì gặp `404 Not Found`.
- **Nguyên nhân**: Nginx chưa được cấu hình fallback về `index.html`.
- **Cách khắc phục**: Đảm bảo file `frontend/nginx.conf` có dòng `try_files $uri $uri/ /index.html;` và Dockerfile của frontend đã copy file này vào `/etc/nginx/conf.d/default.conf`.

### Lỗi 4: Lỗi Out Of Memory (OOM) trên máy RAM yếu (dưới 8GB)
- **Hiện tượng**: Container `keycloak` hoặc `backend` bị tự tắt (Exit code 137).
- **Cách khắc phục**: Thêm giới hạn bộ nhớ (resource limits) trong `docker-compose.yml` cho từng service:
  ```yaml
  backend:
    deploy:
      resources:
        limits:
          memory: 1024M
  keycloak:
    deploy:
      resources:
        limits:
          memory: 1024M
  ```

---

## 9. Bảng Lệnh Docker Bỏ Túi Cần Nhớ

| Mục đích | Câu lệnh |
| :--- | :--- |
| **Khởi động hệ thống (chạy ngầm)** | `docker compose up -d` |
| **Build lại toàn bộ và khởi động** | `docker compose up -d --build` |
| **Dừng hệ thống (vẫn giữ dữ liệu volume)** | `docker compose down` |
| **Dừng hệ thống VÀ XÓA HẾT dữ liệu database** | `docker compose down -v` |
| **Xem trạng thái các container** | `docker compose ps` |
| **Xem log realtime của tất cả dịch vụ** | `docker compose logs -f` |
| **Xem log riêng của Backend** | `docker compose logs -f backend` |
| **Khởi động lại một dịch vụ cụ thể** | `docker compose restart backend` |
| **Vào terminal bên trong container MySQL** | `docker exec -it bookingsalon_mysql bash` |
| **Kiểm tra mức tiêu thụ RAM / CPU của Docker** | `docker stats` |

---

*File này là cẩm nang đóng gói độc lập. Bạn chỉ cần làm theo Mục 3 để tạo các file cấu hình tương ứng, sau đó làm theo Mục 4 và Mục 5 là có thể mang dự án BookingSalon chạy ở bất kỳ máy tính hay server nào.*

