import { checkAuth, logout, showNotification, formatFileSize, authenticatedFetch } from './admin-utils.js';

let currentPage = 1;
let currentCategory = '';
let currentSearch = '';
let currentSort = 'created_at DESC';
let selectedFile = null;
let fileToDelete = null;

const fileIcons = {
    'document': '📄',
    'image': '🖼️',
    'video': '🎬',
    'audio': '🎵',
    'other': '📦'
};

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadFileList();
});

function initializeEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    }
    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    if (categoryFilter) categoryFilter.addEventListener('change', function() {
        currentCategory = this.value; currentPage = 1; loadFileList();
    });
    if (sortFilter) sortFilter.addEventListener('change', function() {
        currentSort = this.value; currentPage = 1; loadFileList();
    });
    initializeUploadEvents();
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDeleteFile);
}

function initializeUploadEvents() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
        uploadArea.addEventListener('dragleave', e => { e.preventDefault(); uploadArea.classList.remove('drag-over'); });
        uploadArea.addEventListener('drop', e => {
            e.preventDefault(); uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFileSelection(files[0]);
        });
        uploadArea.addEventListener('click', () => fileInput.click());
    }
    if (fileInput) fileInput.addEventListener('change', function() {
        if (this.files.length > 0) handleFileSelection(this.files[0]);
    });
    if (uploadBtn) uploadBtn.addEventListener('click', uploadFile);
}

function handleFileSelection(file) {
    selectedFile = file;
    const validation = validateFile(file);
    if (!validation.valid) { showNotification(validation.message, 'error'); return; }
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileTitle = document.getElementById('fileTitle');
    const fileCategory = document.getElementById('fileCategory');
    const uploadBtn = document.getElementById('uploadBtn');
    if (fileInfo && fileName && fileSize) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.classList.remove('d-none');
        if (fileTitle) fileTitle.value = file.name.replace(/\.[^/.]+$/, "");
        if (fileCategory) fileCategory.value = detectFileCategory(file);
        if (uploadBtn) uploadBtn.disabled = false;
    }
    console.log('文件已选择:', file.name, file.size, file.type);
}

function validateFile(file) {
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) return { valid: false, message: `文件大小超过限制，最大允许50MB。当前文件大小：${formatFileSize(file.size)}` };
    return { valid: true };
}

function detectFileCategory(file) {
    const mimeType = file.type.split('/')[0];
    switch (mimeType) {
        case 'image': return 'image';
        case 'video': return 'video';
        case 'audio': return 'audio';
        case 'application':
            if (file.name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) return 'document';
            return 'other';
        default: return 'other';
    }
}

async function uploadFile() {
    if (!selectedFile) { showNotification('请先选择文件', 'error'); return; }
    const uploadBtn = document.getElementById('uploadBtn');
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> 上传中...'; }
    if (progressDiv) progressDiv.classList.remove('d-none');
    try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const fileTitle = document.getElementById('fileTitle')?.value || selectedFile.name;
        const fileCategory = document.getElementById('fileCategory')?.value || detectFileCategory(selectedFile);
        const fileDescription = document.getElementById('fileDescription')?.value || '';
        formData.append('title', fileTitle);
        formData.append('category', fileCategory);
        formData.append('description', fileDescription);
        console.log('准备上传文件:', {
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type,
            title: fileTitle,
            category: fileCategory,
            description: fileDescription
        });
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable && progressBar) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = percentComplete + '%';
                progressBar.textContent = Math.round(percentComplete) + '%';
            }
        });
        xhr.addEventListener('load', function() {
            console.log('上传响应状态:', xhr.status);
            console.log('上传响应内容:', xhr.responseText);
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        showNotification('文件上传成功', 'success');
                        resetUploadForm();
                        loadFileList();
                    } else {
                        showNotification(response.message || '上传失败', 'error');
                    }
                } catch (e) {
                    showNotification('响应解析失败: ' + e.message, 'error');
                }
            } else {
                showNotification('上传失败，HTTP状态: ' + xhr.status, 'error');
            }
            if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.innerHTML = '<i class="bi bi-cloud-upload"></i> 开始上传'; }
            if (progressDiv) progressDiv.classList.add('d-none');
        });
        xhr.addEventListener('error', function() {
            console.error('上传请求失败');
            showNotification('上传失败，请检查网络连接', 'error');
            if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.innerHTML = '<i class="bi bi-cloud-upload"></i> 开始上传'; }
            if (progressDiv) progressDiv.classList.add('d-none');
        });
        xhr.open('POST', '/api/media/file-upload');
        xhr.send(formData);
    } catch (error) {
        console.error('上传过程中发生错误:', error);
        showNotification('上传失败: ' + error.message, 'error');
        if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.innerHTML = '<i class="bi bi-cloud-upload"></i> 开始上传'; }
        if (progressDiv) progressDiv.classList.add('d-none');
    }
}

function resetUploadForm() {
    selectedFile = null;
    const fileInfo = document.getElementById('fileInfo');
    const fileInput = document.getElementById('fileInput');
    const fileTitle = document.getElementById('fileTitle');
    const fileCategory = document.getElementById('fileCategory');
    const fileDescription = document.getElementById('fileDescription');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    if (fileInfo) fileInfo.classList.add('d-none');
    if (fileInput) fileInput.value = '';
    if (fileTitle) fileTitle.value = '';
    if (fileCategory) fileCategory.value = '';
    if (fileDescription) fileDescription.value = '';
    if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.innerHTML = '<i class="bi bi-cloud-upload"></i> 开始上传'; }
    if (progressDiv) progressDiv.classList.add('d-none');
    if (progressBar) { progressBar.style.width = '0%'; progressBar.textContent = '0%'; }
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) { currentSearch = searchInput.value.trim(); currentPage = 1; loadFileList(); }
}

async function loadFileList() {
    try {
        const fileList = document.getElementById('fileList');
        if (fileList) fileList.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"></div></div>';
        let url = `/api/media/files?limit=12&offset=${(currentPage - 1) * 12}`;
        if (currentCategory) url += `&category=${encodeURIComponent(currentCategory)}`;
        if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
        if (currentSort) { const [sort, order] = currentSort.split(' '); url += `&sort=${sort}&order=${order}`; }
        console.log('请求文件列表URL:', url);
        const response = await fetch(url);
        console.log('文件列表响应状态:', response.status);
        if (!response.ok) throw new Error('获取文件列表失败');
        const data = await response.json();
        console.log('文件列表数据:', data);
        if (data.success) {
            displayFileList(data.files);
            displayPagination(data.total, currentPage);
        } else {
            throw new Error(data.message || '获取文件列表失败');
        }
    } catch (error) {
        console.error('加载文件列表失败:', error);
        showNotification(error.message, 'error');
        const fileList = document.getElementById('fileList');
        if (fileList) fileList.innerHTML = `<div class="col-12"><div class="empty-state"><i class="bi bi-exclamation-triangle"></i><h4>加载失败</h4><p>无法加载文件列表，请重试</p></div></div>`;
    }
}

function displayFileList(files) {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;
    if (files.length === 0) {
        fileList.innerHTML = `<div class="col-12"><div class="empty-state"><i class="bi bi-folder"></i><h4>暂无文件</h4><p>还没有上传任何文件</p><button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#uploadModal"><i class="bi bi-cloud-upload"></i> 上传第一个文件</button></div></div>`;
        return;
    }
    fileList.innerHTML = files.map(file => {
        const icon = fileIcons[file.category] || fileIcons.other;
        const fileSize = formatFileSize(file.size);
        const uploadDate = new Date(file.created_at).toLocaleString();
        const isImage = file.category === 'image';
        return `<div class="col-md-6 col-lg-4 mb-4"><div class="file-card"><div class="file-icon">${icon}</div><div class="file-info"><h5>${file.original_name}</h5><div class="file-meta"><div>大小：${fileSize}</div><div>上传时间：${uploadDate}</div></div></div><div class="file-actions">${isImage ? `<button class="btn btn-preview" onclick="previewFile(${file.id})"><i class="bi bi-eye"></i> 预览</button>` : ''}<button class="btn btn-download" onclick="downloadFile(${file.id})"><i class="bi bi-download"></i> 下载</button><button class="btn btn-delete" onclick="deleteFile(${file.id}, '${file.original_name}')"><i class="bi bi-trash"></i> 删除</button></div></div></div>`;
    }).join('');
}

function displayPagination(total, currentPage) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    const totalPages = Math.ceil(total / 12);
    if (totalPages <= 1) { pagination.innerHTML = ''; return; }
    let paginationHTML = '';
    paginationHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePage(${currentPage - 1})">&laquo;</a></li>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `<li class="page-item ${currentPage === i ? 'active' : ''}"><a class="page-link" href="#" onclick="changePage(${i})">${i}</a></li>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    paginationHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="changePage(${currentPage + 1})">&raquo;</a></li>`;
    pagination.innerHTML = paginationHTML;
}

function changePage(page) { currentPage = page; loadFileList(); }
function previewFile(fileId) { window.open(`/api/media/images/${fileId}`, '_blank'); }
function downloadFile(fileId) { window.open(`/api/media/download/${fileId}`, '_blank'); }
function deleteFile(fileId, fileName) {
    fileToDelete = { id: fileId, name: fileName };
    const deleteFileName = document.getElementById('deleteFileName');
    if (deleteFileName) deleteFileName.textContent = fileName;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show();
}
async function confirmDeleteFile() {
    if (!fileToDelete) return;
    try {
        const response = await fetch(`/api/media/${fileToDelete.id}`, { method: 'DELETE', credentials: 'include' });
        if (!response.ok) throw new Error('删除失败');
        const data = await response.json();
        if (data.success) {
            showNotification('文件删除成功', 'success');
            const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            if (deleteModal) deleteModal.hide();
            loadFileList();
        } else {
            throw new Error(data.message || '删除失败');
        }
    } catch (error) {
        showNotification('删除失败: ' + error.message, 'error');
    } finally {
        fileToDelete = null;
    }
}
window.changePage = changePage;
window.previewFile = previewFile;
window.downloadFile = downloadFile;
window.deleteFile = deleteFile; 