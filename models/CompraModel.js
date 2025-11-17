// MODELO: Compra
// Maneja todas las operaciones de base de datos relacionadas con compras/ventas
// Parte del patrón MVC - Modelo de datos para compras

const { getDB } = require('./database');

/**
 * Obtener todas las compras
 * @returns {Array} Lista de compras ordenadas por fecha descendente
 */
function obtenerCompras() {
  const db = getDB();
  
  const compras = db.prepare(`
    SELECT 
      id, numero_orden, comprador_nombre, comprador_mesa, comprador_telefono,
      metodo_pago, comprobante_archivo, total, estado, 
      abonado, listo, entregado, detalles_pedido, fecha
    FROM compras
    ORDER BY fecha DESC
  `).all();
  
  db.close();
  
  return compras.map(c => ({
    ...c,
    abonado: Boolean(c.abonado),
    listo: Boolean(c.listo),
    entregado: Boolean(c.entregado)
  }));
}

/**
 * Obtener una compra por ID con sus detalles
 * @param {number} id - ID de la compra
 * @returns {Object|null} Compra con detalles o null si no existe
 */
function obtenerCompraPorId(id) {
  const db = getDB();
  
  const compra = db.prepare(`
    SELECT 
      id, numero_orden, comprador_nombre, comprador_mesa, comprador_telefono,
      metodo_pago, comprobante_archivo, total, estado,
      abonado, listo, entregado, detalles_pedido, fecha
    FROM compras
    WHERE id = ?
  `).get(id);
  
  if (!compra) {
    db.close();
    return null;
  }
  
  const detalles = db.prepare(`
    SELECT 
      dc.id, dc.producto_id, dc.cantidad, dc.precio_unitario, dc.subtotal,
      dc.nombre_producto,
      COALESCE(p.nombre, dc.nombre_producto) as producto_nombre,
      p.categoria, p.imagen_url
    FROM detalles_compra dc
    LEFT JOIN productos p ON dc.producto_id = p.id
    WHERE dc.compra_id = ?
  `).all(id);
  
  db.close();
  
  return {
    ...compra,
    abonado: Boolean(compra.abonado),
    listo: Boolean(compra.listo),
    entregado: Boolean(compra.entregado),
    detalles
  };
}

/**
 * Crear una nueva compra con sus detalles
 * @param {Object} datosCompra - Datos generales de la compra
 * @param {Array} detallesCompra - Lista de productos comprados
 * @returns {Object} Compra creada con su ID y número de orden
 */
function crearCompra(datosCompra, detallesCompra) {
  const db = getDB();
  
  try {
    // Iniciar transacción
    db.prepare('BEGIN TRANSACTION').run();
    
    // Generar número de orden único
    const numeroOrden = `SH-${Date.now()}`;
    
    // Insertar compra
    const stmtCompra = db.prepare(`
      INSERT INTO compras (
        numero_orden, comprador_nombre, comprador_mesa, comprador_telefono,
        metodo_pago, comprobante_archivo, total, estado, detalles_pedido
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const resultCompra = stmtCompra.run(
      numeroOrden,
      datosCompra.comprador_nombre,
      datosCompra.comprador_mesa || null,
      datosCompra.comprador_telefono || null,
      datosCompra.metodo_pago,
      datosCompra.comprobante_archivo || null,
      datosCompra.total,
      'pendiente',
      datosCompra.detalles_pedido || null
    );
    
    const compraId = resultCompra.lastInsertRowid;
    
    // Insertar detalles en tabla detalles_compra
    const stmtDetalle = db.prepare(`
      INSERT INTO detalles_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal, nombre_producto)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const detalle of detallesCompra) {
      stmtDetalle.run(
        compraId,
        detalle.producto_id,
        detalle.cantidad,
        detalle.precio_unitario,
        detalle.subtotal,
        detalle.nombre_producto || null
      );
    }
    
    // NOTA: El stock se descuenta en CompraController.crearCompra()
    // después de crear la compra exitosamente
    
    // Commit
    db.prepare('COMMIT').run();
    
    db.close();
    
    return {
      id: compraId,
      numero_orden: numeroOrden,
      ...datosCompra
    };
    
  } catch (error) {
    // Rollback en caso de error
    db.prepare('ROLLBACK').run();
    db.close();
    throw error;
  }
}

/**
 * Actualizar estado de una compra
 * @param {number} id - ID de la compra
 * @param {Object} nuevoEstado - Objeto con campos a actualizar (estado, abonado, listo, entregado)
 * @returns {boolean} true si se actualizó correctamente
 */
function actualizarEstadoCompra(id, nuevoEstado) {
  const db = getDB();
  
  const campos = {};
  if (nuevoEstado.estado) campos.estado = nuevoEstado.estado;
  if (nuevoEstado.abonado !== undefined) campos.abonado = nuevoEstado.abonado ? 1 : 0;
  if (nuevoEstado.listo !== undefined) campos.listo = nuevoEstado.listo ? 1 : 0;
  if (nuevoEstado.entregado !== undefined) campos.entregado = nuevoEstado.entregado ? 1 : 0;
  
  const setClauses = Object.keys(campos).map(key => `${key} = ?`).join(', ');
  const values = Object.values(campos);
  
  const stmt = db.prepare(`
    UPDATE compras
    SET ${setClauses}
    WHERE id = ?
  `);
  
  const result = stmt.run(...values, id);
  db.close();
  
  return result.changes > 0;
}

/**
 * Obtener estadísticas de ventas
 * @returns {Object} Objeto con estadísticas generales
 */
function obtenerEstadisticasCompras() {
  const db = getDB();
  
  const stats = {
    totalCompras: db.prepare('SELECT COUNT(*) as count FROM compras').get().count,
    totalVentas: db.prepare('SELECT COALESCE(SUM(total), 0) as sum FROM compras WHERE abonado = 1').get().sum,
    comprasPendientes: db.prepare('SELECT COUNT(*) as count FROM compras WHERE estado = "pendiente"').get().count
  };
  
  db.close();
  
  return stats;
}

/**
 * Eliminar una compra (y sus detalles) por ID
 * @param {number} id - ID de la compra a eliminar
 * @returns {boolean} true si se eliminó correctamente
 */
function eliminarCompra(id) {
  const db = getDB();
  
  try {
    // Iniciar transacción
    db.prepare('BEGIN TRANSACTION').run();
    
    // Eliminar detalles de la compra
    db.prepare('DELETE FROM detalle_compra WHERE compra_id = ?').run(id);
    
    // Eliminar la compra
    const result = db.prepare('DELETE FROM compras WHERE id = ?').run(id);
    
    // Confirmar transacción
    db.prepare('COMMIT').run();
    
    db.close();
    
    return result.changes > 0;
  } catch (error) {
    // Revertir transacción en caso de error
    db.prepare('ROLLBACK').run();
    db.close();
    throw error;
  }
}

module.exports = {
  obtenerCompras,
  obtenerCompraPorId,
  crearCompra,
  actualizarEstadoCompra,
  obtenerEstadisticasCompras,
  eliminarCompra
};
