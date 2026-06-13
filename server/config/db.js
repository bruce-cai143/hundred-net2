/*const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'islandture666capbrs', 
    database: 'school_db2'
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

module.exports = pool;
*/

const mysql = require('mysql2');

const db = mysql.createPool({ 
    host: process.env.MYSQLHOST, 
    port: process.env.MYSQLPORT, 
    user: process.env.MYSQLUSER, 
    password: process.env.MYSQLPASSWORD, 
    database: process.env.MYSQLDATABASE, 
    waitForConnections: true, 
    connectionLimit: 10, 
    queueLimit: 0 
}); 

module.exports = db;