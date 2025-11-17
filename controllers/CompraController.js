// CONTROLADOR: Compra
// Maneja la lógica de negocio para las operaciones de compras/ventas
// Parte del patrón MVC - Controlador que conecta rutas con modelos

const CompraModel = require('../models/CompraModel');
const ProductoModel = require('../models/ProductoModel');

/**
 * Crear una nueva compra
 * POST /api/compras
 */
async function crearCompra(req, res) {
  try {
    console.log('=== INICIO POST /api/compras ===');
    console.log('Body keys:', Object.keys(req.body));
    console.log('File exists:', !!req.file);

    const { comprador_nombre, comprador_telefono, comprador_mesa, metodo_pago, productos, detalles_pedido } = req.body;

    // Normalizar comprador_mesa: convertir string vacío a null
    const mesaNormalizada = comprador_mesa && comprador_mesa !== '' ? parseInt(comprador_mesa) : null;

    // Validar datos obligatorios
    if (!comprador_nombre || !metodo_pago) {
      return res.status(400).json({
        success: false,
        mensaje: 'Faltan datos obligatorios: comprador_nombre y metodo_pago'
      });
    }

    // Validar método de pago
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

    // Parsear productos
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

    // Validar stock de cada producto ANTES de procesar
    for (const item of productosArray) {
      const { producto_id, cantidad } = item;

      const producto = ProductoModel.obtenerProductoPorId(producto_id);

      if (!producto || !producto.activo) {
        return res.status(404).json({
          success: false,
          mensaje: `El producto con ID ${producto_id} no existe o no está disponible`
        });
      }

      // Validación estricta de stock
      if (producto.stock < cantidad) {
        return res.status(400).json({
          success: false,
          mensaje: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}, Solicitado: ${cantidad}`
        });
      }
    }

    // Calcular el total
    let total = 0;
    const itemsConDetalles = productosArray.map(item => {
      const producto = ProductoModel.obtenerProductoPorId(item.producto_id);
      const subtotal = producto.precio * item.cantidad;
      total += subtotal;
      
      return {
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: producto.precio,
        subtotal: subtotal,
        nombre_producto: producto.nombre // Guardar nombre para historial
      };
    });

    // Convertir comprobante a Base64 si existe
    let comprobante_archivo = null;
    if (req.file) {
      const base64String = req.file.buffer.toString('base64');
      comprobante_archivo = `data:${req.file.mimetype};base64,${base64String}`;
    }

    // Crear la compra usando el modelo
    const nuevaCompra = CompraModel.crearCompra(
      {
        comprador_nombre,
        comprador_telefono: comprador_telefono || null,
        comprador_mesa: mesaNormalizada,
        metodo_pago,
        comprobante_archivo,
        total,
        detalles_pedido: detalles_pedido || null
      },
      itemsConDetalles
    );

    // NUEVO: Descontar stock de cada producto después de crear la compra
    try {
      for (const item of itemsConDetalles) {
        ProductoModel.descontarStock(item.producto_id, item.cantidad);
        console.log(`📦 Stock actualizado - Producto ID ${item.producto_id}: -${item.cantidad} unidades`);
      }
    } catch (stockError) {
      console.error('❌ Error al descontar stock:', stockError);
      // Nota: La compra ya fue creada. En producción considerar usar transacciones.
    }

    console.log('✅ Compra creada con ID:', nuevaCompra.id);
    console.log('📦 Número de orden:', nuevaCompra.numero_orden);

    res.status(201).json({
      success: true,
      mensaje: 'Compra registrada exitosamente',
      compra: nuevaCompra
    });

  } catch (error) {
    console.error('Error al crear compra:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al procesar la compra'
    });
  }
}

/**
 * Listar todas las compras
 * GET /api/compras
 */
async function listarCompras(req, res) {
  try {
    // Obtener todas las compras del modelo
    const compras = CompraModel.obtenerCompras();

    // Para cada compra, obtener los detalles
    const comprasConDetalles = compras.map(compra => {
      const compraDetallada = CompraModel.obtenerCompraPorId(compra.id);
      return compraDetallada;
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
}

/**
 * Obtener detalle de una compra específica
 * GET /api/compras/:id
 */
async function obtenerCompraPorId(req, res) {
  try {
    const { id } = req.params;

    const compra = CompraModel.obtenerCompraPorId(id);

    if (!compra) {
      return res.status(404).json({
        success: false,
        mensaje: 'Compra no encontrada'
      });
    }

    res.json({
      success: true,
      compra: compra
    });

  } catch (error) {
    console.error('Error al obtener detalle de compra:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener el detalle de la compra'
    });
  }
}

/**
 * Actualizar estado de una compra
 * PATCH /api/compras/:id/estado
 */
async function actualizarEstadoCompra(req, res) {
  try {
    const { id } = req.params;
    const { abonado, listo, entregado, estado } = req.body;

    console.log('🔄 Actualizando estado de compra ID:', id);

    const compra = CompraModel.obtenerCompraPorId(id);

    if (!compra) {
      return res.status(404).json({
        success: false,
        mensaje: 'Compra no encontrada'
      });
    }

    // Actualizar estado usando el modelo
    const actualizado = CompraModel.actualizarEstadoCompra(id, { abonado, listo, entregado, estado });

    if (!actualizado) {
      return res.status(500).json({
        success: false,
        mensaje: 'Error al actualizar el estado'
      });
    }

    console.log('✅ Estado actualizado');

    // Obtener compra actualizada
    const compraActualizada = CompraModel.obtenerCompraPorId(id);

    res.json({
      success: true,
      mensaje: 'Estado actualizado correctamente',
      compra: compraActualizada
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar el estado de la compra'
    });
  }
}

/**
 * Obtener estadísticas de ventas
 * GET /api/compras/estadisticas/ventas
 */
async function obtenerEstadisticas(req, res) {
  try {
    const stats = CompraModel.obtenerEstadisticasCompras();

    res.json({
      success: true,
      estadisticas: stats
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener las estadísticas'
    });
  }
}

/**
 * Eliminar una compra
 * DELETE /api/compras/:id
 */
async function eliminarCompra(req, res) {
  try {
    const { id } = req.params;

    // Validar que el ID sea válido
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de compra inválido'
      });
    }

    // Verificar que la compra existe
    const compraExistente = CompraModel.obtenerCompraPorId(parseInt(id));
    
    if (!compraExistente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Compra no encontrada'
      });
    }

    // Eliminar la compra
    const eliminado = CompraModel.eliminarCompra(parseInt(id));

    if (eliminado) {
      res.json({
        success: true,
        mensaje: 'Compra eliminada correctamente'
      });
    } else {
      res.status(500).json({
        success: false,
        mensaje: 'No se pudo eliminar la compra'
      });
    }

  } catch (error) {
    console.error('Error al eliminar compra:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar la compra'
    });
  }
}

module.exports = {
  crearCompra,
  listarCompras,
  obtenerCompraPorId,
  actualizarEstadoCompra,
  obtenerEstadisticas,
  eliminarCompra
};
