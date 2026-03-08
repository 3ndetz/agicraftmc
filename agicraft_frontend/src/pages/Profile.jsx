import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { userAPI } from '../services/api';
import './Profile.css';

function Profile() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchProfileData();
  }, [isAuthenticated, navigate]);

  const fetchProfileData = async () => {
    try {
      const [profileRes, transactionsRes, donationsRes] = await Promise.all([
        userAPI.getProfile(),
        userAPI.getTransactions(),
        userAPI.getDonations(),
      ]);

      setProfile(profileRes.data);
      setTransactions(transactionsRes.data.transactions);
      setDonations(donationsRes.data.donations);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="profile-page">
      <h1>Личный кабинет</h1>

      <div className="profile-grid">
        {/* Информация о пользователе */}
        <div className="profile-card">
          <h2>Информация</h2>
          <div className="profile-info">
            <p><strong>Логин:</strong> {profile?.username}</p>
            <p><strong>Email:</strong> {profile?.email}</p>
            <p><strong>Minecraft ник:</strong> {profile?.minecraft_nickname}</p>
            <p><strong>Зарегистрирован:</strong> {new Date(profile?.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Баланс AgiCoins */}
        <div className="profile-card balance-card">
          <h2>Баланс</h2>
          <div className="balance-amount">
            <span className="balance-value">{profile?.agicoins_balance || 0}</span>
            <span className="balance-currency">⚡ AgiCoins</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/donate')}
          >
            Пополнить баланс
          </button>
        </div>
      </div>

      {/* История транзакций */}
      <div className="profile-section">
        <h2>История транзакций AgiCoins</h2>
        {transactions.length === 0 ? (
          <p className="empty-message">Транзакций пока нет</p>
        ) : (
          <div className="transactions-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="transaction-item">
                <span className="transaction-amount">
                  {tx.amount > 0 ? '+' : ''}{tx.amount} ⚡
                </span>
                <span className="transaction-desc">{tx.description}</span>
                <span className="transaction-date">
                  {new Date(tx.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* История покупок */}
      <div className="profile-section">
        <h2>История покупок</h2>
        {donations.length === 0 ? (
          <p className="empty-message">Покупок пока нет</p>
        ) : (
          <div className="donations-list">
            {donations.map((donation) => (
              <div key={donation.id} className="donation-item">
                <span className="donation-product">{donation.product_name}</span>
                <span className="donation-amount">{donation.amount_paid} ₽</span>
                <span className={`donation-status ${donation.payment_status}`}>
                  {donation.payment_status === 'completed' ? 'Оплачено' : 'В ожидании'}
                </span>
                <span className="donation-date">
                  {new Date(donation.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
