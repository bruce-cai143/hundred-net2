-- 创建新闻表
CREATE TABLE news (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '新闻标题',
    summary TEXT COMMENT '新闻摘要',
    content TEXT COMMENT '新闻内容',
    author VARCHAR(100) COMMENT '作者',
    publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft' COMMENT '状态',
    page_path VARCHAR(255) COMMENT '生成的页面路径',
    category VARCHAR(50) DEFAULT 'uncategorized' COMMENT '新闻分类',
    views INT DEFAULT 0 COMMENT '浏览次数',
    featured BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
    cover_image_id INT COMMENT '封面图片ID',
    FOREIGN KEY (cover_image_id) REFERENCES images(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_publish_date (publish_date)
) COMMENT '新闻表';

-- 创建新闻图片关联表
CREATE TABLE news_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    news_id INT NOT NULL COMMENT '新闻ID',
    image_id INT NOT NULL COMMENT '图片ID',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    INDEX idx_news_id (news_id),
    INDEX idx_image_id (image_id)
) COMMENT '新闻图片关联表';

-- 创建新闻分类表
CREATE TABLE news_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    parent_id INT DEFAULT NULL COMMENT '父分类ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status TINYINT DEFAULT 1 COMMENT '状态(1:正常,0:删除)',
    FOREIGN KEY (parent_id) REFERENCES news_categories(id) ON DELETE SET NULL
) COMMENT '新闻分类表';