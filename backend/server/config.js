require('dotenv').config();

module.exports = {
  port: process.env.PORT,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  environment: process.env.NODE_ENV
};