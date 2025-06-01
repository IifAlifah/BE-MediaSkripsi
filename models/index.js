// models/index.js
import Users from './UserModel.js';
import Nilai from './NilaiModel.js';

// Relasi
Users.hasMany(Nilai, { foreignKey: 'userId' });
Nilai.belongsTo(Users, { foreignKey: 'userId' });


export {
  Users,
  Nilai
};
