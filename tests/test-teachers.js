const mysql = require('mysql2/promise');
const config = require('../config/database.js');

async function testTeachersTable() {
    let connection;
    try {
        // 创建连接
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'islandture666capbrs',
            database: 'school_db2'
        });

        console.log('数据库连接成功');

        // 检查teachers表是否存在
        const [tables] = await connection.execute(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'school_db2' AND TABLE_NAME = 'teachers'"
        );

        if (tables.length === 0) {
            console.log('teachers表不存在，正在创建...');
            
            // 创建teachers表
            await connection.execute(`
                CREATE TABLE teachers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    title VARCHAR(100),
                    department VARCHAR(100),
                    email VARCHAR(100),
                    phone VARCHAR(20),
                    bio TEXT,
                    image VARCHAR(255),
                    contact VARCHAR(100),
                    introduction TEXT,
                    specialty VARCHAR(100),
                    status TINYINT(1) DEFAULT 1,
                    order_num INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('teachers表创建成功');
            
            // 插入示例数据
            await connection.execute(`
                INSERT INTO teachers (name, contact, introduction, title, specialty, status, order_num) VALUES 
                ('张三', '123456789', '张三是我校资深教师，拥有20年教学经验...', '主任', '计算机科学', 1, 1),
                ('李四', '987654321', '李四专注于科研，曾获多项科研奖项...', '副主任', '人工智能', 1, 2),
                ('王五', 'wangwu@example.com', '王五毕业于清华大学，专注于人工智能领域研究...', '委员', '机器学习', 1, 3)
            `);
            
            console.log('示例数据插入成功');
        } else {
            console.log('teachers表已存在');
        }

        // 显示表结构
        const [columns] = await connection.execute('DESCRIBE teachers');
        console.log('\n表结构:');
        columns.forEach(col => {
            console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
        });

        // 测试插入数据
        const [result] = await connection.execute(
            'INSERT INTO teachers (name, contact, introduction, status, title, specialty) VALUES (?, ?, ?, ?, ?, ?)',
            ['测试用户', 'test@example.com', '这是一个测试用户', 1, '测试职务', '测试专业']
        );
        
        console.log('\n测试插入成功，ID:', result.insertId);

        // 查询数据
        const [teachers] = await connection.execute('SELECT * FROM teachers ORDER BY id DESC LIMIT 5');
        console.log('\n最新5条记录:');
        teachers.forEach(teacher => {
            console.log(`ID: ${teacher.id}, 姓名: ${teacher.name}, 职务: ${teacher.title}, 状态: ${teacher.status}`);
        });

    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testTeachersTable(); 