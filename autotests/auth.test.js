const request = require('supertest');
const app = require('../server');

describe('Auth - Login', () => {
  test('Login exitoso admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.usuario.role).toBe('admin');
  });

  test('Login falla con password incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    expect([400,401]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});
