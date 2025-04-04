/**
 * 新闻管理脚本
 */

document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const newsList = document.getElementById('news-list');
    const pagination = document.getElementById('pagination');
    const totalCount = document.getElementById('total-count');
    const addNewsBtn = document.getElementById('add-news-btn');
    const newsModal = new bootstrap.Modal(document.getElementById('news-modal'));
    const newsForm = document.getElementById('news-form');
    const newsId = document.getElementById('news-id');
    const newsTitle = document.getElementById('news-title');
    const newsContent = document.getElementById('news-content');
    const newsImage = document.getElementById('news-image');
    const imagePreview = document.getElementById('image-preview');
    const previewImage = imagePreview ? imagePreview.querySelector('img') : null;
    const removeImageBtn = document.getElementById('remove-image');
    const saveNewsBtn = document.getElementById('save-news');
    const confirmModal = new bootstrap.Modal(document.getElementById('confirm-modal'));
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    
    // 当前页码和要删除的新闻ID
    let currentPage = 1;
    let deleteId = null;
    
    // 初始化富文本编辑器
    if (newsContent) {
        $(newsContent).summernote({
            height: 300,
            toolbar: [
                ['style', ['style']],
                ['font', ['bold', 'underline', 'clear']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['table', ['table']],
                ['insert', ['link', 'picture']],
                ['view', ['fullscreen', 'codeview', 'help']]
            ],
            placeholder: '请输入新闻内容...'
        });
    }
    
    // 加载新闻列表
    loadNewsList(currentPage);
    
    // 添加新闻按钮点击事件
    if (addNewsBtn) {
        addNewsBtn.addEventListener('click', function() {
            resetForm();
            document.getElementById('modal-title').textContent = '添加新闻';
            // 清空富文本编辑器内容
            if (newsContent) {
                $(newsContent).summernote('code', '');
            }
            // 清空图片预览
            if (imagePreview) {
                imagePreview.classList.add('d-none');
                if (previewImage) {
                    previewImage.src = '';
                }
            }
            newsModal.show();
        });
    }
    
    // 图片上传预览
    if (newsImage) {
        newsImage.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    if (previewImage) {
                        previewImage.src = e.target.result;
                        imagePreview.classList.remove('d-none');
                    }
                };
                
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }
    
    // 移除图片按钮点击事件
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function() {
            if (newsImage) {
                newsImage.value = '';
            }
            if (imagePreview) {
                imagePreview.classList.add('d-none');
            }
        });
    }
    
    // 保存新闻按钮点击事件
    if (saveNewsBtn) {
        saveNewsBtn.addEventListener('click', function() {
            if (!newsTitle.value.trim()) {
                alert('请输入新闻标题');
                return;
            }
            
            const formData = new FormData();
            formData.append('title', newsTitle.value.trim());
            formData.append('content', $(newsContent).summernote('code'));
            formData.append('category', document.getElementById('news-category').value);
            formData.append('author', document.getElementById('news-author').value);
            
            if (newsImage.files.length > 0) {
                formData.append('image', newsImage.files[0]);
            }
            
            const id = newsId.value;
            const isEdit = id !== '';
            
            saveNews(formData, isEdit ? id : null);
        });
    }
    
    // 确认删除按钮点击事件
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (deleteId) {
                deleteNews(deleteId);
                confirmModal.hide();
            }
        });
    }
    
    /**
     * 加载新闻列表
     */
    async function loadNewsList(page = 1) {
        try {
            currentPage = page;
            
            const data = await fetch(`/api/news?page=${page}&limit=10`);
            
            if (data && newsList) {
                if (data.news.length === 0) {
                    newsList.innerHTML = '<tr><td colspan="6" class="text-center">暂无新闻</td></tr>';
                    if (pagination) pagination.innerHTML = '';
                    if (totalCount) totalCount.textContent = '0';
                    return;
                }
                
                let html = '';
                
                data.news.forEach(news => {
                    const date = new Date(news.created_at);
                    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                    
                    // 截取内容摘要，去除HTML标签
                    const contentPreview = news.content
                        ? news.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
                        : '无内容';
                    
                    html += `
                        <tr>
                            <td>${news.id}</td>
                            <td>${news.title}</td>
                            <td>${news.category || '校园新闻'}</td>
                            <td>${news.author || '未署名'}</td>
                            <td>${formattedDate}</td>
                            <td>
                                <button class="btn btn-sm btn-primary edit-btn" data-id="${news.id}">
                                    <i class="bi bi-pencil"></i> 编辑
                                </button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${news.id}">
                                    <i class="bi bi-trash"></i> 删除
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                newsList.innerHTML = html;
                
                // 更新总数
                if (totalCount) {
                    totalCount.textContent = data.pagination.total;
                }
                
                // 生成分页
                if (pagination) {
                    generatePagination(data.pagination);
                }
                
                // 添加编辑和删除按钮事件
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        editNews(id);
                    });
                });
                
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        deleteId = id;
                        confirmModal.show();
                    });
                });
            }
        } catch (error) {
            console.error('加载新闻列表失败:', error);
            if (newsList) {
                newsList.innerHTML = '<tr><td colspan="6" class="text-center">加载新闻列表失败</td></tr>';
            }
        }
    }
    
    /**
     * 生成分页
     */
    function generatePagination(paginationData) {
        const { total, page, limit, totalPages } = paginationData;
        
        let html = '';
        
        // 上一页
        html += `
            <li class="page-item ${page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${page - 1}" aria-label="上一页">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
        
        // 页码
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || // 第一页
                i === totalPages || // 最后一页
                (i >= page - 1 && i <= page + 1) // 当前页的前后一页
            ) {
                html += `
                    <li class="page-item ${i === page ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (
                (i === 2 && page > 3) || // 第一页后的省略号
                (i === totalPages - 1 && page < totalPages - 2) // 最后一页前的省略号
            ) {
                html += `
                    <li class="page-item disabled">
                        <a class="page-link" href="#">...</a>
                    </li>
                `;
            }
        }
        
        // 下一页
        html += `
            <li class="page-item ${page === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${page + 1}" aria-label="下一页">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;
        
        pagination.innerHTML = html;
        
        // 添加分页点击事件
        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const page = this.getAttribute('data-page');
                
                if (page && !this.parentElement.classList.contains('disabled')) {
                    loadNewsList(parseInt(page));
                }
            });
        });
    }
    
    /**
     * 编辑新闻
     */
    async function editNews(id) {
        try {
            const data = await fetch(`/api/news/${id}`);
            
            if (data && data.news) {
                const news = data.news;
                
                // 填充表单
                newsId.value = news.id;
                newsTitle.value = news.title;
                $(newsContent).summernote('code', news.content || '');
                
                // 显示图片预览
                if (news.image_url && previewImage) {
                    previewImage.src = news.image_url;
                    imagePreview.classList.remove('d-none');
                } else if (imagePreview) {
                    imagePreview.classList.add('d-none');
                }
                
                // 显示模态框
                document.getElementById('modal-title').textContent = '编辑新闻';
                newsModal.show();
            }
        } catch (error) {
            console.error('获取新闻详情失败:', error);
            alert('获取新闻详情失败');
        }
    }
    
    /**
     * 保存新闻
     */
    async function saveNews(formData, id = null) {
        try {
            const url = id ? `/api/news/${id}` : '/api/news';
            const method = id ? 'PUT' : 'POST';
            
            const response = await window.adminUtils.authenticatedFetch(url, {
                method,
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // 记录活动
                window.adminUtils.logActivity(
                    id ? '编辑新闻' : '添加新闻',
                    id ? `编辑新闻 "${newsTitle.value}"` : `添加新闻 "${newsTitle.value}"`
                );
                
                // 关闭模态框并刷新列表
                newsModal.hide();
                loadNewsList(currentPage);
            } else {
                alert(data.message || '保存失败');
            }
        } catch (error) {
            console.error('保存新闻失败:', error);
            alert('保存新闻失败，请稍后重试');
        }
    }
    
    /**
     * 删除新闻
     */
    async function deleteNews(id) {
        try {
            const response = await fetch(`/api/news/${id}`, 'DELETE');
            
            if (response) {
                // 记录活动
                window.adminUtils.logActivity('删除新闻', `删除新闻 ID: ${id}`);
                
                // 刷新列表
                loadNewsList(currentPage);
            }
        } catch (error) {
            console.error('删除新闻失败:', error);
            alert('删除新闻失败，请稍后重试');
        }
    }
    
    /**
     * 重置表单
     */
    function resetForm() {
        if (newsForm) newsForm.reset();
        if (newsId) newsId.value = '';
        if (newsContent) $(newsContent).summernote('code', '');
        if (imagePreview) imagePreview.classList.add('d-none');
    }
});