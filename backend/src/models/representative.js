'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Representative extends Model {
    static associate(models) {
      Representative.belongsTo(models.Team, {
        foreignKey: 'teamId'
      });
    }
  }

  Representative.init({
    teamId: DataTypes.INTEGER,
    role: DataTypes.STRING,
    fullName: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    schoolName: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Representative',
  });

  return Representative;
};
