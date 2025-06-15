const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    try {
        // 创建数据库连接
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'admin123' // 修改为你的实际密码，如果没有密码则留空
        });
        
        console.log('数据库连接成功');
        
        // 创建数据库
        await connection.query('CREATE DATABASE IF NOT EXISTS school_db');
        console.log('数据库创建成功');
        
        // 使用数据库
        await connection.query('USE school_db');
        
        // 创建管理员表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100),
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 检查是否已存在管理员账号
        const [admins] = await connection.query('SELECT * FROM admins');
        
        if (admins.length === 0) {
            // 创建默认管理员账号
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query(
                'INSERT INTO admins (username, password, name, email) VALUES (?, ?, ?, ?)',
                ['admin', hashedPassword, '管理员', 'admin@school.com']
            );
            console.log('默认管理员账号创建成功');
        } else {
            console.log('管理员账号已存在，跳过创建');
        }
        
        console.log('数据库初始化完成');
        connection.end();
    } catch (error) {
        console.error('数据库初始化失败:', error);
    }
}

initDatabase();