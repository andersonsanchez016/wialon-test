class HttpException extends Error {
    constructor(message, status) {
        super(message)

        this.status = status
        this.message = message

        // To capture the stack race (the logs)
        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = HttpException
