// 青年委员会管理模块
import { checkLogin, apiRequest, showToast, confirmDelete } from './admin-utils.js';

// 页面初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    await checkLogin();
    
    // 初始化表单事件
    initFormHandlers();
    
    // 加载委员会成员列表
    fetchTeachersList();
});

// 初始化表单处理
function initFormHandlers() {
    // 委员会成员添加表单
    const teacherForm = document.getElementById('teacher-form');
    teacherForm.addEventListener('submit', handleTeacherSubmit);
    
    // 初始化图片预览
    initImagePreview('teacher-avatar', 'avatar-preview');
    initImagePreview('edit-teacher-avatar', 'edit-avatar-preview');
    
    // 委员会成员更新按钮
    const updateTeacherBtn = document.getElementById('update-teacher');
    updateTeacherBtn.addEventListener('click', handleTeacherUpdate);
}

// 初始化图片预览
function initImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    input.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

// 获取委员会成员列表
async function fetchTeachersList() {
    try {
        // 首先尝试从API获取
        let teachers = [];
        try {
            const response = await apiRequest('/api/teachers');
            if (response.success) {
                teachers = response.data;
            }
        } catch (error) {
            console.warn('API获取委员会成员失败，将尝试从team.html页面获取');
        }
        
        // 如果API没有数据或失败，从team.html页面获取
        if (teachers.length === 0) {
            teachers = await fetchTeachersFromTeamPage();
        }
        
        renderTeachersTable(teachers);
    } catch (error) {
        showToast('error', '获取委员会成员列表时发生错误');
        console.error('Error fetching teachers:', error);
    }
}

// 从team.html页面获取委员会成员数据
async function fetchTeachersFromTeamPage() {
    try {
        const response = await fetch('/team.html');
        const htmlText = await response.text();
        
        // 创建一个临时的DOM元素来解析HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // 查找所有教师卡片
        const teacherCards = doc.querySelectorAll('.teacher-card');
        
        // 提取教师信息
        const teachers = Array.from(teacherCards).map((card, index) => {
            const name = card.querySelector('.teacher-name')?.textContent.trim() || '';
            const description = card.querySelector('.teacher-description')?.textContent.trim() || '';
            const imgSrc = card.querySelector('.teacher-image img')?.getAttribute('src') || '';
            
            return {
                _id: `team-${index + 1}`, // 生成一个临时ID
                name: name,
                contact: '', // team.html中可能没有联系方式
                introduction: description,
                avatar: imgSrc,
                status: true, // 假设所有展示的成员都是在职的
                displayOrder: index + 1 // 显示顺序
            };
        });
        
        return teachers;
    } catch (error) {
        console.error('从team.html获取教师数据失败:', error);
        return [];
    }
}

// 渲染委员会成员表格
function renderTeachersTable(teachers) {
    const tableBody = document.getElementById('teachers-table');
    tableBody.innerHTML = '';
    
    if (teachers.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="7" class="text-center">暂无委员会成员数据</td>';
        tableBody.appendChild(emptyRow);
        return;
    }
    
    // 按显示顺序排序
    teachers.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    teachers.forEach((teacher, index) => {
        const row = document.createElement('tr');
        row.dataset.id = teacher._id;
        row.innerHTML = `
            <td><i class="bi bi-grip-vertical handle"></i></td>
            <td>${index + 1}</td>
            <td><img src="${teacher.avatar || '../assets/icon/default-avatar.png'}" alt="${teacher.name}" class="avatar-thumbnail"></td>
            <td>${teacher.name}</td>
            <td>${teacher.contact || ''}</td>
            <td>${teacher.status ? '<span class="badge bg-success">在职</span>' : '<span class="badge bg-secondary">离职</span>'}</td>
            <td class="action-buttons">
                <button type="button" class="btn btn-sm btn-primary edit-teacher" data-id="${teacher._id}">
                    <i class="bi bi-pencil"></i> 编辑
                </button>
                <button type="button" class="btn btn-sm btn-danger delete-teacher" data-id="${teacher._id}">
                    <i class="bi bi-trash"></i> 删除
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // 绑定编辑按钮事件
    document.querySelectorAll('.edit-teacher').forEach(button => {
        button.addEventListener('click', function() {
            const teacherId = this.getAttribute('data-id');
            openEditTeacherModal(teacherId, teachers);
        });
    });
    
    // 绑定删除按钮事件
    document.querySelectorAll('.delete-teacher').forEach(button => {
        button.addEventListener('click', function() {
            const teacherId = this.getAttribute('data-id');
            handleTeacherDelete(teacherId);
        });
    });
    
    // 初始化排序功能
    initSortable(teachers);
}

// 初始化排序功能
function initSortable(teachers) {
    const tbody = document.getElementById('teachers-table');
    
    if (window.Sortable) {
        new Sortable(tbody, {
            handle: '.handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function(evt) {
                updateTeachersOrder();
            }
        });
    }
}

// 更新教师顺序
async function updateTeachersOrder() {
    const tbody = document.getElementById('teachers-table');
    const rows = tbody.querySelectorAll('tr');
    
    const orderData = Array.from(rows).map((row, index) => {
        const id = row.dataset.id;
        return { id, order: index + 1 };
    });
    
    try {
        // 尝试使用API更新顺序
        const response = await apiRequest('/api/teachers/order', {
            method: 'PUT',
            body: JSON.stringify({ order: orderData }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.success) {
            showToast('success', '委员会成员排序更新成功');
        } else {
            console.warn('API更新顺序失败，将尝试更新team.html');
            await updateTeamHtml();
        }
    } catch (error) {
        console.warn('API更新顺序发生错误，将尝试更新team.html:', error);
        await updateTeamHtml();
    }
}

// 处理委员会成员表单提交
async function handleTeacherSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // 收集表单数据
    const teacherData = {
        name: formData.get('name'),
        contact: formData.get('contact'),
        introduction: formData.get('introduction'),
        status: formData.has('status')
    };
    
    try {
        // 尝试使用API添加
        let success = false;
        let newTeacher = null;
        
        try {
            const response = await apiRequest('/api/teachers', {
                method: 'POST',
                body: formData,
                headers: {
                    // 不设置Content-Type，让浏览器自动设置包含boundary的multipart/form-data
                }
            }, true);
            
            if (response.success) {
                success = true;
                newTeacher = response.data;
                showToast('success', '委员会成员添加成功');
            }
        } catch (error) {
            console.warn('API添加委员会成员失败，将尝试直接更新team.html');
        }
        
        // 如果API添加失败，尝试直接更新team.html
        if (!success) {
            // 生成一个临时ID
            newTeacher = {
                _id: `temp-${Date.now()}`,
                ...teacherData,
                displayOrder: 999 // 放在最后
            };
            
            // 处理头像文件
            const avatarFile = formData.get('avatar');
            if (avatarFile && avatarFile.size > 0) {
                const reader = new FileReader();
                reader.onload = async function(e) {
                    newTeacher.avatar = e.target.result;
                    // 获取当前列表并添加新成员
                    const teachers = await fetchTeachersFromTeamPage();
                    teachers.push(newTeacher);
                    // 渲染表格并更新team.html
                    renderTeachersTable(teachers);
                    await updateTeamHtml(teachers);
                };
                reader.readAsDataURL(avatarFile);
            } else {
                newTeacher.avatar = '../assets/icon/default-avatar.png';
                // 获取当前列表并添加新成员
                const teachers = await fetchTeachersFromTeamPage();
                teachers.push(newTeacher);
                // 渲染表格并更新team.html
                renderTeachersTable(teachers);
                await updateTeamHtml(teachers);
            }
            
            showToast('success', '委员会成员添加成功（直接更新了team.html页面）');
        }
        
        // 重置表单
        form.reset();
        document.getElementById('avatar-preview').src = '../assets/icon/default-avatar.png';
        
        // 刷新列表
        fetchTeachersList();
    } catch (error) {
        showToast('error', '添加委员会成员时发生错误');
        console.error('Error adding teacher:', error);
    }
}

// 打开编辑委员会成员模态框
function openEditTeacherModal(teacherId, teachers) {
    const teacher = teachers.find(t => t._id === teacherId);
    if (!teacher) return;
    
    // 填充表单数据
    document.getElementById('edit-teacher-id').value = teacher._id;
    document.getElementById('edit-teacher-name').value = teacher.name;
    document.getElementById('edit-teacher-contact').value = teacher.contact || '';
    document.getElementById('edit-teacher-introduction').value = teacher.introduction || '';
    document.getElementById('edit-teacher-status').checked = teacher.status;
    
    // 设置头像预览
    const avatarPreview = document.getElementById('edit-avatar-preview');
    avatarPreview.src = teacher.avatar || '../assets/icon/default-avatar.png';
    
    // 显示模态框
    const editModal = new bootstrap.Modal(document.getElementById('editTeacherModal'));
    editModal.show();
}

// 处理委员会成员更新
async function handleTeacherUpdate() {
    const teacherId = document.getElementById('edit-teacher-id').value;
    const form = document.getElementById('edit-teacher-form');
    const formData = new FormData(form);
    
    // 收集更新的数据
    const updatedTeacher = {
        _id: teacherId,
        name: document.getElementById('edit-teacher-name').value,
        contact: document.getElementById('edit-teacher-contact').value,
        introduction: document.getElementById('edit-teacher-introduction').value,
        status: document.getElementById('edit-teacher-status').checked
    };
    
    try {
        // 尝试使用API更新
        let success = false;
        
        try {
            const response = await apiRequest(`/api/teachers/${teacherId}`, {
                method: 'PUT',
                body: formData,
                headers: {
                    // 不设置Content-Type，让浏览器自动设置包含boundary的multipart/form-data
                }
            }, true);
            
            if (response.success) {
                success = true;
                showToast('success', '委员会成员信息更新成功');
            }
        } catch (error) {
            console.warn('API更新委员会成员失败，将尝试直接更新team.html');
        }
        
        // 如果API更新失败，尝试直接更新team.html
        if (!success) {
            // 处理头像文件
            const avatarFile = formData.get('avatar');
            if (avatarFile && avatarFile.size > 0) {
                const reader = new FileReader();
                reader.onload = async function(e) {
                    updatedTeacher.avatar = e.target.result;
                    
                    // 获取当前列表并更新成员
                    const teachers = await fetchTeachersFromTeamPage();
                    const index = teachers.findIndex(t => t._id === teacherId);
                    if (index !== -1) {
                        teachers[index] = {...teachers[index], ...updatedTeacher};
                    }
                    
                    // 渲染表格并更新team.html
                    renderTeachersTable(teachers);
                    await updateTeamHtml(teachers);
                };
                reader.readAsDataURL(avatarFile);
            } else {
                // 获取当前列表并更新成员
                const teachers = await fetchTeachersFromTeamPage();
                const index = teachers.findIndex(t => t._id === teacherId);
                if (index !== -1) {
                    // 保留原来的头像
                    updatedTeacher.avatar = teachers[index].avatar;
                    teachers[index] = {...teachers[index], ...updatedTeacher};
                }
                
                // 渲染表格并更新team.html
                renderTeachersTable(teachers);
                await updateTeamHtml(teachers);
            }
            
            showToast('success', '委员会成员信息更新成功（直接更新了team.html页面）');
        }
        
        // 关闭模态框
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editTeacherModal'));
        editModal.hide();
        
        // 刷新列表
        fetchTeachersList();
    } catch (error) {
        showToast('error', '更新委员会成员信息时发生错误');
        console.error('Error updating teacher:', error);
    }
}

// 处理委员会成员删除
async function handleTeacherDelete(teacherId) {
    const confirmed = await confirmDelete('确定要删除这位委员会成员吗？');
    if (!confirmed) return;
    
    try {
        // 尝试使用API删除
        let success = false;
        
        try {
            const response = await apiRequest(`/api/teachers/${teacherId}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                success = true;
                showToast('success', '委员会成员删除成功');
            }
        } catch (error) {
            console.warn('API删除委员会成员失败，将尝试直接更新team.html');
        }
        
        // 如果API删除失败，尝试直接更新team.html
        if (!success) {
            // 获取当前列表并删除成员
            const teachers = await fetchTeachersFromTeamPage();
            const filteredTeachers = teachers.filter(t => t._id !== teacherId);
            
            // 渲染表格并更新team.html
            renderTeachersTable(filteredTeachers);
            await updateTeamHtml(filteredTeachers);
            
            showToast('success', '委员会成员删除成功（直接更新了team.html页面）');
        }
        
        // 刷新列表
        fetchTeachersList();
    } catch (error) {
        showToast('error', '删除委员会成员时发生错误');
        console.error('Error deleting teacher:', error);
    }
}

// 更新team.html页面
async function updateTeamHtml(teachers = null) {
    try {
        // 如果没有传入teachers参数，先获取当前列表
        if (!teachers) {
            teachers = [];
            const rows = document.querySelectorAll('#teachers-table tr');
            
            rows.forEach((row, index) => {
                const id = row.dataset.id;
                const name = row.cells[3].textContent;
                const contact = row.cells[4].textContent;
                const avatar = row.querySelector('img').src;
                
                teachers.push({
                    _id: id,
                    name,
                    contact,
                    avatar,
                    displayOrder: index + 1
                });
            });
        }
        
        // 获取team.html页面内容
        const response = await fetch('/team.html');
        let htmlText = await response.text();
        
        // 创建一个临时的DOM元素来解析HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // 找到教师网格容器
        const teachersGrid = doc.querySelector('.teachers-grid');
        if (!teachersGrid) {
            throw new Error('在team.html中找不到.teachers-grid元素');
        }
        
        // 清空原有内容
        teachersGrid.innerHTML = '';
        
        // 按显示顺序排序
        teachers.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        
        // 只显示在职的成员
        const activeTeachers = teachers.filter(teacher => teacher.status);
        
        // 添加委员会成员卡片
        activeTeachers.forEach(teacher => {
            const card = document.createElement('div');
            card.className = 'teacher-card';
            card.innerHTML = `
                <div class="teacher-image">
                    <img src="${teacher.avatar || '../assets/icon/default-avatar.png'}" alt="${teacher.name}">
                </div>
                <div class="teacher-info">
                    <h3 class="teacher-name">${teacher.name}</h3>
                    <p class="teacher-description">${teacher.introduction || ''}</p>
                    <div class="teacher-social">
                        <a href="#"><i class="fab fa-weixin"></i></a>
                        <a href="#"><i class="fas fa-envelope"></i></a>
                        <a href="#"><i class="fab fa-weibo"></i></a>
                    </div>
                </div>
            `;
            teachersGrid.appendChild(card);
        });
        
        // 将修改后的HTML转回字符串
        const serializer = new XMLSerializer();
        const updatedHtml = serializer.serializeToString(doc);
        
        // 使用 fetch 或 XMLHttpRequest 发送更新请求到服务器
        const updateResponse = await fetch('/api/update-team-html', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ html: updatedHtml })
        });
        
        if (!updateResponse.ok) {
            throw new Error('更新team.html文件失败');
        }
        
        return true;
    } catch (error) {
        console.error('更新team.html失败:', error);
        showToast('error', '更新team.html页面失败：' + error.message);
        return false;
    }
}

