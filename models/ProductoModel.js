// MODELO: Producto
// Maneja todas las operaciones de base de datos relacionadas con productos
// Parte del patrón MVC - Modelo de datos para productos

const { getDB } = require('./database');

/**
 * Obtener todos los productos activos (para el menú público)
 * @returns {Array} Lista de productos activos
 */
function obtenerProductos() {
  const db = getDB();
  const productos = db.prepare(`
    SELECT id, nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo
    FROM productos
    WHERE activo = 1 AND stock > 0
    ORDER BY categoria, subcategoria, nombre
  `).all();
  db.close();
  
  return productos.map(p => ({
    ...p,
    activo: Boolean(p.activo),
    disponible: p.stock > 0 && Boolean(p.activo)
  }));
}

/**
 * Obtener TODOS los productos (incluyendo inactivos) - para el panel admin
 * @returns {Array} Lista completa de productos
 */
function obtenerTodosLosProductos() {
  const db = getDB();
  const productos = db.prepare(`
    SELECT id, nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo
    FROM productos
    ORDER BY activo DESC, categoria, subcategoria, nombre
  `).all();
  db.close();
  
  return productos.map(p => ({
    ...p,
    activo: Boolean(p.activo),
    disponible: Boolean(p.activo) // Alias para compatibilidad
  }));
}

/**
 * Obtener un producto por ID
 * @param {number} id - ID del producto
 * @returns {Object|null} Producto encontrado o null
 */
function obtenerProductoPorId(id) {
  const db = getDB();
  const producto = db.prepare(`
    SELECT id, nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo
    FROM productos
    WHERE id = ?
  `).get(id);
  db.close();
  
  if (!producto) return null;
  
  return {
    ...producto,
    activo: Boolean(producto.activo),
    disponible: producto.stock > 0 && Boolean(producto.activo)
  };
}

/**
 * Crear un nuevo producto
 * @param {Object} datos - Datos del producto a crear
 * @returns {Object} Producto creado con su ID
 */
function crearProducto(datos) {
  const db = getDB();
  
  const stmt = db.prepare(`
    INSERT INTO productos (nombre, categoria, subcategoria, precio, stock, descripcion, imagen_url, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    datos.nombre,
    datos.categoria,
    datos.subcategoria || null,
    datos.precio,
    datos.stock || 0,
    datos.descripcion || null,
    datos.imagen_url || null,
    datos.activo ? 1 : 0
  );
  
  db.close();
  
  return {
    id: result.lastInsertRowid,
    ...datos,
    activo: Boolean(datos.activo)
  };
}

/**
 * Actualizar un producto existente
 * @param {number} id - ID del producto
 * @param {Object} datos - Datos actualizados
 * @returns {Object|null} Producto actualizado o null si no existe
 */
function actualizarProducto(id, datos) {
  const db = getDB();
  
  const stmt = db.prepare(`
    UPDATE productos
    SET nombre = ?,
        categoria = ?,
        subcategoria = ?,
        precio = ?,
        stock = ?,
        descripcion = ?,
        imagen_url = ?,
        activo = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(
    datos.nombre,
    datos.categoria,
    datos.subcategoria || null,
    datos.precio,
    datos.stock,
    datos.descripcion || null,
    datos.imagen_url || null,
    datos.activo ? 1 : 0,
    id
  );
  
  db.close();
  
  if (result.changes === 0) {
    return null; // No se encontró el producto
  }
  
  return {
    id: parseInt(id),
    ...datos,
    activo: Boolean(datos.activo)
  };
}

/**
 * Eliminar un producto (soft delete - marca como inactivo)
 * @param {number} id - ID del producto
 * @returns {boolean} true si se eliminó correctamente
 */
function eliminarProducto(id) {
  const db = getDB();
  
  const stmt = db.prepare(`
    UPDATE productos
    SET activo = 0
    WHERE id = ?
  `);
  
  const result = stmt.run(id);
  db.close();
  
  return result.changes > 0;
}

/**
 * Eliminar un producto DEFINITIVAMENTE de la base de datos (hard delete)
 * @param {number} id - ID del producto
 * @returns {boolean} true si se eliminó correctamente
 */
function eliminarProductoPermanente(id) {
  const db = getDB();
  
  try {
    // Iniciar transacción para eliminar de forma segura
    db.prepare('BEGIN TRANSACTION').run();
    
    // IMPORTANTE: Primero eliminar detalles_compra asociados
    // Esto es necesario debido a la foreign key constraint
    const stmtDetalles = db.prepare(`
      DELETE FROM detalles_compra
      WHERE producto_id = ?
    `);
    const detallesEliminados = stmtDetalles.run(id);
    
    console.log(`🗑️ Eliminados ${detallesEliminados.changes} detalles de compra del producto ${id}`);
    
    // Ahora sí, eliminar el producto definitivamente
    const stmt = db.prepare(`
      DELETE FROM productos
      WHERE id = ?
    `);
    
    const result = stmt.run(id);
    
    // Confirmar transacción
    db.prepare('COMMIT').run();
    db.close();
    
    return { success: result.changes > 0, detallesEliminados: detallesEliminados.changes };
  } catch (error) {
    // Si hay error, revertir cambios
    try {
      db.prepare('ROLLBACK').run();
    } catch (rollbackError) {
      // Ignorar errores de rollback
    }
    db.close();
    throw error;
  }
}

/**
 * Actualizar solo el stock de un producto
 * @param {number} id - ID del producto
 * @param {number} nuevoStock - Nueva cantidad en stock
 * @returns {boolean} true si se actualizó correctamente
 */
function actualizarStock(id, nuevoStock) {
  const db = getDB();
  
  const stmt = db.prepare(`
    UPDATE productos
    SET stock = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(nuevoStock, id);
  db.close();
  
  return result.changes > 0;
}

/**
 * Descontar stock de un producto (para cuando se confirma una compra)
 * Esta función es CRÍTICA para el control de inventario. Implementa validación
 * atómica con la cláusula WHERE stock >= ? para garantizar que nunca se vuelva
 * negativo el stock, incluso con compras simultáneas.
 * @param {number} id - ID del producto
 * @param {number} cantidad - Cantidad a descontar
 * @returns {boolean} true si se actualizó correctamente
 */
function descontarStock(id, cantidad) {
  const db = getDB();
  
  // Primero verifico que hay stock suficiente antes de intentar descontar.
  // Esto permite dar un mensaje de error más claro para el usuario.
  const producto = db.prepare('SELECT stock FROM productos WHERE id = ?').get(id);
  
  if (!producto) {
    db.close();
    throw new Error(`Producto con ID ${id} no encontrado`);
  }
  
  if (producto.stock < cantidad) {
    db.close();
    throw new Error(`Stock insuficiente para producto ID ${id}. Disponible: ${producto.stock}, Solicitado: ${cantidad}`);
  }
  
  // La cláusula WHERE stock >= ? es FUNDAMENTAL para la atomicidad.
  // SQLite garantiza que esta operación es indivisible. Si dos usuarios
  // intentan comprar simultáneamente el último producto:
  //   - El primero ejecuta: UPDATE ... WHERE stock >= 1 (OK, stock pasa a 0)
  //   - El segundo ejecuta: UPDATE ... WHERE stock >= 1 (FALLA, result.changes = 0)
  // Esto evita condiciones de carrera sin necesidad de locks complejos.
  const stmt = db.prepare(`
    UPDATE productos
    SET stock = stock - ?
    WHERE id = ? AND stock >= ?
  `);
  
  const result = stmt.run(cantidad, id, cantidad);
  db.close();
  
  return result.changes > 0;
}

module.exports = {
  obtenerProductos,
  obtenerTodosLosProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  eliminarProductoPermanente,
  actualizarStock,
  descontarStock
};
