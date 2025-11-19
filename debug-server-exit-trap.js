// Wrapper que intercepta llamadas a process.exit para detectar quién intenta cerrar el proceso
const origExit = process.exit;
process.exit = function(code) {
  try {
    console.error('=== process.exit INTERCEPTADO === code=', code);
    console.error(new Error('Stack trace de quien llamó a process.exit').stack);
    // No llamamos a origExit para evitar que el proceso termine y poder inspeccionar
  } catch (err) {
    // Si algo falla, forzamos la salida para no quedar colgado
    origExit(code);
  }
};

process.on('uncaughtException', (err) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error(err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error(reason && reason.stack ? reason.stack : reason);
});

require('./server');

// Mantener vivo
setInterval(() => {}, 1000);
