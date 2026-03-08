import { useEffect, useState } from 'react';
import { newsAPI } from '../services/api';
import './News.css';

function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await newsAPI.getNews(20);
      setNews(response.data.news);
    } catch (error) {
      setError('Ошибка загрузки новостей');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="news-page">
      <h1>📰 Новости сервера</h1>

      {error && <div className="error-message">{error}</div>}

      {news.length === 0 ? (
        <p className="empty-message">Новостей пока нет</p>
      ) : (
        <div className="news-list">
          {news.map((item) => (
            <article key={item.id} className="news-item">
              <h2>{item.title}</h2>
              <div className="news-meta">
                <span>Автор: {item.author}</span>
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <div className="news-content">
                {item.content}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default News;
