import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; 2025 AgiCraft. Все права защищены.</p>
        <p>Minecraft сервер с искусственным интеллектом</p>
        <div className="footer-links">
          <a href="https://discord.gg/agicraft" target="_blank" rel="noopener noreferrer">
            Discord
          </a>
          <a href="https://github.com/agicraft" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
