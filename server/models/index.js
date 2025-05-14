import User from './user.model.js';
import CsvFile from './csvFile.model.js';
import Dashboard from './dashboard.model.js';

// Устанавливаем ассоциации между моделями
User.hasMany(CsvFile, {
  foreignKey: 'userId',
  as: 'csvFiles'
});
CsvFile.belongsTo(User, {
  foreignKey: 'userId'
});

User.hasMany(Dashboard, {
  foreignKey: 'userId',
  as: 'dashboards'
});
Dashboard.belongsTo(User, {
  foreignKey: 'userId'
});

export {
  User,
  CsvFile,
  Dashboard
}; 