CREATE TABLE images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    original_path VARCHAR(500) NOT NULL,
    file_data MEDIUMBLOB NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(100),
    description TEXT
);