const { Pool, Client } = require('pg')

const pool = new Pool({
    user: 'root',
    host: 'apps.rutappy.co',
    database: 'escolapp',
    password: '$AuditoryNet',
    port: 5432,
})


module.exports = {
    pool
}