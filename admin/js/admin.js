import {
    formatFileSize,
    formatDate,
    showNotification,
    checkAuth,
    logout,
    authenticatedFetch,
    debounce,
    getFileIcon
} from './admin-utils.js';

// 初始化文件管理页面
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    initFileUpload();
    initFileList();
    initSearch();
    initFilters();
    
    // 退出登录按钮
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});

// 初始化文件上传功能
function initFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (!uploadArea || !fileInput) return;
    
    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 处理拖放
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    // 处理文件选择
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

// 处理文件上传
async function handleFiles(files) {
    const progressContainer = document.getElementById('uploadProgress');
    const category = document.getElementById('fileCategory').value;
    const description = document.getElementById('fileDescription').value;
    
    for (const file of files) {
        // 创建进度条
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.innerHTML = `
            <div class="progress-info">
                <span class="filename">${file.name}</span>
                <span class="filesize">${formatFileSize(file.size)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-bar-fill"></div>
            </div>
        `;
        progressContainer.appendChild(progressItem);
        
        const progressBar = progressItem.querySelector('.progress-bar-fill');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', category);
            formData.append('description', description);
            
            const response = await uploadFile(formData, (progress) => {
                progressBar.style.width = `${progress}%`;
            });
            
            if (response.ok) {
                progressItem.classList.add('success');
                showNotification(`${file.name} 上传成功`, 'success');
                // 刷新文件列表
                loadFiles();
            } else {
                progressItem.classList.add('error');
                showNotification(`${file.name} 上传失败`, 'error');
            }
        } catch (error) {
            console.error('上传失败:', error);
            progressItem.classList.add('error');
            showNotification(`${file.name} 上传失败: ${error.message}`, 'error');
        }
        
        // 3秒后移除进度条
        setTimeout(() => {
            progressContainer.removeChild(progressItem);
        }, 3000);
    }
}

// 上传文件
async function uploadFile(formData, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const progress = (e.loaded / e.total) * 100;
                onProgress(progress);
            }
        });
        
        xhr.addEventListener('load', () => {
            resolve({ ok: xhr.status === 200 });
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('上传失败'));
        });
        
        xhr.open('POST', '/api/files/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('adminToken')}`);
        xhr.send(formData);
    });
}

// 初始化文件列表
function initFileList() {
    loadFiles();
    
    // 监听文件操作
    document.getElementById('fileList')?.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const fileId = e.target.closest('.file-item')?.dataset.id;
        
        if (!action || !fileId) return;
        
        switch (action) {
            case 'download':
                downloadFile(fileId);
                break;
            case 'delete':
                deleteFile(fileId);
                break;
            case 'edit':
                editFile(fileId);
                break;
        }
    });
}

// 加载文件列表
async function loadFiles(page = 1) {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;
    
    try {
        const searchQuery = document.getElementById('searchFiles')?.value || '';
        const category = document.getElementById('categoryFilter')?.value || '';
        const sort = document.getElementById('sortFiles')?.value || 'date-desc';
        
        const response = await authenticatedFetch(
            `/api/files?page=${page}&search=${searchQuery}&category=${category}&sort=${sort}`
        );
        
        if (!response.ok) throw new Error('加载文件列表失败');
        
        const data = await response.json();
        
        // 渲染文件列表
        fileList.innerHTML = data.files.map(file => `
            <div class="file-item" data-id="${file.id}">
                <div class="file-icon">${getFileIcon(file.type)}</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span>${formatFileSize(file.size)}</span> ·
                        <span>${formatDate(file.uploaded_at)}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn-secondary" data-action="download">下载</button>
                    <button class="btn-primary" data-action="edit">编辑</button>
                    <button class="btn-danger" data-action="delete">删除</button>
                </div>
            </div>
        `).join('');
        
        // 更新分页
        updatePagination(data.pagination);
    } catch (error) {
        console.error('加载文件列表失败:', error);
        showNotification('加载文件列表失败', 'error');
    }
}

// 更新分页控件
function updatePagination(pagination) {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;
    
    const { currentPage, totalPages } = pagination;
    
    let html = '';
    
    if (totalPages > 1) {
        html += `
            <button class="btn-secondary" 
                ${currentPage === 1 ? 'disabled' : ''}
                onclick="loadFiles(${currentPage - 1})">
                上一页
            </button>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button class="btn-secondary ${i === currentPage ? 'active' : ''}"
                    onclick="loadFiles(${i})">
                    ${i}
                </button>
            `;
        }
        
        html += `
            <button class="btn-secondary"
                ${currentPage === totalPages ? 'disabled' : ''}
                onclick="loadFiles(${currentPage + 1})">
                下一页
            </button>
        `;
    }
    
    paginationEl.innerHTML = html;
}

// 初始化搜索功能
function initSearch() {
    const searchInput = document.getElementById('searchFiles');
    if (!searchInput) return;
    
    const debouncedSearch = debounce(() => loadFiles(1), 300);
    searchInput.addEventListener('input', debouncedSearch);
}

// 初始化筛选功能
function initFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFiles = document.getElementById('sortFiles');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => loadFiles(1));
    }
    
    if (sortFiles) {
        sortFiles.addEventListener('change', () => loadFiles(1));
    }
}

// 下载文件
async function downloadFile(fileId) {
    try {
        const response = await authenticatedFetch(`/api/files/${fileId}/download`);
        if (!response.ok) throw new Error('下载失败');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('下载文件失败:', error);
        showNotification('下载文件失败', 'error');
    }
}

// 删除文件
async function deleteFile(fileId) {
    if (!confirm('确定要删除此文件吗？')) return;
    
    try {
        const response = await authenticatedFetch(`/api/files/${fileId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('删除失败');
        
        showNotification('文件已删除', 'success');
        loadFiles();
    } catch (error) {
        console.error('删除文件失败:', error);
        showNotification('删除文件失败', 'error');
    }
}

// 编辑文件
function editFile(fileId) {
    // TODO: 实现文件编辑功能
    showNotification('文件编辑功能即将推出', 'info');
}