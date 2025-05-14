import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import jwt from 'jsonwebtoken';

// Загружаем переменные окружения
dotenv.config();

// Настройки БД и подключение
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'csv_processor';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

// Создаем экземпляр Sequelize
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  dialect: 'postgres',
  logging: console.log, // Включаем логирование для отладки
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Инициализируем приложение Express
const app = express();
const PORT = process.env.PORT || 3001;

// Настраиваем middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : `http://localhost:${process.env.CLIENT_PORT || 5173}`,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Базовый маршрут для проверки работы API
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to CSV Data Processor API' });
});

// Временный маршрут для аутентификации (пока не подключим модели)
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    // Временно хардкодим пользователя admin
    if (username === 'admin' && password === '1234') {
      const token = jwt.sign(
        { id: 1, username: 'admin', role: 'admin' },
        process.env.JWT_SECRET || 'csv-processor-secret-key',
        { expiresIn: '7d' }
      );
      
      return res.json({
        token,
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin'
        }
      });
    }
    
    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Запускаем сервер
const startServer = async () => {
  try {
    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

// Запускаем сервер
startServer(); 