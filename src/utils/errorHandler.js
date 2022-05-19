function ErrorHandler(err, request, response, next) {
    const status = err.status || 500
    const message = err.message || 'Something went wrong'

    return response.status(status).json({
        error: err,
        status,
        message,
        stack: err.stack
    })
}

module.exports = ErrorHandler
