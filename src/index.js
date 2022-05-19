// Express imports
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')

// Routes
const apiRoutes = require('./routes');

// Error Handler
const ErrorHandler = require('./utils/errorHandler');

// Process

const { wialonConnect } = require('./process/wialon');

// Environment variables
require('dotenv').config({ path: './.env' })

// instance of the app
const app = express()

// to handle the cors
app.use(cors())
// To recognize the incoming request object as a json object
app.use(express.json({ limit: '50mb' }))
// To recognize the incoming Request Object as strings or arrays.
app.use(express.urlencoded({ extended: true }))
// Get the logs
app.use(morgan('dev'))
// To secure the app
app.use(helmet())

// Api routes
app.use('/api', apiRoutes);

// To handle the wrong routes
app.all('*', (req, res, next) => {
    next(
        new HttpException(
            `no se encuentra la ruta ${req.originalUrl} en el servidor`
        )
    )
})

// To handle errors
app.use(ErrorHandler)

// Wialon locations
wialonConnect()

// Server init
app.listen(process.env.PORT || 7000);
console.log(`server running on port ${process.env.PORT || 7000}`);