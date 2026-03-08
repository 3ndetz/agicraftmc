const express = require('express');
const db = require('../models/db');

const router = express.Router();

// Получить список новостей (публичный endpoint)
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await db.query(`
      SELECT n.id, n.title, n.content,
             COALESCE(u.username, 'Администратор') AS author,
             n.created_at, n.updated_at
      FROM web_news n
      LEFT JOIN web_users u ON n.author_id = u.id
      WHERE n.is_published = TRUE
      ORDER BY n.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({ news: result.rows });
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ error: 'Ошибка получения новостей' });
  }
});

// Получить одну новость по ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      SELECT n.id, n.title, n.content,
             COALESCE(u.username, 'Администратор') AS author,
             n.created_at, n.updated_at
      FROM web_news n
      LEFT JOIN web_users u ON n.author_id = u.id
      WHERE n.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Новость не найдена' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ error: 'Ошибка получения новости' });
  }
});

module.exports = router;
