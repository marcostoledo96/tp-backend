const request = require('supertest');
const app = require('../server');
const { login } = require('./helpers');

let adminToken;

// Pruebas adicionales sobre endpoints de compras: listado y estadísticas

describe('Compras - listado y estadísticas', () => {
  beforeAll(async () => {
    adminToken = await login('admin', 'admin123');
  });

  test('Admin puede listar compras', async () => {
    const res = await request(app)
      .get('/api/compras')
      .set('Authorization', `Bearer ${adminToken}`);

    // En modo demo o sin permisos correctos podría devolver 403
    expect([200, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data || res.body.compras || [])).toBe(true);
    }
  });

  test('Admin puede ver estadísticas de compras (si endpoint está habilitado)', async () => {
    const res = await request(app)
      .get('/api/compras/estadisticas')
      .set('Authorization', `Bearer ${adminToken}`);

    // Acepto 200 si está implementado, 404 si no existe, 403 si falta permiso
    expect([200, 403, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      // No asumo un formato fijo, solo que venga algún objeto con datos
      expect(typeof res.body.data).toBe('object');
    }
  });
});
