this is BE folder

# UCPC Register

## How to run the project (docker)

- Fill in the .env file with the correct values
- If you have make installed

```
cd Backend
make up-dev
make migrate

```

### If you don't have make installed

```
cd Backend
docker-compose -f docker-compose.dev.yaml up -d

npm i sequelize-cli
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

```

## How to run the project (not docker)

1. Connect to PostgreSQL and create database:

```sql
CREATE DATABASE ucpc_register;
```

2. Update values in `.env`:

- `DB_USER`
- `DB_PASSWORD`
- `DB_DATABASE` (set to `ucpc_register`)
- `DB_HOST`
- `DB_PORT`
- `DB_DIALECT`

Note: Do not put credentials in `src/configs/config.json`. The project now reads DB settings from env via `src/configs/config.js`.

3. Install dependencies:

```bash
npm install
```

4. Run migrations and seeders (first setup only):

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

5. Start backend:

```bash
npm start
```
