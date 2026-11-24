# syntax=docker/dockerfile:1

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

# Tải trước Gradle wrapper & dependencies với BuildKit Cache Mounts và cấu hình retry khi kết nối Maven Central
RUN --mount=type=cache,target=/root/.gradle/caches \
    --mount=type=cache,target=/root/.gradle/wrapper \
    ./gradlew --no-daemon --stacktrace \
      -Dorg.gradle.internal.http.socketTimeout=60000 \
      -Dorg.gradle.internal.http.connectionTimeout=60000 \
      -Dorg.gradle.internal.repository.max.retries=5 \
      dependencies -q || true

# Copy source code và build (bật biên dịch đa luồng parallel, console plain, tái sử dụng BuildKit cache)
COPY src ./src
RUN --mount=type=cache,target=/root/.gradle/caches \
    --mount=type=cache,target=/root/.gradle/wrapper \
    ./gradlew --no-daemon --stacktrace \
      -Dorg.gradle.internal.http.socketTimeout=60000 \
      -Dorg.gradle.internal.http.connectionTimeout=60000 \
      -Dorg.gradle.internal.repository.max.retries=5 \
      bootJar -x test --parallel --console=plain

# =========================
# Stage 2: Runtime
# Dùng Liberica JRE 21 Musl siêu nhẹ (giảm dung lượng image từ 411MB xuống ~250MB)
# =========================
FROM bellsoft/liberica-runtime-container:jre-21-musl AS runtime
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /workspace/build/libs/*.jar app.jar

# Mặc định chạy với profile dev, trỏ về Postgres container ở docker-compose.dev.yml
ENV SPRING_PROFILES_ACTIVE=dev

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -jar app.jar"]

