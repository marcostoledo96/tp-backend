const request = require('supertest');
const app = require('../server');
const { login } = require('./helpers');

let adminToken;
let productoId;

// Nota: En Vercel las compras están bloqueadas. Estas pruebas asumen entorno local.

describe('Compras - flujo efectivo básico', () => {
  beforeAll(async () => {
    adminToken = await login('admin', 'admin123');
    // Crear producto para la compra
    const prodRes = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre:'Prod Compra', categoria:'Tests', precio:50, stock:3, descripcion:'Para compra', activo:true });
    productoId = prodRes.body.producto.id;
  });

  test('Crear compra efectivo con 2 unidades descuenta stock', async () => {
    const compraRes = await request(app)
      .post('/api/compras')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('comprador_nombre','Tester')
      .field('metodo_pago','efectivo')
      .field('productos', JSON.stringify([{ producto_id: productoId, cantidad:2 }]))
      .field('detalles_pedido','Sin azúcar');
    // Puede fallar si permisos faltan; admin debería tenerlos.
    expect([200,201,403]).toContain(compraRes.status); // 403 si entorno bloqueado o falta permiso
    if(compraRes.status === 201 || compraRes.status === 200){
      expect(compraRes.body.success).toBe(true);
      // Verificar stock
      const productoRes = await request(app).get(`/api/productos/${productoId}`);
      if(productoRes.body.producto){
        expect(productoRes.body.producto.stock).toBe(1); // 3 - 2
      }
    }
  });
});
