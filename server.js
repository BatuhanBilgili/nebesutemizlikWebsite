const { app, prepare } = require('./server-app');
const PORT = process.env.PORT || 3000;

prepare().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});


