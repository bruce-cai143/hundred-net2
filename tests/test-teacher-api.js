const fetch = require('node-fetch');

async function testTeacherAPI() {
    try {
        // 测试获取教师列表
        console.log('测试获取教师列表...');
        const response = await fetch('http://localhost:3000/api/teachers');
        const data = await response.json();
        console.log('获取教师列表结果:', data);
        
        if (data.success) {
            console.log('✅ 获取教师列表成功');
        } else {
            console.log('❌ 获取教师列表失败:', data.message);
        }
        
    } catch (error) {
        console.error('❌ API测试失败:', error.message);
    }
}

testTeacherAPI(); 