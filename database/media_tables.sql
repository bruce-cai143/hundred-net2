-- 创建图片库表
CREATE TABLE images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '图片标题',
    description TEXT COMMENT '图片描述',
    file_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_data LONGBLOB NOT NULL COMMENT '图片二进制数据',
    file_size INT COMMENT '文件大小(字节)',
    mime_type VARCHAR(100) COMMENT '文件MIME类型',
    width INT COMMENT '图片宽度(像素)',
    height INT COMMENT '图片高度(像素)',
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    uploader_id INT COMMENT '上传者ID',
    category VARCHAR(50) DEFAULT 'uncategorized' COMMENT '图片分类',
    tags TEXT COMMENT '图片标签(JSON格式)',
    status TINYINT DEFAULT 1 COMMENT '状态(1:正常,0:删除)',
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_upload_date (upload_date)
) COMMENT '图片库表';

-- 创建文件库表
CREATE TABLE files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '文件标题',
    description TEXT COMMENT '文件描述',
    file_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_data LONGBLOB NOT NULL COMMENT '文件二进制数据',
    file_size INT COMMENT '文件大小(字节)',
    mime_type VARCHAR(100) COMMENT '文件MIME类型',
    file_type VARCHAR(50) COMMENT '文件类型(doc/pdf/zip等)',
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    uploader_id INT COMMENT '上传者ID',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    category VARCHAR(50) DEFAULT 'uncategorized' COMMENT '文件分类',
    tags TEXT COMMENT '文件标签(JSON格式)',
    status TINYINT DEFAULT 1 COMMENT '状态(1:正常,0:删除)',
    version VARCHAR(20) COMMENT '文件版本号',
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_upload_date (upload_date),
    INDEX idx_file_type (file_type)
) COMMENT '文件库表';

-- 创建媒体分类表
CREATE TABLE media_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    parent_id INT DEFAULT NULL COMMENT '父分类ID',
    type ENUM('image', 'file') NOT NULL COMMENT '分类类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status TINYINT DEFAULT 1 COMMENT '状态(1:正常,0:删除)',
    FOREIGN KEY (parent_id) REFERENCES media_categories(id) ON DELETE SET NULL
) COMMENT '媒体分类表';

-- 创建媒体标签表
CREATE TABLE media_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '标签名称',
    description TEXT COMMENT '标签描述',
    type ENUM('image', 'file', 'both') NOT NULL COMMENT '标签类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status TINYINT DEFAULT 1 COMMENT '状态(1:正常,0:删除)',
    UNIQUE KEY unique_tag_name (name)
) COMMENT '媒体标签表';

-- 创建媒体-标签关联表
CREATE TABLE media_tag_relations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    media_id INT NOT NULL COMMENT '媒体ID(图片或文件ID)',
    tag_id INT NOT NULL COMMENT '标签ID',
    media_type ENUM('image', 'file') NOT NULL COMMENT '媒体类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tag_id) REFERENCES media_tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_media_tag (media_id, tag_id, media_type)
) COMMENT '媒体-标签关联表';