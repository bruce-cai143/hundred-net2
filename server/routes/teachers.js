const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// 创建头像上传目录
const avatarsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, avatarsDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB限制
    fileFilter: function(req, file, cb) {
        // 只允许图片类型
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('只支持图片文件类型'));
        }
    }
});

// 获取教师列表
router.get('/', async (req, res) => {
    try {
        // 检查teachers表是否存在
        const [tables] = await pool.query(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'school_db2' AND TABLE_NAME = 'teachers'"
        );
        
        if (tables.length === 0) {
            // 如果表不存在，创建表
            console.log('teachers表不存在，正在创建...');
        } else {
            // 如果表存在，检查是否有contact字段
            const [columns] = await pool.query(
                "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'school_db2' AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'contact'"
            );
            
            if (columns.length === 0) {
                console.log('teachers表缺少contact字段，正在重新创建...');
                // 删除现有表
                await pool.query('DROP TABLE IF EXISTS teachers');
            } else {
                console.log('teachers表已存在且结构正确');
                // 获取教师列表
                const [teachers] = await pool.query('SELECT * FROM teachers ORDER BY order_num ASC');
                res.json({ success: true, data: teachers });
                return;
            }
        }
        
        // 创建表
        await pool.query(`
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
            )
        `);
        console.log('teachers表创建成功');
        
        // 添加一些示例教师
        await pool.query(`
            INSERT INTO teachers (name, contact, introduction, title, specialty, order_num, status) VALUES 
            ('张三', '123456789', '张三是我校资深教师，拥有20年教学经验...', '主任', '计算机科学', 1, 1),
            ('李四', '987654321', '李四专注于科研，曾获多项科研奖项...', '副主任', '人工智能', 2, 1),
            ('王五', 'wangwu@example.com', '王五毕业于清华大学，专注于人工智能领域研究...', '委员', '机器学习', 3, 1)
        `);
    } catch (error) {
        console.error('获取教师列表失败:', error);
        res.status(500).json({ success: false, message: '获取教师列表失败: ' + error.message });
    }
});

// 获取单个教师
router.get('/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;
        
        const [teachers] = await pool.query(
            'SELECT * FROM teachers WHERE id = ?',
            [teacherId]
        );
        
        if (teachers.length === 0) {
            return res.status(404).json({ success: false, message: '教师不存在' });
        }
        
        res.json({ success: true, data: teachers[0] });
    } catch (error) {
        console.error('获取教师详情失败:', error);
        res.status(500).json({ success: false, message: '获取教师详情失败: ' + error.message });
    }
});

// 添加教师
router.post('/', upload.single('avatar'), authenticateToken, async (req, res) => {
    try {
        const { name, contact, introduction, status, title, specialty } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, message: '教师姓名不能为空' });
        }
        
        // 处理头像文件上传
        let avatarPath = null;
        if (req.file) {
            avatarPath = `/uploads/avatars/${req.file.filename}`;
        }
        
        const [result] = await pool.query(
            'INSERT INTO teachers (name, contact, introduction, status, title, specialty, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                name, 
                contact || null, 
                introduction || null, 
                status === 'on' || status === 'true' || status === true || status === 1,
                title || null,
                specialty || null,
                avatarPath
            ]
        );
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'teachers', `添加了委员会成员：${name}`]
        );
        
        res.json({ 
            success: true, 
            message: '委员会成员添加成功', 
            data: {
                id: result.insertId,
                name,
                contact,
                introduction,
                status: status === 'true' || status === true,
                title,
                specialty,
                avatar: avatarPath
            }
        });
    } catch (error) {
        console.error('添加委员会成员失败:', error);
        res.status(500).json({ success: false, message: '添加委员会成员失败: ' + error.message });
    }
});

// 更新教师
router.put('/:id', upload.single('avatar'), authenticateToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { name, contact, introduction, status, title, specialty } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, message: '教师姓名不能为空' });
        }
        
        // 处理头像文件上传
        let avatarPath = null;
        if (req.file) {
            avatarPath = `/uploads/avatars/${req.file.filename}`;
        }
        
        // 构建更新SQL
        let updateSql = 'UPDATE teachers SET name = ?, contact = ?, introduction = ?, status = ?, title = ?, specialty = ?';
        let params = [
            name, 
            contact || null, 
            introduction || null, 
            status === 'on' || status === 'true' || status === true || status === 1,
            title || null,
            specialty || null
        ];
        
        // 如果有新头像，添加到更新字段
        if (avatarPath) {
            updateSql += ', image = ?';
            params.push(avatarPath);
        }
        
        updateSql += ' WHERE id = ?';
        params.push(teacherId);
        
        const [result] = await pool.query(updateSql, params);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '委员会成员不存在' });
        }
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'teachers', `更新了委员会成员：${name}`]
        );
        
        res.json({ success: true, message: '委员会成员更新成功' });
    } catch (error) {
        console.error('更新委员会成员失败:', error);
        res.status(500).json({ success: false, message: '更新委员会成员失败: ' + error.message });
    }
});

// 更新教师排序
router.put('/order', authenticateToken, async (req, res) => {
    try {
        const { order } = req.body;
        
        if (!order || !Array.isArray(order)) {
            return res.status(400).json({ success: false, message: '排序数据格式不正确' });
        }
        
        // 使用事务进行批量更新
        await pool.query('START TRANSACTION');
        
        for (const item of order) {
            await pool.query(
                'UPDATE teachers SET order_num = ? WHERE id = ?',
                [item.order, item.id]
            );
        }
        
        await pool.query('COMMIT');
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'teachers', '更新了委员会成员排序']
        );
        
        res.json({ success: true, message: '委员会成员排序更新成功' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('更新委员会成员排序失败:', error);
        res.status(500).json({ success: false, message: '更新委员会成员排序失败: ' + error.message });
    }
});

// 删除教师
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        
        // 获取教师姓名用于活动记录
        const [teachers] = await pool.query('SELECT name FROM teachers WHERE id = ?', [teacherId]);
        if (teachers.length === 0) {
            return res.status(404).json({ success: false, message: '委员会成员不存在' });
        }
        
        const [result] = await pool.query('DELETE FROM teachers WHERE id = ?', [teacherId]);
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'teachers', `删除了委员会成员：${teachers[0].name}`]
        );
        
        res.json({ success: true, message: '委员会成员删除成功' });
    } catch (error) {
        console.error('删除委员会成员失败:', error);
        res.status(500).json({ success: false, message: '删除委员会成员失败: ' + error.message });
    }
});

// 更新team.html页面内容
router.post('/update-team-html', authenticateToken, async (req, res) => {
    try {
        const { html } = req.body;
        
        if (!html) {
            return res.status(400).json({ success: false, message: 'HTML内容不能为空' });
        }
        
        // 确定team.html文件的路径（相对于项目根目录）
        const teamHtmlPath = path.join(__dirname, '..', 'team.html');
        
        // 写入文件
        fs.writeFile(teamHtmlPath, html, 'utf8', (err) => {
            if (err) {
                console.error('写入team.html文件失败:', err);
                return res.status(500).json({ success: false, message: '写入team.html文件失败: ' + err.message });
            }
            
            // 记录活动
            pool.query(
                'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
                [req.user.id, 'website', '更新了青年委员会页面']
            ).catch(error => {
                console.error('记录活动失败:', error);
            });
            
            res.json({ success: true, message: 'team.html页面更新成功' });
        });
    } catch (error) {
        console.error('更新team.html页面失败:', error);
        res.status(500).json({ success: false, message: '更新team.html页面失败: ' + error.message });
    }
});

module.exports = router;