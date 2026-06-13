// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.error('找不到登录表单');
        return;
    }

    // 登录处理
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            alert('用户名和密码不能为空');
            return;
        }
        
        try {
            console.log('提交登录请求...');
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            console.log('登录响应状态:', response.status);
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('登录成功，获取到令牌');
                // 保存令牌到本地存储
                localStorage.setItem('adminToken', data.token);
                window.location.href = 'dashboard.html';
            } else {
                console.error('登录失败:', data.message);
                alert(data.message || '登录失败，请检查用户名和密码');
            }
        } catch (error) {
            console.error('登录错误:', error);
            alert('登录失败，请检查网络连接');
        }
    });
});