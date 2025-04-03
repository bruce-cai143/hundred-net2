/**
 * 结构管理脚本
 */

// 获取导航项列表
async function getNavItems() {
    try {
        const response = await fetch('/api/navigation');
        const data = await response.json();
        if (response.ok) {
            renderNavItems(data.items);
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
            <td>${item.url}</td>
            <td>${item.sort_order}</td>
            <td>
                <span class="badge ${item.is_active ? 'bg-success' : 'bg-secondary'}">
                    ${item.is_active ? '启用' : '禁用'}
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
        url: document.getElementById('nav-item-link').value,
        sort_order: parseInt(document.getElementById('nav-item-order').value),
        is_active: document.getElementById('nav-item-status').checked
    };
    
    try {
        const response = await fetch('/api/navigation', {
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
        const response = await fetch(`/api/navigation/${id}`);
        const data = await response.json();
        
        if (response.ok) {
            const item = data.item;
            // 填充表单
            document.getElementById('edit-nav-item-id').value = item.id;
            document.getElementById('edit-nav-item-name').value = item.name;
            document.getElementById('edit-nav-item-link').value = item.url;
            document.getElementById('edit-nav-item-order').value = item.sort_order;
            document.getElementById('edit-nav-item-status').checked = item.is_active;
            
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
        url: document.getElementById('edit-nav-item-link').value,
        sort_order: parseInt(document.getElementById('edit-nav-item-order').value),
        is_active: document.getElementById('edit-nav-item-status').checked
    };
    
    try {
        const response = await fetch(`/api/navigation/${id}`, {
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
        const response = await fetch(`/api/navigation/${id}`, {
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