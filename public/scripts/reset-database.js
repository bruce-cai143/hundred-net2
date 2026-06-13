const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
    let connection;
    
    try {
        // 连接数据库
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'islandture666capbrs',
            database: 'school_db2'
        });
        
        console.log('连接数据库成功');
        
        // 读取初始化SQL文件
        const initSqlPath = path.join(__dirname, '../database/init.sql');
        const initSql = fs.readFileSync(initSqlPath, 'utf8');
        
        // 分割SQL语句
        const statements = initSql.split(';').filter(stmt => stmt.trim());
        
        // 执行每个SQL语句
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.execute(statement);
                    console.log('执行SQL:', statement.substring(0, 50) + '...');
                } catch (error) {
                    console.error('SQL执行错误:', error.message);
                }
            }
        }
        
        console.log('数据库重置完成');
        
    } catch (error) {
        console.error('数据库重置失败:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 运行重置
resetDatabase(); 