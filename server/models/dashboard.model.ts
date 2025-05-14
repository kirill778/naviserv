import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.config.js';
import User from './user.model.js';

// Определяем интерфейс для атрибутов дашборда
interface DashboardAttributes {
  id: number;
  name: string;
  description: string;
  layout: object[];
  userId: number;
  isPublic: boolean;
  lastEdited: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Определяем атрибуты, которые могут быть нулевыми при создании
interface DashboardCreationAttributes extends Optional<DashboardAttributes, 'id' | 'description' | 'isPublic' | 'lastEdited' | 'createdAt' | 'updatedAt'> {}

// Создаем класс модели дашборда
class Dashboard extends Model<DashboardAttributes, DashboardCreationAttributes> implements DashboardAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public layout!: object[];
  public userId!: number;
  public isPublic!: boolean;
  public lastEdited!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Инициализируем модель
Dashboard.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    layout: {
      type: DataTypes.JSONB,
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
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastEdited: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Dashboard',
    tableName: 'dashboards',
  }
);

// Определяем ассоциации
Dashboard.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// User.hasMany(Dashboard, { foreignKey: 'userId', as: 'dashboards' });

export default Dashboard; 