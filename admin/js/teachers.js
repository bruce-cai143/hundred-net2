// 教师管理功能

// DOM 元素
document.addEventListener('DOMContentLoaded', async function() {
    // 检查认证状态
    const { checkAuth, logout } = await import('./admin-utils.js');
    await checkAuth();

    // 绑定退出登录事件
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    const teachersTable = document.getElementById('teachers-table');
    const addTeacherBtn = document.getElementById('add-teacher-btn');
    const teacherModal = document.getElementById('teacher-modal');
    const teacherForm = document.getElementById('teacher-form');
    const avatarPreview = document.getElementById('avatar-preview');

// 获取教师列表
async function getTeachers() {
    try {
        const response = await fetch('/api/teachers');
        const data = await response.json();
        if (response.ok) {
            renderTeachers(data);
            updateDashboardCount(data.length);
        } else {
            showToast('error', '获取教师列表失败');
        }
    } catch (error) {
        console.error('获取教师列表出错:', error);
        showToast('error', '获取教师列表出错');
    }
}

// 渲染教师列表
function renderTeachers(teachers) {
    const tbody = teachersTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    teachers.forEach((teacher) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="${teacher.avatar || 'https://via.placeholder.com/40'}" alt="${teacher.name}" class="rounded-circle" style="width: 40px; height: 40px;">
            </td>
            <td>${teacher.name}</td>
            <td>${teacher.title}</td>
            <td>${teacher.department}</td>
            <td>${teacher.email}</td>
            <td>${teacher.phone}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editTeacher(${teacher.id})">
                    <i class="bi bi-pencil"></i> 编辑
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTeacher(${teacher.id})">
                    <i class="bi bi-trash"></i> 删除
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 头像预览
function previewAvatar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            avatarPreview.src = e.target.result;
            avatarPreview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 添加教师
async function addTeacher(formData) {
    try {
        const response = await fetch('/api/teachers', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showToast('success', '添加教师成功');
            getTeachers();
            closeModal();
        } else {
            const error = await response.json();
            showToast('error', error.message || '添加教师失败');
        }
    } catch (error) {
        console.error('添加教师出错:', error);
        showToast('error', '添加教师出错');
    }
}

// 编辑教师
async function editTeacher(id) {
    try {
        const response = await fetch(`/api/teachers/${id}`);
        const teacher = await response.json();
        
        if (response.ok) {
            // 填充表单
            teacherForm.name.value = teacher.name;
            teacherForm.title.value = teacher.title;
            teacherForm.department.value = teacher.department;
            teacherForm.email.value = teacher.email;
            teacherForm.phone.value = teacher.phone;
            if (teacher.avatar) {
                avatarPreview.src = teacher.avatar;
                avatarPreview.style.display = 'block';
            }
            
            // 更新模态框
            teacherModal.querySelector('.modal-title').textContent = '编辑教师';
            teacherForm.dataset.id = id;
            
            // 显示模态框
            const modal = new bootstrap.Modal(teacherModal);
            modal.show();
        } else {
            showToast('error', '获取教师信息失败');
        }
    } catch (error) {
        console.error('获取教师信息出错:', error);
        showToast('error', '获取教师信息出错');
    }
}

// 更新教师
async function updateTeacher(id, formData) {
    try {
        const response = await fetch(`/api/teachers/${id}`, {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            showToast('success', '更新教师成功');
            getTeachers();
            closeModal();
        } else {
            const error = await response.json();
            showToast('error', error.message || '更新教师失败');
        }
    } catch (error) {
        console.error('更新教师出错:', error);
        showToast('error', '更新教师出错');
    }
}

// 删除教师
async function deleteTeacher(id) {
    if (!confirm('确定要删除这个教师吗？')) return;
    
    try {
        const response = await fetch(`/api/teachers/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('success', '删除教师成功');
            getTeachers();
        } else {
            const error = await response.json();
            showToast('error', error.message || '删除教师失败');
        }
    } catch (error) {
        console.error('删除教师出错:', error);
        showToast('error', '删除教师出错');
    }
}

// 关闭模态框
function closeModal() {
    const modal = bootstrap.Modal.getInstance(teacherModal);
    if (modal) {
        modal.hide();
        teacherForm.reset();
        avatarPreview.style.display = 'none';
        teacherForm.dataset.id = '';
    }
}

// 更新仪表盘计数
function updateDashboardCount(count) {
    const countElement = document.getElementById('teachers-count');
    if (countElement) {
        countElement.textContent = count;
    }
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 获取初始数据
    getTeachers();
    
    // 表单提交处理
    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(teacherForm);
        const id = teacherForm.dataset.id;
        
        if (id) {
            await updateTeacher(id, formData);
        } else {
            await addTeacher(formData);
        }
    });
    
    // 头像上传预览
    teacherForm.querySelector('input[type="file"]').addEventListener('change', function() {
        previewAvatar(this);
    });
    
    // 添加按钮点击
    addTeacherBtn.addEventListener('click', () => {
        teacherModal.querySelector('.modal-title').textContent = '添加教师';
        teacherForm.dataset.id = '';
        const modal = new bootstrap.Modal(teacherModal);
        modal.show();
    });
});
});