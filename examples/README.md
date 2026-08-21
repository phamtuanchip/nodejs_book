# Code Examples

Mỗi thư mục tương ứng với một chương trong sách **"Lập trình NodeJS từ cơ bản đến nâng cao"**.

## Chạy examples

### Yêu cầu

- Node.js >= 18
- Một số chapter cần MongoDB, Redis, PostgreSQL (xem hướng dẫn từng chapter)

### Cách dùng

```bash
cd examples/chapterXX
npm install  # nếu có package.json
node 01-ten-file.js
```

## Cấu trúc

| Thư mục | Chủ đề |
|---------|--------|
| `chapter01/` | Internet & Web — HTTP, DNS, URL |
| `chapter02/` | Stateful vs Stateless |
| `chapter03/` | Node.js Core — modules, events, streams |
| `chapter04/` | npm & package management |
| `chapter05/` | Express.js căn bản |
| `chapter06/` | REST API design |
| `chapter07/` | Middleware & Error handling |
| `chapter08/` | Authentication — JWT, session |
| `chapter09/` | MongoDB & Mongoose |
| `chapter10/` | SQL & Sequelize |
| `chapter11/` | Redis — caching, queue |
| `chapter12/` | WebSocket & Socket.IO |
| `chapter13/` | File upload & Storage |
| `chapter14/` | Testing — Jest, Supertest |
| `chapter15/` | Security — Helmet, rate limiting, OWASP |
| `chapter16/` | Performance — clustering, caching |
| `chapter17/` | Deploy & DevOps |
| `chapter18/` | Serverless & Cloud |

## Chapter 17 — Deploy & DevOps

```
chapter17/
├── app.js                          # Express app với health check endpoint
├── config/index.js                 # Config validation fail-fast
├── ecosystem.config.js             # PM2 cluster mode config
├── Dockerfile                      # Multi-stage build
├── docker-compose.yml              # App + MongoDB + Redis
├── nginx/nginx.conf                # Reverse proxy, gzip, rate limiting
└── .github/workflows/deploy.yml   # CI/CD: test → build → push → deploy
```

### Chạy chapter 17

```bash
cd examples/chapter17
cp .env.example .env               # chỉnh sửa các giá trị trong .env

# Cách 1: Chạy trực tiếp
npm install
node app.js

# Cách 2: Dùng PM2
npm install -g pm2
pm2 start ecosystem.config.js --env development

# Cách 3: Dùng Docker Compose
docker compose up -d
curl http://localhost:3000/health
```

## Chapter 18 — Serverless & Cloud

```
chapter18/
├── vercel/
│   ├── api/
│   │   ├── hello.js               # GET /api/hello?name=An&lang=vi
│   │   └── users/
│   │       ├── index.js           # GET/POST /api/users
│   │       └── [id].js            # GET/PUT/DELETE /api/users/:id
│   └── vercel.json                # Function config, timeout, CORS
├── lambda/
│   ├── handler.js                 # AWS Lambda handler (API Gateway v2)
│   └── serverless.yml             # Serverless Framework config
└── cloudflare/
    ├── src/worker.js              # Cloudflare Worker (Web APIs)
    ├── wrangler.toml              # Wrangler config, KV binding
    └── package.json
```

### Chạy chapter 18

```bash
# Vercel
cd examples/chapter18/vercel
npm install -g vercel
vercel dev                          # dev local tại http://localhost:3000

# AWS Lambda (Serverless Framework)
cd examples/chapter18/lambda
npm install -g serverless
npm install serverless-offline
serverless offline                  # dev local tại http://localhost:3000

# Cloudflare Workers
cd examples/chapter18/cloudflare
npm install
npm run dev                         # dev local tại http://localhost:8787
```
