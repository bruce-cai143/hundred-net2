/**
 * 从数据库加载并显示图片库
 */
document.addEventListener('DOMContentLoaded', function() {
    loadImagesFromDatabase();
});

/**
 * 从数据库加载图片
 */
async function loadImagesFromDatabase() {
    try {
        const response = await fetch('/api/media/images');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const images = await response.json();
        displayImages(images);
    } catch (error) {
        console.error('加载图片失败:', error);
        document.getElementById('gallery-container').innerHTML = 
            `<div class="alert alert-danger">加载图片失败: ${error.message}</div>`;
    }
}

/**
 * 显示图片
 * @param {Array} images - 图片数据数组
 */
function displayImages(images) {
    const galleryContainer = document.getElementById('gallery-container');
    
    if (!images || images.length === 0) {
        galleryContainer.innerHTML = '<div class="alert alert-info">暂无图片</div>';
        return;
    }
    
    let html = '<div class="row">';
    
    images.forEach(image => {
        html += `
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="card">
                <img src="/api/media/images/${image.id}" class="card-img-top" alt="${image.title}">
                <div class="card-body">
                    <h5 class="card-title">${image.title}</h5>
                    <p class="card-text">
                        <small class="text-muted">上传时间: ${new Date(image.upload_date).toLocaleDateString()}</small>
                        <br>
                        <small class="text-muted">分类: ${image.category || '未分类'}</small>
                    </p>
                </div>
            </div>
        </div>`;
    });
    
    html += '</div>';
    galleryContainer.innerHTML = html;
}

/**
 * 按分类筛选图片
 * @param {string} category - 分类名称
 */
async function filterByCategory(category) {
    try {
        const response = await fetch(`/api/media/category/${category}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayImages(data.images);
    } catch (error) {
        console.error('筛选图片失败:', error);
        document.getElementById('gallery-container').innerHTML = 
            `<div class="alert alert-danger">筛选图片失败: ${error.message}</div>`;
    }
}