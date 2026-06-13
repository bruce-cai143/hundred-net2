/**
 * 媒体文件管理路由
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const db = require('../config/db');
const auth = require('../middleware/auth');

// 创建上传目录
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 为分类创建子目录
const categoryDirs = ['documents', 'images', 'videos', 'audio', 'other'];
categoryDirs.forEach(dir => {
    const categoryPath = path.join(uploadDir, dir);
    if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
    }
});

// 配置multer存储
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        let uploadPath = uploadDir;
        
        // 根据文件类型选择子目录
        const fileType = file.mimetype.split('/')[0];
        switch(fileType) {
            case 'image':
                uploadPath = path.join(uploadDir, 'images');
                break;
            case 'video':
                uploadPath = path.join(uploadDir, 'videos');
                break;
            case 'audio':
                uploadPath = path.join(uploadDir, 'audio');
                break;
            case 'application':
                if (file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) {
                    uploadPath = path.join(uploadDir, 'documents');
                } else {
                    uploadPath = path.join(uploadDir, 'other');
                }
                break;
            default:
                uploadPath = path.join(uploadDir, 'other');
        }
        
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB限制
    fileFilter: function(req, file, cb) {
        // 允许的文件类型
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'));
        }
    }
});

// 判断文件类型是否为图片
function isImage(mimetype) {
    return mimetype.startsWith('image/');
}

/**
 * 上传文件
 * POST /api/media/upload
 */
router.post('/upload', auth.requireAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '未上传文件' });
        }

        const fileData = await promisify(fs.readFile)(req.file.path);
        const isImageFile = isImage(req.file.mimetype);
        const tableName = isImageFile ? 'images' : 'files';
        
        // 准备插入数据库的数据
        const fileInfo = {
            title: req.body.title || req.file.originalname,
            description: req.body.description || '',
            file_name: req.file.originalname,
            file_data: fileData,
            file_size: req.file.size,
            file_type: path.extname(req.file.originalname).substring(1) || 'unknown',
            category: req.body.category || 'uncategorized',
            uploader_id: req.session.admin ? req.session.admin.id : null
        };
        
        // 如果是图片，添加宽高信息
        if (isImageFile) {
            // 这里可以添加获取图片宽高的代码
            // 例如使用sharp库: const dimensions = await sharp(req.file.path).metadata();
            // fileInfo.width = dimensions.width;
            // fileInfo.height = dimensions.height;
        } else {
            // 如果是文件，添加下载计数
            fileInfo.download_count = 0;
        }
        
        // 插入数据库
        const [result] = await db.query(`INSERT INTO ${tableName} SET ?`, [fileInfo]);
        
        // 删除临时文件
        await promisify(fs.unlink)(req.file.path);
        
        res.json({
            success: true,
            message: '文件上传成功',
            fileId: result.insertId,
            fileName: req.file.originalname,
            isImage: isImageFile
        });
    } catch (error) {
        console.error('文件上传错误:', error);
        res.status(500).json({ success: false, message: '文件上传失败', error: error.message });
    }
});

/**
 * 文件管理页面上传文件
 * POST /api/media/file-upload
 */
router.post('/file-upload', auth.authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '请选择要上传的文件' });
        }

        const { title, category, description } = req.body;
        
        // 使用原始文件名作为标题（如果未提供）
        const fileTitle = title || req.file.originalname;
        
        // 根据文件类型确定类别
        let fileCategory = category || 'other';
        if (!category) {
            const mimeType = req.file.mimetype.split('/')[0];
            switch (mimeType) {
                case 'image':
                    fileCategory = 'image';
                    break;
                case 'video':
                    fileCategory = 'video';
                    break;
                case 'audio':
                    fileCategory = 'audio';
                    break;
                case 'application':
                    if (req.file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) {
                        fileCategory = 'document';
                    }
                    break;
            }
        }

        // 记录文件信息到数据库
        const [result] = await db.query(
            'INSERT INTO files (filename, original_name, mime_type, size, path, category) VALUES (?, ?, ?, ?, ?, ?)',
            [
                req.file.filename,
                req.file.originalname,
                req.file.mimetype,
                req.file.size,
                req.file.path,
                fileCategory
            ]
        );

        res.json({
            success: true,
            message: '文件上传成功',
            file: {
                id: result.insertId,
                title: fileTitle,
                filename: req.file.filename,
                original_name: req.file.originalname,
                mime_type: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                category: fileCategory,
                created_at: new Date()
            }
        });
    } catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({ success: false, message: '文件上传失败: ' + error.message });
    }
});

/**
 * 获取文件列表
 * GET /api/media/files
 */
router.get('/files', async (req, res) => {
    try {
        const { category, search, limit = 20, offset = 0, sort = 'created_at', order = 'DESC' } = req.query;
        
        let query = 'SELECT * FROM files';
        let countQuery = 'SELECT COUNT(*) as total FROM files';
        
        const queryParams = [];
        
        if (category && category !== 'all') {
            query += ' WHERE category = ?';
            countQuery += ' WHERE category = ?';
            queryParams.push(category);
        }
        
        if (search) {
            const whereClause = category && category !== 'all' ? ' AND' : ' WHERE';
            query += `${whereClause} (filename LIKE ? OR original_name LIKE ?)`;
            countQuery += `${whereClause} (filename LIKE ? OR original_name LIKE ?)`;
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm);
        }
        
        // 添加排序和分页
        query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const [files] = await db.query(query, queryParams);
        const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));
        
        res.json({
            success: true,
            files,
            total: countResult[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('获取文件列表错误:', error);
        res.status(500).json({ success: false, message: '获取文件列表失败', error: error.message });
    }
});

/**
 * 获取图片列表
 * GET /api/media/images
 */
router.get('/images', async (req, res) => {
    try {
        const { category, limit = 20, offset = 0, sort = 'created_at', order = 'DESC' } = req.query;
        
        let query = 'SELECT id, filename, original_name, mime_type, size, path, category, created_at FROM files WHERE category = "image"';
        let countQuery = 'SELECT COUNT(*) as total FROM files WHERE category = "image"';
        
        const queryParams = [];
        
        if (category && category !== 'uncategorized') {
            query += ' AND category = ?';
            countQuery += ' AND category = ?';
            queryParams.push(category);
        }
        
        // 添加排序和分页
        query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const [images] = await db.query(query, queryParams);
        const [countResult] = await db.query(countQuery, category && category !== 'uncategorized' ? [category] : []);
        
        res.json({
            success: true,
            images,
            total: countResult[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('获取图片列表错误:', error);
        res.status(500).json({ success: false, message: '获取图片列表失败', error: error.message });
    }
});

/**
 * 获取单个文件信息
 * GET /api/media/file/:id
 */
router.get('/file/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { type = 'file' } = req.query;
        
        const tableName = type === 'image' ? 'files' : 'files';
        
        const [files] = await db.query(
            `SELECT id, filename, original_name, mime_type, size, path, category, created_at FROM ${tableName} WHERE id = ? AND category = ?`,
            [id, type === 'image' ? 'image' : 'file']
        );
        
        if (files.length === 0) {
            return res.status(404).json({ success: false, message: '文件不存在' });
        }
        
        res.json({
            success: true,
            file: files[0]
        });
    } catch (error) {
        console.error('获取文件信息错误:', error);
        res.status(500).json({ success: false, message: '获取文件信息失败', error: error.message });
    }
});

/**
 * 获取单个图片
 * GET /api/media/images/:id
 */
router.get('/images/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [images] = await db.query(
            'SELECT id, filename, original_name, mime_type, path, category, created_at FROM files WHERE id = ? AND category = "image"',
            [id]
        );
        
        if (images.length === 0) {
            return res.status(404).json({ success: false, message: '图片不存在' });
        }
        
        const image = images[0];
        
        // 检查文件是否存在
        if (!fs.existsSync(image.path)) {
            return res.status(404).json({ success: false, message: '图片文件不存在' });
        }
        
        // 设置响应头
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp'
        };
        
        // 从mime_type或original_name推断文件类型
        let fileType = 'jpeg';
        if (image.mime_type) {
            const mimeParts = image.mime_type.split('/');
            if (mimeParts.length > 1) {
                fileType = mimeParts[1];
            }
        } else if (image.original_name) {
            const ext = image.original_name.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                fileType = ext;
            }
        }
        
        const contentType = mimeTypes[fileType] || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 缓存1年
        
        // 发送图片文件
        res.sendFile(image.path);
    } catch (error) {
        console.error('获取图片错误:', error);
        res.status(500).json({ success: false, message: '获取图片失败', error: error.message });
    }
});

/**
 * 下载文件
 * GET /api/media/download/:id
 */
router.get('/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [files] = await db.query(
            'SELECT id, filename, original_name, mime_type, path FROM files WHERE id = ?',
            [id]
        );
        
        if (files.length === 0) {
            return res.status(404).json({ success: false, message: '文件不存在' });
        }
        
        const file = files[0];
        
        // 检查文件是否存在
        if (!fs.existsSync(file.path)) {
            return res.status(404).json({ success: false, message: '文件不存在' });
        }
        
        // 设置响应头
        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
        
        // 发送文件
        res.sendFile(file.path);
    } catch (error) {
        console.error('文件下载错误:', error);
        res.status(500).json({ success: false, message: '文件下载失败', error: error.message });
    }
});

/**
 * 删除文件
 * DELETE /api/media/:id
 */
router.delete('/:id', auth.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 获取文件信息
        const [files] = await db.query('SELECT path FROM files WHERE id = ?', [id]);
        
        if (files.length === 0) {
            return res.status(404).json({ success: false, message: '文件不存在' });
        }
        
        const file = files[0];
        
        // 删除物理文件
        if (fs.existsSync(file.path)) {
            await promisify(fs.unlink)(file.path);
        }
        
        // 删除数据库记录
        await db.query('DELETE FROM files WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: '文件删除成功'
        });
    } catch (error) {
        console.error('文件删除错误:', error);
        res.status(500).json({ success: false, message: '文件删除失败', error: error.message });
    }
});

module.exports = router;