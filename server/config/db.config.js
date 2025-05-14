import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Получаем данные из переменных окружения или используем значения по умолчанию
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'csv_processor';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

// Создаем экземпляр Sequelize для подключения к базе данных
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  dialect: 'postgres',
  logging: false, // Отключаем логирование SQL запросов в консоль
  pool: {
    max: 5, // Максимальное количество соединений в пуле
    min: 0, // Минимальное количество соединений в пуле
    acquire: 30000, // Максимальное время в мс для получения соединения из пула
    idle: 10000 // Максимальное время в мс, которое соединение может бездействовать, прежде чем будет освобождено
  }
});

export default sequelize; 