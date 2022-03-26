const ErrorResponse = require('../utils/errorResponse')

const errorHandler = (err, req, res, next) => {
    let error = { ...err }

    // console.log(error)
    // console.log(err)

    error.message = err.message

    //  Log to console for dev
    // console.log(err.stack.blue)
    // console.log(err)


    // Mongoose bad ObjectId
    // castEror jen když id neni ve správném formátu např jiná délka. pokud je ve správném formátu dostanu errorresponse hlášku co mám v daném controllers
    if (err.name === 'CastError') {
        const message = `Resource not found`
        error = new ErrorResponse(message, 404)
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = `Duplicite field value entered`
        error = new ErrorResponse(message, 400)
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message)
        error = new ErrorResponse(message, 400)
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    })
}

module.exports = errorHandler


