const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../backend/server/.env.test'),
  override: true,
});