// 导入工具函数
import { checkAuth, logout, showNotification, authenticatedFetch } from './admin-utils.js';

// 全局变量
let currentPage = 1;

// 获取新闻列表
async function getNewsList(page = 1) {
    try {
        // 检查用户是否已登录，如果未登录会自动重定向
        if (!checkAuth()) {
            return;
        }
        
        currentPage = page;
        const response = await fetch(`/api/news/admin/list?page=${page}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '获取新闻列表失败');
        }
        
        const data = await response.json();
        displayNewsList(data.news);
        displayPagination(data.pagination);
    } catch (error) {
        console.error('获取新闻列表错误:', error);
        showNotification(error.message, 'error');
    }
}

// 显示新闻列表
function displayNewsList(news) {
    const newsListElement = document.getElementById('newsList');
    
    if (!newsListElement) {
        console.error('新闻列表元素不存在');
        return;
    }
    
    if (news.length === 0) {
        newsListElement.innerHTML = '<p class="text-center py-4">暂无新闻</p>';
        return;
    }
    
    newsListElement.innerHTML = news.map(item => `
        <div class="news-item" data-id="${item.id}">
            <div class="news-item-title">${item.title}</div>
            <div class="news-item-meta">
                ${item.author ? `作者：${item.author} | ` : ''}
                分类：${item.category || '未分类'} | 
                发布时间：${new Date(item.created_at).toLocaleString()}
            </div>
            <div class="news-preview">
                ${item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content}
            </div>
            <div class="news-actions">
                <button class="btn-view" onclick="window.viewNews(${item.id})">
                    <i class="bi bi-eye"></i> 查看
                </button>
                <button class="btn-edit" onclick="window.editNews(${item.id})">
                    <i class="bi bi-pencil"></i> 编辑
                </button>
                <button class="btn-delete" onclick="window.deleteNews(${item.id})">
                    <i class="bi bi-trash"></i> 删除
                </button>
            </div>
        </div>
    `).join('');
}

// 显示分页
function displayPagination(pagination) {
    const paginationElement = document.getElementById('pagination');
    
    if (!paginationElement) {
        console.error('分页元素不存在');
        return;
    }
    
    if (pagination.totalPages <= 1) {
        paginationElement.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 上一页按钮
    paginationHTML += `
        <button 
            ${pagination.page === 1 ? 'disabled' : ''}
            onclick="window.getNewsList(${pagination.page - 1})"
        >&laquo;</button>
    `;
    
    // 页码按钮
    for (let i = 1; i <= pagination.totalPages; i++) {
        // 只显示当前页附近的页码
        if (i === 1 || i === pagination.totalPages || (i >= pagination.page - 2 && i <= pagination.page + 2)) {
            paginationHTML += `
                <button 
                    ${pagination.page === i ? 'class="active"' : ''}
                    onclick="window.getNewsList(${i})"
                >${i}</button>
            `;
        } else if (i === pagination.page - 3 || i === pagination.page + 3) {
            paginationHTML += `<span>...</span>`;
        }
    }
    
    // 下一页按钮
    paginationHTML += `
        <button 
            ${pagination.page === pagination.totalPages ? 'disabled' : ''}
            onclick="window.getNewsList(${pagination.page + 1})"
        >&raquo;</button>
    `;
    
    paginationElement.innerHTML = paginationHTML;
}

// 图片预览
document.getElementById('images')?.addEventListener('change', function(event) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;
    
    // 获取当前已有的图片数量
    const existingImages = preview.querySelectorAll('.image-item').length;
    const newFiles = Array.from(this.files);
    
    // 检查总图片数量是否超过限制
    if (existingImages + newFiles.length > 5) {
        showNotification('最多只能上传5张图片', 'warning');
        this.value = '';
        return;
    }
    
    // 创建或获取隐藏的input来存储所有文件
    let hiddenInput = document.getElementById('allImages');
    if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        hiddenInput.type = 'file';
        hiddenInput.id = 'allImages';
        hiddenInput.name = 'images';
        hiddenInput.multiple = true;
        hiddenInput.style.display = 'none';
        document.getElementById('newsForm').appendChild(hiddenInput);
    }
    
    // 将新文件添加到隐藏input
    const dt = new DataTransfer();
    const currentFiles = hiddenInput.files;
    
    // 添加现有文件
    for (let i = 0; i < currentFiles.length; i++) {
        dt.items.add(currentFiles[i]);
    }
    
    // 添加新文件
    newFiles.forEach(file => {
        dt.items.add(file);
    });
    
    hiddenInput.files = dt.files;
    
    newFiles.forEach((file, index) => {
        // 验证文件类型
        if (!file.type.match('image.*')) {
            showNotification(`文件 "${file.name}" 不是图片，请选择图片文件`, 'error');
            return;
        }
        
        // 验证文件大小
        if (file.size > 5 * 1024 * 1024) { // 5MB
            showNotification(`图片 "${file.name}" 超过5MB限制`, 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const div = document.createElement('div');
            div.className = 'image-item';
            const actualIndex = existingImages + index;
            div.innerHTML = `
                <img src="${e.target.result}" alt="预览图片">
                <button type="button" class="remove-image" data-index="${actualIndex}" data-filename="${file.name}">×</button>
                <input type="text" class="image-caption" name="caption_${actualIndex}" placeholder="图片说明">
            `;
            
            // 添加删除按钮事件
            div.querySelector('.remove-image').addEventListener('click', function() {
                removeImage(parseInt(this.getAttribute('data-index')), this.getAttribute('data-filename'));
            });
            
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
    
    // 清空input，允许重复选择同一文件
    this.value = '';
});

// 删除预览图片
function removeImage(index, filename) {
    try {
        const preview = document.getElementById('imagePreview');
        const hiddenInput = document.getElementById('allImages');
        
        if (!preview) return;
        
        // 从隐藏input中移除指定文件
        if (hiddenInput) {
        const dt = new DataTransfer();
            const currentFiles = hiddenInput.files;
        
            for (let i = 0; i < currentFiles.length; i++) {
                if (currentFiles[i].name !== filename) {
                    dt.items.add(currentFiles[i]);
            }
        }
        
            hiddenInput.files = dt.files;
        }
        
        // 找到对应索引的预览项并删除
        const imageItems = preview.querySelectorAll('.image-item');
        if (index < imageItems.length) {
            imageItems[index].remove();
        }
        
        // 更新剩余图片的index和caption索引
        const remainingItems = preview.querySelectorAll('.image-item');
        remainingItems.forEach((item, i) => {
            item.querySelector('.remove-image').setAttribute('data-index', i);
            const caption = item.querySelector('.image-caption');
            caption.name = `caption_${i}`;
        });
    } catch (error) {
        console.error('移除图片错误:', error);
        showNotification('移除图片失败', 'error');
    }
}

// 提交表单
const form = document.getElementById('newsForm');
if (form) {
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        try {
            // 检查用户是否已登录
            if (!checkAuth()) {
                return;
            }
            
            // 验证表单
            if (!validateNewsForm()) {
                return;
            }
            
            // 获取表单数据
            const formData = new FormData(form);
            const newsId = document.getElementById('newsId').value;

            // 检查是否有图片文件 - 从隐藏的input获取
            const hiddenInput = document.getElementById('allImages');
            let hasImages = false;
            
            if (hiddenInput && hiddenInput.files.length > 0) {
                // 将隐藏input中的文件添加到FormData
                for (let i = 0; i < hiddenInput.files.length; i++) {
                    formData.append('images', hiddenInput.files[i]);
                }
                hasImages = true;
            }
            
            // 添加调试信息
            console.log('表单元素:', {
                title: document.getElementById('title')?.value,
                content: document.getElementById('content')?.value,
                author: document.getElementById('author')?.value,
                category: document.getElementById('category')?.value,
                newsId: newsId
            });
            
            console.log('FormData内容:', {
                title: formData.get('title'),
                content: formData.get('content'),
                author: formData.get('author'),
                category: formData.get('category'),
                hasImages: hasImages,
                imageCount: hiddenInput ? hiddenInput.files.length : 0
            });
            
            // 测试FormData是否为空
            const formDataEntries = [];
            for (let [key, value] of formData.entries()) {
                formDataEntries.push([key, value]);
            }
            console.log('FormData所有条目:', formDataEntries);
            
            // 如果FormData为空，手动添加数据
            if (formDataEntries.length === 0) {
                console.log('FormData为空，手动添加数据');
                formData.append('title', document.getElementById('title').value);
                formData.append('content', document.getElementById('content').value);
                formData.append('author', document.getElementById('author').value);
                formData.append('category', document.getElementById('category').value);
            }
            
            // 开始提交
            let url, method;
            if (hasImages) {
                // 如果有图片，使用带图片的路由
                url = newsId ? `/api/news/${newsId}/with-images` : '/api/news/with-images';
                method = newsId ? 'PUT' : 'POST';
            } else {
                // 如果没有图片，使用普通路由
                url = newsId ? `/api/news/${newsId}` : '/api/news';
                method = newsId ? 'PUT' : 'POST';
            }
            
            // 显示加载状态
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass"></i> 处理中...';
            
            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                body: formData // 直接使用FormData，包含图片文件
            });
            
            // 恢复按钮状态
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            
            console.log('响应状态:', response.status);
            console.log('响应头:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('错误响应:', errorText);
                throw new Error(`请求失败: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            showNotification(data.message || (newsId ? '新闻更新成功' : '新闻发布成功'), 'success');
            
            resetForm();
            getNewsList(currentPage);
        } catch (error) {
            console.error('提交新闻表单错误:', error);
            showNotification(error.message, 'error');
        }
    });
}

// 验证新闻表单
function validateNewsForm() {
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const category = document.getElementById('category').value.trim();
    
    if (!title) {
        showNotification('请输入新闻标题', 'warning');
        document.getElementById('title').focus();
        return false;
    }
    
    if (!content) {
        showNotification('请输入新闻内容', 'warning');
        document.getElementById('content').focus();
        return false;
    }
    
    if (!category) {
        showNotification('请输入新闻分类', 'warning');
        document.getElementById('category').focus();
        return false;
    }
    
    return true;
}

// 重置表单
function resetForm() {
    const newsForm = document.getElementById('newsForm');
    if (!newsForm) return;
    
    newsForm.reset();
    document.getElementById('newsId').value = '';
    document.getElementById('formTitle').textContent = '添加新闻';
    
    const cancelEditBtn = document.getElementById('cancelEdit');
    if (cancelEditBtn) {
        cancelEditBtn.style.display = 'none';
    }
    
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    
    // 重置隐藏的图片input
    const hiddenInput = document.getElementById('allImages');
    if (hiddenInput) {
        hiddenInput.remove();
    }
}

// 编辑新闻
async function editNews(id) {
    try {
        // 检查用户是否已登录
        if (!checkAuth()) {
            return;
        }
        
        const response = await fetch(`/api/news/${id}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '获取新闻信息失败');
        }
        
        const data = await response.json();
        const news = data.news;
        
        if (!news) {
            throw new Error('未找到新闻数据');
        }
        
        document.getElementById('newsId').value = news.id;
        document.getElementById('title').value = news.title;
        document.getElementById('author').value = news.author || '';
        document.getElementById('category').value = news.category || '';
        document.getElementById('content').value = news.content;
        document.getElementById('formTitle').textContent = '编辑新闻';
        document.getElementById('cancelEdit').style.display = 'inline-block';
        
        // 显示现有图片
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = '';
            
            if (news.images && news.images.length > 0) {
                news.images.forEach((image, index) => {
                    const div = document.createElement('div');
                    div.className = 'image-item';
                    div.innerHTML = `
                        <img src="${image.image_url}" alt="新闻图片">
                        <button type="button" class="remove-image existing-image" data-id="${image.id}">×</button>
                        <input type="text" class="image-caption" value="${image.caption || ''}" placeholder="图片说明">
                        <input type="hidden" name="existing_image_${index}" value="${image.id}">
                    `;
                    
                    // 添加删除按钮事件
                    div.querySelector('.remove-image').addEventListener('click', function() {
                        const imageId = parseInt(this.getAttribute('data-id'));
                        if (confirm('确定要删除这张图片吗？')) {
                            deleteNewsImage(imageId);
                        }
                    });
                    
                    preview.appendChild(div);
                });
            } else {
                preview.innerHTML = '<p class="text-muted">暂无图片</p>';
            }
        }
        
        // 滚动到表单顶部
        window.scrollTo({
            top: form.offsetTop - 50,
            behavior: 'smooth'
        });
    } catch (error) {
        console.error('编辑新闻错误:', error);
        showNotification(error.message, 'error');
    }
}

// 删除新闻图片
async function deleteNewsImage(imageId) {
    try {
        // 检查用户是否已登录
        if (!checkAuth()) {
            return;
        }
        
        const response = await fetch(`/api/news/image/${imageId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '删除图片失败');
        }
        
        const data = await response.json();
        showNotification(data.message || '图片删除成功', 'success');
        
        // 重新加载编辑表单
        const newsId = document.getElementById('newsId').value;
        if (newsId) {
            editNews(newsId);
        }
    } catch (error) {
        console.error('删除新闻图片错误:', error);
        showNotification(error.message, 'error');
    }
}

// 删除新闻
async function deleteNews(id) {
    try {
        // 检查用户是否已登录
        if (!checkAuth()) {
            return;
        }
        
        // 使用更具描述性的确认信息
        if (!confirm('确定要删除这条新闻吗？该操作不可恢复，相关图片也会被删除。')) {
            return;
        }
        
        const response = await fetch(`/api/news/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '删除新闻失败');
        }
        
        const data = await response.json();
        showNotification(data.message || '新闻删除成功', 'success');
        
        // 刷新列表，保持在当前页
        getNewsList(currentPage);
    } catch (error) {
        console.error('删除新闻错误:', error);
        showNotification(error.message, 'error');
    }
}

// 查看新闻
function viewNews(id) {
    // 在新标签页打开新闻
    window.open(`/news.html?id=${id}`, '_blank');
}

// 取消编辑
document.getElementById('cancelEdit')?.addEventListener('click', resetForm);

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 检查是否已登录并获取新闻列表
        if (checkAuth()) {
            await getNewsList();
        }
    } catch (error) {
        console.error('初始化错误:', error);
        showNotification('初始化新闻管理页面失败', 'error');
    }
});

// 导出必要的函数到全局作用域
window.getNewsList = getNewsList;
window.editNews = editNews;
window.deleteNews = deleteNews;
window.viewNews = viewNews;
window.removeImage = removeImage;