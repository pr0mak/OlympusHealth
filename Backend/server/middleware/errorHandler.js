
function errorHandler(err, req, res, next) {
    console.error(err);

    return res.status(500).json({
        success: false,
        message: "Παρουσιάστηκε σφάλμα στον server."
    });
}

module.exports = errorHandler;