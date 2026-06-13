// 测试teachers功能修复
const mysql = require('mysql2/promise');
const config = require('./config/config.js');

async function testTeachersFix() {
    let connection;
    try {
        // 连接数据库
        connection = await mysql.createConnection(config.database);
        console.log('数据库连接成功');

        // 1. 检查表结构
        console.log('\n=== 检查teachers表结构 ===');
        const [columns] = await connection.execute('DESCRIBE teachers');
        console.log('表结构:', columns.map(col => `${col.Field} (${col.Type})`));

        // 2. 检查现有数据
        console.log('\n=== 检查现有数据 ===');
        const [teachers] = await connection.execute('SELECT * FROM teachers');
        console.log('现有教师数据:', teachers);

        // 3. 测试插入新数据
        console.log('\n=== 测试插入新数据 ===');
        const [result] = await connection.execute(
            'INSERT INTO teachers (name, contact, introduction, status, title, specialty) VALUES (?, ?, ?, ?, ?, ?)',
            ['测试教师', '13800138000', '这是一个测试教师', 1, '测试职务', '测试专业']
        );
        console.log('插入成功，ID:', result.insertId);

        // 4. 验证插入的数据
        const [newTeacher] = await connection.execute('SELECT * FROM teachers WHERE id = ?', [result.insertId]);
        console.log('新插入的数据:', newTeacher[0]);

        // 5. 测试更新数据
        console.log('\n=== 测试更新数据 ===');
        await connection.execute(
            'UPDATE teachers SET status = ? WHERE id = ?',
            [0, result.insertId]
        );
        const [updatedTeacher] = await connection.execute('SELECT * FROM teachers WHERE id = ?', [result.insertId]);
        console.log('更新后的数据:', updatedTeacher[0]);

        // 6. 清理测试数据
        await connection.execute('DELETE FROM teachers WHERE id = ?', [result.insertId]);
        console.log('测试数据已清理');

        console.log('\n✅ 所有测试通过！teachers表功能正常');

    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testTeachersFix(); 