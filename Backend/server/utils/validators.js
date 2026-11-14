
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,50}$/;

function validateRegistration(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return "Μη έγκυρα δεδομένα εγγραφής.";
    }

    const { username, password, gender, age } = body;

    // Username validation
    if (
        typeof username !== "string" ||
        !USERNAME_PATTERN.test(username.trim())
    ) {
        return "Το username πρέπει να έχει 3–50 χαρακτήρες και να περιέχει μόνο λατινικά γράμματα, αριθμούς ή underscore (_).";
    }

    // Password validation
    if (
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 72
    ) {
        return "Ο κωδικός πρέπει να περιέχει από 8 έως 72 χαρακτήρες.";
    }

    // Gender validation
    if (
        gender !== "male" &&
        gender !== "female"
    ) {
        return "Το gender πρέπει να είναι male ή female.";
    }

    // Age validation
    if (
        !Number.isInteger(age) ||
        age < 18 ||
        age > 120
    ) {
        return "Η ηλικία πρέπει να είναι ακέραιος αριθμός από 18 έως 120.";
    }

    return null;
}

module.exports = {
    USERNAME_PATTERN,
    validateRegistration
};
