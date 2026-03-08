import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <p>
        AgiCraft &middot;{' '}
        <Link to="/news">Новости</Link>
        {' '}&middot;{' '}
        <Link to="/donate">Поддержать</Link>
      </p>
    </footer>
  );
}

export default Footer;
