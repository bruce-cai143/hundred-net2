// 从数据库加载图片
async function loadImageFromDB(imageId, imgElement) {
    try {
        const response = await fetch(`/api/images/${imageId}`);
        if (!response.ok) {
            throw new Error('Failed to load image');
        }
        
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        imgElement.src = imageUrl;
        
        // 清理 URL 对象
        imgElement.onload = () => {
            URL.revokeObjectURL(imageUrl);
        };
    } catch (error) {
        console.error('Error loading image:', error);
        imgElement.alt = 'Image failed to load';
    }
}

// 获取图片列表
async function getImagesList() {
    try {
        const response = await fetch('/api/images');
        if (!response.ok) {
            throw new Error('Failed to fetch images list');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching images list:', error);
        return [];
    }
}

// 初始化页面上的所有图片
async function initializeImages() {
    const images = await getImagesList();
    const imgElements = document.querySelectorAll('img[data-db-image]');
    
    imgElements.forEach(async (img) => {
        const imagePath = img.getAttribute('data-db-image');
        const imageInfo = images.find(image => image.original_path === imagePath);
        
        if (imageInfo) {
            await loadImageFromDB(imageInfo.id, img);
        }
    });
}

// 当页面加载完成时初始化图片
document.addEventListener('DOMContentLoaded', initializeImages);