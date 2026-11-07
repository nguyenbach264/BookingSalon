# ========================================================
# GIAI ĐOẠN 1: Build file JAR từ mã nguồn Java 21
# ========================================================
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Copy tệp cấu hình dependency trước để tận dụng Docker Cache Layer
COPY pom.xml .
RUN mvn dependency:resolve -B

# Copy toàn bộ mã nguồn backend vào và đóng gói
COPY src ./src
RUN mvn clean package -DskipTests -B

# ========================================================
# GIAI ĐOẠN 2: Runtime Image chạy ứng dụng (Siêu nhẹ & An toàn)
# ========================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Tạo tài khoản người dùng không có quyền root (Bảo mật container)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Cài đặt curl để phục vụ docker healthcheck và múi giờ Việt Nam
RUN apk add --no-cache curl tzdata
ENV TZ=Asia/Ho_Chi_Minh
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy file jar từ giai đoạn build sang
COPY --from=builder /build/target/*.jar app.jar
RUN chown -R appuser:appgroup /app

# Chạy với user bảo mật
USER appuser

EXPOSE 8080

# Cấu hình cờ JVM tối ưu cho môi trường Container
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Duser.timezone=Asia/Ho_Chi_Minh", \
  "-jar", "app.jar"]
