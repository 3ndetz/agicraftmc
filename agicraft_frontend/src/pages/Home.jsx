import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Home.css';

function ServerStatus({ server, loading }) {
  if (loading) {
    return <span className="server-status status-loading">Проверка…</span>;
  }
  if (!server) {
    return <span className="server-status status-offline">Недоступен</span>;
  }
  return server.online
    ? <span className="server-status status-online">{server.players}/{server.maxPlayers} онлайн</span>
    : <span className="server-status status-offline">Недоступен</span>;
}

function Home() {
  const [servers, setServers] = useState([]);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    api.get('/servers/status')
      .then((res) => setServers(res.data.servers || []))
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  const getServer = (id) => servers.find((s) => s.id === id) || null;

  return (
    <div className="home">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">Minecraft · Java 1.21.1</div>
          <h1 className="hero-title">AgiCraft</h1>
          <p className="hero-subtitle">
            Minecraft-сервер с поддержкой ИИ-агентов. Исследуй, экспериментируй, создавай.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">Начать играть</Link>
            <Link to="/donate" className="btn btn-secondary">Поддержать проект</Link>
          </div>
        </div>
      </section>

      <section className="servers-section">
        <h2 className="section-title">Серверы</h2>

        <div className="servers-grid">
          <div className="server-card">
            <span className="server-card-icon">🌐</span>
            <h3>AgiCraft Network</h3>
            <p>Основная точка входа. Подключитесь к сети и выберите сервер внутри.</p>
            <ServerStatus server={getServer('velocity')} loading={statusLoading} />
          </div>

          <div className="server-card">
            <span className="server-card-icon">🤖</span>
            <h3>AI Research</h3>
            <p>Экспериментальный сервер для тестирования и исследования ИИ-агентов.</p>
            <ServerStatus server={getServer('airesearch')} loading={statusLoading} />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="connect-section">
        <h2 className="section-title">Как подключиться?</h2>
        <div className="connect-box">
          <code>188.242.12.214:25565</code>
          <p>Java Edition · версия 1.21.1</p>
        </div>
      </section>
    </div>
  );
}

export default Home;
