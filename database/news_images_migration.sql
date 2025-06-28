-- 新闻图片二进制存储表
CREATE TABLE IF NOT EXISTS news_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  news_id INT,
  image_name VARCHAR(255),
  file_data LONGBLOB,
  mime_type VARCHAR(100),
  upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 