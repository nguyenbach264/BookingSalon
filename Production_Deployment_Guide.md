# Hướng dẫn Deploy BookingSalon lên Server Thật
## Quy trình từng bước — Công nghệ & Kiến thức cần nắm

> **Hệ thống hiện tại**: Spring Boot 3.5.3 + React 19 + Keycloak 26 + MySQL 8 + Redis + Cloudinary + VNPay/SePay  
> **Mục tiêu**: Deploy hoàn chỉnh lên VPS Linux, chạy ổn định ở production  
> **Đối tượng**: Developer đã có codebase, chưa từng deploy lên server thật

---

## MỤC LỤC

- [Tổng quan kiến trúc production](#tổng-quan-kiến-trúc-production)
- [Giai đoạn 0 — Chuẩn bị trước khi deploy](#giai-đoạn-0--chuẩn-bị-trước-khi-deploy)
- [Giai đoạn 1 — Mua và cấu hình Server (VPS)](#giai-đoạn-1--mua-và-cấu-hình-server-vps)
- [Giai đoạn 2 — Cài đặt môi trường trên Server](#giai-đoạn-2--cài-đặt-môi-trường-trên-server)
- [Giai đoạn 3 — Cấu hình Domain và SSL](#giai-đoạn-3--cấu-hình-domain-và-ssl)
- [Giai đoạn 4 — Cấu hình Nginx Reverse Proxy](#giai-đoạn-4--cấu-hình-nginx-reverse-proxy)
- [Giai đoạn 5 — Deploy Keycloak](#giai-đoạn-5--deploy-keycloak)
- [Giai đoạn 6 — Deploy MySQL và Redis](#giai-đoạn-6--deploy-mysql-và-redis)
- [Giai đoạn 7 — Build và Deploy Backend](#giai-đoạn-7--build-và-deploy-backend)
- [Giai đoạn 8 — Build và Deploy Frontend](#giai-đoạn-8--build-và-deploy-frontend)
- [Giai đoạn 9 — Cập nhật cấu hình cho Production](#giai-đoạn-9--cập-nhật-cấu-hình-cho-production)
- [Giai đoạn 10 — Kiểm tra và Smoke Test](#giai-đoạn-10--kiểm-tra-và-smoke-test)
- [Giai đoạn 11 — Monitoring và Logging](#giai-đoạn-11--monitoring-và-logging)
- [Quy trình cập nhật (Re-deploy)](#quy-trình-cập-nhật-re-deploy)
- [Xử lý sự cố thường gặp](#xử-lý-sự-cố-thường-gặp)

---

## Tổng quan kiến trúc production

```
                        INTERNET
                           │
                    ┌──────▼──────┐
                    │  Cloudflare  │  (DNS + CDN + DDoS protection)
                    └──────┬──────┘
                           │ HTTPS (443)
                    ┌──────▼──────┐
                    │    Nginx    │  (Reverse Proxy + SSL termination)
                    │  Port 80/443│
                    └──┬──────┬──┘
                       │      │
          ┌────────────▼──┐ ┌─▼──────────────────┐
          │   Frontend    │ │   Backend (BFF)     │
          │  Static Files │ │   Spring Boot       │
          │  /var/www/    │ │   Port 8080         │
          │  bachbarber/  │ │                     │
          └───────────────┘ └──┬──────────────┬──┘
                               │              │
                    ┌──────────▼──┐  ┌────────▼───────┐
                    │   MySQL 8   │  │   Redis         │
                    │  Port 3306  │  │   Port 6379     │
                    └─────────────┘  └────────────────┘
                               │
                    ┌──────────▼──┐
                    │  Keycloak   │
                    │  Port 8081  │
                    └─────────────┘

External Services (Cloud):
  Cloudinary → Image storage
  VNPay / SePay → Payment gateway
  Gmail SMTP → Email notifications
```

---

## Giai đoạn 0 — Chuẩn bị trước khi deploy

### 0.1 Checklist code trước khi đưa lên server

**Bắt buộc phải làm:**

```
[ ] Xóa .env khỏi Git history (hoặc rotate tất cả credentials)
    → DB_PASSWORD, KEYCLOAK_CLIENT_SECRET, GOOGLE credentials,
      VNPAY keys, SEPAY keys, Gmail app password, Cloudinary secret
    → Mọi secret hiện đang lộ trên git — PHẢI thay đổi tất cả

[ ] Đổi DB_USERNAME từ root sang user riêng (xem DB_Migration_And_NonRoot_User_Guide.md)

[ ] Tắt spring.jpa.show-sql=true (log SQL ra stdout là thảm họa production)

[ ] Tắt Swagger UI trên production (lộ toàn bộ API specification)

[ ] Đổi JPA_DDL_AUTO=validate (hiện đã validate — tốt)

[ ] Kiểm tra không còn hardcode localhost trong frontend code
    (authProvider.jsx, notificationWebSocket.js, ...)

[ ] Frontend build với biến môi trường production (VITE_API_URL=https://...)
```

### 0.2 Domain cần chuẩn bị

```
Ví dụ với domain bachbarber.vn:

bachbarber.vn           → Frontend (React SPA)
api.bachbarber.vn       → Backend Spring Boot (BFF)
auth.bachbarber.vn      → Keycloak IAM

Hoặc đơn giản hơn dùng path-based (1 domain):
bachbarber.vn           → Frontend
bachbarber.vn/api/*     → Backend
bachbarber.vn/auth/*    → Keycloak

(Path-based đơn giản hơn cho SSL cert, nhưng phức tạp hơn cho routing)
```

### 0.3 Credentials cần rotate trước khi deploy

```
1. MySQL: Tạo user mới (không dùng root)
2. Keycloak client secret: Regenerate trong Keycloak Admin
3. Google OAuth: Revoke và tạo lại credentials tại Google Cloud Console
4. Gmail: Thu hồi App Password cũ, tạo App Password mới
5. Cloudinary: Rotate API key/secret
6. VNPay: Liên hệ VNPay để rotate (sandbox tạm chấp nhận)
7. SePay: Rotate webhook key

LÝ DO: File .env đã bị commit vào Git, bất kỳ ai có access repo đều đọc được.
Trên production: Tất cả secrets phải là giá trị MỚI, khác với development.
```

---

## Giai đoạn 1 — Mua và cấu hình Server (VPS)

### 1.1 Lựa chọn VPS Provider

**Khuyến nghị cho dự án BookingSalon:**

| Provider | Gói phù hợp | RAM | CPU | SSD | Giá | Ghi chú |
|---------|------------|-----|-----|-----|-----|---------|
| **DigitalOcean** | Basic Droplet | 4GB | 2 vCPU | 80GB | ~$24/tháng | Tốt nhất cho beginner, UI đẹp |
| **Vultr** | Regular Cloud | 4GB | 2 vCPU | 80GB | ~$24/tháng | Datacenter ở Singapore |
| **Linode (Akamai)** | Shared CPU | 4GB | 2 vCPU | 80GB | ~$24/tháng | Ổn định, tài liệu tốt |
| **AWS EC2** | t3.medium | 4GB | 2 vCPU | Riêng | ~$30/tháng | Phức tạp hơn, ecosystem mạnh |

**Lý do cần 4GB RAM tối thiểu:**
```
Spring Boot (JVM):     ~512MB - 1GB
Keycloak:              ~512MB - 1GB
MySQL:                 ~512MB - 1GB
Redis:                 ~64MB - 256MB
Nginx:                 ~50MB
OS + System:           ~256MB
─────────────────────────
Tổng cần:              ~2-3.5GB
Headroom:              ~500MB - 1.5GB
```

### 1.2 Chọn OS

**Khuyến nghị: Ubuntu 22.04 LTS (Jammy)**

```
Lý do:
  ✅ LTS (Long Term Support) đến tháng 4/2027
  ✅ Cộng đồng lớn, tài liệu phong phú
  ✅ Tất cả hướng dẫn dưới đây dựa trên Ubuntu 22.04
  ✅ Bảo mật patches thường xuyên
```

### 1.3 Bảo mật server ban đầu

**Kết nối SSH lần đầu (từ máy local của bạn):**

```bash
# Server cấp cho IP mới mặc định root password
ssh root@IP_SERVER_CỦA_BẠN

# Bước 1: Tạo user không phải root để làm việc hàng ngày
adduser deploy
# Nhập password mạnh cho user 'deploy'

# Bước 2: Cấp quyền sudo
usermod -aG sudo deploy

# Bước 3: Copy SSH key từ root sang deploy user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Bước 4: Đăng xuất root, đăng nhập bằng deploy
exit
ssh deploy@IP_SERVER_CỦA_BẠN
```

**Cấu hình SSH an toàn hơn:**

```bash
sudo nano /etc/ssh/sshd_config

# Thay đổi các dòng sau:
Port 2222                    # Đổi port mặc định (22 bị scan liên tục)
PermitRootLogin no           # Không cho login root qua SSH
PasswordAuthentication no    # Chỉ dùng SSH key, không dùng password
PubkeyAuthentication yes

# Khởi động lại SSH (MỞ terminal mới trước để không bị lock out!)
sudo systemctl restart sshd
```

**Cấu hình Firewall (UFW):**

```bash
# Bật UFW
sudo ufw default deny incoming   # Mặc định từ chối tất cả vào
sudo ufw default allow outgoing  # Cho phép tất cả ra ngoài

# Mở các port cần thiết
sudo ufw allow 2222/tcp    # SSH (port mới)
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS

# Bật UFW
sudo ufw enable
sudo ufw status verbose

# QUAN TRỌNG: Keycloak, MySQL, Redis KHÔNG mở ra ngoài
# Chỉ truy cập nội bộ từ localhost/private network
```

---

## Giai đoạn 2 — Cài đặt môi trường trên Server

### 2.1 Cập nhật OS và cài công cụ cơ bản

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
    curl wget git unzip \
    htop nano vim \
    net-tools lsof \
    build-essential \
    ufw fail2ban
```

**fail2ban** — Tự động ban IP sau nhiều lần login thất bại:

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2.2 Cài Java 21

```bash
# Cài OpenJDK 21 (LTS)
sudo apt install -y openjdk-21-jdk

# Verify
java -version
# Output: openjdk version "21.x.x" 2024-09-17

# Set JAVA_HOME
echo 'JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64' | sudo tee -a /etc/environment
source /etc/environment
```

### 2.3 Cài Maven (để build backend)

```bash
sudo apt install -y maven

# Hoặc cài phiên bản mới hơn:
MAVEN_VERSION=3.9.9
wget https://downloads.apache.org/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz
sudo tar -xzf apache-maven-${MAVEN_VERSION}-bin.tar.gz -C /opt
sudo ln -s /opt/apache-maven-${MAVEN_VERSION} /opt/maven

echo 'export M2_HOME=/opt/maven' | sudo tee -a /etc/profile.d/maven.sh
echo 'export PATH=${M2_HOME}/bin:${PATH}' | sudo tee -a /etc/profile.d/maven.sh
source /etc/profile.d/maven.sh

mvn -version
```

### 2.4 Cài Node.js 22 (để build frontend)

```bash
# Dùng NVM (Node Version Manager) - linh hoạt hơn
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

nvm install 22
nvm use 22
node --version   # v22.x.x
npm --version

# Cài pnpm (nếu dùng pnpm)
npm install -g pnpm
```

### 2.5 Cài Nginx

```bash
sudo apt install -y nginx

# Enable và start
sudo systemctl enable nginx
sudo systemctl start nginx

# Test
curl http://localhost
# Phải thấy: Welcome to nginx!
```

### 2.6 Cài Certbot (SSL tự động từ Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## Giai đoạn 3 — Cấu hình Domain và SSL

### 3.1 Trỏ DNS về Server

**Tại Cloudflare (hoặc nhà cung cấp domain):**

```
Type    Name              Content           TTL     Proxy
────────────────────────────────────────────────────────
A       @                 IP_SERVER         Auto    ✅ Proxied
A       www               IP_SERVER         Auto    ✅ Proxied
A       api               IP_SERVER         Auto    ✅ Proxied
A       auth              IP_SERVER         Auto    ✅ Proxied

Nếu dùng Cloudflare Proxy (cam):
  - Ẩn IP thật của server (bảo mật)
  - CDN + cache cho static files
  - DDoS protection miễn phí
  - Cần set Cloudflare SSL mode = "Full (Strict)"
```

### 3.2 Tạo SSL Certificate (Let's Encrypt)

```bash
# Cấp cert cho tất cả subdomains cùng lúc
sudo certbot --nginx \
    -d bachbarber.vn \
    -d www.bachbarber.vn \
    -d api.bachbarber.vn \
    -d auth.bachbarber.vn

# Nhập email khi được hỏi
# Đồng ý terms of service

# Certbot tự động:
# 1. Verify domain ownership (tạo file trong /var/www/html/.well-known/)
# 2. Cấp cert và lưu vào /etc/letsencrypt/live/bachbarber.vn/
# 3. Tự động sửa config Nginx để dùng SSL
```

**Tự động renew cert (30 ngày một lần):**

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot đã tự thêm cron job, kiểm tra:
sudo cat /etc/cron.d/certbot
# 0 */12 * * * root certbot renew --quiet

# Hoặc dùng systemd timer:
sudo systemctl status certbot.timer
```

### 3.3 Lý thuyết SSL/TLS cần nắm

```
TLS handshake (khi browser kết nối HTTPS):

1. Browser → Server: "Hello, tôi hỗ trợ TLS 1.2, 1.3. Cipher suites: ..."
2. Server → Browser: Certificate (chứa public key) + "Tôi chọn TLS 1.3"
3. Browser verify certificate:
   - Certificate được ký bởi Let's Encrypt (CA)
   - CA cert trong trusted store của OS/Browser
   - CN/SAN match với domain đang truy cập
   - Certificate chưa hết hạn
4. Browser tạo session key bằng public key của server
5. Từ đây: Mọi data đều mã hóa

Let's Encrypt certificates:
  - Miễn phí
  - Hết hạn sau 90 ngày (phải renew)
  - Trusted bởi mọi browser hiện đại
  - DV (Domain Validation) — xác minh chủ domain

Phân loại SSL:
  DV (Domain Validation):    Xác minh bạn sở hữu domain → Miễn phí (Let's Encrypt)
  OV (Organization Val.):    Xác minh tổ chức → ~$50-200/năm
  EV (Extended Validation):  Xác minh nghiêm ngặt → Green bar → ~$200-500/năm
  → DV là đủ cho BookingSalon (e-commerce nhỏ)
```

---

## Giai đoạn 4 — Cấu hình Nginx Reverse Proxy

### 4.1 Nginx là gì và tại sao cần?

```
Nginx đóng vai trò là "cổng vào" duy nhất của server:

                        INTERNET
                           │ HTTPS:443
                    ┌──────▼──────┐
                    │    NGINX    │
                    │  (Port 443) │
                    └──┬──────┬──┘
          ┌────────────▼──┐ ┌─▼──────────────────┐
          │ /              │ │ /api/*              │
          │ Static Files  │ │ Spring Boot :8080   │
          └───────────────┘ └─────────────────────┘

Nginx làm:
  1. SSL Termination: Nhận HTTPS từ ngoài, forward HTTP nội bộ
  2. Static file serving: Phục vụ React build files (nhanh hơn nhiều so với Java)
  3. Reverse proxy: Forward /api/* đến Spring Boot
  4. Load balancing: Nếu có nhiều instance backend
  5. Gzip compression: Giảm bandwidth
  6. Rate limiting: Bảo vệ backend
  7. Caching headers: Cache static assets
```

### 4.2 Cấu hình Nginx cho BookingSalon

```bash
# Tạo file config
sudo nano /etc/nginx/sites-available/bachbarber
```

```nginx
# /etc/nginx/sites-available/bachbarber

# ─── Redirect HTTP → HTTPS ──────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name bachbarber.vn www.bachbarber.vn api.bachbarber.vn auth.bachbarber.vn;
    
    # Let's Encrypt verification path
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect tất cả HTTP → HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# ─── Frontend (React SPA) ────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bachbarber.vn www.bachbarber.vn;

    ssl_certificate     /etc/letsencrypt/live/bachbarber.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bachbarber.vn/privkey.pem;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # HSTS (bắt buộc dùng HTTPS trong 1 năm)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Root của React build
    root /var/www/bachbarber/frontend;
    index index.html;
    
    # Gzip compression cho static files
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    
    # Cache headers cho static assets (JS, CSS có hash trong tên)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # React Router — mọi path đều phục vụ index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# ─── Backend API (Spring Boot BFF) ──────────────────────────────────────────
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.bachbarber.vn;
    
    ssl_certificate     /etc/letsencrypt/live/bachbarber.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bachbarber.vn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Rate limiting: 20 request/giây per IP
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
    limit_req zone=api_limit burst=50 nodelay;
    
    # Auth endpoints: giới hạn chặt hơn (chống brute force)
    location /api/auth/login {
        limit_req zone=api_limit burst=5 nodelay;
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket endpoints
    location /ws/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
    
    # All other API routes
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Tăng timeout cho upload (Cloudinary)
        client_max_body_size 110M;
    }
}

# ─── Keycloak IAM ───────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name auth.bachbarber.vn;
    
    ssl_certificate     /etc/letsencrypt/live/bachbarber.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bachbarber.vn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Keycloak cần biết nó đứng sau proxy
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 443;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
```

```bash
# Kích hoạt config
sudo ln -s /etc/nginx/sites-available/bachbarber /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # Xóa config mặc định

# Test config
sudo nginx -t
# Kết quả: nginx: configuration file /etc/nginx/nginx.conf test is successful

# Reload
sudo systemctl reload nginx
```

---

## Giai đoạn 5 — Deploy Keycloak

### 5.1 Lý thuyết Keycloak trong production

```
Development:                   Production:
  Keycloak standalone mode       Keycloak + PostgreSQL/MySQL (production DB)
  H2 in-memory database          Keycloak đứng sau reverse proxy (Nginx)
  Port 8080 trực tiếp            KC_HOSTNAME = auth.bachbarber.vn
  HTTP                           HTTPS
```

### 5.2 Cài Keycloak với MySQL backend

```bash
# Tải Keycloak (cùng version với development: 26.x)
KEYCLOAK_VERSION=26.0.5
wget https://github.com/keycloak/keycloak/releases/download/${KEYCLOAK_VERSION}/keycloak-${KEYCLOAK_VERSION}.tar.gz
sudo tar -xzf keycloak-${KEYCLOAK_VERSION}.tar.gz -C /opt
sudo ln -s /opt/keycloak-${KEYCLOAK_VERSION} /opt/keycloak

# Tạo user hệ thống cho Keycloak (không chạy bằng root)
sudo groupadd keycloak
sudo useradd -r -g keycloak -d /opt/keycloak -s /sbin/nologin keycloak
sudo chown -R keycloak:keycloak /opt/keycloak
sudo chmod o+x /opt/keycloak/bin/
```

### 5.3 Tạo database cho Keycloak

```sql
-- Đăng nhập MySQL
mysql -u root -p

CREATE DATABASE keycloakdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'keycloak'@'localhost' IDENTIFIED BY 'Keycloak@StrongPass123!';
GRANT ALL PRIVILEGES ON keycloakdb.* TO 'keycloak'@'localhost';
FLUSH PRIVILEGES;
```

### 5.4 Cấu hình Keycloak production

```bash
sudo nano /opt/keycloak/conf/keycloak.conf
```

```properties
# /opt/keycloak/conf/keycloak.conf

# Database
db=mysql
db-url=jdbc:mysql://localhost:3306/keycloakdb?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh
db-username=keycloak
db-password=Keycloak@StrongPass123!
db-url-database=keycloakdb

# HTTP/HTTPS (Keycloak chạy HTTP nội bộ, Nginx xử lý HTTPS bên ngoài)
http-enabled=true
http-port=8081
https-enabled=false

# Hostname (quan trọng: đây là URL public mà Keycloak sẽ dùng)
hostname=https://auth.bachbarber.vn
hostname-backchannel-dynamic=true

# Proxy (Nginx ở phía trước)
proxy-headers=forwarded
# Hoặc nếu dùng X-Forwarded-*:
# proxy-headers=xforwarded

# Admin console
http-relative-path=/

# Logging
log-level=INFO
log=console,file
log-file=/var/log/keycloak/keycloak.log
```

### 5.5 Tạo systemd service cho Keycloak

```bash
sudo nano /etc/systemd/system/keycloak.service
```

```ini
[Unit]
Description=Keycloak Identity Provider
After=network.target mysql.service
Requires=mysql.service

[Service]
User=keycloak
Group=keycloak
WorkingDirectory=/opt/keycloak
Environment=JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
Environment=KC_HOME=/opt/keycloak
EnvironmentFile=/etc/keycloak/keycloak.env

ExecStart=/opt/keycloak/bin/kc.sh start
ExecStop=/bin/kill -TERM $MAINPID

Restart=always
RestartSec=10
TimeoutStartSec=120
TimeoutStopSec=30

StandardOutput=journal
StandardError=journal
SyslogIdentifier=keycloak

[Install]
WantedBy=multi-user.target
```

```bash
# Tạo file environment cho Keycloak admin password
sudo mkdir -p /etc/keycloak
sudo nano /etc/keycloak/keycloak.env
```

```bash
# /etc/keycloak/keycloak.env
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=VeryStrongAdminPassword123!
```

```bash
sudo chmod 600 /etc/keycloak/keycloak.env
sudo chown root:root /etc/keycloak/keycloak.env

# Build Keycloak (cần làm lần đầu)
sudo -u keycloak /opt/keycloak/bin/kc.sh build --db=mysql

# Enable và start service
sudo systemctl daemon-reload
sudo systemctl enable keycloak
sudo systemctl start keycloak

# Kiểm tra logs
sudo journalctl -u keycloak -f
```

### 5.6 Cấu hình lại Keycloak Realm cho production

```
Sau khi Keycloak chạy tại https://auth.bachbarber.vn:
1. Đăng nhập admin: https://auth.bachbarber.vn/admin
2. Chọn realm: booking-salon-realm
3. Cập nhật Frontend URL:
   Realm Settings → General → Frontend URL: https://auth.bachbarber.vn
4. Cập nhật Valid Redirect URIs của client booking-salon-client:
   Clients → booking-salon-client → Valid Redirect URIs
   Thêm: https://bachbarber.vn/oauth2/callback
   Xóa: http://localhost:5173/*
5. Web Origins:
   Thêm: https://bachbarber.vn
   Xóa: http://localhost:5173
6. Regenerate client secrets (quan trọng!)
7. Cập nhật Google IDP redirect URI tại Google Cloud Console:
   https://auth.bachbarber.vn/realms/booking-salon-realm/broker/google/endpoint
```

---

## Giai đoạn 6 — Deploy MySQL và Redis

### 6.1 Cài MySQL 8

```bash
sudo apt install -y mysql-server-8.0

# Secure installation (đặt root password, remove test DB...)
sudo mysql_secure_installation

# Tạo database và user cho ứng dụng (xem chi tiết tại DB_Migration_And_NonRoot_User_Guide.md)
sudo mysql -u root -p << 'EOF'
CREATE DATABASE bookingsalondb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'bookingsalon_app'@'localhost' IDENTIFIED BY 'App@StrongPass2024!';
GRANT SELECT, INSERT, UPDATE, DELETE ON bookingsalondb.* TO 'bookingsalon_app'@'localhost';

CREATE USER 'bookingsalon_migrate'@'localhost' IDENTIFIED BY 'Migrate@StrongPass2024!';
GRANT ALL PRIVILEGES ON bookingsalondb.* TO 'bookingsalon_migrate'@'localhost';

FLUSH PRIVILEGES;
EOF
```

**Cấu hình MySQL cho production:**

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
# Binding — chỉ lắng nghe localhost, không expose ra ngoài
bind-address = 127.0.0.1

# Performance
innodb_buffer_pool_size = 512M   # 25-50% RAM cho MySQL
max_connections = 100
wait_timeout = 600
interactive_timeout = 600

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2              # Log query chậm hơn 2 giây

# Timezone
default-time-zone = '+07:00'
```

```bash
sudo systemctl restart mysql

# Import dữ liệu ban đầu từ initData.md (chạy SQL)
# Hoặc để Flyway migration tự chạy khi backend start
```

### 6.2 Cài và cấu hình Redis

```bash
sudo apt install -y redis-server

# Cấu hình Redis
sudo nano /etc/redis/redis.conf
```

```conf
# Binding — chỉ localhost
bind 127.0.0.1 ::1

# Password bắt buộc trong production
requirepass YourRedisStrongPassword123!

# Lưu dữ liệu vào disk (persistence)
save 900 1      # Sau 900s nếu có 1 key thay đổi
save 300 10     # Sau 300s nếu có 10 key thay đổi
save 60 10000   # Sau 60s nếu có 10000 key thay đổi

# Memory limit
maxmemory 256mb
maxmemory-policy allkeys-lru    # Xóa key ít dùng nhất khi hết memory

# Log level
loglevel notice
logfile /var/log/redis/redis-server.log
```

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli -a YourRedisStrongPassword123! ping
# PONG
```

---

## Giai đoạn 7 — Build và Deploy Backend

### 7.1 Cấu trúc thư mục production

```bash
sudo mkdir -p /opt/bookingsalon
sudo mkdir -p /opt/bookingsalon/logs
sudo mkdir -p /opt/bookingsalon/config

# Tạo user hệ thống cho app (không dùng root để chạy app)
sudo useradd -r -s /bin/false -d /opt/bookingsalon bookingsalon
sudo chown -R bookingsalon:bookingsalon /opt/bookingsalon
```

### 7.2 Tạo file environment production (QUAN TRỌNG)

```bash
sudo nano /opt/bookingsalon/config/production.env
sudo chmod 600 /opt/bookingsalon/config/production.env
sudo chown bookingsalon:bookingsalon /opt/bookingsalon/config/production.env
```

```bash
# /opt/bookingsalon/config/production.env
# ĐÂY LÀ FILE NHẠY CẢM — KHÔNG BAO GIỜ COMMIT VÀO GIT

# Database (user ứng dụng, không phải root)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bookingsalondb
DB_USERNAME=bookingsalon_app
DB_PASSWORD=App@StrongPass2024!
JPA_DDL_AUTO=validate

# Keycloak (server internal URL vs public URL)
KEYCLOAK_SERVER_URL=http://localhost:8081
KEYCLOAK_PUBLIC_URL=https://auth.bachbarber.vn
KEYCLOAK_REALM=booking-salon-realm
KEYCLOAK_CLIENT_ID=booking-salon-admin
KEYCLOAK_CLIENT_SECRET=<NEW_SECRET_SAU_KHI_ROTATE>
KEYCLOAK_FRONTEND_CLIENT_ID=booking-salon-client
KEYCLOAK_IDP_GOOGLE_ENABLED=true
KEYCLOAK_IDP_GOOGLE_CLIENT_ID=<GOOGLE_CLIENT_ID>
KEYCLOAK_IDP_GOOGLE_CLIENT_SECRET=<GOOGLE_CLIENT_SECRET_MỚI>

# Redis (với password)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YourRedisStrongPassword123!

# VNPay (production keys, không phải sandbox)
VNPAY_TMN_CODE=<PRODUCTION_TMN_CODE>
VNPAY_HASH_SECRET=<PRODUCTION_HASH_SECRET>
VNPAY_PAY_URL=https://pay.vnpay.vn/vpcpay.html
VNPAY_RETURN_URL=https://api.bachbarber.vn/api/v1/payments/webhooks/vnpay/callback
VNPAY_NOTIFY_URL=https://api.bachbarber.vn/api/v1/payments/webhook/vnpay

# SePay
SEPAY_MERCHANT_ID=<PRODUCTION_MERCHANT_ID>
SEPAY_SECRET_KEY=<PRODUCTION_SECRET_KEY>
SEPAY_API_BASE_URL=https://pgapi.sepay.vn
SEPAY_WEBHOOK_API_KEY=<PRODUCTION_WEBHOOK_KEY>
SEPAY_ENV=production

# Bank Transfer
PAYMENT_BANK_BIN=<BANK_BIN>
PAYMENT_BANK_ACCOUNT=<BANK_ACCOUNT>
PAYMENT_WEBHOOK_SECRET=<STRONG_RANDOM_SECRET>
PAYMENT_EXPIRE_MINUTES=15

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<PRODUCTION_EMAIL>
MAIL_PASSWORD=<NEW_APP_PASSWORD>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<CLOUD_NAME>
CLOUDINARY_API_KEY=<API_KEY_MỚI>
CLOUDINARY_API_SECRET=<API_SECRET_MỚI>

# CORS (production domains)
CORS_ALLOWED_ORIGINS=https://bachbarber.vn,https://www.bachbarber.vn
FRONTEND_URL=https://bachbarber.vn
```

### 7.3 Build JAR từ source code

```bash
# Clone/copy source code lên server
# Cách 1: Clone từ Git (nếu đã remove .env khỏi git)
cd /home/deploy
git clone https://github.com/your-repo/BookingSalon.git

# Cách 2: Upload từ máy local
# scp -P 2222 -r ./BookingSalon deploy@IP_SERVER:/home/deploy/

# Build
cd /home/deploy/BookingSalon/backend
mvn clean package -DskipTests

# Kết quả: target/BookingSalon-0.0.1-SNAPSHOT.jar

# Copy JAR sang thư mục production
sudo cp target/BookingSalon-0.0.1-SNAPSHOT.jar /opt/bookingsalon/app.jar
sudo chown bookingsalon:bookingsalon /opt/bookingsalon/app.jar
```

### 7.4 Tạo systemd service cho Backend

```bash
sudo nano /etc/systemd/system/bookingsalon.service
```

```ini
[Unit]
Description=BookingSalon Spring Boot Application
After=network.target mysql.service redis-server.service keycloak.service
Requires=mysql.service redis-server.service

[Service]
User=bookingsalon
Group=bookingsalon
WorkingDirectory=/opt/bookingsalon

# Load environment variables từ file (không hardcode trong service)
EnvironmentFile=/opt/bookingsalon/config/production.env

# JVM options tối ưu cho production
Environment=JAVA_OPTS=-Xmx1g -Xms512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200

ExecStart=/usr/lib/jvm/java-21-openjdk-amd64/bin/java \
    $JAVA_OPTS \
    -Dspring.profiles.active=production \
    -Dlogging.file.name=/opt/bookingsalon/logs/app.log \
    -jar /opt/bookingsalon/app.jar

# Graceful shutdown
ExecStop=/bin/kill -SIGTERM $MAINPID

# Tự động restart nếu crash
Restart=on-failure
RestartSec=15
StartLimitIntervalSec=60
StartLimitBurst=3

# Timeout
TimeoutStartSec=120
TimeoutStopSec=60

StandardOutput=journal
StandardError=journal
SyslogIdentifier=bookingsalon

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable bookingsalon
sudo systemctl start bookingsalon

# Theo dõi logs khi start
sudo journalctl -u bookingsalon -f

# Kiểm tra status
sudo systemctl status bookingsalon
```

---

## Giai đoạn 8 — Build và Deploy Frontend

### 8.1 Tạo environment variables cho production frontend

```bash
# Tại máy LOCAL (Windows) trước khi build
cd frontend

# Tạo file .env.production
```

```bash
# frontend/.env.production
VITE_API_URL=https://api.bachbarber.vn
VITE_WS_URL=wss://api.bachbarber.vn
VITE_KEYCLOAK_URL=https://auth.bachbarber.vn
VITE_KEYCLOAK_REALM=booking-salon-realm
VITE_KEYCLOAK_CLIENT_ID=booking-salon-client
```

### 8.2 Cập nhật frontend code để đọc từ env

**Tạo file config helper:**

```javascript
// frontend/src/config/api.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
export const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081';
export const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'booking-salon-realm';
export const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'booking-salon-client';
```

**Cập nhật `authProvider.jsx` thay vì hardcode:**

```javascript
// Thay vì:
const response = await fetch("http://localhost:8080/api/auth/login", ...)

// Dùng:
import { API_BASE_URL } from '../config/api';
const response = await fetch(`${API_BASE_URL}/api/auth/login`, ...)
```

### 8.3 Build React app

```bash
# Tại máy LOCAL
cd frontend

# Cài dependencies (nếu chưa có)
npm install

# Build cho production (tự động dùng .env.production)
npm run build

# Kết quả: thư mục dist/ chứa toàn bộ static files
```

**Vite config cần cập nhật cho production build:**

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Tách code thành chunks nhỏ hơn cho better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
        }
      }
    },
    // Cảnh báo nếu chunk quá lớn
    chunkSizeWarningLimit: 1000,
    // Source maps cho debugging (tắt nếu không muốn expose source)
    sourcemap: false,
  }
})
```

### 8.4 Upload và deploy frontend

```bash
# Từ máy LOCAL — Upload dist/ lên server
scp -P 2222 -r frontend/dist/* deploy@IP_SERVER:/tmp/frontend-build/

# Trên SERVER
sudo mkdir -p /var/www/bachbarber/frontend
sudo cp -r /tmp/frontend-build/* /var/www/bachbarber/frontend/
sudo chown -R www-data:www-data /var/www/bachbarber/
sudo chmod -R 755 /var/www/bachbarber/

# Kiểm tra
ls /var/www/bachbarber/frontend/
# Phải thấy: index.html, assets/

# Reload Nginx
sudo systemctl reload nginx
```

---

## Giai đoạn 9 — Cập nhật cấu hình cho Production

### 9.1 Tạo application-production.properties

```bash
# Tạo file config production (override application.properties)
sudo nano /opt/bookingsalon/config/application-production.properties
```

```properties
# /opt/bookingsalon/config/application-production.properties
# OVERRIDE các giá trị từ application.properties

# Tắt show-sql trong production
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# Tắt Swagger UI (lộ API specification)
springdoc.swagger-ui.enabled=false
springdoc.api-docs.enabled=false

# Session Cookie — Strict production settings
server.servlet.session.cookie.secure=true
server.servlet.session.cookie.same-site=strict
server.servlet.session.cookie.name=BSSID
server.servlet.session.cookie.max-age=8h
server.servlet.session.timeout=8h

# Logging — chỉ INFO và ERROR trong production
logging.level.root=WARN
logging.level.demo.bookingsalon=INFO
logging.level.org.springframework=WARN
logging.level.demo.bookingsalon.payment=INFO

# Flyway — strict validation
spring.flyway.validate-on-migrate=true
spring.flyway.out-of-order=false

# Actuator (monitoring)
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=when-authorized
management.server.port=8090
management.server.address=127.0.0.1  # Chỉ localhost, không expose ra ngoài

# Server settings
server.port=8080
server.tomcat.max-threads=200
server.tomcat.min-spare-threads=20

# Force HTTPS
server.forward-headers-strategy=native
```

```bash
# Copy file config
sudo cp /opt/bookingsalon/config/application-production.properties \
    /opt/bookingsalon/application-production.properties
```

**Cập nhật ExecStart trong systemd để load config file:**

```bash
ExecStart=/usr/lib/jvm/java-21-openjdk-amd64/bin/java \
    $JAVA_OPTS \
    -Dspring.profiles.active=production \
    -Dspring.config.additional-location=/opt/bookingsalon/config/ \
    -Dlogging.file.name=/opt/bookingsalon/logs/app.log \
    -jar /opt/bookingsalon/app.jar
```

### 9.2 Cập nhật URLs trong Keycloak Realm

```
Admin Console: https://auth.bachbarber.vn/admin

1. Realm Settings:
   Frontend URL: https://auth.bachbarber.vn
   
2. Client: booking-salon-client
   Root URL: https://bachbarber.vn
   Valid Redirect URIs: https://bachbarber.vn/oauth2/callback
   Web Origins: https://bachbarber.vn
   
3. Client: booking-salon-admin
   Regenerate secret → Cập nhật KEYCLOAK_CLIENT_SECRET

4. Identity Providers → Google → Update redirect URI
   tại Google Cloud Console:
   Authorized redirect URIs thêm:
   https://auth.bachbarber.vn/realms/booking-salon-realm/broker/google/endpoint
```

---

## Giai đoạn 10 — Kiểm tra và Smoke Test

### 10.1 Checklist kiểm tra từng service

```bash
# Kiểm tra tất cả services đang chạy
sudo systemctl status nginx mysql redis-server keycloak bookingsalon

# Test từng service
curl -I https://bachbarber.vn                  # Frontend
curl -I https://api.bachbarber.vn/api/salons   # Backend public API
curl -I https://auth.bachbarber.vn/health/live # Keycloak health
```

### 10.2 Test Authentication Flow

```bash
# Test login API
curl -X POST https://api.bachbarber.vn/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","password":"testpass"}' \
    -c /tmp/cookies.txt \
    -v

# Kiểm tra response header có Set-Cookie: BSSID không
# Kiểm tra cookie có HttpOnly; Secure; SameSite=Strict không

# Test API với cookie
curl https://api.bachbarber.vn/api/auth/me \
    -b /tmp/cookies.txt \
    -v
```

### 10.3 Test SSL

```bash
# Test SSL grade tại: https://www.ssllabs.com/ssltest/
# Nhập: api.bachbarber.vn
# Mục tiêu: Grade A hoặc A+

# Hoặc dùng command line
nmap --script ssl-enum-ciphers -p 443 api.bachbarber.vn
```

### 10.4 Test WebSocket

```javascript
// Chạy trong browser console
const ws = new WebSocket('wss://api.bachbarber.vn/ws/notifications?userId=xxx');
ws.onopen = () => console.log('WSS connected!');
ws.onerror = (e) => console.error('WSS error:', e);
```

### 10.5 Test Payment Webhook (VNPay/SePay)

```
VNPay: Cấu hình notify URL = https://api.bachbarber.vn/api/v1/payments/webhook/vnpay
SePay: Webhook URL = https://api.bachbarber.vn/api/payments/webhook/sepay

Các URL này phải accessible từ ngoài internet (VNPay/SePay server gọi đến)
Test bằng: https://webhook.site để capture webhook test
```

---

## Giai đoạn 11 — Monitoring và Logging

### 11.1 Log Management

```bash
# Xem log backend real-time
tail -f /opt/bookingsalon/logs/app.log

# Xem log systemd
journalctl -u bookingsalon -n 100 --no-pager

# Log rotation (tự động xóa log cũ)
sudo nano /etc/logrotate.d/bookingsalon
```

```
/opt/bookingsalon/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    postrotate
        systemctl kill -s USR1 bookingsalon.service
    endscript
}
```

### 11.2 Cài đặt monitoring cơ bản với Uptime Kuma

**Uptime Kuma** — Free, self-hosted monitoring, dễ cài:

```bash
# Cài Node.js đã có sẵn
npm install -g pm2
npx uptime-kuma

# Hoặc dùng Docker (nếu đã cài Docker)
docker run -d \
    --name uptime-kuma \
    -p 3001:3001 \
    -v uptime-kuma:/app/data \
    --restart unless-stopped \
    louislam/uptime-kuma:1
```

**Thêm monitors:**
```
Monitor 1: https://bachbarber.vn           → Frontend up/down
Monitor 2: https://api.bachbarber.vn/actuator/health → Backend health
Monitor 3: https://auth.bachbarber.vn/health/live    → Keycloak health
Monitor 4: TCP 127.0.0.1:3306             → MySQL
Monitor 5: TCP 127.0.0.1:6379             → Redis
```

**Alert qua email/Telegram khi service down.**

### 11.3 Spring Boot Actuator Health Endpoint

```bash
# Kiểm tra health (chỉ localhost)
curl http://127.0.0.1:8090/actuator/health

# Response mong muốn:
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "redis": { "status": "UP" },
    "diskSpace": { "status": "UP" }
  }
}
```

### 11.4 Disk và Memory monitoring

```bash
# Script kiểm tra sức khỏe server — chạy mỗi ngày
cat > /opt/bookingsalon/health-check.sh << 'EOF'
#!/bin/bash
echo "=== Server Health Check $(date) ==="
echo "--- Disk Usage ---"
df -h /
echo "--- Memory ---"
free -h
echo "--- Services ---"
systemctl is-active nginx mysql redis-server keycloak bookingsalon
echo "--- App Log (last 20 errors) ---"
grep -i "ERROR" /opt/bookingsalon/logs/app.log | tail -20
EOF

chmod +x /opt/bookingsalon/health-check.sh

# Thêm vào cron: Chạy mỗi ngày 8 giờ sáng
crontab -e
# Thêm: 0 8 * * * /opt/bookingsalon/health-check.sh >> /opt/bookingsalon/logs/health.log 2>&1
```

---

## Quy trình cập nhật (Re-deploy)

### Script deploy tự động

```bash
# /opt/bookingsalon/deploy.sh
#!/bin/bash
set -e  # Dừng nếu có lỗi

echo "🚀 Starting deployment $(date)"

# 1. Pull code mới
cd /home/deploy/BookingSalon
git pull origin main

# 2. Build backend
echo "📦 Building backend..."
cd backend
mvn clean package -DskipTests -q
echo "✅ Build successful"

# 3. Copy JAR
sudo cp target/BookingSalon-0.0.1-SNAPSHOT.jar /opt/bookingsalon/app-new.jar

# 4. Graceful shutdown (Spring Boot shutdown hook)
echo "⏳ Stopping current application..."
sudo systemctl stop bookingsalon
sleep 5

# 5. Swap JAR
sudo mv /opt/bookingsalon/app.jar /opt/bookingsalon/app-backup.jar
sudo mv /opt/bookingsalon/app-new.jar /opt/bookingsalon/app.jar
sudo chown bookingsalon:bookingsalon /opt/bookingsalon/app.jar

# 6. Start new version
echo "▶️  Starting new version..."
sudo systemctl start bookingsalon

# 7. Wait và kiểm tra health
echo "⏳ Waiting for application to start (60s)..."
sleep 60

HEALTH=$(curl -s http://127.0.0.1:8090/actuator/health | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
if [ "$HEALTH" = "UP" ]; then
    echo "✅ Deployment successful! Application is UP"
else
    echo "❌ Health check failed! Rolling back..."
    sudo systemctl stop bookingsalon
    sudo mv /opt/bookingsalon/app.jar /opt/bookingsalon/app-failed.jar
    sudo mv /opt/bookingsalon/app-backup.jar /opt/bookingsalon/app.jar
    sudo systemctl start bookingsalon
    echo "🔄 Rolled back to previous version"
    exit 1
fi

# 8. Build và deploy frontend
echo "📦 Building frontend..."
cd /home/deploy/BookingSalon/frontend
npm run build

sudo cp -r dist/* /var/www/bachbarber/frontend/
sudo chown -R www-data:www-data /var/www/bachbarber/
sudo systemctl reload nginx

echo "🎉 Deployment completed successfully!"
```

```bash
chmod +x /opt/bookingsalon/deploy.sh
```

---

## Xử lý sự cố thường gặp

### Backend không start

```bash
# Xem log chi tiết
journalctl -u bookingsalon -n 100 --no-pager

# Lỗi thường gặp:
# 1. "Connection refused" đến MySQL → MySQL chưa chạy hoặc sai credentials
# 2. "Connection refused" đến Redis → Redis chưa chạy hoặc sai password
# 3. "Unable to obtain issuer" → Keycloak chưa chạy hoặc sai URL
# 4. "Port 8080 already in use" → Kill process cũ: sudo fuser -k 8080/tcp
# 5. Flyway migration fail → Kiểm tra script migration
```

### CORS Error trên browser

```
Kiểm tra:
1. CORS_ALLOWED_ORIGINS phải khớp CHÍNH XÁC với origin của frontend
   (kể cả https:// và không có trailing slash)
2. Nginx forwarding đúng Host header chưa?
3. Spring Boot nhận đúng X-Forwarded-Proto không?
```

### Cookie không gửi (401 liên tục sau login)

```
Nguyên nhân phổ biến:
1. Cookie Secure=true nhưng gọi HTTP → Không gửi cookie
2. SameSite=Strict và frontend/backend khác site → Không gửi cookie
3. Frontend không dùng credentials: "include"
4. Nginx không forward đúng domain → JSESSIONID/BSSID mất
```

### WebSocket không kết nối

```
Kiểm tra Nginx config có đúng upgrade headers không:
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";

Và frontend dùng wss:// (không phải ws://) khi HTTPS
```

### Keycloak redirect loop

```
Nguyên nhân: Keycloak không biết đang đứng sau proxy
Giải pháp: Kiểm tra keycloak.conf
  hostname=https://auth.bachbarber.vn
  proxy-headers=forwarded (hoặc xforwarded)
  
Kiểm tra Nginx có gửi:
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-Host $host;
```

---

## Kiến thức bổ sung cần nắm

### Linux Command Line cơ bản

```bash
# File operations
ls -la          # Liệt kê files với permissions
chmod 755 file  # Đổi permissions (owner: rwx, group: r-x, other: r-x)
chown user:group file  # Đổi owner

# Process management
ps aux | grep java      # Tìm process Java
kill -9 PID             # Force kill process
lsof -i :8080           # Xem process đang dùng port 8080

# Disk và memory
df -h                   # Disk usage
free -h                 # Memory usage
du -sh /opt/bookingsalon # Size của thư mục

# Network
netstat -tulpn          # Xem ports đang mở
curl -I https://url     # Kiểm tra HTTP headers
```

### systemd cơ bản

```bash
sudo systemctl start service       # Start
sudo systemctl stop service        # Stop
sudo systemctl restart service     # Restart
sudo systemctl reload service      # Reload config (graceful)
sudo systemctl status service      # Xem trạng thái
sudo systemctl enable service      # Auto-start khi boot
sudo systemctl disable service     # Tắt auto-start
journalctl -u service -f           # Xem logs real-time
journalctl -u service --since "1 hour ago"  # Logs 1 giờ qua
```

### Docker (tùy chọn — không bắt buộc cho setup này)

Docker là cách phổ biến hơn để deploy, nhưng phức tạp hơn khi mới học. Có thể dùng sau khi đã thành thạo deploy trực tiếp:

```yaml
# docker-compose.yml (ví dụ, không dùng trong guide này)
services:
  backend:
    image: bookingsalon-backend:latest
    ports: ["8080:8080"]
    environment:
      - DB_HOST=mysql
  mysql:
    image: mysql:8.0
  redis:
    image: redis:7-alpine
  keycloak:
    image: quay.io/keycloak/keycloak:26.0.5
```

---

## Tóm tắt chi phí ước tính

| Hạng mục | Chi phí/tháng | Ghi chú |
|---------|--------------|---------|
| VPS 4GB RAM | ~$24 | DigitalOcean/Vultr |
| Domain .vn | ~$3 | Từ NIC.VN hoặc Namecheap |
| SSL Certificate | Miễn phí | Let's Encrypt |
| Cloudinary (Free tier) | $0 | 25GB storage, 25GB bandwidth |
| Gmail SMTP | $0 | App Password |
| VNPay | 0-1.1% per transaction | Theo hợp đồng |
| **Tổng tối thiểu** | **~$27/tháng** | |

---

*Tài liệu này bổ sung cho `BookingSalon_Production_Review.md` với quy trình deployment thực tế.*  
*Đọc thêm `CSRF_Auth_Security_Guide.md` để fix các security issues trước khi deploy.*  
*Đọc `DB_Migration_And_NonRoot_User_Guide.md` để setup database user đúng cách.*

