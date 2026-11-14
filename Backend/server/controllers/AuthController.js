
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
    validateRegistration,
    USERNAME_PATTERN
} = require("../utils/validators");

// Fields that are safe to return to the frontend
function publicUser(user) {
    return {
        id: String(user.id),
        username: user.username,
        gender: user.gender,
        age: user.age
    };
}

// POST /api/auth/register
async function register(req, res, next) {
    try {
        const validationError = validateRegistration(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const { password, gender, age } = req.body;
        const username = req.body.username.trim();

        const exists = await User.exists(username);

        if (exists) {
            return res.status(409).json({
                success: false,
                message: "Το username χρησιμοποιείται ήδη."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            password: hashedPassword,
            gender,
            age
        });

        return res.status(201).json({
            success: true,
            message: "Η εγγραφή ολοκληρώθηκε με επιτυχία."
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Το username χρησιμοποιείται ήδη."
            });
        }

        next(error);
    }
}

// POST /api/auth/login
async function login(req, res, next) {
    try {
        const { username, password } = req.body || {};

        if (
            typeof username !== "string" ||
            !USERNAME_PATTERN.test(username.trim()) ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Συμπλήρωσε σωστά username και κωδικό."
            });
        }

        const user = await User.findByUsername(username.trim());

        const isValid = user
            ? await bcrypt.compare(password, user.password)
            : false;

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: "Λανθασμένο username ή κωδικός πρόσβασης."
            });
        }

        const token = jwt.sign(
            {
                id: String(user.id)
            },
            process.env.JWT_SECRET,
            {
                algorithm: "HS256",
                expiresIn: "24h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Επιτυχής σύνδεση!",
            token,
            user: publicUser(user)
        });

    } catch (error) {
        next(error);
    }
}

// GET /api/auth/me
async function me(req, res, next) {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Ο χρήστης δεν βρέθηκε."
            });
        }

        return res.status(200).json({
            success: true,
            user: publicUser(user)
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    me
};
