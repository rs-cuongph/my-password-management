# Vibe Kanban Backend - NestJS với Prisma và PostgreSQL

## 🚀 Đã hoàn thành setup

✅ **NestJS Project** - Framework backend hiện đại với TypeScript
✅ **Prisma ORM** - Object-Relational Mapping cho TypeScript
✅ **PostgreSQL Configuration** - Database setup với Docker Compose
✅ **Environment Configuration** - Cấu hình môi trường development
✅ **Health Check Endpoint** - Endpoint kiểm tra kết nối database

## 📁 Cấu trúc project

```
backend/
├── src/
│   ├── app.controller.ts    # Main controller với health check
│   ├── app.service.ts       # Service với database health check
│   ├── app.module.ts        # Root module với Prisma và Config
│   ├── main.ts             # Application entry point
│   └── prisma.service.ts   # Prisma service cho database
├── prisma/
│   └── schema.prisma       # Prisma schema với User model example
├── .env                    # Environment variables
└── package.json            # Dependencies
```

## 🛠 Các lệnh quan trọng

### 1. Khởi động database
```bash
# Từ root folder (cần Docker running)
docker-compose -f docker-compose.dev.yml up postgres -d
```

### 2. Chạy migration đầu tiên
```bash
# Từ backend folder
npx prisma migrate dev --name init
```

### 3. Chạy NestJS server
```bash
npm run start:dev
```

### 4. Kiểm tra health
```bash
curl http://localhost:3000/health
```

## 🔧 Cấu hình Database

### Environment Variables (.env)
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vibe_kanban_dev?schema=public"
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=vibe_kanban_dev
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

### Prisma Schema (prisma/schema.prisma)
Đã có model User ví dụ:
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

## 📦 Dependencies đã cài đặt

### Core
- **@nestjs/common** - NestJS core functionality
- **@nestjs/core** - NestJS core module
- **@nestjs/config** - Configuration management
- **@prisma/client** - Prisma client
- **prisma** - Prisma CLI và schema management

### Development
- **@nestjs/cli** - NestJS CLI tools
- **typescript** - TypeScript compiler
- **ts-node** - TypeScript execution

## 🎯 Endpoints có sẵn

- `GET /` - Hello World message
- `GET /health` - Database health check với thông tin:
  - Database connection status
  - Environment info
  - Timestamp

## 🚀 Bước tiếp theo để phát triển

### 1. Tạo modules mới
```bash
nest generate module users
nest generate service users
nest generate controller users
```

### 2. Thêm models vào Prisma schema
```bash
# Edit prisma/schema.prisma
npx prisma migrate dev --name add_new_model
npx prisma generate
```

### 3. Cài đặt thêm packages cần thiết
```bash
npm install class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express
npm install @nestjs/jwt @nestjs/passport passport-jwt
```

## 🔍 Troubleshooting

### Database connection issues:
1. Kiểm tra Docker đang chạy
2. Kiểm tra port 5432 không bị chiếm
3. Verify DATABASE_URL trong .env

### Prisma issues:
1. Chạy `npx prisma generate` sau khi thay đổi schema
2. Chạy `npx prisma migrate dev` để sync database
3. Kiểm tra DATABASE_URL format

## 📚 Tài liệu tham khảo

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
