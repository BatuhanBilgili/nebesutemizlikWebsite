const { app, prepare } = require('../server-app');

module.exports = async (req, res) => {
  try {
    await prepare();
    return app(req, res);
  } catch (err) {
    console.error('Error in serverless handler:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
};


