// Módulo de conexión a SQLite con soporte para Vercel
// En Vercel copia la DB a /tmp (permite escritura)

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Detectar si estamos en Vercel
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Path a la base de datos
const DB_PATH = IS_VERCEL 
  ? '/tmp/sanpaholmes.db'
  : path.join(__dirname, '..', 'db', 'sanpaholmes.db');

// En Vercel, copiar DB de assets a /tmp al iniciar
if (IS_VERCEL) {
  const SOURCE_DB = path.join(__dirname, '..', 'db', 'sanpaholmes.db');
  
  if (!fs.existsSync(DB_PATH) && fs.existsSync(SOURCE_DB)) {
    try {
      fs.copyFileSync(SOURCE_DB, DB_PATH);
      console.log('OK: DB copiada a /tmp para Vercel');
    } catch (error) {
      console.error('ERROR: Error al copiar DB:', error);
    }
  }
}

/**
 * Obtener conexión a la base de datos
 * @returns {Database} Instancia de la base de datos
 */
function getDB() {
  try {
    const db = new Database(DB_PATH, { 
      fileMustExist: false
    });
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    return db;
  } catch (error) {
    console.error('ERROR: Error al conectar DB:', error);
    throw error;
  }
}

module.exports = { getDB, IS_VERCEL };
