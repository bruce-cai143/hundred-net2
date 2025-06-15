// 检查登录状态
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    // 首先检查登录状态
    if (!checkAuth()) return;
    // 导航切换
    const navLinks = document.querySelectorAll('.admin-nav a');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href').startsWith('#')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 移除所有active类
                navLinks.forEach(l => l.classList.remove('active'));
                contentSections.forEach(s => s.classList.remove('active'));
                
                // 添加active类到当前项
                this.classList.add('active');
                
                // 显示对应内容区域
                const targetId = this.getAttribute('href').substring(1) + 'Manager';
                document.getElementById(targetId).classList.add('active');
            });
        }
    });
    
    // 退出登录
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('确定要退出登录吗？')) {
            // 清除登录状态
            localStorage.removeItem('adminToken');
            // 跳转到登录页
            window.location.href = 'login.html';
        }
    });
    
    // 加载新闻列表
    loadNews();
    
    // 加载文件列表
    loadFiles();
    
    // 文件上传表单提交
    document.getElementById('fileUploadForm').addEventListener('submit', function(e) {
        e.preventDefault();
        uploadFile(this);
    });
    
    // 添加新闻按钮点击事件
    document.getElementById('addNewsBtn').addEventListener('click', function() {
        showNewsForm();
    });
});

// 加载新闻列表
async function loadNews() {
    if (!checkAuth()) return;
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/news', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('获取新闻失败');
        
        const news = await response.json();
        const newsList = document.getElementById('newsList');
        
        if (news.length === 0) {
            newsList.innerHTML = '<p>暂无新闻</p>';
            return;
        }
        
        newsList.innerHTML = news.map(item => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <div class="admin-item-title">${item.title}</div>
                    <div class="admin-item-meta">发布日期: ${new Date(item.created_at).toLocaleDateString()}</div>
                </div>
                <div class="admin-item-actions">
                    <button class="button small" onclick="editNews(${item.id})">编辑</button>
                    <button class="button small outline" onclick="deleteNews(${item.id})">删除</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载新闻失败:', error);
        document.getElementById('newsList').innerHTML = '<p>加载新闻失败</p>';
    }
}

// 加载文件列表
async function loadFiles() {
    if (!checkAuth()) return;
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/files', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('获取文件失败');
        
        const files = await response.json();
        const filesList = document.getElementById('filesList');
        
        if (files.length === 0) {
            filesList.innerHTML = '<p>暂无文件</p>';
            return;
        }
        
        filesList.innerHTML = files.map(file => `
            <div class="admin-item">
                <div class="admin-item-info">
                    <div class="admin-item-title">${file.title}</div>
                    <div class="admin-item-meta">
                        分类: ${file.category} | 
                        大小: ${formatFileSize(file.file_size)} | 
                        下载次数: ${file.download_count}
                    </div>
                </div>
                <div class="admin-item-actions">
                    <a href="/api/files/${file.id}" class="button small" target="_blank">下载</a>
                    <button class="button small outline" onclick="deleteFile(${file.id})">删除</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载文件失败:', error);
        document.getElementById('filesList').innerHTML = '<p>加载文件失败</p>';
    }
}

// 上传文件
async function uploadFile(form) {
    if (!checkAuth()) return;
    
    const formData = new FormData(form);
    const token = localStorage.getItem('adminToken');
    
    try {
        const response = await fetch('/api/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '上传文件失败');
        }
        
        alert('文件上传成功');
        form.reset();
        loadFiles();
    } catch (error) {
        console.error('上传文件失败:', error);
        alert(error.message || '上传文件失败，请重试');
    }
}

// 显示新闻表单
function showNewsForm(newsData = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = newsData ? '编辑新闻' : '添加新闻';
    
    modalBody.innerHTML = `
        <form id="newsForm">
            ${newsData ? `<input type="hidden" name="id" value="${newsData.id}">` : ''}
            <div class="form-group">
                <label for="newsTitle">标题</label>
                <input type="text" id="newsTitle" name="title" value="${newsData?.title || ''}" required>
            </div>
            <div class="form-group">
                <label for="newsContent">内容</label>
                <textarea id="newsContent" name="content" rows="6" required>${newsData?.content || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="newsCategory">分类</label>
                <input type="text" id="newsCategory" name="category" value="${newsData?.category || ''}">
            </div>
            <div class="form-group">
                <label for="newsImage">封面图片</label>
                <input type="file" id="newsImage" name="image" accept="image/*">
                ${newsData?.image ? `<p>当前图片: ${newsData.image}</p>` : ''}
            </div>
            <button type="submit" class="button">${newsData ? '更新' : '添加'}</button>
        </form>
    `;
    
    modal.style.display = 'block';
    
    // 关闭模态框
    document.querySelector('.close-btn').addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // 提交表单
    document.getElementById('newsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveNews(this, newsData ? true : false);
    });
}

// 保存新闻
async function saveNews(form, isEdit) {
    if (!checkAuth()) return;
    
    const formData = new FormData(form);
    const token = localStorage.getItem('adminToken');
    
    try {
        const url = isEdit ? `/api/news/${formData.get('id')}` : '/api/news';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '保存新闻失败');
        }
        
        alert(isEdit ? '新闻更新成功' : '新闻添加成功');
        document.getElementById('modal').style.display = 'none';
        loadNews();
    } catch (error) {
        console.error('保存新闻失败:', error);
        alert(error.message || '保存新闻失败，请重试');
    }
}

// 编辑新闻
async function editNews(id) {
    if (!checkAuth()) return;
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/news/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('获取新闻详情失败');
        
        const news = await response.json();
        showNewsForm(news);
    } catch (error) {
        console.error('获取新闻详情失败:', error);
        alert('获取新闻详情失败，请重试');
    }
}

// 删除新闻
async function deleteNews(id) {
    if (!checkAuth()) return;
    if (!confirm('确定要删除这条新闻吗？')) return;
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/news/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('删除新闻失败');
        
        alert('新闻删除成功');
        loadNews();
    } catch (error) {
        console.error('删除新闻失败:', error);
        alert('删除新闻失败，请重试');
    }
}

// 删除文件
async function deleteFile(id) {
    if (!checkAuth()) return;
    if (!confirm('确定要删除这个文件吗？')) return;
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/files/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('删除文件失败');
        
        alert('文件删除成功');
        loadFiles();
    } catch (error) {
        console.error('删除文件失败:', error);
        alert('删除文件失败，请重试');
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}