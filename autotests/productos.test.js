const request = require('supertest');
const app = require('../server');
const { login } = require('./helpers');

let adminToken;
let createdId;

describe('Productos - CRUD básico', () => {
  beforeAll(async () => {
    adminToken = await login('admin', 'admin123');
  });

  test('Listado público retorna success', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.productos)).toBe(true);
  });

  test('Crear producto válido', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre:'Test Prod', categoria:'Tests', subcategoria:'Unit', precio:123.45, stock:5, descripcion:'Producto de prueba', activo:true });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdId = res.body.producto.id;
    expect(createdId).toBeDefined();
  });

  test('Actualizar producto', async () => {
    const res = await request(app)
      .put(`/api/productos/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ precio:150, stock:10 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.producto.precio).toBe(150);
  });

  test('Soft delete producto', async () => {
    const res = await request(app)
      .delete(`/api/productos/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Verificar que no aparece en listado público
    const list = await request(app).get('/api/productos');
    const found = list.body.productos.find(p => p.id === createdId);
    expect(found).toBeUndefined();
  });
});
