// Wrapper para capturar excepciones no manejadas y arrancar server.js
process.on('uncaughtException', (err) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error(err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error(reason && reason.stack ? reason.stack : reason);
});

require('./server');

// Mantener el proceso vivo para inspección (si el server no se cae)
setInterval(() => {}, 1000);
