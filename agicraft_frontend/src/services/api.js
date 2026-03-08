import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Создаём axios instance с базовыми настройками
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления JWT токена к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истёк или недействителен
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// === Auth API ===
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verify: () => api.get('/auth/verify'),
};

// === User API ===
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  getBalance: () => api.get('/user/balance'),
  getTransactions: () => api.get('/user/transactions'),
  getDonations: () => api.get('/user/donations'),
};

// === Payment API ===
export const paymentAPI = {
  getProducts: () => api.get('/payment/products'),
  createPayment: (productId) => api.post('/payment/create', { product_id: productId }),
  getPaymentStatus: (donationId) => api.get(`/payment/status/${donationId}`),
};

// === News API ===
export const newsAPI = {
  getNews: (limit = 10, offset = 0) => api.get(`/news?limit=${limit}&offset=${offset}`),
  getNewsById: (id) => api.get(`/news/${id}`),
};

export default api;
