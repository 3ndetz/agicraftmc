import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { paymentAPI } from '../services/api';
import './Donate.css';

function Donate() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await paymentAPI.getProducts();
      setProducts(response.data.products);
    } catch (error) {
      setError('Ошибка загрузки продуктов');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const response = await paymentAPI.createPayment(productId);
      window.location.href = response.data.confirmation_url;
    } catch (error) {
      setError(error.response?.data?.error || 'Ошибка создания платежа');
    }
  };

  // Группировка продуктов по типам
  const ranks = products.filter((p) => p.product_type === 'rank');
  const agicoinsPackages = products.filter((p) => p.product_type === 'agicoins');

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="donate-page">
      <h1>💎 Поддержать проект</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Пакеты AgiCoins */}
      <section className="donate-section">
        <h2>⚡ Пакеты AgiCoins</h2>
        <p className="section-desc">
          AgiCoins можно тратить на покупку рангов в игре через /shop
        </p>
        <div className="products-grid">
          {agicoinsPackages.map((product) => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p className="product-desc">{product.description}</p>
              <div className="product-price">
                {product.price_agicoins} ₽
              </div>
              <button
                onClick={() => handlePurchase(product.id)}
                className="btn btn-primary"
              >
                Купить
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Ранги - 2 месяца */}
      <section className="donate-section">
        <h2>🎖 Ранги (2 месяца)</h2>
        <div className="products-grid ranks-grid">
          {ranks
            .filter((r) => r.duration_days === 60)
            .map((product) => (
              <div key={product.id} className="product-card rank-card">
                <h3>{product.name}</h3>
                <p className="product-desc">{product.description}</p>
                <div className="product-price">
                  {product.price_agicoins} ⚡
                </div>
                <button
                  onClick={() => handlePurchase(product.id)}
                  className="btn btn-primary"
                >
                  Купить
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* Ранги - 6 месяцев */}
      <section className="donate-section">
        <h2>🎖 Ранги (6 месяцев) - скидка 15%</h2>
        <div className="products-grid ranks-grid">
          {ranks
            .filter((r) => r.duration_days === 180)
            .map((product) => (
              <div key={product.id} className="product-card rank-card discount">
                <span className="discount-badge">-15%</span>
                <h3>{product.name}</h3>
                <p className="product-desc">{product.description}</p>
                <div className="product-price">
                  {product.price_agicoins} ⚡
                </div>
                <button
                  onClick={() => handlePurchase(product.id)}
                  className="btn btn-primary"
                >
                  Купить
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* Ранги - 12 месяцев */}
      <section className="donate-section">
        <h2>🎖 Ранги (12 месяцев) - скидка 20%</h2>
        <div className="products-grid ranks-grid">
          {ranks
            .filter((r) => r.duration_days === 365)
            .map((product) => (
              <div key={product.id} className="product-card rank-card discount">
                <span className="discount-badge">-20%</span>
                <h3>{product.name}</h3>
                <p className="product-desc">{product.description}</p>
                <div className="product-price">
                  {product.price_agicoins} ⚡
                </div>
                <button
                  onClick={() => handlePurchase(product.id)}
                  className="btn btn-primary"
                >
                  Купить
                </button>
              </div>
            ))}
        </div>
      </section>

      <div className="donate-info">
        <h3>ℹ️ Информация</h3>
        <ul>
          <li>Платежи обрабатываются через YooKassa (безопасно)</li>
          <li>Ранги активируются автоматически после оплаты</li>
          <li>Вопросы? Пишите в Discord: discord.gg/agicraft</li>
        </ul>
      </div>
    </div>
  );
}

export default Donate;
