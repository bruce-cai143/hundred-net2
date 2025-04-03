CREATE TABLE downloads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_data LONGBLOB,
    file_size INT,
    file_type VARCHAR(100),
    download_count INT DEFAULT 0,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(50)
);