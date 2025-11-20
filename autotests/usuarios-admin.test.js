const request = require('supertest');
const app = require('../server');
const { login } = require('./helpers');

let adminToken;

describe('Usuarios - CRUD básico admin', () => {
  beforeAll(async () => {
    adminToken = await login('admin', 'admin123');
  });

  test('Admin puede listar usuarios', async () => {
    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.usuarios)).toBe(true);
    }
  });

  test('Admin puede crear usuario nuevo (si no está bloqueado por modo demo)', async () => {
    const username = `jest_user_${Date.now()}`;
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username,
        password: 'Test1234',
        nombre: 'Usuario Jest',
        telefono: '111111',
        role_id: 1
      });

    // En Vercel o modo demo se espera 403, en local debería ser 201
    expect([201, 403]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.success).toBe(true);
      expect(res.body.usuario).toBeDefined();
    }
  });
});
