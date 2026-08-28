# syntax=docker/dockerfile:1
#
# Dockerfile này chỉ dùng để BUILD IMAGE VÀ CHẠY LOCAL trên máy dev
# (không dùng để push lên registry hay deploy).

# =========================
# Stage 1: Build
# =========================
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

# Copy Gradle wrapper & config trước để tận dụng Docker layer cache
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew

# Tải dependencies (cache riêng layer này, chỉ tải lại khi build.gradle đổi)
RUN ./gradlew --no-daemon dependencies || true

# Copy source code và build
COPY src ./src
RUN ./gradlew --no-daemon clean bootJar -x test

# =========================
# Stage 2: Runtime
# =========================
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /workspace/build/libs/*.jar app.jar

# Mặc định chạy với profile dev, trỏ về Postgres container ở docker-compose.dev.yml
# (Postgres cần chạy trên cùng network Docker hoặc dùng host.docker.internal, xem hướng dẫn ở báo cáo)
ENV SPRING_PROFILES_ACTIVE=dev

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -jar app.jar"]
