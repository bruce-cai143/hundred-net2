const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/db');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 根据文件类型和用途选择不同的目录
        let uploadDir = 'uploads/';
        
        // 检查是否是轮播图上传
        if (req.body.type === 'slide') {
            uploadDir += 'slides/';
        } else {
            switch (file.mimetype.split('/')[0]) {
                case 'image':
                    uploadDir += 'images/';
                    break;
                case 'video':
                    uploadDir += 'videos/';
                    break;
                case 'audio':
                    uploadDir += 'audio/';
                    break;
                default:
                    uploadDir += 'documents/';
            }
        }
        
        // 确保目录存在
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// 文件类型过滤
const fileFilter = (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4',
        'audio/mpeg',
        'audio/wav'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 限制文件大小为50MB
    }
});

// 上传轮播图
router.post('/slide', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '请选择要上传的图片' });
        }

        const { title, link, order = 0, status = true } = req.body;

        // 记录轮播图信息到数据库
        const [result] = await pool.query(
            'INSERT INTO files (filename, original_name, mime_type, size, path, uploaded_by, type, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                req.file.filename,
                req.file.originalname,
                req.file.mimetype,
                req.file.size,
                req.file.path,
                req.user.id,
                'slide',
                JSON.stringify({ title, link, order, status })
            ]
        );

        // 记录上传活动
        await pool.query(
            'INSERT INTO activities (type, description) VALUES (?, ?)',
            ['轮播图上传', `管理员 ${req.user.username} 上传了轮播图 ${title || '无标题'}`]
        );

        res.json({
            message: '轮播图上传成功',
            slide: {
                id: result.insertId,
                title,
                image_url: `/uploads/slides/${req.file.filename}`,
                link,
                order: parseInt(order),
                status: status === 'true' || status === true
            }
        });
    } catch (error) {
        console.error('轮播图上传失败:', error);
        res.status(500).json({ message: '轮播图上传失败: ' + error.message });
    }
});

// 获取轮播图列表
router.get('/slides', async (req, res) => {
    try {
        const [files] = await pool.query(
            'SELECT id, filename, metadata, created_at FROM files WHERE type = "slide" ORDER BY JSON_EXTRACT(metadata, "$.order") ASC'
        );

        const slides = files.map(file => {
            const metadata = JSON.parse(file.metadata);
            return {
                id: file.id,
                title: metadata.title,
                image_url: `/uploads/slides/${file.filename}`,
                link: metadata.link,
                order: metadata.order,
                status: metadata.status,
                created_at: file.created_at
            };
        });

        res.json({ slides });
    } catch (error) {
        console.error('获取轮播图列表失败:', error);
        res.status(500).json({ message: '获取轮播图列表失败: ' + error.message });
    }
});

// 更新轮播图
router.put('/slide/:id', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const slideId = req.params.id;
        const { title, link, order = 0, status = true } = req.body;

        // 获取原有轮播图信息
        const [files] = await pool.query('SELECT * FROM files WHERE id = ? AND type = "slide"', [slideId]);
        if (files.length === 0) {
            return res.status(404).json({ message: '轮播图不存在' });
        }

        let updateData = {
            metadata: JSON.stringify({ title, link, order, status })
        };

        // 如果上传了新图片
        if (req.file) {
            // 删除旧图片
            fs.unlink(files[0].path, (err) => {
                if (err) console.error('删除旧图片失败:', err);
            });

            updateData = {
                ...updateData,
                filename: req.file.filename,
                original_name: req.file.originalname,
                mime_type: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            };
        }

        // 更新数据库记录
        await pool.query(
            'UPDATE files SET ? WHERE id = ?',
            [updateData, slideId]
        );

        // 记录更新活动
        await pool.query(
            'INSERT INTO activities (type, description) VALUES (?, ?)',
            ['轮播图更新', `管理员 ${req.user.username} 更新了轮播图 ${title || '无标题'}`]
        );

        res.json({
            message: '轮播图更新成功',
            slide: {
                id: slideId,
                title,
                image_url: `/uploads/slides/${req.file ? req.file.filename : files[0].filename}`,
                link,
                order: parseInt(order),
                status: status === 'true' || status === true
            }
        });
    } catch (error) {
        console.error('更新轮播图失败:', error);
        res.status(500).json({ message: '更新轮播图失败: ' + error.message });
    }
});

// 删除轮播图
router.delete('/slide/:id', authenticateToken, async (req, res) => {
    try {
        const slideId = req.params.id;

        // 获取轮播图信息
        const [files] = await pool.query('SELECT * FROM files WHERE id = ? AND type = "slide"', [slideId]);
        if (files.length === 0) {
            return res.status(404).json({ message: '轮播图不存在' });
        }

        const file = files[0];
        const metadata = JSON.parse(file.metadata);

        // 删除物理文件
        fs.unlink(file.path, async (err) => {
            if (err) {
                console.error('删除轮播图文件失败:', err);
                return res.status(500).json({ message: '删除轮播图失败' });
            }

            // 从数据库中删除记录
            await pool.query('DELETE FROM files WHERE id = ?', [slideId]);

            // 记录删除活动
            await pool.query(
                'INSERT INTO activities (type, description) VALUES (?, ?)',
                ['轮播图删除', `管理员 ${req.user.username} 删除了轮播图 ${metadata.title || '无标题'}`]
            );

            res.json({ message: '轮播图删除成功' });
        });
    } catch (error) {
        console.error('删除轮播图失败:', error);
        res.status(500).json({ message: '删除轮播图失败: ' + error.message });
    }
});

// 上传单个文件
router.post('/file', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '请选择要上传的文件' });
        }
        
        // 记录文件信息到数据库
        const [result] = await pool.query(
            'INSERT INTO files (filename, original_name, mime_type, size, path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
            [
                req.file.filename,
                req.file.originalname,
                req.file.mimetype,
                req.file.size,
                req.file.path,
                req.user.id
            ]
        );
        
        // 记录上传活动
        await pool.query(
            'INSERT INTO activities (type, description) VALUES (?, ?)',
            ['文件上传', `管理员 ${req.user.username} 上传了文件 ${req.file.originalname}`]
        );
        
        res.json({
            message: '文件上传成功',
            file: {
                id: result.insertId,
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            }
        });
    } catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({ message: '文件上传失败: ' + error.message });
    }
});

// 获取文件列表
router.get('/files', authenticateToken, async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT f.*, a.username as uploader_name FROM files f LEFT JOIN admins a ON f.uploaded_by = a.id';
        let countQuery = 'SELECT COUNT(*) as total FROM files';
        
        if (category) {
            query += ' WHERE category = ?';
            countQuery += ' WHERE category = ?';
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        
        const [files] = await pool.query(query, category ? [category, parseInt(limit), offset] : [parseInt(limit), offset]);
        const [totalCount] = await pool.query(countQuery, category ? [category] : []);
        
        res.json({
            files,
            pagination: {
                total: totalCount[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount[0].total / limit)
            }
        });
    } catch (error) {
        console.error('获取文件列表失败:', error);
        res.status(500).json({ message: '获取文件列表失败: ' + error.message });
    }
});

// 删除文件
router.delete('/file/:id', authenticateToken, async (req, res) => {
    try {
        const fileId = req.params.id;
        
        // 获取文件信息
        const [files] = await pool.query('SELECT * FROM files WHERE id = ?', [fileId]);
        
        if (files.length === 0) {
            return res.status(404).json({ message: '文件不存在' });
        }
        
        const file = files[0];
        
        // 删除物理文件
        fs.unlink(file.path, async (err) => {
            if (err) {
                console.error('删除文件失败:', err);
                return res.status(500).json({ message: '删除文件失败' });
            }
            
            // 从数据库中删除记录
            await pool.query('DELETE FROM files WHERE id = ?', [fileId]);
            
            // 记录删除活动
            await pool.query(
                'INSERT INTO activities (type, description) VALUES (?, ?)',
                ['文件删除', `管理员 ${req.user.username} 删除了文件 ${file.original_name}`]
            );
            
            res.json({ message: '文件删除成功' });
        });
    } catch (error) {
        console.error('删除文件失败:', error);
        res.status(500).json({ message: '删除文件失败: ' + error.message });
    }
});

// 下载文件
router.get('/download/:id', authenticateToken, async (req, res) => {
    try {
        const fileId = req.params.id;
        
        // 获取文件信息
        const [files] = await pool.query('SELECT * FROM files WHERE id = ?', [fileId]);
        
        if (files.length === 0) {
            return res.status(404).json({ message: '文件不存在' });
        }
        
        const file = files[0];
        
        // 记录下载活动
        await pool.query(
            'INSERT INTO activities (type, description) VALUES (?, ?)',
            ['文件下载', `管理员 ${req.user.username} 下载了文件 ${file.original_name}`]
        );
        
        res.download(file.path, file.original_name);
    } catch (error) {
        console.error('文件下载失败:', error);
        res.status(500).json({ message: '文件下载失败: ' + error.message });
    }
});

module.exports = router;