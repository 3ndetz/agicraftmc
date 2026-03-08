import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './Header.css';

function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          ⚡ AgiCraft
        </Link>

        <nav className="nav">
          <Link to="/">Главная</Link>
          <Link to="/news">Новости</Link>
          <Link to="/donate">Донат</Link>

          {isAuthenticated ? (
            <>
              <Link to="/profile">Профиль</Link>
              <button onClick={logout} className="logout-btn">
                Выйти ({user?.username})
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-login">Войти</Link>
              <Link to="/register" className="btn-register">Регистрация</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
