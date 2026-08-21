# Multi-stage build — giảm kích thước image production
# Stage 1 cài tất cả deps, stage 2 chỉ copy những gì cần thiết

# ===================== Stage 1: Builder =====================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files trước — tận dụng Docker layer cache
# Nếu code thay đổi mà package.json không đổi, bước npm install được cache lại
COPY package*.json ./

# Cài tất cả dependencies (bao gồm devDependencies)
RUN npm ci

# Copy toàn bộ source code
COPY . .

# Nếu có bước build (TypeScript, webpack...) thì chạy ở đây
# RUN npm run build


# ===================== Stage 2: Production =====================
FROM node:20-alpine AS production

# Tạo user riêng — không chạy app với quyền root
RUN addgroup -g 1001 -S nodejs && \
    adduser  -u 1001 -S nodejs -G nodejs

WORKDIR /app

# Chỉ copy package files để cài production deps
COPY package*.json ./

# Cài production dependencies — bỏ devDependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy source từ stage builder (không copy node_modules của builder)
COPY --from=builder /app/app.js    ./app.js
COPY --from=builder /app/config    ./config

# Nếu có thư mục dist từ bước build:
# COPY --from=builder /app/dist ./dist

# Đổi owner về user không phải root
RUN chown -R nodejs:nodejs /app

USER nodejs

# Khai báo cổng (chỉ tài liệu, không tự động publish)
EXPOSE 3000

# Healthcheck — Docker sẽ tự kiểm tra mỗi 30 giây
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Dùng node trực tiếp, không qua npm start — nhận SIGTERM đúng cách
CMD ["node", "app.js"]
