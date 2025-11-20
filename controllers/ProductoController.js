// CONTROLADOR: Producto
// Maneja la lógica de negocio para las operaciones de productos
// Parte del patrón MVC - Controlador que conecta rutas con modelos

const ProductoModel = require('../models/ProductoModel');

/**
 * Listar todos los productos activos (para el menú público)
 * GET /api/productos
 */
async function listarProductos(req, res) {
  try {
    const { categoria, subcategoria } = req.query;

    // Obtener productos activos desde el modelo
    let productos = ProductoModel.obtenerProductos();
    
    // Aplicar filtros si se proporcionan
    if (categoria) {
      productos = productos.filter(p => p.categoria === categoria);
    }
    if (subcategoria) {
      productos = productos.filter(p => p.subcategoria === subcategoria);
    }

    console.log(`📋 GET /api/productos - Devolviendo ${productos.length} productos`);

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
}

/**
 * Listar TODOS los productos (activos e inactivos) - Solo para administradores
 * GET /api/productos/admin/all
 */
async function listarTodosLosProductos(req, res) {
  try {
    const productos = ProductoModel.obtenerTodosLosProductos();

    console.log(`🔐 GET /api/productos/admin/all - Devolviendo ${productos.length} productos (activos + inactivos)`);

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
}

/**
 * Obtener un producto específico por ID
 * GET /api/productos/:id
 */
async function obtenerProductoPorId(req, res) {
  try {
    const { id } = req.params;

    const producto = ProductoModel.obtenerProductoPorId(id);

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
}

/**
 * Crear un nuevo producto
 * POST /api/productos
 */
async function crearProducto(req, res) {
  try {
    const { nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo } = req.body;

    console.log('➕ Creando nuevo producto:', { nombre, categoria, subcategoria, precio });

    // Validar campos obligatorios
    if (!nombre || !categoria || !subcategoria || precio === undefined) {
      return res.status(400).json({
        success: false,
        mensaje: 'Faltan datos obligatorios: nombre, categoria, subcategoria y precio'
      });
    }

    // Crear el producto usando el modelo
    const nuevoProducto = ProductoModel.crearProducto({
      nombre,
      categoria,
      subcategoria,
      precio: parseFloat(precio),
      stock: parseInt(stock) || 0,
      descripcion: descripcion || null,
      imagen_url: imagen_url || null,
      activo: activo !== undefined ? activo : true
    });

    console.log('✅ Producto creado con ID:', nuevoProducto.id);

    res.status(201).json({
      success: true,
      mensaje: 'Producto creado exitosamente',
      producto: nuevoProducto
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear el producto'
    });
  }
}

/**
 * Actualizar un producto existente
 * PUT /api/productos/:id
 */
async function actualizarProducto(req, res) {
  try {
    const { id } = req.params;
    const { nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo } = req.body;

    console.log('✏️ Actualizando producto ID:', id);

    // Verificar que el producto existe
    const productoExiste = ProductoModel.obtenerProductoPorId(id);

    if (!productoExiste) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado'
      });
    }

    // Validar campos obligatorios si se proporcionan
    if (nombre !== undefined && !nombre) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre no puede estar vacío'
      });
    }

    if (categoria !== undefined && !categoria) {
      return res.status(400).json({
        success: false,
        mensaje: 'La categoría no puede estar vacía'
      });
    }

    if (subcategoria !== undefined && !subcategoria) {
      return res.status(400).json({
        success: false,
        mensaje: 'La subcategoría no puede estar vacía'
      });
    }

    // Actualizar el producto usando el modelo
    const productoActualizado = ProductoModel.actualizarProducto(id, {
      nombre: nombre || productoExiste.nombre,
      categoria: categoria || productoExiste.categoria,
      subcategoria: subcategoria !== undefined ? subcategoria : productoExiste.subcategoria,
      precio: precio !== undefined ? parseFloat(precio) : productoExiste.precio,
      stock: stock !== undefined ? parseInt(stock) : productoExiste.stock,
      descripcion: descripcion !== undefined ? descripcion : productoExiste.descripcion,
      imagen_url: imagen_url !== undefined ? imagen_url : productoExiste.imagen_url,
      activo: activo !== undefined ? activo : productoExiste.activo
    });

    console.log('✅ Producto actualizado ID:', id);

    res.json({
      success: true,
      mensaje: 'Producto actualizado exitosamente',
      producto: productoActualizado
    });

  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar el producto'
    });
  }
}

/**
 * Eliminar (desactivar) un producto o eliminarlo definitivamente
 * DELETE /api/productos/:id?permanent=true
 */
async function eliminarProducto(req, res) {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    console.log('🗑️ Eliminando producto ID:', id, permanent ? '(DEFINITIVO)' : '(soft delete)');

    // Verificar que el producto existe
    const productoExiste = ProductoModel.obtenerProductoPorId(id);

    if (!productoExiste) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado'
      });
    }

    // Si permanent=true, eliminar definitivamente
    if (permanent === 'true') {
      const eliminadoPermanente = ProductoModel.eliminarProductoPermanente(id);

      if (!eliminadoPermanente) {
        return res.status(500).json({
          success: false,
          mensaje: 'Error al eliminar el producto definitivamente'
        });
      }

      console.log('🗑️ Producto ELIMINADO DEFINITIVAMENTE:', id);

      return res.json({
        success: true,
        mensaje: 'Producto eliminado definitivamente de la base de datos'
      });
    }

    // Soft delete (desactivar)
    const eliminado = ProductoModel.eliminarProducto(id);

    if (!eliminado) {
      return res.status(500).json({
        success: false,
        mensaje: 'Error al eliminar el producto'
      });
    }

    console.log('✅ Producto marcado como inactivo:', id);

    res.json({
      success: true,
      mensaje: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar el producto'
    });
  }
}

module.exports = {
  listarProductos,
  listarTodosLosProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
};
