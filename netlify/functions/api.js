const serverless = require('serverless-http');
const app = require('../../server');

// Handler serverless para Netlify Functions
exports.handler = serverless(app);
