/**
 * 管理员控制面板脚本
 */

document.addEventListener('DOMContentLoaded', async function() {
    // 导入工具函数
    const { checkAuth, logout } = await import('./admin-utils.js');
    
    // 检查认证状态
    await checkAuth();
    
    // 获取统计元素
    const newsCount = document.getElementById('news-count');
    const slidesCount = document.getElementById('slides-count');
    const teachersCount = document.getElementById('teachers-count');
    const filesCount = document.getElementById('files-count');
    const activitiesList = document.getElementById('activities-list');
    
    // 绑定退出登录事件
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // 加载统计数据
    loadDashboardData();
    
    /**
     * 加载控制面板数据
     */
    async function loadDashboardData() {
        try {
            // 获取新闻数量
            const newsData = await fetch('/api/count/news');
            if (newsData && newsCount) {
                newsCount.textContent = newsData.count || 0;
            }
            
            // 获取轮播图数量
            const slidesData = await fetch('/api/count/slides');
            if (slidesData && slidesCount) {
                slidesCount.textContent = slidesData.count || 0;
            }
            
            // 获取教师数量
            const teachersData = await fetch('/api/count/teachers');
            if (teachersData && teachersCount) {
                teachersCount.textContent = teachersData.count || 0;
            }
            
            // 获取文件数量
            const filesData = await fetch('/api/count/uploads');
            if (filesData && filesCount) {
                filesCount.textContent = filesData.count || 0;
            }
            
            // 获取最近活动
            loadRecentActivities();
        } catch (error) {
            console.error('加载控制面板数据失败:', error);
        }
    }
    
    /**
     * 加载最近活动
     */
    async function loadRecentActivities() {
        try {
            const activitiesData = await fetch('/api/activities?limit=10');
            
            if (activitiesData && activitiesData.activities && activitiesList) {
                if (activitiesData.activities.length === 0) {
                    activitiesList.innerHTML = '<tr><td colspan="3" class="text-center">暂无活动记录</td></tr>';
                    return;
                }
                
                let html = '';
                
                activitiesData.activities.forEach(activity => {
                    const date = new Date(activity.created_at);
                    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                    
                    html += `
                        <tr>
                            <td>${activity.type}</td>
                            <td>${activity.description}</td>
                            <td>${formattedDate}</td>
                        </tr>
                    `;
                });
                
                activitiesList.innerHTML = html;
            }
        } catch (error) {
            console.error('加载活动记录失败:', error);
            if (activitiesList) {
                activitiesList.innerHTML = '<tr><td colspan="3" class="text-center">加载活动记录失败</td></tr>';
            }
        }
    }
});