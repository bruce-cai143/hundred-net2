import { checkAuth, logout, showNotification, formatFileSize as formatFileSizeUtil, authenticatedFetch } from './admin-utils.js';

// 文件类型图标
const fileIcons = {
    'document': '📄',
    'image': '🖼️',
    'video': '🎬',
    'audio': '🎵',
    'other': '📦'
};

// 全局变量
let currentCategory = 'all';
let currentPage = 1;
let fileToUpload = null; // 存储要上传的文件

// 获取文件列表
export async function getFileList(page = 1, category = 'all') {
    try {
        // 检查用户是否已登录，如果未登录会自动重定向
        if (!checkAuth()) {
            return;
        }
        
        let url = `/api/media/files?limit=10&offset=${(page - 1) * 10}`;
        if (category !== 'all') {
            url += `&category=${category}`;
        }
        
        const response = await authenticatedFetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '获取文件列表失败');
        }
        
        const data = await response.json();
        
        // 更新全局变量
        currentPage = page;
        currentCategory = category;
        
        displayFileList(data.files);
        displayPagination(data.total, page);
    } catch (error) {
        console.error('获取文件列表错误:', error);
        showNotification(error.message, 'error');
    }
}

// 显示文件列表
function displayFileList(files) {
    const fileListElement = document.getElementById('fileList');
    
    if (!fileListElement) {
        console.error('文件列表元素不存在');
        return;
    }
    
    if (files.length === 0) {
        fileListElement.innerHTML = '<p class="text-center py-4">暂无文件</p>';
        return;
    }
    
    fileListElement.innerHTML = files.map(file => {
        const icon = fileIcons[file.category] || fileIcons.other;
        const fileSize = formatFileSizeUtil(file.file_size || file.size);
        const uploadDate = new Date(file.upload_date || file.created_at).toLocaleString();
        
        return `
            <div class="file-item">
                <div class="file-icon">${icon}</div>
                <div class="file-info">
                    <div class="file-name">${file.title || file.file_name || file.original_name}</div>
                    <div class="file-meta">
                        ${file.description ? `<div>${file.description}</div>` : ''}
                        <div>大小：${fileSize} | 上传时间：${uploadDate}</div>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn-download" onclick="window.downloadFile(${file.id}, '${file.category === 'image' ? 'image' : 'file'}')">下载</button>
                    <button class="btn-delete" onclick="window.deleteFile(${file.id}, '${file.category === 'image' ? 'image' : 'file'}')">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

// 显示分页
function displayPagination(total, currentPage) {
    const paginationElement = document.getElementById('pagination');
    
    if (!paginationElement) {
        console.error('分页元素不存在');
        return;
    }
    
    const totalPages = Math.ceil(total / 10);
    
    if (totalPages <= 1) {
        paginationElement.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 上一页按钮
    paginationHTML += `
        <button 
            ${currentPage === 1 ? 'disabled' : ''}
            onclick="window.getFileList(${currentPage - 1}, '${currentCategory}')"
        >&laquo;</button>
    `;
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        // 只显示当前页附近的页码
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
            <button 
                ${currentPage === i ? 'class="active"' : ''}
                    onclick="window.getFileList(${i}, '${currentCategory}')"
            >${i}</button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span>...</span>`;
        }
    }
    
    // 下一页按钮
    paginationHTML += `
        <button 
            ${currentPage === totalPages ? 'disabled' : ''}
            onclick="window.getFileList(${currentPage + 1}, '${currentCategory}')"
        >&raquo;</button>
    `;
    
    paginationElement.innerHTML = paginationHTML;
}

// 下载文件
export async function downloadFile(id, type = 'file') {
    try {
        if (!checkAuth()) {
            return;
        }
        
    window.open(`/api/media/download/${id}?type=${type}`, '_blank');
    } catch (error) {
        console.error('下载文件错误:', error);
        showNotification('下载文件失败: ' + error.message, 'error');
    }
}

// 删除文件
export async function deleteFile(id, type = 'file') {
    try {
        if (!checkAuth()) {
            return;
        }
        
        if (!confirm('确定要删除这个文件吗？此操作无法撤销。')) {
            return;
        }
        
        const response = await authenticatedFetch(`/api/media/file/${id}?type=${type}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '删除文件失败');
        }
        
        const data = await response.json();
        
        showNotification(data.message || '文件删除成功', 'success');
        getFileList(currentPage, currentCategory); // 刷新文件列表
    } catch (error) {
        console.error('删除文件错误:', error);
        showNotification('删除文件失败: ' + error.message, 'error');
    }
}

// 验证文件
function validateFile(file) {
    // 验证文件大小（最大50MB）
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        return {
            valid: false,
            message: `文件大小超过限制，最大允许50MB。当前文件大小：${formatFileSizeUtil(file.size)}`
        };
    }
    
    // 验证文件类型
    const allowedTypes = {
        // 图片文件
        'image/jpeg': true,
        'image/png': true,
        'image/gif': true,
        'image/webp': true,
        // 文档文件
        'application/pdf': true,
        'application/msword': true,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
        'application/vnd.ms-excel': true,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
        'application/vnd.ms-powerpoint': true,
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': true,
        // 视频文件
        'video/mp4': true,
        'video/webm': true,
        'video/ogg': true,
        // 音频文件
        'audio/mpeg': true,
        'audio/wav': true,
        'audio/ogg': true,
        // 压缩文件
        'application/zip': true,
        'application/x-rar-compressed': true,
        'application/x-7z-compressed': true,
        // 文本文件
        'text/plain': true
    };
    
    if (!allowedTypes[file.type]) {
        return {
            valid: false,
            message: `不支持的文件类型：${file.type}`
        };
    }
    
    return {
        valid: true,
        message: '文件验证通过'
    };
}

// 处理文件选择
function handleFileSelection(file) {
    try {
        if (!file) return;
        
        // 验证文件
        const validation = validateFile(file);
        
        // 显示验证结果
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (!uploadArea) {
            console.error('上传区域元素不存在');
            return;
        }
        
        // 如果验证失败
        if (!validation.valid) {
            showNotification(validation.message, 'error');
            return;
        }
        
        fileToUpload = file;
        
        // 根据文件类型设置图标和类别
        let fileType = file.type.split('/')[0];
        let icon = fileIcons.other;
        let category = 'other';
    
    switch (fileType) {
        case 'image':
                icon = fileIcons.image;
                category = 'image';
            break;
        case 'video':
                icon = fileIcons.video;
                category = 'video';
            break;
        case 'audio':
                icon = fileIcons.audio;
                category = 'audio';
            break;
        case 'application':
            if (file.name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) {
                    icon = fileIcons.document;
                    category = 'document';
            } else {
                    icon = fileIcons.other;
                    category = 'other';
            }
            break;
        default:
                icon = fileIcons.other;
                category = 'other';
        }
        
        // 设置文件分类
        const categorySelect = document.getElementById('fileCategory');
        if (categorySelect) {
            categorySelect.value = category;
        }
        
        uploadArea.innerHTML = `
            <div class="selected-file">
                <div class="file-icon">${icon}</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSizeUtil(file.size)}</div>
                </div>
                <button type="button" class="btn-cancel" id="cancelUpload">取消</button>
            </div>
            <div class="file-validation valid">
                <i class="bi bi-check-circle"></i> 文件验证通过
            </div>
        `;
        
        // 重新添加文件输入框
        if (fileInput) {
            uploadArea.appendChild(fileInput);
        }
        
        // 添加取消上传按钮事件
        document.getElementById('cancelUpload')?.addEventListener('click', (e) => {
            e.stopPropagation();
            resetUploadArea();
        });
        
        console.log("文件已选择:", file.name);
    } catch (error) {
        console.error('处理文件选择错误:', error);
        showNotification('处理文件选择失败: ' + error.message, 'error');
    }
}

// 重置上传区域
function resetUploadArea() {
    try {
        fileToUpload = null;
        const uploadArea = document.getElementById('uploadArea');
        
        if (!uploadArea) {
            console.error('上传区域元素不存在');
            return;
        }
        
        // 保存原有的fileInput，以保留其事件监听器
        const oldFileInput = document.getElementById('fileInput');
        
        uploadArea.innerHTML = `
            <i class="file-icon">📁</i>
            <p>拖拽文件到此处或点击上传</p>
        `;
        
        // 重新插入原有的fileInput或创建新的
        if (oldFileInput) {
            uploadArea.appendChild(oldFileInput);
        } else {
            const newInput = document.createElement('input');
            newInput.type = 'file';
            newInput.id = 'fileInput';
            newInput.style.display = 'none';
            newInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    handleFileSelection(this.files[0]);
                }
            });
            uploadArea.appendChild(newInput);
        }
        
        // 重置表单字段
        const categorySelect = document.getElementById('fileCategory');
        const descriptionField = document.getElementById('fileDescription');
        const progressElement = document.getElementById('uploadProgress');
        
        if (categorySelect) categorySelect.value = '';
        if (descriptionField) descriptionField.value = '';
        if (progressElement) progressElement.innerHTML = '';
    } catch (error) {
        console.error('重置上传区域错误:', error);
        showNotification('重置上传区域失败: ' + error.message, 'error');
    }
}

// 上传文件
async function uploadFile() {
    try {
        // 检查用户是否已登录
        if (!checkAuth()) {
            showNotification('请先登录后再上传文件', 'warning');
            return;
        }
        
        // 检查是否已选择文件
        if (!fileToUpload) {
            showNotification('请先选择要上传的文件', 'warning');
            return;
        }
        
        // 再次验证文件
        const validation = validateFile(fileToUpload);
        if (!validation.valid) {
            showNotification(validation.message, 'error');
            return;
        }
        
        // 获取表单元素
        const categorySelect = document.getElementById('fileCategory');
        const descriptionField = document.getElementById('fileDescription');
        
        // 验证文件分类
        if (!categorySelect || !categorySelect.value) {
            showNotification('请选择文件分类', 'warning');
            categorySelect?.classList.add('error');
            return;
        } else {
            categorySelect.classList.remove('error');
        }
        
        // 准备FormData对象
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('category', categorySelect.value);
        
        if (descriptionField && descriptionField.value) {
            formData.append('description', descriptionField.value);
        }
        
        // 更新上传区域状态
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.add('uploading');
        }
        
        // 初始化进度条
        const progressElement = document.getElementById('uploadProgress');
        if (progressElement) {
            progressElement.innerHTML = '<div class="progress-bar"><div class="progress"></div></div><div class="progress-text">上传中... 0%</div>';
        }
        
        const progressBar = progressElement?.querySelector('.progress');
        const progressText = progressElement?.querySelector('.progress-text');
        
        // 使用XMLHttpRequest以支持上传进度
        const xhr = new XMLHttpRequest();
        
        // 设置进度监听
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && progressBar && progressText) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                progressBar.style.width = percentComplete + '%';
                progressText.textContent = `上传中... ${percentComplete}%`;
            }
        });
        
        // 创建Promise以更好地处理XHR事件
        const uploadPromise = new Promise((resolve, reject) => {
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('解析服务器响应失败'));
                    }
                } else {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        reject(new Error(errorResponse.message || '上传失败'));
                    } catch (e) {
                        reject(new Error('上传失败: 服务器响应异常'));
                    }
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new Error('网络错误，上传失败'));
            });
            
            xhr.addEventListener('abort', () => {
                reject(new Error('上传已取消'));
            });
        });
        
        // 开始上传
        xhr.open('POST', '/api/media/file-upload');
        
        // 使用认证Token
        // 注意: 我们使用session认证，不需要额外的token
        xhr.withCredentials = true; // 确保跨域请求发送cookies
        
        xhr.send(formData);
        
        try {
            // 等待上传完成
            const response = await uploadPromise;
            
            // 更新进度条为完成状态
            if (progressBar && progressText) {
                progressBar.style.width = '100%';
                progressText.textContent = '上传成功!';
                progressText.style.color = 'green';
            }
            
            // 移除上传区域状态
            if (uploadArea) {
                uploadArea.classList.remove('uploading');
            }
            
            // 显示成功消息
            setTimeout(() => {
                showNotification(response.message || '文件上传成功', 'success');
                resetUploadArea();
                getFileList(currentPage, currentCategory); // 刷新文件列表
            }, 1000);
        } catch (error) {
            // 移除上传区域状态
            if (uploadArea) {
                uploadArea.classList.remove('uploading');
            }
            
            // 更新进度条为失败状态
            if (progressText) {
                progressText.textContent = '上传失败!';
                progressText.style.color = 'red';
            }
            
            throw error; // 重新抛出以便外部catch捕获
        }
    } catch (error) {
        console.error('文件上传错误:', error);
        showNotification('文件上传失败: ' + error.message, 'error');
    }
}

// 过滤文件类别
function filterByCategory(category) {
    currentCategory = category;
    currentPage = 1;
    getFileList(currentPage, currentCategory);
    
    // 更新UI显示当前分类
    const categoryButtons = document.querySelectorAll('#categoryFilter option');
    categoryButtons.forEach(button => {
        if (button.value === category) {
            button.selected = true;
        }
    });
}

// 搜索文件
async function searchFiles() {
    try {
        const searchTerm = document.getElementById('searchFiles')?.value.trim();
        if (!searchTerm) {
            getFileList(1, currentCategory);
            return;
        }
        
        if (!checkAuth()) {
            return;
        }
        
        showNotification('搜索功能正在开发中...', 'info');
        // 将来可以添加搜索API调用
    } catch (error) {
        console.error('搜索文件错误:', error);
        showNotification('搜索文件失败: ' + error.message, 'error');
    }
}

// 初始化事件监听
function initializeEventListeners() {
    console.log("正在初始化事件监听器...");
    
    // 确保上传区域存在
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) {
        console.error("上传区域元素不存在!");
        return;
    }
    
    // 确保文件输入框存在
    let fileInput = document.getElementById('fileInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'fileInput';
        fileInput.style.display = 'none';
        uploadArea.appendChild(fileInput);
    }
    
    // 文件上传区域点击事件
    uploadArea.addEventListener('click', function(e) {
        console.log("上传区域被点击");
        // 避免冒泡到子元素
        if (e.target === this || e.target.tagName !== 'BUTTON') {
            fileInput.click();
        }
    });
    
    // 拖拽相关事件
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('dragover');
        console.log("拖拽悬停");
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');
        console.log("拖拽离开");
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');
        console.log("文件已放下");
        
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });
    
    // 文件输入框变更事件
    fileInput.addEventListener('change', function() {
        console.log("文件输入已变更:", this.files.length);
        if (this.files.length > 0) {
            handleFileSelection(this.files[0]);
        }
    });
    
    // 上传按钮
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', uploadFile);
        console.log("上传按钮事件已添加");
    } else {
        console.error("上传按钮不存在!");
    }
    
    // 分类过滤
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterByCategory(this.value);
        });
    }
    
    // 搜索
    const searchFilesInput = document.getElementById('searchFiles');
    if (searchFilesInput) {
        searchFilesInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchFiles();
            }
        });
    }
    
    // 暴露函数到全局作用域，解决动态创建的DOM元素中事件调用问题
    window.downloadFile = downloadFile;
    window.deleteFile = deleteFile;
    window.getFileList = getFileList;
    window.handleFileSelection = handleFileSelection;
    
    console.log("事件监听器初始化完成");
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM内容已加载");
    
    // 检查用户是否已登录
    if (checkAuth()) {
    getFileList();
    }
    
    // 延迟初始化事件监听器，确保DOM元素已完全加载
    setTimeout(() => {
    initializeEventListeners();
        console.log("上传按钮存在:", !!document.getElementById('uploadBtn'));
    }, 500);
});

// 导出必要的函数
export {
    getFileList,
    downloadFile,
    deleteFile,
    currentCategory,
    currentPage
};