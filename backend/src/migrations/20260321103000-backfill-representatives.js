'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      INSERT INTO "Representatives" ("teamId", "role", "fullName", "phone", "email", "citizenId", "createdAt", "updatedAt")
      SELECT p."teamId", 'COACH', TRIM(p."trainerName"), NULL, NULL, NULL, NOW(), NOW()
      FROM "Processes" p
      WHERE p."trainerName" IS NOT NULL
        AND LENGTH(TRIM(p."trainerName")) > 0
      ON CONFLICT ("teamId", "role")
      DO UPDATE SET
        "fullName" = EXCLUDED."fullName",
        "updatedAt" = NOW();
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO "Representatives" ("teamId", "role", "fullName", "phone", "email", "citizenId", "createdAt", "updatedAt")
      SELECT x."teamId", 'LEADER', x."fullName", x."phone", NULL, x."citizenId", NOW(), NOW()
      FROM (
        SELECT DISTINCT ON ("teamId") "teamId", "fullName", "phone", "citizenId"
        FROM "Participants"
        ORDER BY "teamId", "id" ASC
      ) x
      WHERE x."fullName" IS NOT NULL
        AND LENGTH(TRIM(x."fullName")) > 0
      ON CONFLICT ("teamId", "role")
      DO UPDATE SET
        "fullName" = EXCLUDED."fullName",
        "phone" = EXCLUDED."phone",
        "citizenId" = EXCLUDED."citizenId",
        "updatedAt" = NOW();
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM "Representatives"
      WHERE "role" IN ('COACH', 'LEADER');
    `);
  }
};
