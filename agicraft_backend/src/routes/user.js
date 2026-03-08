const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../models/db');

const router = express.Router();

// Получить информацию о текущем пользователе
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        u.id, u.username, u.email, u.minecraft_nickname,
        u.created_at, u.last_login,
        COALESCE(b.balance, 0) as agicoins_balance
      FROM web_users u
      LEFT JOIN web_agicoins_balance b ON u.id = b.user_id
      WHERE u.id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
});

// Получить баланс AgiCoins
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT balance FROM web_agicoins_balance WHERE user_id = $1',
      [req.user.id]
    );

    const balance = result.rows.length > 0 ? result.rows[0].balance : 0;
    res.json({ balance });
  } catch (error) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ error: 'Ошибка получения баланса' });
  }
});

// Получить историю транзакций AgiCoins
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id, amount, transaction_type, description, created_at
      FROM web_agicoins_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ error: 'Ошибка получения транзакций' });
  }
});

// Получить историю донатов (покупок рангов)
router.get('/donations', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        d.id,
        d.amount_paid,
        d.agicoins_purchased,
        p.name as product_name,
        p.description as product_description,
        d.payment_status,
        d.created_at
      FROM web_donations d
      LEFT JOIN web_donate_products p ON d.product_id = p.id
      WHERE d.user_id = $1
      ORDER BY d.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json({ donations: result.rows });
  } catch (error) {
    console.error('Donations fetch error:', error);
    res.status(500).json({ error: 'Ошибка получения истории покупок' });
  }
});

module.exports = router;
