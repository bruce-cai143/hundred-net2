document.addEventListener('DOMContentLoaded', function() {
    // 获取URL参数中的新闻ID
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');
    
    if (!newsId) {
        showError('未找到新闻ID');
        return;
    }
    
    // 加载新闻详情
    loadNewsDetail(newsId);
    
    // 初始化移动端菜单
    initMobileMenu();
});

// 加载新闻详情
async function loadNewsDetail(id) {
    const loading = document.getElementById('newsLoading');
    const content = document.getElementById('newsContent');
    
    try {
        const response = await fetch(`/api/news/${id}`);
        if (!response.ok) {
            throw new Error('获取新闻详情失败');
        }
        
        const data = await response.json();
        const news = data.news; // API返回的是 {success: true, news: {...}}
        
        if (!news) {
            throw new Error('新闻不存在');
        }
        
        // 设置页面标题
        document.title = `${news.title} - 未来科技中学`;
        
        // 填充新闻内容
        document.getElementById('newsTitle').textContent = news.title;
        document.getElementById('newsCategory').textContent = news.category || '校园新闻';
        
        // 修复日期显示
        let dateText = '未知日期';
        if (news.created_at) {
            try {
                const date = new Date(news.created_at);
                if (!isNaN(date.getTime())) {
                    dateText = date.toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
            } catch (e) {
                console.error('日期解析错误:', e);
            }
        }
        document.getElementById('newsDate').textContent = dateText;
        
        document.getElementById('newsAuthor').textContent = news.author ? `作者: ${news.author}` : '';
        
        // 设置新闻图片 - 修复图片显示逻辑
        const imageContainer = document.getElementById('newsImageContainer');
        const newsImage = document.getElementById('newsImage');
        
        // 检查是否有图片
        if (news.image_url || (news.images && news.images.length > 0)) {
            if (news.image_url) {
                // 单张图片
                newsImage.src = news.image_url;
                newsImage.alt = news.title;
                imageContainer.style.display = 'block';
            } else if (news.images && news.images.length > 0) {
                // 多张图片，创建图片画廊
                imageContainer.innerHTML = '';
                imageContainer.style.display = 'block';
                
                if (news.images.length === 1) {
                    // 只有一张图片
                    const img = document.createElement('img');
                    img.src = news.images[0].image_url;
                    img.alt = news.images[0].caption || news.title;
                    img.className = 'news-image-single';
                    imageContainer.appendChild(img);
                } else {
                    // 多张图片，创建画廊
                    const gallery = document.createElement('div');
                    gallery.className = 'news-gallery';
                    
                    news.images.forEach((image, index) => {
                        const imgContainer = document.createElement('div');
                        imgContainer.className = 'gallery-item';
                        
                        const img = document.createElement('img');
                        img.src = image.image_url;
                        img.alt = image.caption || `${news.title} - 图片 ${index + 1}`;
                        img.className = 'gallery-image';
                        
                        imgContainer.appendChild(img);
                        
                        // 如果有图片说明，添加说明文字
                        if (image.caption) {
                            const caption = document.createElement('div');
                            caption.className = 'image-caption';
                            caption.textContent = image.caption;
                            
                            imgContainer.appendChild(caption);
                        }
                        
                        gallery.appendChild(imgContainer);
                    });
                    
                    imageContainer.appendChild(gallery);
                }
            }
        } else {
            imageContainer.style.display = 'none';
        }
        
        // 设置新闻正文
        document.getElementById('newsBody').innerHTML = formatNewsContent(news.content);
        
        // 显示内容，隐藏加载中
        loading.style.display = 'none';
        content.style.display = 'block';
    } catch (error) {
        console.error('加载新闻详情失败:', error);
        showError('加载新闻详情失败，请稍后再试');
    }
}

// 格式化新闻内容
function formatNewsContent(content) {
    if (!content) return '';
    
    // 将换行符转换为段落
    return content.split('\n')
        .filter(paragraph => paragraph.trim() !== '')
        .map(paragraph => `<p>${paragraph}</p>`)
        .join('');
}

// 显示错误信息
function showError(message) {
    const loading = document.getElementById('newsLoading');
    loading.innerHTML = `<p class="error-message">${message}</p>`;
}

// 初始化移动端菜单
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    menuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
    });
}

// 返回上一页函数
function goBack() {
    // 检查是否有历史记录
    if (document.referrer && document.referrer !== window.location.href) {
        window.history.back();
    } else {
        // 如果没有历史记录，返回首页
        window.location.href = 'index.html';
    }
}