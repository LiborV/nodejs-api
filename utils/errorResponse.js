class ErrorResponse extends Error {
    constructor(message, statusCode) {
        https://www.itnetwork.cz/javascript/oop/dedicnost-a-polymorfismus-v-javascriptu
        super(message)
        this.statusCode = statusCode
    }
}

module.exports = ErrorResponse
