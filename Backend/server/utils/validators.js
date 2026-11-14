
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return "Μη έγκυρα δεδομένα εγγραφής.";
    }

    const { firstname, lastname, phone, email, password } = data;

    if (
        typeof firstname !== "string" ||
        !firstname.trim() ||
        firstname.trim().length > 100
    ) {
        return "Συμπλήρωσε σωστό όνομα.";
    }

    if (
        typeof lastname !== "string" ||
        !lastname.trim() ||
        lastname.trim().length > 100
    ) {
        return "Συμπλήρωσε σωστό επώνυμο.";
    }

    if (
        typeof phone !== "string" ||
        !/^\+?[0-9\s()-]{7,30}$/.test(phone.trim())
    ) {
        return "Συμπλήρωσε σωστό τηλέφωνο.";
    }

    if (
        typeof email !== "string" ||
        email.length > 254 ||
        !emailPattern.test(email.trim())
    ) {
        return "Συμπλήρωσε έγκυρο email.";
    }

    if (
        typeof password !== "string" ||
        password.length < 8 ||
        Buffer.byteLength(password, "utf8") > 72
    ) {
        return "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες και έως 72 bytes.";
    }

    return null;
}

module.exports = {
    validateRegistration,
    emailPattern
};
