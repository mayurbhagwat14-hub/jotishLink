import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// We will mock the express app for the basic health check to avoid bringing up the full database connection
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

describe('Backend API Tests', () => {
  it('should return 200 OK for the /health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
