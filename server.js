import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import authRoutes from './server/routes/auth.routes.js';
import csvFilesRoutes from './server/routes/csvFiles.routes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, CsvFile, Dashboard } from './server/models/index.js';

// Загружаем переменные окружения
dotenv.config();

// Получаем __dirname в модульной среде
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  logging: console.log,
  dialectOptions: {
    // Увеличиваем время ожидания для подключения
    connectTimeout: 60000,
    ssl: false
  },
  define: {
    // По умолчанию добавляем схему public для всех таблиц
    schema: 'public'
  }
});

// Инициализируем приложение Express
const app = express();
const PORT = process.env.PORT || 3001;

// Настраиваем middleware
app.use(cors({
  origin: '*', // Allow all origins for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly specify all methods
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Базовый маршрут для проверки работы API
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CSV Data Processor API' });
});

// Simple test route for POST requests
app.post('/test-post', (req, res) => {
  console.log('Test POST route hit, body:', req.body);
  res.json({ message: 'POST request received', body: req.body });
});

// Подключаем маршруты
app.use('/api/auth', authRoutes);
app.use('/api/csv-files', csvFilesRoutes);

// В случае проблем с аутентификацией, используем запасной вариант
app.post('/api/auth/login-fallback', (req, res) => {
  const { username, password } = req.body;
  
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

// Создание тестового пользователя админа если база пустая
async function createAdminUserIfNone() {
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: '1234',
        role: 'admin'
      });
      console.log('Тестовый пользователь admin создан');
    }
  } catch (error) {
    console.error('Ошибка при создании тестового пользователя:', error);
  }
}

// Импортируем модели и инициализируем их
const initializeDatabase = async () => {
  try {
    // Проверяем соединение с базой данных
    await sequelize.authenticate();
    console.log('Соединение с базой данных установлено успешно.');
    
    // Синхронизируем модели с базой данных (создаем таблицы)
    await sequelize.sync({ alter: true });
    console.log('База данных синхронизирована.');
    
    // Создаем тестового пользователя если нужно
    await createAdminUserIfNone();
    
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    return false;
  }
};

// Запускаем сервер
const startServer = async () => {
  let dbInitialized = false;
  
  try {
    // Инициализируем базу данных
    dbInitialized = await initializeDatabase();
    
    // Запускаем сервер
    app.listen(PORT, () => {
      if (dbInitialized) {
        console.log(`Сервер запущен на порту ${PORT} с подключением к БД`);
      } else {
        console.log(`Сервер запущен на порту ${PORT} без подключения к БД`);
      }
    });
  } catch (error) {
    console.error('Не удалось подключиться к базе данных:', error);
    console.log('-----------------------------------------------------------');
    console.log('Возможные причины ошибки:');
    console.log('1. PostgreSQL не запущен. Запустите Docker Desktop и выполните:');
    console.log('   npm run db:start');
    console.log('2. Неверные учетные данные в .env файле');
    console.log('3. База данных недоступна на указанном хосте/порту');
    console.log('-----------------------------------------------------------');
    console.log('Запуск сервера без подключения к базе данных...');
    
    // Все равно запускаем сервер
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT} (без подключения к БД)`);
    });
  }
};

// Запускаем сервер
startServer(); 