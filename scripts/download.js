/**
 * 文件下载页面脚本
 */
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const fileList = document.getElementById('fileList');
    const categoryFilter = document.getElementById('categoryFilter');
    const fileTypeFilter = document.getElementById('fileTypeFilter');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    // 分页状态
    const state = {
        currentPage: 1,
        limit: 15,
        totalPages: 1,
        category: '',
        fileType: '',
        search: '',
        order: 'DESC'
    };
    
    // 初始化
    loadFiles();
    
    // 事件监听
    categoryFilter.addEventListener('change', function() {
        state.category = this.value;
        state.currentPage = 1;
        loadFiles();
    });
    
    fileTypeFilter.addEventListener('change', function() {
        state.fileType = this.value;
        state.currentPage = 1;
        loadFiles();
    });
    
    searchButton.addEventListener('click', function() {
        state.search = searchInput.value.trim();
        state.currentPage = 1;
        loadFiles();
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            state.search = this.value.trim();
            state.currentPage = 1;
            loadFiles();
        }
    });
    
    prevPageBtn.addEventListener('click', function() {
        if (state.currentPage > 1) {
            state.currentPage--;
            loadFiles();
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        if (state.currentPage < state.totalPages) {
            state.currentPage++;
            loadFiles();
        }
    });
    
    /**
     * 加载文件列表
     */
    function loadFiles() {
        // 显示加载中
        fileList.innerHTML = '<tr><td colspan="5" class="loading">加载中...</td></tr>';
        
        // 计算偏移量
        const offset = (state.currentPage - 1) * state.limit;
        
        // 构建API URL
        let url = `/api/media/files?limit=${state.limit}&offset=${offset}&sort=upload_date&order=${state.order}`;
        if (state.category) {
            url += `&category=${state.category}`;
        }
        if (state.fileType) {
            url += `&type=${state.fileType}`;
        }
        if (state.search) {
            url += `&search=${encodeURIComponent(state.search)}`;
        }
        
        // 获取文件数据
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderFileList(data.files);
                    updatePagination(data.total);
                } else {
                    fileList.innerHTML = `<tr><td colspan="5" class="error">加载失败: ${data.message}</td></tr>`;
                }
            })
            .catch(error => {
                console.error('获取文件列表失败:', error);
                fileList.innerHTML = '<tr><td colspan="5" class="error">加载失败，请稍后重试</td></tr>';
            });
    }
    
    /**
     * 渲染文件列表
     * @param {Array} files - 文件数组
     */
    function renderFileList(files) {
        if (files.length === 0) {
            fileList.innerHTML = '<tr><td colspan="5" class="no-files">暂无文件</td></tr>';
            return;
        }
        
        let html = '';
        
        files.forEach(file => {
            const uploadDate = new Date(file.upload_date).toLocaleDateString('zh-CN');
            const fileSize = formatFileSize(file.file_size);
            const fileType = getFileType(file.file_name);
            
            html += `
                <tr>
                    <td>
                        <img src="/assets/images/file-icons/${fileType}.png" class="file-icon" alt="${fileType}" onerror="this.src='/assets/images/file-icons/default.png'">
                        ${file.title || file.file_name}
                    </td>
                    <td>
                        <span class="file-type ${fileType}">${fileType.toUpperCase()}</span>
                    </td>
                    <td>${fileSize}</td>
                    <td>${uploadDate}</td>
                    <td>
                        <a href="/api/media/download/${file.id}" class="download-button" title="下载文件">
                            下载
                        </a>
                    </td>
                </tr>
            `;
        });
        
        fileList.innerHTML = html;
    }
    
    /**
     * 更新分页
     * @param {number} total - 总记录数
     */
    function updatePagination(total) {
        state.totalPages = Math.ceil(total / state.limit);
        
        pageInfo.textContent = `第 ${state.currentPage} 页，共 ${state.totalPages} 页`;
        
        prevPageBtn.disabled = state.currentPage <= 1;
        nextPageBtn.disabled = state.currentPage >= state.totalPages;
    }
    
    /**
     * 格式化文件大小
     * @param {number} bytes - 文件大小（字节）
     * @returns {string} 格式化后的文件大小
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * 获取文件类型
     * @param {string} fileName - 文件名
     * @returns {string} 文件类型
     */
    function getFileType(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        
        const typeMap = {
            'pdf': 'pdf',
            'doc': 'doc',
            'docx': 'doc',
            'xls': 'xls',
            'xlsx': 'xls',
            'ppt': 'ppt',
            'pptx': 'ppt',
            'zip': 'zip',
            'rar': 'zip',
            '7z': 'zip',
            'txt': 'txt'
        };
        
        return typeMap[ext] || 'default';
    }
});