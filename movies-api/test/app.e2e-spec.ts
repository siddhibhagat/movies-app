import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('GET /api/movies/search', () => {
    it('should return searched movies', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies/search')
        .query({ term: 'space', page: '1', limit: '10' });

      expect(response.status).toBe(200); // Expect 200 OK
      expect(response.body).toHaveProperty('data'); // Ensure response contains data
      expect(Array.isArray(response.body.data)).toBe(true); // Check if data is an array
    });

    it('should return 404 if search page exceeds total pages', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies/search')
        .query({ term: 'space', page: 50, limit: 10 }); // Exaggerated page number

      expect(response.status).toBe(404); // Expect 404 Not Found if page exceeds total count
    });
  });
});
