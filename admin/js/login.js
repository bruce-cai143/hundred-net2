/**
 * 管理员登录脚本
 */

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    
    // 检查是否已登录
    checkAuthStatus();
    
    // 登录表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // 验证输入
            if (!username || !password) {
                showError('请输入用户名和密码');
                return;
            }
            
            // 发送登录请求
            login(username, password);
        });
    }
    
    /**
     * 登录请求
     */
    async function login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // 确保包含会话cookie
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            console.log(data)
            
            if (response.ok) {
                // 登录成功，直接跳转到管理面板
                window.location.href = 'index.html';
            } else {
                // 登录失败
                showError(`${data.message}\n错误代码: ${data.code || '未知'}` || '登录失败，请检查用户名和密码');
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            showError('登录请求失败，请稍后重试');
        }
    }
    
    /**
     * 检查认证状态
     */
    async function checkAuthStatus() {
        const currentPage = window.location.pathname.split('/').pop();
        
        try {
            // 检查会话状态
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // 包含会话 cookie
            });
            
            // 处理响应
            if (response.ok) {
                // 已登录
                if (currentPage === 'login.html') {
                    // 如果在登录页但已登录，跳转到管理面板
                    window.location.href = 'index.html';
                }
            } else if (response.status === 401) {
                // 401是预期的未授权响应，不需要在控制台显示错误
                if (currentPage !== 'login.html') {
                    // 如果不在登录页且未登录，安静地跳转到登录页
                    window.location.href = 'login.html';
                }
            } else {
                // 其他错误状态码
                console.warn('检查认证状态失败:', response.status);
                if (currentPage !== 'login.html') {
                    window.location.href = 'login.html';
                }
            }
        } catch (error) {
            // 网络错误或其他异常
            console.error('检查认证状态时发生异常:', error);
            if (currentPage !== 'login.html') {
                window.location.href = 'login.html';
            }
        }
    }
    
    /**
     * 显示错误消息
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
    
    /**
     * 记录活动
     */
    async function logActivity(type, description) {
        try {
            await fetch('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // 包含会话 cookie
                body: JSON.stringify({ type, description })
            });
        } catch (error) {
            console.error('记录活动失败:', error);
        }
    }
});