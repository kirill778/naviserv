import express from 'express';
import cors from 'cors';

// Создаем простой Express сервер
const app = express();
const PORT = 3001;

// Настраиваем middleware
app.use(cors());
app.use(express.json());

// Базовый маршрут для проверки работы API
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CSV Data Processor API' });
});

// Временный маршрут для аутентификации
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Проверяем учетные данные админа
  if (username === 'admin' && password === '1234') {
    return res.json({
      token: 'fake-token-for-testing',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      }
    });
  }
  
  return res.status(401).json({ message: 'Invalid credentials' });
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Simple server is running on port ${PORT}`);
}); 