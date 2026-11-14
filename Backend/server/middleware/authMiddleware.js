
const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Απαιτείται σύνδεση."
        });
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        if (!decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Μη έγκυρο token."
            });
        }

        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Το token είναι άκυρο ή έχει λήξει."
        });
    }
}

module.exports = authenticate;