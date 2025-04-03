// 导航栏管理相关功能
/**
 * 系统设置脚本
 */

document.addEventListener('DOMContentLoaded', async function() {
    // 检查认证状态
    const { checkAuth, logout } = await import('./admin-utils.js');
    await checkAuth();

    // 绑定退出登录事件
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // 获取DOM元素
    const passwordForm = document.getElementById('password-form');
    const profileForm = document.getElementById('profile-form');
    const clearActivitiesBtn = document.getElementById('clear-activities-btn');
    const backupDbBtn = document.getElementById('backup-db-btn');
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    
    // 密码相关元素
    const currentPassword = document.getElementById('current-password');
    const newPassword = document.getElementById('new-password');
// 获取导航项列表
async function getNavItems() {
    try {
        const response = await fetch('/api/settings/nav-items');
        const data = await response.json();
        if (response.ok) {
            renderNavItems(data);
        } else {
            showError('nav-items-error', data.message);
        }
    } catch (error) {
        showError('nav-items-error', '获取导航项失败');
    }
}

// 渲染导航项列表
function renderNavItems(items) {
    const tbody = document.getElementById('nav-items-table');
    tbody.innerHTML = '';
    
    items.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.link}</td>
            <td>${item.order}</td>
            <td>
                <span class="badge ${item.status ? 'bg-success' : 'bg-secondary'}">
                    ${item.status ? '启用' : '禁用'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary me-2" onclick="editNavItem(${item.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteNavItem(${item.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 添加导航项
async function addNavItem(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('nav-item-name').value,
        link: document.getElementById('nav-item-link').value,
        order: parseInt(document.getElementById('nav-item-order').value),
        status: document.getElementById('nav-item-status').checked
    };
    
    try {
        const response = await fetch('/api/settings/nav-items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (response.ok) {
            // 关闭模态框并刷新列表
            const modal = bootstrap.Modal.getInstance(document.getElementById('addNavItemModal'));
            modal.hide();
            document.getElementById('nav-item-form').reset();
            getNavItems();
        } else {
            showError('nav-item-error', data.message);
        }
    } catch (error) {
        showError('nav-item-error', '添加导航项失败');
    }
}

// 编辑导航项
async function editNavItem(id) {
    try {
        const response = await fetch(`/api/settings/nav-items/${id}`);
        const data = await response.json();
        
        if (response.ok) {
            // 填充表单
            document.getElementById('edit-nav-item-id').value = data.id;
            document.getElementById('edit-nav-item-name').value = data.name;
            document.getElementById('edit-nav-item-link').value = data.link;
            document.getElementById('edit-nav-item-order').value = data.order;
            document.getElementById('edit-nav-item-status').checked = data.status;
            
            // 显示模态框
            const modal = new bootstrap.Modal(document.getElementById('editNavItemModal'));
            modal.show();
        } else {
            showError('nav-item-error', data.message);
        }
    } catch (error) {
        showError('nav-item-error', '获取导航项信息失败');
    }
}

// 更新导航项
async function updateNavItem(event) {
    event.preventDefault();
    
    const id = document.getElementById('edit-nav-item-id').value;
    const formData = {
        name: document.getElementById('edit-nav-item-name').value,
        link: document.getElementById('edit-nav-item-link').value,
        order: parseInt(document.getElementById('edit-nav-item-order').value),
        status: document.getElementById('edit-nav-item-status').checked
    };
    
    try {
        const response = await fetch(`/api/settings/nav-items/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (response.ok) {
            // 关闭模态框并刷新列表
            const modal = bootstrap.Modal.getInstance(document.getElementById('editNavItemModal'));
            modal.hide();
            document.getElementById('edit-nav-item-form').reset();
            getNavItems();
        } else {
            showError('edit-nav-item-error', data.message);
        }
    } catch (error) {
        showError('edit-nav-item-error', '更新导航项失败');
    }
}

// 删除导航项
async function deleteNavItem(id) {
    if (!confirm('确定要删除这个导航项吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/settings/nav-items/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            getNavItems();
        } else {
            const data = await response.json();
            showError('nav-items-error', data.message);
        }
    } catch (error) {
        showError('nav-items-error', '删除导航项失败');
    }
}

// 显示错误信息
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
    setTimeout(() => {
        errorElement.classList.add('d-none');
    }, 3000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 获取导航项列表
    getNavItems();
    
    // 添加导航项表单提交事件
    document.getElementById('nav-item-form').addEventListener('submit', addNavItem);
    
    // 编辑导航项表单提交事件
    document.getElementById('edit-nav-item-form').addEventListener('submit', updateNavItem);
});
});