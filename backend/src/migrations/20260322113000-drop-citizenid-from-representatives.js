'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('Representatives', 'citizenId');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Representatives', 'citizenId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};
