/**
 * 新闻列表页面脚本
 */
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const newsList = document.getElementById('newsList');
    const featuredNews = document.getElementById('featuredNews');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortOrder = document.getElementById('sortOrder');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    // 分页状态
    const state = {
        currentPage: 1,
        limit: 12,
        totalPages: 1,
        category: '',
        order: 'DESC'
    };
    
    // 初始化
    loadNews();
    loadFeaturedNews();
    
    // 事件监听
    categoryFilter.addEventListener('change', function() {
        state.category = this.value;
        state.currentPage = 1;
        loadNews();
    });
    
    sortOrder.addEventListener('change', function() {
        state.order = this.value;
        state.currentPage = 1;
        loadNews();
    });
    
    prevPageBtn.addEventListener('click', function() {
        if (state.currentPage > 1) {
            state.currentPage--;
            loadNews();
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        if (state.currentPage < state.totalPages) {
            state.currentPage++;
            loadNews();
        }
    });
    
    /**
     * 加载新闻列表
     */
    function loadNews() {
        // 显示加载中
        newsList.innerHTML = '<div class="loading">加载中...</div>';
        
        // 计算偏移量
        const offset = (state.currentPage - 1) * state.limit;
        
        // 构建API URL
        let url = `/api/news?limit=${state.limit}&offset=${offset}&sort=publish_date&order=${state.order}&status=published`;
        if (state.category) {
            url += `&category=${state.category}`;
        }
        
        // 获取新闻数据
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderNewsList(data.news);
                    updatePagination(data.total);
                } else {
                    newsList.innerHTML = `<div class="error">加载失败: ${data.message}</div>`;
                }
            })
            .catch(error => {
                console.error('获取新闻列表失败:', error);
                newsList.innerHTML = '<div class="error">加载失败，请稍后重试</div>';
            });
    }
    
    /**
     * 加载置顶新闻
     */
    function loadFeaturedNews() {
        // 构建API URL
        const url = `/api/news?limit=3&offset=0&sort=publish_date&order=DESC&status=published&featured=true`;
        
        // 获取置顶新闻数据
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.news.length > 0) {
                    renderFeaturedNews(data.news);
                } else {
                    document.querySelector('.featured-news').style.display = 'none';
                }
            })
            .catch(error => {
                console.error('获取置顶新闻失败:', error);
                document.querySelector('.featured-news').style.display = 'none';
            });
    }
    
    /**
     * 渲染新闻列表
     * @param {Array} news - 新闻数组
     */
    function renderNewsList(news) {
        if (news.length === 0) {
            newsList.innerHTML = '<div class="no-news">暂无新闻</div>';
            return;
        }
        
        let html = '';
        
        news.forEach(item => {
            const publishDate = new Date(item.publish_date).toLocaleDateString('zh-CN');
            const coverImage = item.cover_image_id 
                ? `/api/media/download/${item.cover_image_id}?type=image` 
                : '/assets/images/news-default.jpg';
            
            html += `
                <div class="news-card">
                    <img class="news-card-image" src="${coverImage}" alt="${item.title}" onerror="this.src='/assets/images/news-default.jpg'">
                    <div class="news-card-content">
                        <h3 class="news-card-title">
                            <a href="/${item.page_path}">${item.title}</a>
                        </h3>
                        <p class="news-card-summary">${item.summary || '暂无摘要'}</p>
                        <div class="news-card-meta">
                            <span>${publishDate}</span>
                            <span>浏览: ${item.views}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        newsList.innerHTML = html;
    }
    
    /**
     * 渲染置顶新闻
     * @param {Array} news - 置顶新闻数组
     */
    function renderFeaturedNews(news) {
        if (news.length === 0) {
            document.querySelector('.featured-news').style.display = 'none';
            return;
        }
        
        let html = '';
        
        news.forEach(item => {
            const publishDate = new Date(item.publish_date).toLocaleDateString('zh-CN');
            
            html += `
                <div class="featured-news-card">
                    <h3><a href="/${item.page_path}">${item.title}</a></h3>
                    <p>${item.summary || item.title}</p>
                    <div class="news-card-meta">
                        <span>${publishDate}</span>
                    </div>
                </div>
            `;
        });
        
        featuredNews.innerHTML = html;
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
});