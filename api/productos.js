// API de productos para la DEMO
// Acá está todo lo relacionado con listar, crear, editar y eliminar productos
// IMPORTANTE: Esta es una versión DEMO que usa JSON como base de datos
// Las operaciones de escritura (crear/editar/eliminar) solo se simulan, NO modifican el JSON

const express = require('express');
const router = express.Router();
const db = require('../db/json-db');
const { verificarAutenticacion, verificarPermiso } = require('../middleware/auth');

// 📋 GET /api/productos - Listar todos los productos activos
// Esta ruta es pública, cualquiera puede ver los productos
// SOLO devuelve productos con activo = true (para el menú público)
router.get('/', async (req, res) => {
  try {
    const { categoria, subcategoria } = req.query;

    // Obtenemos productos activos desde el JSON
    const filtros = {};
    if (categoria) filtros.categoria = categoria;
    if (subcategoria) filtros.subcategoria = subcategoria;

    const productos = db.obtenerProductosActivos(filtros);

    console.log(`📋 GET /api/productos - Devolviendo ${productos.length} productos`);
    if (productos.length > 0) {
      console.log('Ejemplo primer producto:', {
        id: productos[0].id,
        nombre: productos[0].nombre,
        categoria: productos[0].categoria,
        subcategoria: productos[0].subcategoria,
        activo: productos[0].activo
      });
    }

    // Headers para evitar caché
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({
      success: true,
      productos: productos
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener los productos'
    });
  }
});

// 🔐 GET /api/productos/admin/all - Listar TODOS los productos (activos e inactivos)
// Esta ruta es solo para administradores autenticados
router.get('/admin/all', verificarAutenticacion, async (req, res) => {
  try {
    const { categoria, subcategoria } = req.query;

    // Obtenemos TODOS los productos desde el JSON
    const filtros = {};
    if (categoria) filtros.categoria = categoria;
    if (subcategoria) filtros.subcategoria = subcategoria;

    const productos = db.obtenerTodosLosProductos(filtros);

    console.log(`🔐 GET /api/productos/admin/all - Devolviendo ${productos.length} productos (incluyendo inactivos)`);

    res.json({
      success: true,
      productos: productos
    });

  } catch (error) {
    console.error('Error al obtener todos los productos:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener los productos'
    });
  }
});

// 🔍 GET /api/productos/:id - Obtener un producto específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const producto = db.obtenerProductoPorId(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      producto: producto
    });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener el producto'
    });
  }
});

// ➕ POST /api/productos - Crear un nuevo producto
// Solo usuarios con permiso 'gestionar_productos' pueden hacer esto
// IMPORTANTE: En esta DEMO, solo SIMULA la creación, NO modifica el JSON
router.post('/', verificarAutenticacion, verificarPermiso('gestionar_productos'), async (req, res) => {
  try {
    const { nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo } = req.body;

    console.log('✨ DEMO: Simulando creación de producto:', {
      nombre,
      categoria,
      subcategoria,
      precio
    });

    // Validamos que los campos obligatorios estén presentes
    if (!nombre || !categoria || !precio) {
      return res.status(400).json({
        success: false,
        mensaje: 'Faltan datos obligatorios: nombre, categoria y precio'
      });
    }

    // SIMULAMOS la creación del producto
    const nuevoProducto = db.simularCrearProducto({
      nombre,
      categoria,
      subcategoria: subcategoria || null,
      precio,
      stock: stock || 0,
      descripcion: descripcion || null,
      imagen_url: imagen_url || null,
      activo: activo !== undefined ? activo : true
    });

    console.log('✅ DEMO: Producto simulado con ID:', nuevoProducto.id);
    console.log('⚠️ NOTA: Este producto NO se guardó realmente en la base de datos (es solo para demo)');

    res.status(201).json({
      success: true,
      mensaje: 'Producto creado exitosamente (simulado para demo)',
      producto: nuevoProducto,
      demo: true
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear el producto'
    });
  }
});

// ✏️ PUT /api/productos/:id - Actualizar un producto
// Solo usuarios con permiso 'gestionar_productos' pueden hacer esto
// IMPORTANTE: En esta DEMO, solo SIMULA la actualización, NO modifica el JSON
router.put('/:id', verificarAutenticacion, verificarPermiso('gestionar_productos'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo } = req.body;

    console.log('✨ DEMO: Simulando actualización de producto ID:', id);

    // Verificamos que el producto existe en el JSON
    const productoExiste = db.obtenerProductoPorId(id);

    if (!productoExiste) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado'
      });
    }

    // SIMULAMOS la actualización del producto
    const productoActualizado = db.simularActualizarProducto(id, {
      nombre,
      categoria,
      subcategoria,
      precio,
      stock,
      descripcion,
      imagen_url,
      activo
    });

    console.log('✅ DEMO: Producto actualizado ID:', id);
    console.log('⚠️ NOTA: Este cambio NO se guardó realmente en la base de datos (es solo para demo)');

    res.json({
      success: true,
      mensaje: 'Producto actualizado exitosamente (simulado para demo)',
      producto: productoActualizado,
      demo: true
    });

  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar el producto'
    });
  }
});

// 🗑️ DELETE /api/productos/:id - Eliminar (desactivar) un producto
// En realidad no lo borramos, solo lo marcamos como inactivo
// Solo usuarios con permiso 'gestionar_productos' pueden hacer esto
// IMPORTANTE: En esta DEMO, solo SIMULA la eliminación, NO modifica el JSON
router.delete('/:id', verificarAutenticacion, verificarPermiso('gestionar_productos'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('✨ DEMO: Simulando eliminación de producto ID:', id);

    // Verificamos que el producto existe en el JSON
    const productoExiste = db.obtenerProductoPorId(id);

    if (!productoExiste) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado'
      });
    }

    // SIMULAMOS la eliminación (marcado como inactivo)
    const productoEliminado = db.simularEliminarProducto(id);

    console.log('✅ DEMO: Producto marcado como inactivo:', {
      id: productoEliminado.id,
      nombre: productoEliminado.nombre,
      activo: productoEliminado.activo
    });
    console.log('⚠️ NOTA: Este cambio NO se guardó realmente en la base de datos (es solo para demo)');

    res.json({
      success: true,
      mensaje: 'Producto eliminado exitosamente (simulado para demo)',
      demo: true
    });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar el producto'
    });
  }
});

module.exports = router;
