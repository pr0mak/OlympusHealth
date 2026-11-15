# ASTRA - Quick Start

Follow **only the steps below** to set up and run ASTRA locally.

Run all commands from the project root directory, which contains `Frontend/`, `Backend/`, and `astra-ai/`.

## 1. Prerequisites

Make sure you have installed:

- **Node.js** and **npm**
- **MySQL Server** (running)
- **Python 3** with `pip`

## 2. Set Up the MySQL Database (One-Time Setup)

Open **MySQL Command Line Client** or **MySQL Workbench** and connect as an administrator (`root`).

Execute the following SQL commands:

```sql
CREATE DATABASE IF NOT EXISTS astra_db;

CREATE USER IF NOT EXISTS 'astra_app'@'localhost'
  IDENTIFIED BY 'Password123!';

GRANT SELECT, INSERT, UPDATE, DELETE ON astra_db.*
  TO 'astra_app'@'localhost';
```

Next, open a terminal in the **project root directory** and import the database schema.

**macOS / Linux / Git Bash / Windows CMD:**

```bash
mysql -u root -p astra_db < Backend/db_schema/schema.sql
```

**Windows PowerShell:** If the `<` redirection does not work, open `Backend/db_schema/schema.sql` in MySQL Workbench, select `astra_db` as the default schema, and click **Execute**.


### Verify MySQL User Creation

After executing the SQL commands, open MySQL Workbench
and navigate to:

**Administration → Users and Privileges**

You should see the `astra_app` user with `localhost`
as its host, as shown below.

![MySQL User Setup](<img width="1487" height="587" alt="image" src="https://github.com/user-attachments/assets/bbd58f31-286b-4e50-a4fd-82737ad99719" />)

If the user appears in the list, the MySQL account
has been created successfully.


## 3. Configure the Backend Environment (One-Time Setup)

Create the following file:

`Backend/server/.env`

Add:

```dotenv
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=astra_app
DB_PASSWORD=ChangeThisLocalDbPassword!2026
DB_NAME=astra_db

JWT_SECRET=replace_this_with_your_own_random_secret_of_at_least_32_characters

AI_ENGINE_URL=http://127.0.0.1:8000
```

**Important:**

- If you change the MySQL password in Step 2, update `DB_PASSWORD` accordingly.
- Replace `JWT_SECRET` with your own random secret of at least 32 characters.
- Never upload your `.env` file to GitHub.

## 4. Install and Start the Application - 3 Terminals

Open three separate terminals, each starting from the project root directory.

### Terminal 1 - Backend

```bash
cd Backend/server
npm install
node seed.js
npm run dev
```

The `node seed.js` command creates **demo users and synthetic health measurements**.

Run it **only once** during the initial setup.

### Terminal 2 - Frontend

```bash
cd Frontend
npm install
npm run dev
```

If your frontend requires an explicit API URL, create:

`Frontend/.env`

```dotenv
VITE_API_URL=http://localhost:3001
```

Restart the frontend after modifying its `.env` file.

### Terminal 3 - Python AI Engine

```bash
cd astra-ai
python -m pip install -r requirements.txt
python -m uvicorn astra.api:app --reload --port 8000
```

On macOS or Linux, use `python3` instead of `python` if necessary.

**Keep all three terminals running while using ASTRA.**

After the initial installation, you only need the startup commands (`npm run dev` and `python -m uvicorn astra.api:app --reload --port 8000`).

## 5. Open ASTRA and Sign In

Open the application:

**http://localhost:5173/sign-in**

After successfully running `node seed.js`, you can use the following demo accounts:

| Username | Password |
|---|---|
| `alex_morgan` | `AstraDemo2026!` |
| `sophia_miller` | `AstraDemo2026!` |

These accounts are available **only if the database seeding process completed successfully**.

They are intended for local demonstration purposes only. Do not use these credentials in a public deployment.

### Create Your Own Account (Optional)

Alternatively, visit:

**http://localhost:5173/register**

Create an account by entering:

- Username
- Password
- Gender
- Age

After registration, sign in using your **username and password**.

New accounts initially have no health measurements. You can add records through:

**Health Data → Add Measurements**


If the application does not connect, verify that:

- MySQL Server is running.
- The MySQL credentials in `Backend/server/.env` match those created in Step 2.
- All three terminals are running without errors.

---

**Note:** These instructions assume the ASTRA project contains `Backend/db_schema/schema.sql` and `Backend/server/seed.js`. Use the latest project version with username-based authentication, since older project snapshots may contain different authentication routes.
