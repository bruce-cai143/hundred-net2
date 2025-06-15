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

// 显示提示信息
function showToast(type, message) {
    // 如果页面中已经有toast插件，使用它
    if (window.Swal) {
        Swal.fire({
            icon: type === 'success' ? 'success' : 'error',
            title: type === 'success' ? '成功' : '错误',
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    } else {
        // 否则使用简单的原生方式
        alert(message);
    }
}

// 确认删除对话框
async function confirmDelete(message) {
    if (window.Swal) {
        const result = await Swal.fire({
            title: '确认删除',
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '确定删除',
            cancelButtonText: '取消'
        });
        return result.isConfirmed;
    } else {
        return confirm(message);
    }
}

// 检查登录状态
async function checkLogin() {
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

// API请求封装
async function apiRequest(url, options = {}, isFormData = false) {
    try {
        // 设置默认选项
        const defaultOptions = {
            method: 'GET',
            credentials: 'include', // 确保发送cookie
            headers: !isFormData ? { 'Content-Type': 'application/json' } : {}
        };
        
        // 合并选项
        const mergedOptions = { ...defaultOptions, ...options };
        
        // 发送请求
        const response = await fetch(url, mergedOptions);
        
        // 处理未授权响应
        if (response.status === 401) {
            window.location.href = '/admin/login.html';
            throw new Error('未登录或会话已过期');
        }
        
        // 解析响应JSON
        const data = await response.json();
        
        // 如果响应包含错误字段，则抛出错误
        if (!data.success && data.message) {
            throw new Error(data.message);
        }
        
        return data;
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
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

// 导出工具函数
export {
    formatFileSize,
    formatDate,
    showToast,
    confirmDelete,
    checkLogin,
    apiRequest,
    logout,
    debounce,
    getFileIcon
};