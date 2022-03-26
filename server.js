const path = require('path')
const express = require('express')
const dotenv = require('dotenv')
const app = express()
const morgan = require('morgan')
const errorHandler = require('./middleware/error')
const connectDB = require('./config/db')
const colors = require('colors')
const fileupload = require('express-fileupload')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')


// Load env vars
dotenv.config({ path: './config/config.env' })

// Connect to database
connectDB()

// Body parser
app.use(express.json())

// Cookie parser
app.use(cookieParser())

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// File uploading (middleware)
app.use(fileupload())

// Sanitize data
app.use(mongoSanitize())

// Set security headers
app.use(helmet())

// Prevent XSS attacks
app.use(xss())

// Enable Cors
app.use(cors())

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 10 minutes)
})

// Apply the rate limiting middleware to all requests
app.use(limiter)

//Prevent http param pollution
app.use(hpp())

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))

// Route files
const bootcamps = require('./routes/bootcamps')
const courses = require('./routes/courses')
const auth = require('./routes/auth')
const users = require('./routes/users')
const reviews = require('./routes/reviews')



// Mount routes
app.use('/api/v1/bootcamps', bootcamps)
app.use('/api/v1/courses', courses)
app.use('/api/v1/auth', auth)
app.use('/api/v1/users', users)
app.use('/api/v1/reviews', reviews)

app.use(errorHandler)

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
    console.log(`App running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold)
})

// Handle unhanled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red)
    // Close server and exit process
    server.close(() => process.exit(1))
})