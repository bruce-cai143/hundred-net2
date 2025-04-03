// 文件上传管理功能

// 全局函数定义，使其在页面中可访问
window.downloadFile = function(id, filename) {
    try {
        const url = `/api/uploads/${id}/download`;
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('success', '开始下载文件');
    } catch (error) {
        console.error('文件下载出错:', error);
        showToast('error', '文件下载出错');
    }
};

window.deleteFile = async function(id) {
    if (!confirm('确定要删除这个文件吗？')) return;
    
    try {
        const response = await fetch(`/api/uploads/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('success', '删除文件成功');
            getFiles();
        } else {
            const error = await response.json();
            showToast('error', error.message || '删除文件失败');
        }
    } catch (error) {
        console.error('删除文件出错:', error);
        showToast('error', '删除文件出错');
    }
};

// 编辑轮播图（全局函数）
window.editSlide = async function(id) {
    try {
        const response = await fetch(`/api/slides/${id}`);
        const slide = await response.json();
        
        if (response.ok) {
            document.getElementById('slide-id').value = slide.id;
            document.getElementById('slide-title').value = slide.title;
            document.getElementById('slide-link').value = slide.link || '';
            document.getElementById('slide-order').value = slide.order;
            document.getElementById('slide-status').checked = slide.status;
            document.getElementById('image-preview').innerHTML = `<img src="${slide.image_url}" alt="预览图" class="img-thumbnail" style="max-width: 200px;">`;
            
            document.getElementById('slideFormModalLabel').textContent = '编辑轮播图';
            const slideFormModal = document.getElementById('slideFormModal');
            const slideFormModalInstance = new bootstrap.Modal(slideFormModal);
            slideFormModalInstance.show();
        } else {
            showToast('error', '获取轮播图信息失败');
        }
    } catch (error) {
        console.error('获取轮播图信息出错:', error);
        showToast('error', '获取轮播图信息出错');
    }
};

// 删除轮播图（全局函数）
window.deleteSlide = async function(id) {
    if (!confirm('确定要删除这个轮播图吗？')) return;
    
    try {
        const response = await fetch(`/api/slides/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('success', '删除轮播图成功');
            getSlides();
        } else {
            const error = await response.json();
            showToast('error', error.message || '删除轮播图失败');
        }
    } catch (error) {
        console.error('删除轮播图出错:', error);
        showToast('error', '删除轮播图出错');
    }
};

// DOM 元素
document.addEventListener('DOMContentLoaded', function() {
const uploadsTable = document.getElementById('uploads-table');
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const uploadProgress = document.getElementById('upload-progress');
const uploadProgressBar = document.getElementById('upload-progress-bar');
const manageSlides = document.getElementById('manageSlides');
const slidesModal = document.getElementById('slidesModal');
const addSlideBtn = document.getElementById('addSlideBtn');
const slideFormModal = document.getElementById('slideFormModal');
const slideForm = document.getElementById('slide-form');
const saveSlideBtn = document.getElementById('saveSlideBtn');

// 获取文件列表
async function getFiles() {
    try {
        const response = await fetch('/api/uploads');
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        const data = await response.json();
        renderFiles(data);
        updateDashboardCount(data.length);
    } catch (error) {
        console.error('获取文件列表出错:', error);
        // 如果API尚未实现，使用模拟数据（仅在开发环境）
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.log('使用模拟数据');
            const mockFiles = generateMockFiles();
            renderFiles(mockFiles);
            updateDashboardCount(mockFiles.length);
        } else {
            showToast('error', '获取文件列表失败，请稍后重试');
        }
    }
}

// 生成模拟数据（仅用于开发环境）
function generateMockFiles() {
    return [
        {
            id: 1,
            name: '百人计划介绍.pdf',
            size: 2540000,
            type: 'application/pdf',
            category: '文档',
            upload_date: new Date(2024, 0, 15).toISOString()
        },
        {
            id: 2,
            name: '教学视频.mp4',
            size: 156000000,
            type: 'video/mp4',
            category: '媒体',
            upload_date: new Date(2024, 0, 16).toISOString()
        },
        {
            id: 3,
            name: '课程资料.zip',
            size: 45600000,
            type: 'application/zip',
            category: '压缩包',
            upload_date: new Date(2024, 0, 17).toISOString()
        }
    ];
}

// 渲染文件列表
function renderFiles(files) {
    const tbody = uploadsTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    files.forEach((file) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${file.name}</td>
            <td>${formatFileSize(file.size)}</td>
            <td>${file.type}</td>
            <td>${file.category || '一般'}</td>
            <td>${formatDate(file.upload_date)}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="downloadFile('${file.id}', '${file.name}')">
                    <i class="bi bi-download"></i> 下载
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteFile('${file.id}')">
                    <i class="bi bi-trash"></i> 删除
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化日期
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
    // 创建toast元素
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // 添加到页面
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(container);
        container.appendChild(toastEl);
    } else {
        toastContainer.appendChild(toastEl);
    }
    
    // 初始化并显示toast
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    // 自动移除
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

// 上传文件
async function uploadFiles(files) {
    const formData = new FormData();
    
    // 获取文件类别
    const fileCategory = document.getElementById('file-category') ? 
        document.getElementById('file-category').value : 'general';
    
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    // 添加文件类别
    formData.append('category', fileCategory);
    
    try {
        uploadProgress.style.display = 'block';
        uploadProgressBar.style.width = '0%';
        uploadProgressBar.textContent = '0%';
        
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/uploads', true);
        
        xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                uploadProgressBar.style.width = percentComplete + '%';
                uploadProgressBar.textContent = percentComplete + '%';
            }
        };
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                showToast('success', '文件上传成功');
                getFiles();
                uploadForm.reset();
            } else {
                const error = JSON.parse(xhr.responseText);
                showToast('error', error.message || '文件上传失败');
            }
            uploadProgress.style.display = 'none';
        };
        
        xhr.onerror = function() {
            showToast('error', '文件上传出错');
            uploadProgress.style.display = 'none';
        };
        
        xhr.send(formData);
    } catch (error) {
        console.error('文件上传出错:', error);
        showToast('error', '文件上传出错');
        uploadProgress.style.display = 'none';
    }
}

// 这些函数已移至全局作用域

// 更新仪表盘计数
function updateDashboardCount(count) {
    const countElement = document.getElementById('files-count');
    if (countElement) {
        countElement.textContent = count;
    }
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 获取初始数据
    getFiles();
    
    // 文件上传处理
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            uploadFiles(this.files);
        }
    });

    // 管理轮播图按钮点击事件
    manageSlides.addEventListener('click', () => {
        const slidesModalInstance = new bootstrap.Modal(slidesModal);
        slidesModalInstance.show();
        getSlides();
    });

    // 添加轮播图按钮点击事件
    addSlideBtn.addEventListener('click', () => {
        const slideFormModalInstance = new bootstrap.Modal(slideFormModal);
        slideFormModalInstance.show();
        slideForm.reset();
        document.getElementById('slide-id').value = '';
        document.getElementById('slideFormModalLabel').textContent = '添加轮播图';
    });

    // 保存轮播图按钮点击事件
    saveSlideBtn.addEventListener('click', () => {
        const slideId = document.getElementById('slide-id').value;
        if (slideId) {
            updateSlide(slideId);
        } else {
            addSlide();
        }
    });
});

// 获取轮播图列表
async function getSlides() {
    try {
        const response = await fetch('/api/slides');
        const data = await response.json();
        if (response.ok) {
            renderSlides(data);
        } else {
            showToast('error', '获取轮播图列表失败');
        }
    } catch (error) {
        console.error('获取轮播图列表出错:', error);
        showToast('error', '获取轮播图列表出错');
    }
}

// 渲染轮播图列表
function renderSlides(slides) {
    const tbody = document.getElementById('slides-table');
    tbody.innerHTML = '';
    
    slides.forEach((slide, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${slide.title}</td>
            <td><img src="${slide.image_url}" alt="${slide.title}" class="img-thumbnail" style="max-width: 100px;"></td>
            <td>${slide.link || '-'}</td>
            <td>${slide.order}</td>
            <td>${slide.status ? '启用' : '禁用'}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editSlide(${slide.id})">
                    <i class="bi bi-pencil"></i> 编辑
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSlide(${slide.id})">
                    <i class="bi bi-trash"></i> 删除
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 添加轮播图
async function addSlide() {
    const formData = new FormData(slideForm);
    try {
        const response = await fetch('/api/slides', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showToast('success', '添加轮播图成功');
            getSlides();
            bootstrap.Modal.getInstance(slideFormModal).hide();
        } else {
            const error = await response.json();
            showToast('error', error.message || '添加轮播图失败');
        }
    } catch (error) {
        console.error('添加轮播图出错:', error);
        showToast('error', '添加轮播图出错');
    }
}

// 编辑轮播图
async function editSlide(id) {
    try {
        const response = await fetch(`/api/slides/${id}`);
        const slide = await response.json();
        
        if (response.ok) {
            document.getElementById('slide-id').value = slide.id;
            document.getElementById('slide-title').value = slide.title;
            document.getElementById('slide-link').value = slide.link || '';
            document.getElementById('slide-order').value = slide.order;
            document.getElementById('slide-status').checked = slide.status;
            document.getElementById('image-preview').innerHTML = `<img src="${slide.image_url}" alt="预览图" class="img-thumbnail" style="max-width: 200px;">`;
            
            document.getElementById('slideFormModalLabel').textContent = '编辑轮播图';
            const slideFormModalInstance = new bootstrap.Modal(slideFormModal);
            slideFormModalInstance.show();
        } else {
            showToast('error', '获取轮播图信息失败');
        }
    } catch (error) {
        console.error('获取轮播图信息出错:', error);
        showToast('error', '获取轮播图信息出错');
    }
}

// 更新轮播图
async function updateSlide(id) {
    const formData = new FormData(slideForm);
    try {
        const response = await fetch(`/api/slides/${id}`, {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            showToast('success', '更新轮播图成功');
            getSlides();
            bootstrap.Modal.getInstance(slideFormModal).hide();
        } else {
            const error = await response.json();
            showToast('error', error.message || '更新轮播图失败');
        }
    } catch (error) {
        console.error('更新轮播图出错:', error);
        showToast('error', '更新轮播图出错');
    }
}

// 删除轮播图
async function deleteSlide(id) {
    if (!confirm('确定要删除这个轮播图吗？')) return;
    
    try {
        const response = await fetch(`/api/slides/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('success', '删除轮播图成功');
            getSlides();
        } else {
            const error = await response.json();
            showToast('error', error.message || '删除轮播图失败');
        }
    } catch (error) {
        console.error('删除轮播图出错:', error);
        showToast('error', '删除轮播图出错');
    }
}

});