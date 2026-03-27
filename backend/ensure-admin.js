const bcrypt = require('bcryptjs');
const db = require('./src/models');

const ADMIN_EMAIL = 'admin@uit.cs';
const ADMIN_USERNAME = 'UCPCAdmin';
const ADMIN_ROLE = 'ADMIN';
const DEFAULT_USER_ROLE = 'USER';
const ADMIN_DEFAULT_PASSWORD = '123456';

async function ensureAdminUser() {
  await db.sequelize.authenticate();
  const now = new Date();

  const adminPasswordHash = bcrypt.hashSync(ADMIN_DEFAULT_PASSWORD, 12);

  const [adminUser, created] = await db.User.findOrCreate({
    where: { email: ADMIN_EMAIL },
    defaults: {
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      role: ADMIN_ROLE,
      password: adminPasswordHash,
      createdAt: now,
      updatedAt: now
    }
  });

  if (created) {
    console.log(`[bootstrap] Created default admin account: ${ADMIN_EMAIL}`);
  } else if (adminUser.role !== ADMIN_ROLE || adminUser.username !== ADMIN_USERNAME) {
    await adminUser.update({ role: ADMIN_ROLE, username: ADMIN_USERNAME, updatedAt: now });
    console.log(`[bootstrap] Updated role to ADMIN for: ${ADMIN_EMAIL}`);
  } else {
    console.log(`[bootstrap] Default admin already exists: ${ADMIN_EMAIL}`);
  }

  // Keep exactly one admin account in the system.
  const allAdminUsers = await db.User.findAll({
    where: { role: ADMIN_ROLE },
    order: [
      ['createdAt', 'ASC'],
      ['id', 'ASC']
    ]
  });

  // Prefer keeping the designated admin account. If there are duplicates, keep the oldest row.
  const preferredAdmin =
    allAdminUsers.find((user) => user.email === ADMIN_EMAIL) || allAdminUsers[0] || adminUser;

  if (
    preferredAdmin.role !== ADMIN_ROLE ||
    preferredAdmin.username !== ADMIN_USERNAME ||
    preferredAdmin.email !== ADMIN_EMAIL
  ) {
    await preferredAdmin.update({
      role: ADMIN_ROLE,
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      updatedAt: now
    });
  }

  const redundantAdmins = allAdminUsers.filter((user) => user.id !== preferredAdmin.id);

  if (redundantAdmins.length > 0) {
    for (const user of redundantAdmins) {
      await user.update({ role: DEFAULT_USER_ROLE, updatedAt: now });
    }

    console.log(
      `[bootstrap] Demoted ${redundantAdmins.length} redundant admin account(s) to USER (kept id=${preferredAdmin.id}).`
    );
  }
}

ensureAdminUser()
  .catch((error) => {
    console.error('[bootstrap] Failed to ensure admin account:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.sequelize.close();
  });
