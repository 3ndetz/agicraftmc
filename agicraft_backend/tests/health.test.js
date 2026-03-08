const request = require('supertest');
const app = require('../src/server');

describe('Health Check Endpoints', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /api/news should return 200', async () => {
    const response = await request(app).get('/api/news');
    expect(response.statusCode).toBe(200);
  });
});
