const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Token yok' });

  try {
    const decoded = jwt.verify(token, 'jwt_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token geçersiz' });
  }
}

module.exports = verifyToken;