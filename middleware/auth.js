const jwt = require('jsonwebtoken')
const asyncHandler = require('./async')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/User')

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
    let token

    console.log(req.cookies)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Set token from Bearer token from in header
        token = req.headers.authorization.split(' ')[1]
    }
        // Set token from cookie
    // else if (req.cookies.token) {
    //     console.log('Using cookie')
    //     token = req.cookies.token
    // }

    // Make sure token exists
    if (!token) {
        return next(new ErrorResponse('Not auhorized to access this route', 401))
    }

    try {
        // Verify token
        const decode = jwt.verify(token, process.env.JWT_SECRET)

        console.log(decode)

        req.user = await User.findById(decode.id)

        next()
    } catch (error) {
        return next(new ErrorResponse('Not auhorized to access this route', 401))
    }
})

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403)
            )
        }
        next()
    }
}
