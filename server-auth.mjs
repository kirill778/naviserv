import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Создаем Express сервер
const app = express();
const PORT = 3001;
const JWT_SECRET = 'csv-processor-secret-key';

// Настраиваем middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Временный список пользователей (в реальном приложении будет база данных)
// Обратите внимание, что пароль уже хеширован
let users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    // Хешируем пароль "1234" заранее
    password: '$2b$10$8KvTXDDQJztWvzLqfUl7ZOJqpv4oB4XuCLqERBdJ02.T3Oq.q3mIy', // хеш для "1234"
    role: 'admin',
    isActive: true,
    lastLogin: null
  }
];

// Базовый маршрут для проверки работы API
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CSV Data Processor API' });
});

// Маршрут для аутентификации
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Ищем пользователя
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Обновляем время последнего входа
    user.lastLogin = new Date();

    // Генерируем JWT токен
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Возвращаем информацию о пользователе и токен
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Маршрут для получения информации о текущем пользователе
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ищем пользователя
    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Возвращаем информацию о пользователе
    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Auth server is running on port ${PORT}`);
}); 