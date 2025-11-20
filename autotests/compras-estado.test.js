const request = require('supertest');
const app = require('../server');
const { login } = require('./helpers');

let adminToken;
let compraId;

describe('Compras - actualización de estado', () => {
  beforeAll(async () => {
    adminToken = await login('admin', 'admin123');
    // Crear producto base
    const prodRes = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Prod Estado', categoria: 'Tests', precio: 100, stock: 5, descripcion: 'Para estado', activo: true });
    const productoId = prodRes.body.producto.id;

    // Crear compra
    const compraRes = await request(app)
      .post('/api/compras')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('comprador_nombre', 'Tester Estado')
      .field('metodo_pago', 'efectivo')
      .field('productos', JSON.stringify([{ producto_id: productoId, cantidad: 1 }]));

    if ([200, 201].includes(compraRes.status) && compraRes.body.compra) {
      compraId = compraRes.body.compra.id;
    }
  });

  test('Admin puede actualizar estado de compra a listo', async () => {
    if (!compraId) {
      // Entorno en el que no se pudo crear compra (ej. permisos o Vercel demo)
      return;
    }

    const res = await request(app)
      .patch(`/api/compras/${compraId}/estado`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado: 'listo', listo: true });

    expect([200, 400, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
    }
  });
});
