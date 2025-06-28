-- 更新teachers表，添加缺失的字段
USE school_db2;

-- 添加contact字段
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS contact VARCHAR(100);

-- 添加introduction字段
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS introduction TEXT;

-- 添加status字段
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS status TINYINT(1) DEFAULT 1;

-- 添加order_num字段
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS order_num INT DEFAULT 0;

-- 更新现有记录的status为1（在职）
UPDATE teachers SET status = 1 WHERE status IS NULL; 