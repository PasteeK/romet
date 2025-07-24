const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token OK :', decoded);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token invalide' });
  }
}

module.exports = { authenticateToken };
