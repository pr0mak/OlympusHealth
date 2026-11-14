
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
    validateRegistration,
    emailPattern
} = require("../utils/validators");

async function register(req, res, next) {
    try {
        const error = validateRegistration(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        const { firstname, lastname, phone, password } = req.body;
        const email = req.body.email.trim().toLowerCase();

        if (await User.exists(email)) {
            return res.status(409).json({
                success: false,
                message: "Το email χρησιμοποιείται ήδη."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await User.create({
            firstname: firstname.trim(),
            lastname: lastname.trim(),
            phone: phone.trim(),
            email,
            password: passwordHash,
            role: "user"
        });

        return res.status(201).json({
            success: true,
            message: "Η εγγραφή ολοκληρώθηκε με επιτυχία."
        });

    } catch (error) {
        // MySQL duplicate unique key
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Το email χρησιμοποιείται ήδη."
            });
        }

        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body || {};

        if (
            typeof email !== "string" ||
            email.length > 254 ||
            !emailPattern.test(email.trim()) ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Συμπλήρωσε σωστά email και κωδικό."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findByEmail(normalizedEmail);

        const isValid = user
            ? await bcrypt.compare(password, user.password)
            : false;

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: "Λανθασμένο email ή κωδικός πρόσβασης."
            });
        }

        const token = jwt.sign(
            {
                id: String(user.id),
                role: user.role
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
            user: {
                id: String(user.id),
                firstname: user.firstname,
                lastname: user.lastname,
                phone: user.phone,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
}

async function me(req, res, next) {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Ο χρήστης δεν βρέθηκε."
            });
        }

        return res.json({
            success: true,
            user: {
                ...user,
                id: String(user.id)
            }
        });

    } catch (error) {
        next(error);
    }
}

module.exports = { register, login, me };