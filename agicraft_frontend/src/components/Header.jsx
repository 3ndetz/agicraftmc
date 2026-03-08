import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './Header.css';

function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="logo-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor"/>
          </svg>
          <span>AgiCraft</span>
        </Link>

        <button
          className="nav-toggle"
          aria-label="Menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <nav className={`nav-center${menuOpen ? ' open' : ''}`}>
          <NavLink to="/" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)} end>
            Главная
          </NavLink>
          <NavLink to="/news" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
            Новости
          </NavLink>
          <NavLink to="/donate" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
            Поддержать
          </NavLink>

          {isAuthenticated && (
            <NavLink to="/profile" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
              Профиль
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          {isAuthenticated ? (
            <button className="nav-cta nav-cta-outline" onClick={logout}>
              Выйти ({user?.username})
            </button>
          ) : (
            <>
              <Link to="/login" className="nav-link nav-link-auth" onClick={() => setMenuOpen(false)}>
                Войти
              </Link>
              <Link to="/register" className="nav-cta" onClick={() => setMenuOpen(false)}>
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
