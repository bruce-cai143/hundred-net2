// 测试教师更新功能
const mysql = require('mysql2/promise');
const config = require('./config/config.js');

async function testTeacherUpdate() {
    let connection;
    try {
        // 连接数据库
        connection = await mysql.createConnection(config.database);
        console.log('数据库连接成功');

        // 1. 检查现有教师数据
        console.log('\n=== 检查现有教师数据 ===');
        const [teachers] = await connection.execute('SELECT * FROM teachers');
        console.log('现有教师数量:', teachers.length);
        if (teachers.length > 0) {
            console.log('第一个教师:', teachers[0]);
        }

        // 2. 测试更新教师数据
        if (teachers.length > 0) {
            const teacherId = teachers[0].id;
            console.log('\n=== 测试更新教师数据 ===');
            
            const [result] = await connection.execute(
                'UPDATE teachers SET name = ?, contact = ?, status = ?, title = ?, specialty = ? WHERE id = ?',
                ['测试更新', '13800138000', 1, '测试职务', '测试专业', teacherId]
            );
            
            console.log('更新结果:', result);
            
            // 验证更新
            const [updatedTeacher] = await connection.execute('SELECT * FROM teachers WHERE id = ?', [teacherId]);
            console.log('更新后的教师:', updatedTeacher[0]);
            
            // 恢复原数据
            await connection.execute(
                'UPDATE teachers SET name = ?, contact = ?, status = ?, title = ?, specialty = ? WHERE id = ?',
                [teachers[0].name, teachers[0].contact, teachers[0].status, teachers[0].title, teachers[0].specialty, teacherId]
            );
            console.log('已恢复原数据');
        }

        console.log('\n✅ 教师更新功能测试通过！');

    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testTeacherUpdate(); 