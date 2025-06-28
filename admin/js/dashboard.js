/**
 * 管理员控制面板脚本
 */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('控制面板初始化开始...');
    
    // 获取统计元素
    const newsCount = document.getElementById('news-count');
    const imagesCount = document.getElementById('images-count');
    const teachersCount = document.getElementById('teachers-count');
    const filesCount = document.getElementById('files-count');
    const recentNewsList = document.getElementById('recent-news-list');
    
    // 绑定退出登录事件
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出登录吗？')) {
                window.location.href = '/admin/login.html';
            }
        });
    }
    
    // 立即加载统计数据
    console.log('开始加载控制面板数据...');
    await loadDashboardData();
    
    /**
     * 加载控制面板数据
     */
    async function loadDashboardData() {
        try {
            console.log('并行加载统计数据...');
            
            // 并行加载所有数据以提高速度
            const [newsData, imagesData, teachersData, filesData] = await Promise.all([
                fetch('/api/count/news').then(res => res.json()).catch(() => ({ count: 0 })),
                fetch('/api/count/images-count').then(res => res.json()).catch(() => ({ count: 0 })),
                fetch('/api/count/teachers').then(res => res.json()).catch(() => ({ count: 0 })),
                fetch('/api/count/files').then(res => res.json()).catch(() => ({ count: 0 }))
            ]);
            
            console.log('统计数据加载完成:', { newsData, imagesData, teachersData, filesData });
            
            // 更新统计数字
            if (newsCount) {
                newsCount.textContent = newsData.count || 0;
                console.log('新闻数量已更新:', newsData.count);
            }
            if (imagesCount) {
                imagesCount.textContent = imagesData.count || 0;
                console.log('图片数量已更新:', imagesData.count);
            }
            if (teachersCount) {
                teachersCount.textContent = teachersData.count || 0;
                console.log('教师数量已更新:', teachersData.count);
            }
            if (filesCount) {
                filesCount.textContent = filesData.count || 0;
                console.log('文件数量已更新:', filesData.count);
            }
            
            // 加载最近新闻
            console.log('开始加载最近新闻...');
            await loadRecentNews();
            
        } catch (error) {
            console.error('加载控制面板数据失败:', error);
            // 设置默认值
            if (newsCount) newsCount.textContent = '0';
            if (imagesCount) imagesCount.textContent = '0';
            if (teachersCount) teachersCount.textContent = '0';
            if (filesCount) filesCount.textContent = '0';
        }
    }
    
    /**
     * 加载最近新闻
     */
    async function loadRecentNews() {
        try {
            console.log('请求最近新闻数据...');
            const response = await fetch('/api/news?limit=10&sort=created_at&order=DESC');
            const data = await response.json();
            
            console.log('最近新闻数据:', data);
            
            if (data && data.news && recentNewsList) {
                if (data.news.length === 0) {
                    recentNewsList.innerHTML = '<tr><td colspan="3" class="text-center">暂无新闻</td></tr>';
                    console.log('没有新闻数据');
                    return;
                }
                
                let html = '';
                
                data.news.forEach(news => {
                    const date = new Date(news.created_at);
                    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                    
                    html += `
                        <tr>
                            <td>${news.title || '无标题'}</td>
                            <td><span class="badge bg-primary">${news.category || '校园新闻'}</span></td>
                            <td>${formattedDate}</td>
                        </tr>
                    `;
                });
                
                recentNewsList.innerHTML = html;
                console.log('最近新闻已更新，共', data.news.length, '条');
            }
        } catch (error) {
            console.error('加载最近新闻失败:', error);
            if (recentNewsList) {
                recentNewsList.innerHTML = '<tr><td colspan="3" class="text-center">加载新闻失败</td></tr>';
            }
        }
    }
    
    console.log('控制面板初始化完成');
});