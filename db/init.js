const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// 测试数据库连接
async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功');
        connection.release();
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error);
        return false;
    }
}

// 初始化数据库
async function initDatabase() {
    try {
        // 检查数据库是否存在
        const [rows] = await pool.query(
            "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'school_db2'"
        );
        
        if (rows.length === 0) {
            // 创建数据库
            await pool.query("CREATE DATABASE IF NOT EXISTS school_db2");
            console.log('数据库创建成功');
        }
        
        // 使用数据库
        await pool.query("USE school_db2");

        // 检查并更新表结构
        // await checkAndUpdateTables();
         // 首先创建管理员表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100),
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // 创建活动记录表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                type VARCHAR(50) NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE SET NULL
            )
        `);
        console.log('活动记录表创建成功');
        
       

        // 然后创建文件表（因为它依赖于admins表）
        await pool.query(`
            CREATE TABLE IF NOT EXISTS files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                size BIGINT NOT NULL,
                path VARCHAR(255) NOT NULL,
                category VARCHAR(50) DEFAULT 'general',
                uploaded_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (uploaded_by) REFERENCES admins(id)
            )
        `);

        // 创建设置表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                \`key\` VARCHAR(50) NOT NULL UNIQUE,
                value TEXT,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        // 检查是否已存在管理员账号
        const [admins] = await pool.query('SELECT * FROM admins WHERE username = ?', ['admin']);
        
        if (admins.length === 0) {
            // 创建默认管理员账号
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                'INSERT INTO admins (username, password, name, email) VALUES (?, ?, ?, ?)',
                ['admin', hashedPassword, '管理员', 'admin@school.com']
            );
            console.log('默认管理员账号创建成功');
        } else {
            console.log('管理员账号已存在，跳过创建');
        }
        
        // 创建活动日志表
        // await pool.query(`
        //     CREATE TABLE IF NOT EXISTS activities (
        //         id INT AUTO_INCREMENT PRIMARY KEY,
        //         type VARCHAR(50) NOT NULL,
        //         description TEXT,
        //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        //     )
        // `);
        
        // 创建新闻表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS news (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                category VARCHAR(50) NOT NULL DEFAULT '校园新闻',
                author VARCHAR(50),
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // 创建新闻图片表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS news_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                news_id INT,
                image_path VARCHAR(255) NOT NULL,
                caption VARCHAR(255),
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
            )
        `);
        
        // 创建轮播图表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS slides (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                image_url VARCHAR(255) NOT NULL,
                link VARCHAR(255),
                order_num INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `),
        
        // 创建教师表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teachers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                title VARCHAR(100),
                department VARCHAR(50),
                avatar_url VARCHAR(255),
                introduction TEXT,
                order_num INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 创建活动日志表（已在前面创建，这里删除重复的创建语句）
        
        console.log('数据库初始化完成');
        return true;
    } catch (error) {
        console.error('数据库初始化失败:', error);
        return false;
    }
}

async function checkAndUpdateTables() {
    // 检查 files 表结构
    const [filesColumns] = await pool.query("SHOW COLUMNS FROM files");
    const filesColumnNames = filesColumns.map(col => col.Field);

    if (!filesColumnNames.includes('created_at')) {
        await pool.query("ALTER TABLE files ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        console.log('files 表添加了 created_at 列');
    }

    if (!filesColumnNames.includes('uploaded_by')) {
        await pool.query("ALTER TABLE files ADD COLUMN uploaded_by INT, ADD FOREIGN KEY (uploaded_by) REFERENCES admins(id)");
        console.log('files 表添加了 uploaded_by 列');
    }

    // 检查 news_images 表是否存在
    try {
        const [newsImagesColumns] = await pool.query("SHOW COLUMNS FROM news_images");
        const newsImagesColumnNames = newsImagesColumns.map(col => col.Field);
        
        // 如果没有display_order列，添加它
        if (!newsImagesColumnNames.includes('display_order')) {
            await pool.query("ALTER TABLE news_images ADD COLUMN display_order INT DEFAULT 0");
            console.log('news_images 表添加了 display_order 列');
        }
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            // 表不存在，创建它
            await pool.query(`
                CREATE TABLE IF NOT EXISTS news_images (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    news_id INT,
                    image_path VARCHAR(255) NOT NULL,
                    caption VARCHAR(255),
                    display_order INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
                )
            `);
            console.log('news_images 表创建成功');
        } else {
            console.error('检查 news_images 表失败:', error);
        }
    }

    // 可以在这里添加其他表的检查和更新
}

module.exports = {
    testDatabaseConnection,
    initDatabase,
    checkAndUpdateTables
};