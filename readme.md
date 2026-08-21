# Sách: Lập Trình NodeJS - Từ Cơ Bản Đến Nâng Cao

## Mục tiêu dự án
Viết một quyển sách tiếng Việt hướng dẫn lập trình NodeJS cho người mới bắt đầu, chỉ có kiến thức JavaScript cơ bản. Sách sẽ dẫn dắt học viên từ các khái niệm nền tảng về server, web application đến các kỹ thuật nâng cao và cloud/serverless.

## Đối tượng độc giả
- Đã biết JavaScript cơ bản (biến, hàm, vòng lặp, array, object, ES6+)
- Chưa biết gì về server-side programming
- Chưa biết về HTTP, API, database
- Muốn trở thành Backend Developer hoặc Fullstack Developer

## Định dạng xuất bản
- **Giai đoạn 1**: HTML (đọc trên trình duyệt)
- **Giai đoạn 2**: PDF và EPUB
- **Giai đoạn 3**: Xuất bản Amazon KDP hoặc nền tảng khác

## Cấu trúc thư mục dự án

```
NodeJs_book/
├── readme.md              # File plan này
├── index.html             # Trang chủ sách (mục lục)
├── assets/
│   ├── css/
│   │   └── style.css      # Style cho sách HTML
│   ├── js/
│   │   └── main.js        # Navigation, highlight code
│   └── images/
├── chapters/
│   ├── part1/             # Phần 1: Nền tảng
│   │   ├── chapter01.html
│   │   ├── chapter02.html
│   │   └── chapter03.html
│   ├── part2/             # Phần 2: NodeJS cơ bản
│   │   ├── chapter04.html
│   │   ├── chapter05.html
│   │   ├── chapter06.html
│   │   └── chapter07.html
│   ├── part3/             # Phần 3: Web Application
│   │   ├── chapter08.html
│   │   ├── chapter09.html
│   │   ├── chapter10.html
│   │   └── chapter11.html
│   ├── part4/             # Phần 4: Database & Authentication
│   │   ├── chapter12.html
│   │   ├── chapter13.html
│   │   └── chapter14.html
│   └── part5/             # Phần 5: Nâng cao & Cloud
│       ├── chapter15.html
│       ├── chapter16.html
│       ├── chapter17.html
│       └── chapter18.html
└── examples/              # Code mẫu cho từng chương
    ├── chapter01/
    ├── chapter02/
    └── ...
```

---

## Syllabus đầy đủ

### PHẦN 1: NỀN TẢNG - Hiểu Cách Internet Hoạt Động

#### Chương 1: Internet và Web Hoạt Động Như Thế Nào?
**Mục tiêu**: Học viên hiểu được luồng dữ liệu từ browser đến server
- Internet là gì? Client và Server là gì?
- HTTP/HTTPS protocol - request và response
- URL, Domain, IP Address, DNS
- Cách browser giao tiếp với server
- Sự khác biệt giữa frontend và backend
- **Code mẫu**: Mô phỏng HTTP request bằng `curl` và `fetch`
- **Bài tập**: Dùng DevTools xem HTTP request của 1 trang web thực tế

#### Chương 2: Web Application - Stateful vs Stateless
**Mục tiêu**: Hiểu khái niệm state trong web application
- Stateless protocol (HTTP là stateless)
- State là gì và tại sao cần lưu state
- Các cách lưu state phía client:
  - Cookie - cơ chế, giới hạn, bảo mật
  - LocalStorage vs SessionStorage
  - IndexedDB (giới thiệu)
- Các cách lưu state phía server:
  - Server Session
  - JWT Token
  - Database
- **Code mẫu**: Demo cookie, localStorage, sessionStorage trong browser
- **Bài tập**: Xây dựng mini shopping cart dùng localStorage

#### Chương 3: NodeJS là gì? Cài đặt môi trường
**Mục tiêu**: Cài đặt và chạy được chương trình NodeJS đầu tiên
- NodeJS là gì? Tại sao dùng NodeJS?
- V8 Engine, libuv, event loop overview
- Cài đặt NodeJS (nvm, node, npm)
- So sánh NodeJS với PHP, Python, Java
- `node` REPL và chạy file `.js`
- npm và package.json cơ bản
- **Code mẫu**: Hello World, đọc file, HTTP server 3 dòng
- **Bài tập**: Tạo script tính toán và in ra console

---

### PHẦN 2: NODEJS CƠ BẢN

#### Chương 4: NodeJS Core Modules
**Mục tiêu**: Sử dụng thành thạo các module có sẵn của NodeJS
- Module system: `require` vs `import/export`
- `fs` - đọc/ghi file
- `path` - xử lý đường dẫn
- `os` - thông tin hệ thống
- `events` - EventEmitter pattern
- `crypto` - mã hóa cơ bản
- **Code mẫu**: File manager CLI, log rotator
- **Bài tập**: Viết script backup file tự động

#### Chương 5: Async Programming trong NodeJS
**Mục tiêu**: Nắm vững lập trình bất đồng bộ
- Callback pattern và callback hell
- Promise và Promise chain
- async/await
- Error handling với try/catch
- Event Loop chi tiết - call stack, task queue, microtask
- `Promise.all`, `Promise.race`, `Promise.allSettled`
- **Code mẫu**: Fetch nhiều API song song, retry mechanism
- **Bài tập**: Viết hàm download nhiều file song song với giới hạn concurrency

#### Chương 6: HTTP Server với NodeJS thuần
**Mục tiêu**: Tự xây dựng HTTP server không dùng framework
- Module `http` - createServer
- Request object: method, url, headers, body
- Response object: statusCode, headers, write, end
- Routing thủ công
- Xử lý JSON request/response
- Stream và pipe
- **Code mẫu**: REST API đơn giản cho todo list
- **Bài tập**: Xây dựng file server phục vụ static files

#### Chương 7: npm Ecosystem và Quản lý Packages
**Mục tiêu**: Sử dụng thành thạo npm và quản lý dependencies
- `package.json` chi tiết - scripts, dependencies, devDependencies
- Semantic Versioning (semver)
- `npm install`, `npm update`, `npm audit`
- `package-lock.json` và tại sao quan trọng
- Tạo và publish package lên npm
- npx và global packages
- **Code mẫu**: Tạo CLI tool publish lên npm
- **Bài tập**: Tạo npm package tiện ích và publish

---

### PHẦN 3: WEB APPLICATION VỚI EXPRESS

#### Chương 8: Express.js - Framework Web Phổ Biến Nhất
**Mục tiêu**: Xây dựng web server với Express
- Express là gì? Tại sao dùng Express?
- Cài đặt và cấu trúc project
- Route cơ bản: GET, POST, PUT, DELETE
- Route parameters và query strings
- Middleware concept - request pipeline
- Built-in middleware: `express.json()`, `express.static()`
- **Code mẫu**: REST API cơ bản cho blog
- **Bài tập**: Xây dựng API quản lý sản phẩm

#### Chương 9: Middleware và Error Handling
**Mục tiêu**: Hiểu sâu về middleware pattern
- Middleware chain hoạt động như thế nào
- Viết custom middleware
- Third-party middleware: cors, helmet, morgan, rate-limiter
- Error handling middleware
- 404 handler
- Request validation với Joi hoặc Zod
- **Code mẫu**: Auth middleware, logging middleware
- **Bài tập**: Thêm rate limiting và request logging vào API

#### Chương 10: Cookie, Session và Authentication
**Mục tiêu**: Implement authentication cho web app
- Cookie với Express: set, get, options (httpOnly, secure, sameSite)
- Express Session với `express-session`
- Session store: memory (dev), Redis (production)
- JWT Authentication: tạo token, verify, refresh token
- bcrypt để hash password
- Middleware bảo vệ route (auth guard)
- **Code mẫu**: Hệ thống đăng nhập/đăng xuất hoàn chỉnh
- **Bài tập**: Xây dựng API với đầy đủ auth flow

#### Chương 11: Templating Engine và Server-Side Rendering
**Mục tiêu**: Render HTML từ phía server
- SSR vs CSR vs SSG - khi nào dùng gì?
- EJS templating engine
- Layout, partial, include
- Truyền dữ liệu từ route vào template
- Form handling và redirect
- Flash message
- **Code mẫu**: Website blog đơn giản render phía server
- **Bài tập**: Xây dựng admin panel cho quản lý nội dung

---

### PHẦN 4: DATABASE VÀ DỮ LIỆU

#### Chương 12: MongoDB với Mongoose
**Mục tiêu**: Lưu trữ dữ liệu với MongoDB
- NoSQL vs SQL - khi nào dùng gì?
- MongoDB Atlas (cloud, miễn phí)
- Mongoose: Schema, Model, Document
- CRUD operations
- Validation ở tầng Mongoose
- Population (join documents)
- Indexing cơ bản
- **Code mẫu**: API blog với đầy đủ CRUD và user relationship
- **Bài tập**: Xây dựng API e-commerce đơn giản

#### Chương 13: SQL với PostgreSQL và Prisma
**Mục tiêu**: Làm việc với relational database
- SQL cơ bản: SELECT, INSERT, UPDATE, DELETE, JOIN
- PostgreSQL setup (local và cloud - Supabase)
- Prisma ORM: schema, migration, client
- Relations: one-to-many, many-to-many
- Transaction
- **Code mẫu**: Hệ thống quản lý đơn hàng với relations
- **Bài tập**: Thiết kế và implement schema cho ứng dụng thực tế

#### Chương 14: Caching với Redis
**Mục tiêu**: Tăng performance với caching
- Redis là gì? Use cases
- Redis data types: string, hash, list, set
- Cache-aside pattern
- Session store với Redis
- Rate limiting với Redis
- **Code mẫu**: Cache API response, leaderboard với sorted set
- **Bài tập**: Thêm caching layer vào API đã xây dựng

---

### PHẦN 5: NÂNG CAO VÀ CLOUD

#### Chương 15: REST API Best Practices và API Design
**Mục tiêu**: Thiết kế API chuẩn, dễ bảo trì
- RESTful conventions đúng chuẩn
- HTTP Status Codes đúng cách dùng
- API versioning
- Pagination, filtering, sorting
- API documentation với Swagger/OpenAPI
- File upload với Multer
- **Code mẫu**: API hoàn chỉnh với full documentation
- **Bài tập**: Refactor API từ các chương trước theo chuẩn

#### Chương 16: Testing và Code Quality
**Mục tiêu**: Viết code có test, đảm bảo chất lượng
- Tại sao cần test?
- Unit test với Jest
- Integration test với Supertest
- Mocking
- Code coverage
- ESLint và Prettier
- **Code mẫu**: Test suite đầy đủ cho API
- **Bài tập**: Viết test cho toàn bộ API đã xây dựng

#### Chương 17: Deploy và DevOps Cơ Bản
**Mục tiêu**: Đưa ứng dụng lên production
- Environment variables và `.env`
- Process manager: PM2
- Docker cơ bản: Dockerfile, docker-compose
- Deploy lên VPS (DigitalOcean/Linode) - hướng dẫn từng bước
- Nginx làm reverse proxy
- SSL với Let's Encrypt
- CI/CD với GitHub Actions
- **Code mẫu**: Dockerfile và docker-compose cho project
- **Bài tập**: Deploy ứng dụng lên cloud VPS

#### Chương 18: Serverless và Cloud Functions
**Mục tiêu**: Hiểu và xây dựng ứng dụng serverless
- Serverless là gì? Ưu/nhược điểm so với server truyền thống
- Function as a Service (FaaS)
- AWS Lambda - cold start, warm start, timeout
- Vercel Functions (dễ nhất để bắt đầu)
- Cloudflare Workers
- Event-driven architecture
- Khi nào nên dùng serverless?
- **Code mẫu**: API serverless deploy lên Vercel
- **Bài tập**: Migrate 1 endpoint từ Express sang Vercel Function

---

## Dự án cuối khóa - Capstone Project

**Xây dựng ứng dụng Blog Platform hoàn chỉnh** gồm:
- Backend API với Express + MongoDB
- Authentication (JWT)
- File upload (ảnh bài viết)
- Caching với Redis
- Testing
- Deploy lên cloud

---

## Tiêu chuẩn mỗi chương

Mỗi chương HTML phải có:
1. **Giới thiệu** - Tại sao học chủ đề này, học xong làm được gì
2. **Lý thuyết** - Giải thích khái niệm bằng ngôn ngữ đơn giản, có hình minh họa/diagram
3. **Code mẫu** - Ít nhất 2-3 ví dụ code có thể chạy được ngay
4. **Giải thích code** - Từng dòng code quan trọng được giải thích
5. **Bài tập thực hành** - 2-3 bài tập từ dễ đến khó
6. **Tóm tắt** - Bullet points những điểm chính
7. **Bước tiếp theo** - Link đến chương tiếp theo

---

## Tech stack cho bản HTML

- **Syntax highlighting**: Prism.js hoặc Highlight.js
- **Font**: Google Fonts (Inter cho text, JetBrains Mono cho code)
- **Layout**: CSS thuần, responsive
- **Navigation**: Sidebar với mục lục, breadcrumb
- **Dark mode**: Toggle sáng/tối

---

## Trạng thái tiến độ

| Chương | Tiêu đề | Trạng thái |
|--------|---------|------------|
| 1 | Internet và Web hoạt động như thế nào | ⏳ Chưa bắt đầu |
| 2 | Stateful vs Stateless, Cookie, Browser Storage | ⏳ Chưa bắt đầu |
| 3 | NodeJS là gì? Cài đặt môi trường | ⏳ Chưa bắt đầu |
| 4 | NodeJS Core Modules | ⏳ Chưa bắt đầu |
| 5 | Async Programming | ⏳ Chưa bắt đầu |
| 6 | HTTP Server thuần | ⏳ Chưa bắt đầu |
| 7 | npm Ecosystem | ⏳ Chưa bắt đầu |
| 8 | Express.js cơ bản | ⏳ Chưa bắt đầu |
| 9 | Middleware và Error Handling | ⏳ Chưa bắt đầu |
| 10 | Cookie, Session, Authentication | ⏳ Chưa bắt đầu |
| 11 | Templating Engine và SSR | ⏳ Chưa bắt đầu |
| 12 | MongoDB với Mongoose | ⏳ Chưa bắt đầu |
| 13 | SQL với PostgreSQL và Prisma | ⏳ Chưa bắt đầu |
| 14 | Caching với Redis | ⏳ Chưa bắt đầu |
| 15 | REST API Best Practices | ⏳ Chưa bắt đầu |
| 16 | Testing và Code Quality | ⏳ Chưa bắt đầu |
| 17 | Deploy và DevOps cơ bản | ⏳ Chưa bắt đầu |
| 18 | Serverless và Cloud Functions | ⏳ Chưa bắt đầu |
