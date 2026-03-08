const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/db');

const router = express.Router();

// Регистрация нового пользователя
router.post('/register', async (req, res) => {
  const { username, email, password, minecraft_nickname } = req.body;

  // Валидация
  if (!username || !email || !password || !minecraft_nickname) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Пароль должен содержать минимум 8 символов' });
  }

  try {
    // Проверяем, существует ли уже такой пользователь
    const existingUser = await db.query(
      'SELECT id FROM web_users WHERE username = $1 OR email = $2 OR minecraft_nickname = $3',
      [username, email, minecraft_nickname]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Пользователь с таким логином, email или Minecraft ником уже существует'
      });
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаём пользователя
    const result = await db.query(
      `INSERT INTO web_users (username, email, password_hash, minecraft_nickname, minecraft_uuid)
       VALUES ($1, $2, $3, $4, NULL)
       RETURNING id, username, email, minecraft_nickname, created_at`,
      [username, email, passwordHash, minecraft_nickname]
    );

    const user = result.rows[0];

    // Генерируем JWT токен
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Регистрация успешна',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        minecraft_nickname: user.minecraft_nickname,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// Вход в систему
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны' });
  }

  try {
    // Ищем пользователя
    const result = await db.query(
      'SELECT id, username, email, password_hash, minecraft_nickname FROM web_users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const user = result.rows[0];

    // Проверяем пароль
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Генерируем JWT токен
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Обновляем last_login
    await db.query(
      'UPDATE web_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      message: 'Вход выполнен',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        minecraft_nickname: user.minecraft_nickname
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

// Проверка токена
router.get('/verify', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query(
      'SELECT id, username, email, minecraft_nickname FROM web_users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Пользователь не найден' });
    }

    res.json({ valid: true, user: result.rows[0] });
  } catch (error) {
    res.status(403).json({ valid: false, error: 'Недействительный токен' });
  }
});

module.exports = router;
