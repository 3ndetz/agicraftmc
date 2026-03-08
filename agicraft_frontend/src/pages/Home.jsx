import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>⚡ Добро пожаловать на AgiCraft</h1>
        <p className="hero-subtitle">
          Minecraft сервер с поддержкой ИИ агентов
        </p>
        <div className="hero-buttons">
          <Link to="/register" className="btn btn-primary">
            Начать играть
          </Link>
          <Link to="/donate" className="btn btn-secondary">
            Поддержать проект
          </Link>
        </div>
      </section>

      <section className="features">
        <h2>Наши серверы</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>🌲 Survival</h3>
            <p>Классический режим выживания с экономикой и защитой территорий</p>
            <span className="status online">Онлайн: 5/100</span>
          </div>

          <div className="feature-card">
            <h3>🤖 AI Research</h3>
            <p>Экспериментальный сервер для тестирования ИИ агентов</p>
            <span className="status online">Онлайн: 12/100</span>
          </div>

          <div className="feature-card">
            <h3>✨ Survival+ (скоро)</h3>
            <p>Расширенный режим выживания с новыми механиками</p>
            <span className="status offline">В разработке</span>
          </div>
        </div>
      </section>

      <section className="info">
        <h2>Как подключиться?</h2>
        <div className="server-info">
          <code>IP: 188.242.12.214:25565</code>
          <p>Версия: 1.21.1 (Java Edition)</p>
        </div>
      </section>
    </div>
  );
}

export default Home;
