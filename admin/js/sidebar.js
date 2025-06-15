/**
 * 侧边栏加载与管理
 * 负责加载侧边栏并管理活动状态
 */

// 页面加载时初始化侧边栏
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
});

// 初始化侧边栏
function initSidebar() {
    // 检查当前页面是否使用了容器或直接内嵌侧边栏
    const sidebarContainer = document.getElementById('sidebar-container');
    
    if (sidebarContainer) {
        // 使用容器模式，从片段文件加载侧边栏
        loadSidebarFromFragment();
    } else {
        // 直接内嵌模式，查找并高亮当前菜单项
        highlightCurrentMenuItem();
    }
}

// 从片段文件加载侧边栏
function loadSidebarFromFragment() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    // 从片段文件加载侧边栏
    fetch('/admin/fragments/sidrbar.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('无法加载侧边栏');
            }
            return response.text();
        })
        .then(html => {
            // 直接填充侧边栏内容，不添加额外的包装元素
            sidebarContainer.innerHTML = html;
            // 激活当前页面对应的菜单项
            highlightCurrentMenuItem();
        })
        .catch(error => {
            console.error('加载侧边栏失败:', error);
            sidebarContainer.innerHTML = '<div class="alert alert-danger m-3">侧边栏加载失败</div>';
        });
}

// 高亮当前页面
function highlightCurrentMenuItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const menuItems = document.querySelectorAll('.sidebar-menu a');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        // 移除所有激活状态
        item.classList.remove('active');
        
        // 如果当前页面路径包含链接href，则激活
        if (href === currentPage) {
            item.classList.add('active');
        }
    });
}

// 导出模块功能
export { initSidebar, highlightCurrentMenuItem }; 