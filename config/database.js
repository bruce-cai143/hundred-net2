const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'islandture666capbrs',
  database: 'school_db2'
});

module.exports = connection;