// 管理后台通用工具函数
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 自动消失
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 检查登录状态
async function checkAuth() {
    try {
        // 验证会话状态
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include' // 确保发送cookie
        });
        
        if (!response.ok) {
            throw new Error('未登录或会话已过期');
        }
        
        return true;
    } catch (error) {
        console.error('验证登录状态失败:', error);
        window.location.href = '/admin/login.html';
        return false;
    }
}

// 退出登录
async function logout() {
    // 显示确认对话框
    const confirmLogout = confirm('确定要退出登录吗？');
    if (confirmLogout) {
        try {
            // 发送退出请求到服务器
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('退出登录请求失败:', error);
        } finally {
            // 重定向到登录页
            window.location.href = '/index.html';
        }
    }
}

// 初始化退出登录按钮
function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// 在页面加载时初始化退出登录功能
document.addEventListener('DOMContentLoaded', () => {
    initLogout();
});

// 为所有请求添加认证
async function authenticatedFetch(url, options = {}) {
    try {
        const response = await fetch(url, { 
            ...options, 
            credentials: 'include'  // 确保发送cookie
        });
        
        if (response.status === 401) {
            window.location.href = '/admin/login.html';
            throw new Error('未登录或会话已过期');
        }
        return response;
    } catch (error) {
        console.error('请求失败:', error);
        throw error;
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 获取文件图标
function getFileIcon(fileType) {
    const icons = {
        'image': '🖼️',
        'video': '🎥',
        'audio': '🎵',
        'document': '📄',
        'pdf': '📕',
        'archive': '📦',
        'other': '📎'
    };
    return icons[fileType] || icons.other;
}

// API请求函数
async function apiRequest(url, options = {}) {
    try {
        const response = await authenticatedFetch(url, options);
        return await response.json();
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
}

// 导出工具函数
export {
    formatFileSize,
    formatDate,
    showNotification,
    checkAuth,
    logout,
    authenticatedFetch,
    apiRequest,
    debounce,
    getFileIcon
};