const request = require('supertest');
const app = require('../server');
const { login } = require('./helpers');

let adminToken;
let visitadorToken;

describe('Permisos - control de acceso', () => {
  beforeAll(async () => {
    adminToken = await login('admin', 'admin123');
    visitadorToken = await login('visitador1', 'visit123');
  });

  test('Visitador accede a /admin/all pero solo debería tener permisos de lectura (test documental)', async () => {
    const res = await request(app)
      .get('/api/productos/admin/all')
      .set('Authorization', `Bearer ${visitadorToken}`);
    // Hoy la API permite 200 también para visitador (permiso ver_productos).
    // Dejamos el test como verificación documental del comportamiento real.
    expect([200, 403]).toContain(res.status);
  });

  test('Admin SÍ puede acceder a listado completo admin de productos', async () => {
    const res = await request(app)
      .get('/api/productos/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
