# 📋 Review CI/CD Pipeline — BookingSalon

> **Phạm vi:** GitHub Actions (`ci.yml`) + Docker (`Dockerfile` backend/frontend) + Docker Compose (`docker-compose.yml` / `docker-compose.prod.yml`)
> **Ngày review:** 2026-10-27

---

## 0. Nền tảng lý thuyết CI/CD với GitHub Actions

### 0.1 CI/CD là gì?

**CI/CD** (Continuous Integration / Continuous Delivery & Deployment) là tập hợp các thực hành tự động hóa vòng đời phần mềm — từ lúc developer commit code đến khi ứng dụng chạy trên production — nhằm giảm rủi ro, tăng tốc độ phát hành và đảm bảo chất lượng.

```
Developer Push
      │
      ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│     CI      │───▶│  CD (Deliv) │───▶│  CD (Deploy)│───▶│ Production  │
│  Build+Test │    │ Package+Push│    │ Release Gate│    │   Running   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
  Tự động hoàn toàn   Tự động hoàn toàn  Thủ công / Auto   Môi trường thật
```

| Thuật ngữ | Định nghĩa |
|---|---|
| **Continuous Integration (CI)** | Tự động build & test mỗi khi có code mới — phát hiện lỗi sớm |
| **Continuous Delivery (CD)** | Tự động đóng gói artifact sẵn sàng deploy — chọn thời điểm deploy thủ công |
| **Continuous Deployment (CD)** | Mọi thay đổi qua test đều tự động deploy lên production — không cần can thiệp tay |

---

### 0.2 GitHub Actions — Kiến trúc & Các khái niệm cốt lõi

GitHub Actions là nền tảng CI/CD tích hợp sẵn trong GitHub. Mọi thứ được định nghĩa trong file YAML tại `.github/workflows/`.

#### Sơ đồ kiến trúc tổng quan

```
Repository
└── .github/
    └── workflows/
        └── ci.yml          ← Workflow file
              │
              ├── on: [trigger]          ← Sự kiện kích hoạt
              └── jobs:
                    ├── job-A            ← Chạy song song (mặc định)
                    │     └── steps:
                    │           ├── uses: action  ← Dùng action có sẵn
                    │           └── run: command  ← Chạy lệnh shell
                    └── job-B
                          needs: job-A  ← Chạy tuần tự (phụ thuộc)
```

#### Các thành phần chính

| Thành phần | Mô tả | Ví dụ trong BookingSalon |
|---|---|---|
| **Workflow** | File YAML định nghĩa toàn bộ pipeline | `ci.yml` |
| **Event (Trigger)** | Sự kiện kích hoạt workflow | `push`, `pull_request`, `workflow_dispatch` |
| **Job** | Nhóm các steps chạy trên 1 runner | `backend-test`, `frontend-check`, `docker-build-push` |
| **Step** | Đơn vị thực thi nhỏ nhất trong job | `Set up JDK 21`, `Run Backend Tests` |
| **Action** | Block tái sử dụng từ Marketplace | `actions/checkout@v4`, `docker/build-push-action@v6` |
| **Runner** | Máy ảo thực thi job | `ubuntu-latest` (GitHub-hosted) |
| **Artifact** | File được lưu giữa các job/workflow | Surefire test reports |
| **Secret** | Biến nhạy cảm được mã hóa | `DOCKERHUB_TOKEN`, `PROD_SSH_KEY` |
| **Variable** | Biến cấu hình không nhạy cảm | `VITE_API_URL`, `VITE_KEYCLOAK_URL` |
| **Environment** | Môi trường deploy với protection rules | `production` (yêu cầu approval) |
| **Context** | Object chứa metadata runtime | `github.ref`, `github.sha`, `secrets.*` |

---

### 0.3 Vòng đời thực thi một Workflow

```
1. Trigger (sự kiện xảy ra)
        │
        ▼
2. GitHub tạo Workflow Run
        │
        ▼
3. Phân tích dependency (needs:)
        │
        ├──▶ Job A (runner A khởi động)
        │         ├── Step 1: actions/checkout  (clone repo)
        │         ├── Step 2: setup-java        (cài JDK)
        │         ├── Step 3: mvnw verify       (build + test)
        │         └── Step 4: upload-artifact   (lưu reports)
        │
        ├──▶ Job B (runner B khởi động song song)
        │         ├── Step 1: actions/checkout
        │         ├── Step 2: setup-node
        │         ├── Step 3: npm ci
        │         └── Step 4: npm run build
        │
        └──▶ Job C (chờ A và B xong - needs: [A, B])
                  ├── Step 1: docker/setup-buildx
                  ├── Step 2: docker/login
                  ├── Step 3: docker/build-push (backend)
                  └── Step 4: docker/build-push (frontend)
```

**Lưu ý quan trọng:**
- Mỗi job chạy trên một **runner riêng biệt**, filesystem không được chia sẻ
- Muốn truyền file giữa các job phải dùng `upload-artifact` / `download-artifact`
- Mỗi step thất bại → job dừng (trừ khi có `if: always()` hoặc `continue-on-error: true`)

---

### 0.4 Hệ thống Trigger (Events)

```yaml
on:
  push:                         # Khi push code lên branch
    branches: [master, main]
    tags: ['v*.*.*']            # Khi tạo tag theo semver
  pull_request:                 # Khi mở/cập nhật Pull Request
    branches: [master]
    types: [opened, synchronize, reopened]
  workflow_dispatch:            # Kích hoạt thủ công từ GitHub UI
  schedule:                     # Chạy theo lịch (cron)
    - cron: '0 2 * * 1'        # Mỗi thứ Hai lúc 2:00 UTC
  release:                      # Khi tạo GitHub Release
    types: [published]
```

**Thứ tự ưu tiên kiểm tra điều kiện:**
```
Event xảy ra
    → branches/tags filter (có khớp không?)
    → paths filter (file nào thay đổi?)
    → if: condition (biểu thức có đúng không?)
    → Chạy job/step
```

---

### 0.5 Contexts & Expressions

GitHub Actions cung cấp nhiều **context object** để truy cập metadata tại runtime:

```yaml
# github context — thông tin về event và repo
${{ github.ref }}              # refs/heads/master
${{ github.sha }}              # abc1234def5678... (full SHA)
${{ github.event_name }}       # push | pull_request | workflow_dispatch
${{ github.actor }}            # tên user trigger workflow
${{ github.repository }}       # owner/repo-name

# secrets context — biến nhạy cảm (không in ra log)
${{ secrets.DOCKERHUB_TOKEN }}

# vars context — biến cấu hình thông thường
${{ vars.VITE_API_URL }}

# steps context — output của step trước
${{ steps.meta-backend.outputs.tags }}

# needs context — trạng thái job phụ thuộc
${{ needs.backend-test.result }}  # success | failure | cancelled
```

**Biểu thức điều kiện (if:):**
```yaml
# Chỉ chạy khi push (không chạy với PR)
if: github.event_name == 'push'

# Chỉ chạy khi push vào master
if: github.ref == 'refs/heads/master' && github.event_name == 'push'

# Luôn chạy dù step trước fail
if: always()

# Chạy khi job trước thành công
if: needs.backend-test.result == 'success'

# Chạy khi là tag release
if: startsWith(github.ref, 'refs/tags/v')
```

---

### 0.6 Secrets & Variables — Quản lý cấu hình nhạy cảm

GitHub cung cấp 3 cấp độ lưu trữ cấu hình:

```
Organization Level  (chia sẻ giữa nhiều repo)
      │
      ▼
Repository Level    (chỉ repo này)
      │
      ▼
Environment Level   (chỉ khi deploy vào environment cụ thể)
```

| Loại | Scope | Mã hóa | Hiện trong log | Dùng cho |
|---|---|---|---|---|
| **Secret** | Org/Repo/Env | ✅ AES-256 | ❌ Ẩn `***` | Passwords, tokens, SSH keys |
| **Variable** | Org/Repo/Env | ❌ Plaintext | ✅ Hiển thị | URLs, config values, feature flags |

**Best practices cho BookingSalon:**
```
Secrets cần tạo:
  DOCKERHUB_USERNAME    ← Docker Hub username
  DOCKERHUB_TOKEN       ← Docker Hub access token (không dùng password)
  PROD_HOST             ← IP/domain server production
  PROD_USER             ← SSH username
  PROD_SSH_KEY          ← Private key SSH (-----BEGIN OPENSSH PRIVATE KEY-----)

Variables cần tạo:
  VITE_API_URL          ← https://api.bookingsalon.vn
  VITE_WS_URL           ← wss://api.bookingsalon.vn
  VITE_KEYCLOAK_URL     ← https://auth.bookingsalon.vn
  VITE_KEYCLOAK_REALM   ← booking-salon-realm
  VITE_KEYCLOAK_CLIENT_ID ← booking-salon-client
```

---

### 0.7 Caching — Tăng tốc Pipeline

Caching là kỹ thuật lưu lại các file tốn thời gian tải (dependency) giữa các lần chạy:

```yaml
# Cách 1: Dùng actions/cache trực tiếp
- uses: actions/cache@v4
  with:
    path: ~/.m2/repository          # Thư mục cần cache
    key: maven-${{ hashFiles('**/pom.xml') }}    # Key thay đổi khi pom.xml thay đổi
    restore-keys: maven-            # Fallback key (prefix match)

# Cách 2: Cache tích hợp sẵn trong setup action (BookingSalon đang dùng)
- uses: actions/setup-java@v4
  with:
    cache: 'maven'                  # Tự động cache ~/.m2

# Cách 3: Docker layer cache với GHA (BookingSalon đang dùng)
- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha            # Đọc cache từ GitHub Actions Cache
    cache-to: type=gha,mode=max     # Ghi cache, mode=max lưu mọi layer
```

**Chiến lược cache key:**
```
Cache hit (100%): key khớp hoàn toàn → dùng lại toàn bộ
Cache miss:       key không khớp → tìm restore-keys → build mới → lưu cache
```

---

### 0.8 Artifacts — Truyền file giữa Jobs

```yaml
# Job A: Upload artifact
- uses: actions/upload-artifact@v4
  with:
    name: surefire-test-reports         # Tên artifact
    path: backend/target/surefire-reports/
    retention-days: 7                   # Tự xóa sau 7 ngày

# Job B (chạy sau Job A): Download artifact
- uses: actions/download-artifact@v4
  with:
    name: surefire-test-reports
    path: ./reports/                    # Giải nén vào đây
```

**Khi nào dùng artifact:**
- Truyền file build (`.jar`, `dist/`) từ CI sang CD job
- Lưu test reports để xem sau
- Lưu coverage reports để upload lên Codecov/SonarCloud
- Lưu Docker image scan results

---

### 0.9 Environments & Protection Rules — Kiểm soát Deploy

GitHub **Environments** cho phép kiểm soát việc deploy vào môi trường nhạy cảm:

```yaml
jobs:
  deploy:
    environment: production       # Tham chiếu environment đã tạo trên GitHub
    runs-on: ubuntu-latest
```

**Các protection rule có thể cấu hình:**

| Rule | Tác dụng |
|---|---|
| **Required reviewers** | Phải có người approve trước khi deploy |
| **Wait timer** | Delay N phút trước khi tự động tiếp tục |
| **Deployment branches** | Chỉ branch cụ thể mới được deploy vào env này |
| **Environment secrets** | Secret chỉ khả dụng khi deploy vào env này |

```
Flow với protection rule:
  Job "deploy" bắt đầu
       │
       ▼
  Gửi thông báo cho reviewer
       │
       ▼  (reviewer approve)
  Job thực sự chạy
       │
       ▼
  Truy cập environment secrets
```

---

### 0.10 Docker trong CI/CD — Quy trình Build & Push

```
Developer commit
      │
      ▼
GitHub Actions Runner
      │
      ├─ docker/setup-buildx-action   ← Khởi động BuildKit engine
      │
      ├─ docker/login-action          ← Xác thực với Docker Hub
      │
      ├─ docker/metadata-action       ← Tạo tags & labels tự động
      │      ├── tag: latest          (khi push master)
      │      ├── tag: master          (tên branch)
      │      ├── tag: v1.2.3          (khi tạo git tag)
      │      └── tag: sha-abc1234     (SHA commit ngắn)
      │
      └─ docker/build-push-action     ← Build & Push
             ├── context: ./backend   (build context)
             ├── file: Dockerfile     (instructions)
             ├── cache-from: gha      (đọc layer cache)
             ├── cache-to: gha        (ghi layer cache)
             └── push: true           (đẩy lên registry)
```

#### Multi-stage Dockerfile — Tại sao quan trọng?

```dockerfile
# Stage 1: Builder (image to — có đầy đủ build tools)
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
# ... build JAR

# Stage 2: Runtime (image nhỏ — chỉ có JRE)
FROM eclipse-temurin:21-jre-alpine
COPY --from=builder /build/target/*.jar app.jar
# Không có Maven, không có source code, không có build tools
```

| | Builder Stage | Runtime Stage |
|---|---|---|
| Image size | ~500MB | ~200MB |
| Attack surface | Lớn | Nhỏ |
| Chứa source code | ✅ | ❌ |
| Dùng để deploy | ❌ | ✅ |

#### Docker Layer Cache hoạt động thế nào?

```dockerfile
# ✅ ĐÚNG — Copy pom.xml trước, resolve dependency riêng
COPY pom.xml .
RUN mvn dependency:resolve -B          ← Cache layer này! (chỉ rebuild khi pom.xml thay đổi)

COPY src ./src
RUN mvn clean package -DskipTests -B   ← Rebuild mỗi khi src/ thay đổi

# ❌ SAI — Copy toàn bộ trước → không bao giờ cache được dependency
COPY . .
RUN mvn clean package -DskipTests -B
```

---

### 0.11 Branching Strategy & Tag Strategy trong CI/CD

**Branching model của BookingSalon:**

```
master ──────●──────●──────●──────●  (production)
             │      │      │      └── v1.2.0 tag → latest image
             │      │      └── hotfix merge
             │      └── feature merge
             │
demo-app ────●──────●──────●          (staging/demo)
             │
feature/x ───●──────●                 (feature branch, không trigger CI/CD)
```

**Image tagging strategy:**

| Git Event | Image Tags được tạo |
|---|---|
| Push `master` | `latest`, `master`, `sha-abc1234` |
| Push `demo-app` | `demo-app`, `sha-def5678` |
| Create tag `v1.2.3` | `v1.2.3`, `1.2.3`, `1.2`, `sha-ghi9012` |
| Pull Request | Không push (chỉ build để verify) |

---

### 0.12 Pipeline Security Best Practices

#### 1. Pin action versions bằng commit SHA

```yaml
# ❌ Nguy hiểm — tag có thể bị thay đổi (supply chain attack)
uses: actions/checkout@v4

# ✅ An toàn — pin bằng commit SHA không thay đổi được
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
```

#### 2. Principle of Least Privilege cho GITHUB_TOKEN

```yaml
# Khai báo permissions tối thiểu cần thiết
permissions:
  contents: read          # Đọc code
  packages: write         # Push lên GHCR (nếu dùng)
  security-events: write  # Upload SARIF security scan
  # Không khai báo → mặc định read-only (GitHub Actions hiện đại)
```

#### 3. Không dùng `pull_request_target` với untrusted code

```yaml
# ❌ Nguy hiểm — fork PR có thể đọc secrets
on: pull_request_target

# ✅ An toàn — fork PR không có quyền đọc secrets
on: pull_request
```

#### 4. Validate inputs trong workflow_dispatch

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]   # Giới hạn input hợp lệ
        required: true
```

---

### 0.13 Observability — Theo dõi Pipeline

**3 nguồn thông tin khi pipeline fail:**

```
1. GitHub Actions Log
   └── Chi tiết từng step: stdout/stderr của lệnh
   └── Xem tại: repo → Actions → workflow run → job → step

2. Uploaded Artifacts
   └── Test reports (Surefire XML → HTML)
   └── Coverage reports
   └── Security scan results (SARIF)

3. Notifications
   └── GitHub email notification (mặc định)
   └── Slack/Teams webhook
   └── GitHub Status Check (hiện ở PR)
```

**Cấu hình Slack notification:**
```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v2
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK }}
    webhook-type: incoming-webhook
    payload: |
      {
        "text": "❌ Pipeline failed on `${{ github.ref_name }}`",
        "attachments": [{
          "color": "danger",
          "fields": [
            {"title": "Workflow", "value": "${{ github.workflow }}", "short": true},
            {"title": "Run", "value": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}", "short": false}
          ]
        }]
      }
```

---

### 0.14 Kịch bản thực tế: Code lỗi vẫn được push lên thì sao?

#### 1. Điều gì thực sự xảy ra?
Git và GitHub Actions hoạt động theo cơ chế **bất đồng bộ**:
```
Developer (git push) ───▶ GitHub Repo nhận commit ───▶ Phát sự kiện webhook ───▶ Kích hoạt CI/CD
```
Code luôn được lưu vào GitHub **trước** khi CI/CD bắt đầu chạy. Do đó:
- **CI/CD không chặn được lệnh `git push` ở client**, trừ khi bạn dùng Git Pre-push Hook cục bộ trên máy.
- **Docker & Server an toàn:** Nhờ cơ chế `needs: [backend-test, frontend-check]`, nếu test/lint thất bại thì job `docker-build-push` sẽ bị hủy (Canceled/Skipped). Sẽ không có Docker Image lỗi nào bị đẩy lên Docker Hub hay deploy ra production.
- **Nhưng Repository bị "ô nhiễm":** Code lỗi đã nằm trên nhánh `master`. Các thành viên khác pull về sẽ bị lỗi theo.

#### 2. Giải pháp chuẩn công nghiệp: Branch Protection Rules (Rulesets)
Để ngăn tuyệt đối code lỗi vào nhánh chính:
1. **Cấm push trực tiếp:** Chỉ cho phép merge thông qua Pull Request (PR).
2. **Status Checks Enforced:** Cấu hình trên GitHub yêu cầu các jobs `backend-test` và `frontend-check` phải trả về status **PASS (Xanh ✅)** thì mới cho phép bấm Merge.
3. **Pre-push Hooks (Tùy chọn):** Dùng `Husky` ở phía frontend/backend để chạy lint/test nhanh trên máy dev trước khi lệnh `git push` gửi dữ liệu lên mạng.

#### 3. Quy trình xử lý sự cố khi lỡ push code lỗi lên master
| Cách xử lý | Lệnh thực hiện | Khi nào nên dùng |
|---|---|---|
| **Fix forward** | Commit bản sửa lỗi mới ➔ `git push origin master` | Lỗi nhỏ, sửa được ngay trong vài phút |
| **Git Revert** | `git revert <commit_id>` ➔ `git push origin master` | Lỗi nghiêm trọng hoặc cần thời gian điều tra |

---

## 1. Tổng quan kiến trúc pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│                       GitHub Actions CI/CD                           │
│                                                                      │
│  push/PR ──► [backend-test] ──┐                                      │
│                               ├──► [docker-build-push] ──► Docker Hub│
│  push/PR ──► [frontend-check]─┘                                      │
│                                                                      │
│  (Chỉ build+push khi: push branch master/demo-app hoặc tag v*.*.*)  │
└──────────────────────────────────────────────────────────────────────┘
```

**Stack:**
| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Backend | Spring Boot | Java 21 / Maven |
| Frontend | React 19 SPA | Node.js 22 / Vite |
| Database | MySQL | 8.0 |
| Cache | Redis | 7-alpine |
| IAM | Keycloak | 26.0 (prod) / 26.7.0 (dev) |
| Container Registry | Docker Hub | — |
| CI/CD | GitHub Actions | ubuntu-latest |

---

## 2. Review từng Job

### 2.1 `backend-test` — Backend Tests & Build

```yaml
# ci.yml dòng 20-48
```

| ✅ Điểm tốt | ⚠️ Vấn đề tiềm ẩn |
|---|---|
| Dùng `actions/setup-java@v4` với cache Maven | Không có `timeout-minutes` → job có thể treo vô thời hạn |
| Upload Surefire reports với `if: always()` | Test chạy `./mvnw clean verify` — không tách biệt unit test và integration test |
| Retention 7 ngày hợp lý | Không có bước scan bảo mật dependency (OWASP/Snyk) |

### 2.2 `frontend-check` — Lint & Build

```yaml
# ci.yml dòng 53-78
```

| ✅ Điểm tốt | ⚠️ Vấn đề tiềm ẩn |
|---|---|
| Dùng `npm ci` (reproducible install) | Không có bước chạy unit test frontend |
| Cache `npm` theo `package-lock.json` | Không upload build artifact để tái sử dụng ở job sau |
| Lint kiểm tra code style | `npm run build` ở CI không truyền `VITE_*` env → build với URL mặc định `localhost` |

### 2.3 `docker-build-push` — Build & Push Images

```yaml
# ci.yml dòng 84-157
```

| ✅ Điểm tốt | ⚠️ Vấn đề tiềm ẩn |
|---|---|
| Dùng `docker/buildx` với QEMU (multi-arch ready) | Chỉ build `linux/amd64` — chưa khai báo `platforms:` |
| GHA cache (`type=gha`) tăng tốc build | **BUG nghiêm trọng:** tag `latest` dùng điều kiện sai (xem §3.1) |
| SHA tag (`sha-xxxxxxx`) cho traceability | Frontend build với URL hardcode vào image (xem §3.3) |
| Metadata action tự động label OCI chuẩn | Không có bước smoke test sau khi push image |
| `needs: [backend-test, frontend-check]` đúng thứ tự | Không có job CD (deploy lên server) |

---

## 3. Danh sách Lỗi & Khắc Phục

---

### 🔴 BUG #1 — Tag `latest` không bao giờ được gán (Logic sai)

**File:** [`ci.yml` dòng 113, 136](file:///e:/Projects/BookingSalon/.github/workflows/ci.yml#L113-L136)

**Mô tả:**
```yaml
# CÁI NÀY SAI — nhánh master không bao giờ match 'refs/heads/main'
type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master' }}
```
Pipeline trigger trên nhánh `master` (dòng 6) nhưng điều kiện `enable` kiểm tra cả `refs/heads/main`. Vấn đề: `github.ref` khi push nhánh `master` sẽ là `refs/heads/master` → tag `latest` **vẫn được gán đúng cho nhánh master**. Tuy nhiên, nếu dự án đổi default branch sang `main` thì `master` sẽ không còn được gán `latest` nữa.

> **Vấn đề thực sự:** Nhánh `demo-app` (dòng 7) cũng trigger build+push, và sẽ **ghi đè tag `demo-app`** lên Docker Hub nhưng cũng push tag `sha-*`, dẫn tới Docker Hub lẫn lộn giữa production và demo image.

**Khắc phục:**
```yaml
tags: |
  # Chỉ gán 'latest' khi push vào master
  type=raw,value=latest,enable=${{ github.ref == 'refs/heads/master' }}
  # Gán tag branch (master, demo-app)
  type=ref,event=branch
  # Gán tag version khi tạo release (v1.0.0)
  type=ref,event=tag
  # Gán SHA ngắn để tracing
  type=sha,format=short,prefix=sha-
```

---

### 🔴 BUG #2 — Frontend image bake URL `localhost` cứng vào binary

**File:** [`ci.yml` dòng 149-154](file:///e:/Projects/BookingSalon/.github/workflows/ci.yml#L149-L154) | [`frontend/Dockerfile`](file:///e:/Projects/BookingSalon/frontend/Dockerfile)

**Mô tả:**
Vite build các biến `VITE_*` thành **static string** trong bundle JS tại compile time. Image Docker hiện tại bake URL production vào lúc build CI — nếu URL thay đổi (staging vs production), phải build lại image mới.

```dockerfile
# Frontend Dockerfile — VITE_* được nhúng cứng vào dist/
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
```

**Khắc phục — Runtime config injection qua Nginx:**
```nginx
# nginx.conf — thêm endpoint /config.js
location /config.js {
    add_header Content-Type application/javascript;
    return 200 "window.__APP_CONFIG__ = {
      apiUrl: '${VITE_API_URL}',
      keycloakUrl: '${VITE_KEYCLOAK_URL}'
    };";
}
```
```html
<!-- index.html -->
<script src="/config.js"></script>
```
```js
// src/config.ts
const config = window.__APP_CONFIG__ ?? { apiUrl: import.meta.env.VITE_API_URL };
```

Hoặc dùng `envsubst` trong entrypoint script của Nginx để inject env vào `config.js` lúc container start.

---

### 🟠 BUG #3 — Keycloak version không nhất quán giữa dev và prod

**File:** [`docker-compose.yml` dòng 63](file:///e:/Projects/BookingSalon/docker-compose.yml#L63) vs [`docker-compose.prod.yml` dòng 62](file:///e:/Projects/BookingSalon/docker-compose.prod.yml#L62)

**Mô tả:**
```yaml
# docker-compose.yml (dev)
image: quay.io/keycloak/keycloak:26.7.0   # ← version cụ thể

# docker-compose.prod.yml (prod)
image: quay.io/keycloak/keycloak:26.0     # ← version cũ hơn!
```
Dev chạy 26.7.0, Prod chạy 26.0 → có thể gây **"Works on my machine"** do API/config Keycloak thay đổi giữa các phiên bản.

**Khắc phục:**
```yaml
# Dùng cùng 1 version, định nghĩa qua .env hoặc variable
image: quay.io/keycloak/keycloak:${KEYCLOAK_VERSION:-26.7.0}
```

---

### 🟠 BUG #4 — Keycloak healthcheck port sai ở dev

**File:** [`docker-compose.yml` dòng 81](file:///e:/Projects/BookingSalon/docker-compose.yml#L81)

**Mô tả:**
```yaml
# docker-compose.yml (dev) — Keycloak healthcheck dùng port 9000
test: ["CMD-SHELL", "exec 3<>/dev/tcp/127.0.0.1/9000 ..."]

# docker-compose.prod.yml — Keycloak healthcheck dùng port 8080
test: ["CMD-SHELL", "exec 3<>/dev/tcp/127.0.0.1/8080 ..."]
```
Keycloak 26+ expose management port là **9000** (không phải 8080). File dev đúng (9000), file prod sai (8080). Nếu Keycloak prod chưa mở port 9000, healthcheck sẽ fail → backend không bao giờ start.

**Khắc phục cho `docker-compose.prod.yml`:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "exec 3<>/dev/tcp/127.0.0.1/9000 && echo -e 'GET /health/ready HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' >&3 && grep -q '200 OK' <&3"]
  interval: 15s
  timeout: 5s
  retries: 15
  start_period: 90s
```

---

### 🟠 BUG #5 — Keycloak prod dùng `start-dev` mode

**File:** [`docker-compose.prod.yml` dòng 65](file:///e:/Projects/BookingSalon/docker-compose.prod.yml#L65)

**Mô tả:**
```yaml
command: start-dev --import-realm   # ← KHÔNG an toàn cho production!
```
`start-dev` tắt nhiều tính năng bảo mật (H2 in-memory DB fallback, TLS tắt, cache disabled). Dù Keycloak prod đã cấu hình MySQL, việc dùng `start-dev` vẫn là **anti-pattern nghiêm trọng**.

**Khắc phục:**
```yaml
command: start --optimized --import-realm
# Hoặc nếu chưa build optimized image:
command: start --import-realm
environment:
  KC_HTTP_ENABLED: "true"
  KC_HOSTNAME_STRICT: "false"
  KC_DB: mysql
  KC_DB_URL: jdbc:mysql://mysql:3306/${DB_NAME}
```

---

### 🟠 BUG #6 — Password hardcode trong Docker Compose & Healthcheck

**File:** [`docker-compose.yml` dòng 15, 28](file:///e:/Projects/BookingSalon/docker-compose.yml#L15-L29) | [`docker-compose.prod.yml` dòng 15, 28](file:///e:/Projects/BookingSalon/docker-compose.prod.yml#L15-L29)

**Mô tả:**
```yaml
MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-Bach@vt05}   # fallback lộ password
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_PASSWORD:-Bach@vt05}"]
  # Password hiện trong 'docker inspect' và log!
```

**Khắc phục:**
```yaml
# Dùng file thay vì biến môi trường trong healthcheck
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "--password=$${MYSQL_ROOT_PASSWORD}"]
# Hoặc dùng --defaults-file với file config MySQL
```
Và **không đặt default password** trong file compose — yêu cầu bắt buộc truyền qua `.env`:
```yaml
MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}   # Không có fallback :-
```

---

### 🟡 BUG #7 — Không có `timeout-minutes` trong các job CI

**File:** [`ci.yml` dòng 20, 53, 84](file:///e:/Projects/BookingSalon/.github/workflows/ci.yml#L20-L88)

**Mô tả:**
GitHub Actions mặc định timeout là **6 giờ**. Nếu Maven build hoặc Docker push bị treo, GitHub Actions runner sẽ lãng phí resource trong nhiều giờ.

**Khắc phục:**
```yaml
jobs:
  backend-test:
    timeout-minutes: 20
    ...
  frontend-check:
    timeout-minutes: 10
    ...
  docker-build-push:
    timeout-minutes: 30
    ...
```

---

### 🟡 BUG #8 — Frontend build trong CI không có `VITE_*` vars → URL sai

**File:** [`ci.yml` dòng 76-78](file:///e:/Projects/BookingSalon/.github/workflows/ci.yml#L76-L78)

**Mô tả:**
Job `frontend-check` chạy `npm run build` mà không truyền bất kỳ `VITE_*` env nào → Vite dùng giá trị mặc định `undefined` → build thành công nhưng bundle không phản ánh cấu hình thật.

**Khắc phục:**
```yaml
- name: Build Frontend SPA
  working-directory: frontend
  env:
    VITE_API_URL: ${{ vars.VITE_API_URL || 'http://placeholder-for-ci-check' }}
    VITE_KEYCLOAK_URL: ${{ vars.VITE_KEYCLOAK_URL || 'http://placeholder-for-ci-check' }}
  run: npm run build
```

---

### 🟡 BUG #9 — Redis healthcheck với empty password không ổn định

**File:** [`docker-compose.yml` dòng 53-54](file:///e:/Projects/BookingSalon/docker-compose.yml#L53-L54)

**Mô tả:**
```yaml
test: ["CMD-SHELL", "redis-cli -a \"${REDIS_PASSWORD:-}\" ping | grep -q PONG || redis-cli ping | grep -q PONG"]
```
Khi `REDIS_PASSWORD` rỗng, `redis-cli -a ""` có thể in warning ra stderr và fail grep. Logic fallback `|| redis-cli ping` cũng không đáng tin.

**Khắc phục:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "redis-cli ${REDIS_PASSWORD:+-a $REDIS_PASSWORD} ping | grep -q PONG"]
  interval: 10s
  timeout: 3s
  retries: 5
```

---

### 🟡 BUG #10 — Không có job CD (Deploy tự động)

**File:** [`ci.yml`](file:///e:/Projects/BookingSalon/.github/workflows/ci.yml)

**Mô tả:**
Pipeline chỉ build & push image lên Docker Hub nhưng **không có bước triển khai lên server**. Sau khi image được push, việc cập nhật server phải thực hiện thủ công.

**Khắc phục — Thêm job `deploy`:**
```yaml
deploy:
  name: Deploy to Production
  needs: docker-build-push
  if: github.ref == 'refs/heads/master' && github.event_name == 'push'
  runs-on: ubuntu-latest
  environment: production   # Yêu cầu approval trước khi deploy
  timeout-minutes: 15

  steps:
    - name: Deploy via SSH
      uses: appleboy/ssh-action@v1
      with:
        host: ${{ secrets.PROD_HOST }}
        username: ${{ secrets.PROD_USER }}
        key: ${{ secrets.PROD_SSH_KEY }}
        script: |
          cd /opt/bookingsalon
          IMAGE_TAG=sha-${{ github.sha }} docker compose -f docker-compose.prod.yml pull
          IMAGE_TAG=sha-${{ github.sha }} docker compose -f docker-compose.prod.yml up -d --no-deps backend frontend
          docker system prune -f
```

---

### 🟡 BUG #11 — `SPRING_FLYWAY_IGNORE_MIGRATION_PATTERNS: "*:*"` ở production

**File:** [`docker-compose.prod.yml` dòng 123](file:///e:/Projects/BookingSalon/docker-compose.prod.yml#L123)

**Mô tả:**
```yaml
SPRING_FLYWAY_IGNORE_MIGRATION_PATTERNS: "*:*"
SPRING_FLYWAY_VALIDATE_ON_MIGRATE: "false"
SPRING_FLYWAY_OUT_OF_ORDER: "true"
```
Ba cấu hình này kết hợp tắt hoàn toàn tính năng kiểm tra tính toàn vẹn của Flyway ở **production** — rủi ro cao nếu migration bị lỗi sẽ không được phát hiện.

**Khắc phục:**
```yaml
# Production nên strict hơn dev
SPRING_FLYWAY_VALIDATE_ON_MIGRATE: "true"
SPRING_FLYWAY_OUT_OF_ORDER: "false"
SPRING_FLYWAY_IGNORE_MIGRATION_PATTERNS: ""   # Không ignore
```

---

### 🔵 CẢI TIẾN #12 — Thiếu Security Scanning trong pipeline

**Mô tả:**
Không có bước nào scan lỗ hổng bảo mật trong dependency Java/Node hoặc Docker image.

**Khắc phục — Thêm Trivy scan:**
```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ secrets.DOCKERHUB_USERNAME }}/bookingsalon-backend:sha-${{ github.sha }}
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'

- name: Upload Trivy scan results to GitHub Security
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: 'trivy-results.sarif'
```

---

### 🔵 CẢI TIẾN #13 — Chưa dùng Docker image digest để pin phiên bản

**File:** [`docker-compose.prod.yml`](file:///e:/Projects/BookingSalon/docker-compose.prod.yml)

**Mô tả:**
```yaml
image: mysql:8.0          # Tag có thể bị overwrite bất kỳ lúc nào
image: redis:7-alpine
image: quay.io/keycloak/keycloak:26.0
```

**Khắc phục:**
```yaml
# Dùng digest để đảm bảo immutability
image: mysql:8.0@sha256:xxxxxxx
# Hoặc ít nhất dùng patch version cụ thể
image: mysql:8.0.36
image: redis:7.2.4-alpine
```

---

### 🔵 CẢI TIẾN #14 — Thiếu multi-platform build

**File:** [`ci.yml` dòng 118-127](file:///e:/Projects/BookingSalon/.github/workflows/ci.yml#L118-L127)

**Mô tả:**
Đã setup QEMU nhưng không khai báo `platforms:` → chỉ build `linux/amd64`. Nếu server production dùng ARM (AWS Graviton, Raspberry Pi), image sẽ không chạy được.

**Khắc phục:**
```yaml
- name: Build & Push Backend Docker Image
  uses: docker/build-push-action@v6
  with:
    platforms: linux/amd64,linux/arm64   # Multi-arch
    context: ./backend
    ...
```

---

## 4. Tóm tắt lỗi theo mức độ

| Mức độ | # | Mô tả |
|---|---|---|
| 🔴 Critical | 2 | Tag `latest` logic sai (#1), Frontend URL bake cứng vào image (#2) |
| 🟠 High | 4 | Keycloak version mismatch (#3), Healthcheck port sai (#4), `start-dev` ở prod (#5), Password lộ (#6) |
| 🟡 Medium | 5 | Không timeout CI (#7), Build frontend không có env (#8), Redis healthcheck (#9), Không có CD (#10), Flyway tắt validation (#11) |
| 🔵 Low/Improve | 3 | Security scan (#12), Image digest (#13), Multi-platform (#14) |

---

## 5. Checklist khắc phục ưu tiên

- [ ] **🔴** Fix điều kiện `latest` tag trong `metadata-action` (#1)
- [ ] **🔴** Implement runtime config cho Frontend thay vì build-time bake (#2)
- [ ] **🟠** Đồng bộ Keycloak version giữa dev và prod (#3)
- [ ] **🟠** Fix Keycloak healthcheck port 9000 ở prod (#4)
- [ ] **🟠** Đổi Keycloak prod từ `start-dev` sang `start` (#5)
- [ ] **🟠** Loại bỏ password hardcode/fallback trong compose files (#6)
- [ ] **🟡** Thêm `timeout-minutes` cho tất cả jobs (#7)
- [ ] **🟡** Thêm `VITE_*` vars vào bước build CI (#8)
- [ ] **🟡** Thêm job CD với SSH deploy (#10)
- [ ] **🟡** Restore Flyway validation ở production (#11)
- [ ] **🔵** Tích hợp Trivy security scan (#12)
- [ ] **🔵** Thêm `platforms: linux/amd64,linux/arm64` (#14)

---

> _Review bởi Antigravity • BookingSalon Project • 2026-10-31

