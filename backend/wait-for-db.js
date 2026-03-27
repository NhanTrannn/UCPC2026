#!/usr/bin/env node

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'postgres',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

const maxAttempts = 30;
let attempts = 0;

async function waitForDb() {
  while (attempts < maxAttempts) {
    try {
      await sequelize.authenticate();
      console.log('✓ Database connection successful');
      await sequelize.close();
      process.exit(0);
    } catch (error) {
      attempts++;
      console.log(`[${attempts}/${maxAttempts}] Waiting for database... (${error.message})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.error('✗ Database connection failed after retries');
  process.exit(1);
}

waitForDb();
