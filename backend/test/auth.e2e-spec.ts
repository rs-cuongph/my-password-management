import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Set global prefix to match main.ts
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return validation error for missing credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
    });

    it('should return validation error for empty username', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: '', password: 'password123' })
        .expect(400);
    });

    it('should return validation error for missing password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: 'testuser' })
        .expect(400);
    });

    it('should handle authentication failure gracefully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: 'nonexistent', password: 'wrongpassword' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.need2fa).toBe(false);
          expect(res.body.kdfSalt).toBe('');
          expect(res.body.message).toBeDefined();
        });
    });
  });
});