// API de compras para la DEMO
// Acá se registran las compras, se valida el stock y se guarda el comprobante
// IMPORTANTE: Esta es una versión DEMO que usa JSON como base de datos
// Las compras se SIMULAN, NO modifican el JSON (solo lectura)

const express = require('express');
const router = express.Router();
const db = require('../db/json-db');
const multer = require('multer');
const { verificarAutenticacion, verificarPermiso } = require('../middleware/auth');

// Configuración de multer para mantener archivo en MEMORIA
// Esto permite subir comprobantes en la simulación
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 3 * 1024 * 1024 // Máximo 3MB
  },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|webp/;
    const mimetype = tiposPermitidos.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, WEBP)'));
    }
  }
});

// 🛍️ POST /api/compras - Crear una nueva compra
// Esta ruta es pública, cualquier comprador puede usarla
// IMPORTANTE: En esta DEMO, solo SIMULA la compra, NO modifica el JSON
router.post('/', upload.single('comprobante'), async (req, res) => {
  try {
    console.log('=== INICIO POST /api/compras (DEMO) ===');
    console.log('Body keys:', Object.keys(req.body));
    console.log('File exists:', !!req.file);

    const { comprador_nombre, comprador_telefono, comprador_mesa, metodo_pago, productos, detalles_pedido } = req.body;

    // Normalizar comprador_mesa: convertir string vacío a null
    const mesaNormalizada = comprador_mesa && comprador_mesa !== '' ? parseInt(comprador_mesa) : null;

    // Validamos los datos obligatorios
    if (!comprador_nombre || !metodo_pago) {
      return res.status(400).json({
        success: false,
        mensaje: 'Faltan datos obligatorios: comprador_nombre y metodo_pago'
      });
    }

    // Validamos el método de pago
    if (!['efectivo', 'transferencia'].includes(metodo_pago)) {
      return res.status(400).json({
        success: false,
        mensaje: 'El método de pago debe ser "efectivo" o "transferencia"'
      });
    }

    // Si es transferencia, debe haber comprobante
    if (metodo_pago === 'transferencia' && !req.file) {
      return res.status(400).json({
        success: false,
        mensaje: 'Para transferencia es obligatorio subir el comprobante'
      });
    }

    // Parseamos los productos
    let productosArray;
    try {
      productosArray = typeof productos === 'string' ? JSON.parse(productos) : productos;
    } catch (error) {
      return res.status(400).json({
        success: false,
        mensaje: 'El formato de productos es inválido'
      });
    }

    if (!Array.isArray(productosArray) || productosArray.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Debe incluir al menos un producto'
      });
    }

    // Validamos el stock de cada producto (sin modificar nada)
    for (const item of productosArray) {
      const { producto_id, cantidad } = item;

      const producto = db.obtenerProductoPorId(producto_id);

      if (!producto || !producto.activo) {
        return res.status(404).json({
          success: false,
          mensaje: `El producto con ID ${producto_id} no existe o no está disponible`
        });
      }

      if (producto.stock < cantidad) {
        return res.status(400).json({
          success: false,
          mensaje: `No hay suficiente stock de ${producto.nombre}. Stock disponible: ${producto.stock}`
        });
      }
    }

    // Calculamos el total
    let total = 0;
    const itemsConDetalles = productosArray.map(item => {
      const producto = db.obtenerProductoPorId(item.producto_id);
      const subtotal = producto.precio * item.cantidad;
      total += subtotal;
      
      return {
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: producto.precio,
        subtotal: subtotal
      };
    });

    // Convertimos el comprobante a Base64 si existe
    let comprobante_archivo = null;
    if (req.file) {
      const base64String = req.file.buffer.toString('base64');
      comprobante_archivo = `data:${req.file.mimetype};base64,${base64String}`;
    }

    // SIMULAMOS la creación de la compra
    const nuevaCompra = db.simularCrearCompra({
      comprador_nombre,
      comprador_telefono: comprador_telefono || null,
      comprador_mesa: mesaNormalizada,
      metodo_pago,
      comprobante_archivo,
      total,
      detalles_pedido: detalles_pedido || null,
      items: itemsConDetalles
    });

    console.log('✅ DEMO: Compra simulada con ID:', nuevaCompra.id);
    console.log('⚠️ NOTA: Esta compra NO se guardó realmente en la base de datos (es solo para demo)');

    res.status(201).json({
      success: true,
      mensaje: 'Compra registrada exitosamente (simulado para demo)',
      compra: nuevaCompra,
      demo: true
    });

  } catch (error) {
    console.error('Error al crear compra:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al procesar la compra'
    });
  }
});

// 📋 GET /api/compras - Listar todas las compras
// Solo usuarios con permiso 'ver_compras' pueden hacer esto
router.get('/', verificarAutenticacion, verificarPermiso('ver_compras'), async (req, res) => {
  try {
    // Obtenemos todas las compras del JSON
    const compras = db.obtenerTodasLasCompras();

    // Para cada compra, agregamos los nombres de los productos en el detalle
    const comprasConDetalles = compras.map(compra => {
      const items = compra.items.map(item => {
        const producto = db.obtenerProductoPorId(item.producto_id);
        return {
          ...item,
          producto_nombre: producto ? producto.nombre : 'Producto desconocido'
        };
      });

      return {
        ...compra,
        detalles: items
      };
    });

    res.json({
      success: true,
      compras: comprasConDetalles
    });

  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener las compras'
    });
  }
});

// 🔍 GET /api/compras/:id - Obtener detalle de una compra específica
// Solo usuarios con permiso 'ver_compras' pueden hacer esto
router.get('/:id', verificarAutenticacion, verificarPermiso('ver_compras'), async (req, res) => {
  try {
    const { id } = req.params;

    const compra = db.obtenerCompraPorId(id);

    if (!compra) {
      return res.status(404).json({
        success: false,
        mensaje: 'Compra no encontrada'
      });
    }

    // Agregamos los nombres de los productos
    const detalleConNombres = compra.items.map(item => {
      const producto = db.obtenerProductoPorId(item.producto_id);
      return {
        ...item,
        producto_nombre: producto ? producto.nombre : 'Producto desconocido'
      };
    });

    res.json({
      success: true,
      compra: compra,
      detalle: detalleConNombres
    });

  } catch (error) {
    console.error('Error al obtener detalle de compra:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener el detalle de la compra'
    });
  }
});

// 🔄 PUT /api/compras/:id/productos - Actualizar productos de una compra
// Solo usuarios con permiso 'editar_compras' pueden hacer esto
// IMPORTANTE: En esta DEMO, solo SIMULA la actualización, NO modifica el JSON
router.put('/:id/productos', verificarAutenticacion, verificarPermiso('editar_compras'), async (req, res) => {
  try {
    const { id } = req.params;
    const { productos } = req.body;

    console.log('✨ DEMO: Simulando actualización de productos de compra ID:', id);

    // Validar que exista la compra
    const compra = db.obtenerCompraPorId(id);
    if (!compra) {
      return res.status(404).json({
        success: false,
        mensaje: 'Compra no encontrada'
      });
    }

    // Validar que se envíen productos
    if (!productos || productos.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Debe enviar al menos un producto'
      });
    }

    // Calcular el nuevo total
    let nuevoTotal = 0;
    for (const prod of productos) {
      nuevoTotal += parseFloat(prod.subtotal);
    }

    console.log('✅ DEMO: Productos actualizados');
    console.log('⚠️ NOTA: Este cambio NO se guardó realmente en la base de datos (es solo para demo)');

    res.json({
      success: true,
      mensaje: 'Productos actualizados correctamente (simulado para demo)',
      nuevoTotal: nuevoTotal,
      demo: true
    });

  } catch (error) {
    console.error('Error al actualizar productos:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar los productos'
    });
  }
});

// 📊 GET /api/compras/estadisticas/ventas - Obtener estadísticas de ventas
// Solo usuarios con permiso 'ver_compras' pueden hacer esto
router.get('/estadisticas/ventas', verificarAutenticacion, verificarPermiso('ver_compras'), async (req, res) => {
  try {
    const compras = db.obtenerTodasLasCompras();
    const totalVentas = db.obtenerTotalVentas();

    // Ventas por método de pago
    const ventasPorMetodo = {};
    compras.forEach(compra => {
      if (!ventasPorMetodo[compra.metodo_pago]) {
        ventasPorMetodo[compra.metodo_pago] = { cantidad: 0, monto: 0 };
      }
      ventasPorMetodo[compra.metodo_pago].cantidad++;
      ventasPorMetodo[compra.metodo_pago].monto += compra.total;
    });

    // Productos más vendidos
    const productosVendidos = {};
    compras.forEach(compra => {
      compra.items.forEach(item => {
        const producto = db.obtenerProductoPorId(item.producto_id);
        if (!productosVendidos[item.producto_id]) {
          productosVendidos[item.producto_id] = {
            nombre: producto ? producto.nombre : 'Desconocido',
            cantidad_vendida: 0,
            monto_total: 0
          };
        }
        productosVendidos[item.producto_id].cantidad_vendida += item.cantidad;
        productosVendidos[item.producto_id].monto_total += item.subtotal;
      });
    });

    const productosMasVendidos = Object.values(productosVendidos)
      .sort((a, b) => b.cantidad_vendida - a.cantidad_vendida)
      .slice(0, 10);

    res.json({
      success: true,
      estadisticas: {
        total_ventas: {
          total: compras.length,
          monto_total: totalVentas
        },
        ventas_por_metodo: Object.entries(ventasPorMetodo).map(([metodo, datos]) => ({
          metodo_pago: metodo,
          ...datos
        })),
        productos_mas_vendidos: productosMasVendidos
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener las estadísticas'
    });
  }
});

// 🔄 PATCH /api/compras/:id/estado - Actualizar estado de una compra
// IMPORTANTE: En esta DEMO, solo SIMULA la actualización, NO modifica el JSON
router.patch('/:id/estado', verificarAutenticacion, verificarPermiso('editar_compras'), async (req, res) => {
  try {
    const { id } = req.params;
    const { abonado, listo, entregado } = req.body;

    console.log('✨ DEMO: Simulando actualización de estado de compra ID:', id);

    const compra = db.obtenerCompraPorId(id);

    if (!compra) {
      return res.status(404).json({
        success: false,
        mensaje: 'Compra no encontrada'
      });
    }

    // Simular actualización
    const compraActualizada = db.simularActualizarCompra(id, { abonado, listo, entregado });

    console.log('✅ DEMO: Estado actualizado');
    console.log('⚠️ NOTA: Este cambio NO se guardó realmente en la base de datos (es solo para demo)');

    res.json({
      success: true,
      mensaje: 'Estado actualizado correctamente (simulado para demo)',
      compra: compraActualizada,
      demo: true
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar el estado de la compra'
    });
  }
});

// 🗑️ DELETE /api/compras/:id - Eliminar una compra
// IMPORTANTE: En esta DEMO, solo SIMULA la eliminación, NO modifica el JSON
router.delete('/:id', verificarAutenticacion, verificarPermiso('eliminar_compras'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('✨ DEMO: Simulando eliminación de compra ID:', id);

    const compra = db.obtenerCompraPorId(id);

    if (!compra) {
      return res.status(404).json({
        success: false,
        mensaje: 'Compra no encontrada'
      });
    }

    console.log('✅ DEMO: Compra eliminada');
    console.log('⚠️ NOTA: Este cambio NO se guardó realmente en la base de datos (es solo para demo)');

    res.json({
      success: true,
      mensaje: 'Compra eliminada correctamente (simulado para demo)',
      demo: true
    });

  } catch (error) {
    console.error('Error al eliminar compra:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar la compra'
    });
  }
});

// ✏️ PUT /api/compras/:id - Actualizar información de una compra
// IMPORTANTE: En esta DEMO, solo SIMULA la actualización, NO modifica el JSON
router.put('/:id', verificarAutenticacion, verificarPermiso('editar_compras'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comprador_nombre, comprador_telefono, comprador_mesa } = req.body;

    console.log('✨ DEMO: Simulando actualización de compra ID:', id);

    const compra = db.obtenerCompraPorId(id);

    if (!compra) {
      return res.status(404).json({
        success: false,
        mensaje: 'Compra no encontrada'
      });
    }

    const compraActualizada = db.simularActualizarCompra(id, {
      comprador_nombre,
      comprador_telefono,
      comprador_mesa
    });

    console.log('✅ DEMO: Compra actualizada');
    console.log('⚠️ NOTA: Este cambio NO se guardó realmente en la base de datos (es solo para demo)');

    res.json({
      success: true,
      mensaje: 'Compra actualizada correctamente (simulado para demo)',
      compra: compraActualizada,
      demo: true
    });

  } catch (error) {
    console.error('Error al actualizar compra:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar la compra'
    });
  }
});

module.exports = router;
