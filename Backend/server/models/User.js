
const db = require("../config/db");

class User {

    // Check if username already exists
    static async exists(username) {
        const [rows] = await db.execute(
            `SELECT id
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [username]
        );

        return rows.length > 0;
    }

    // Find user by username (used during login)
    static async findByUsername(username) {
        const [rows] = await db.execute(
            `SELECT id, username, password, gender, age
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [username]
        );

        return rows[0] || null;
    }

    // Find user by ID (used in /api/auth/me)
    static async findById(id) {
        const [rows] = await db.execute(
            `SELECT id, username, gender, age
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [id]
        );

        return rows[0] || null;
    }

    // Create new user (used during registration)
    static async create(user) {
        const {
            username,
            password,
            gender,
            age
        } = user;

        const [result] = await db.execute(
            `INSERT INTO users
                (username, password, gender, age)
             VALUES (?, ?, ?, ?)`,
            [
                username,
                password,
                gender,
                age
            ]
        );

        return result.insertId;
    }
}

module.exports = User;
