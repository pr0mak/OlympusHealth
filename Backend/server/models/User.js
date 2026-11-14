
const db = require("../config/db");

class User {

    static async exists(email) {
        const [rows] = await db.execute(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        return rows.length > 0;
    }

    static async findByEmail(email) {
        const [rows] = await db.execute(
            "SELECT * FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        return rows[0] || null;
    }

    static async findById(id) {
        const [rows] = await db.execute(
            `SELECT id, firstname, lastname, phone,
                    email, role, created_at
             FROM users
             WHERE id = ? LIMIT 1`,
            [id]
        );

        return rows[0] || null;
    }

    static async create(user) {
        const { firstname, lastname, phone,
                email, password, role = "user" } = user;

        const [result] = await db.execute(
            `INSERT INTO users
             (firstname, lastname, phone, email, password, role)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [firstname, lastname, phone, email, password, role]
        );

        return result.insertId;
    }
}

module.exports = User;
