-- 完全修复teachers表结构
USE school_db2;

-- 删除现有的teachers表（如果存在）
DROP TABLE IF EXISTS teachers;

-- 重新创建teachers表，包含所有需要的字段
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    bio TEXT,
    image VARCHAR(255),
    contact VARCHAR(100),
    introduction TEXT,
    specialty VARCHAR(100),
    status TINYINT(1) DEFAULT 1,
    order_num INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入示例数据
INSERT INTO teachers (name, contact, introduction, title, specialty, status, order_num) VALUES 
('张三', '123456789', '张三是我校资深教师，拥有20年教学经验...', '主任', '计算机科学', 1, 1),
('李四', '987654321', '李四专注于科研，曾获多项科研奖项...', '副主任', '人工智能', 1, 2),
('王五', 'wangwu@example.com', '王五毕业于清华大学，专注于人工智能领域研究...', '委员', '机器学习', 1, 3);

-- 显示表结构确认
DESCRIBE teachers;

-- 显示插入的数据
SELECT * FROM teachers; 