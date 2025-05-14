import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.config.js';
import User from './user.model.js';

// Определяем интерфейс для атрибутов файла CSV
interface CsvFileAttributes {
  id: number;
  name: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  userId: number;
  columnHeaders: string[];
  rowCount: number;
  processedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Определяем атрибуты, которые могут быть нулевыми при создании
interface CsvFileCreationAttributes extends Optional<CsvFileAttributes, 'id' | 'processedAt' | 'createdAt' | 'updatedAt'> {}

// Создаем класс модели файла CSV
class CsvFile extends Model<CsvFileAttributes, CsvFileCreationAttributes> implements CsvFileAttributes {
  public id!: number;
  public name!: string;
  public originalName!: string;
  public path!: string;
  public size!: number;
  public mimeType!: string;
  public userId!: number;
  public columnHeaders!: string[];
  public rowCount!: number;
  public processedAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Инициализируем модель
CsvFile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    columnHeaders: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    rowCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'CsvFile',
    tableName: 'csv_files',
  }
);

// Определяем ассоциации
CsvFile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// User.hasMany(CsvFile, { foreignKey: 'userId', as: 'csvFiles' });

export default CsvFile; 