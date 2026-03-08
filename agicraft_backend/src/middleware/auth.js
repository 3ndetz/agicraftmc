const jwt = require('jsonwebtoken');
const db = require('../models/db');

// Middleware для проверки JWT токена
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Проверяем, существует ли пользователь в БД
    const result = await db.query(
      'SELECT id, username, email, minecraft_nickname FROM web_users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Пользователь не найден' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Токен истёк' });
    }
    return res.status(403).json({ error: 'Недействительный токен' });
  }
};

// Middleware для проверки ai_research роли
const requireAIAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  try {
    // Проверяем наличие ai_research роли через LuckPerms
    const result = await db.query(`
      SELECT 1 FROM luckperms_user_permissions
      WHERE uuid = (SELECT minecraft_uuid FROM web_users WHERE id = $1)
      AND permission = 'server.ai_research'
      LIMIT 1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(403).json({
        error: 'Доступ запрещён. Требуется роль ai_research'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking AI access:', error);
    return res.status(500).json({ error: 'Ошибка проверки прав доступа' });
  }
};

module.exports = {
  authenticateToken,
  requireAIAccess
};
