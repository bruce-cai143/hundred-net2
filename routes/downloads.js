/**
 * 文件下载与管理路由
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * 获取文件列表
 * GET /api/downloads
 */
router.get('/', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 12, offset = 0, sort = 'upload_date', order = 'DESC' } = req.query;
        const calculatedOffset = offset || (page - 1) * limit;
        
        let query = `SELECT id, title, description, file_name, original_name, file_path, file_size, size, path, mime_type, upload_date, download_count, category FROM files WHERE status = 1`;
        let countQuery = `SELECT COUNT(*) as total FROM files WHERE status = 1`;
        
        const queryParams = [];
        
        if (category && category !== 'all') {
            query += ' AND category = ?';
            countQuery += ' AND category = ?';
            queryParams.push(category);
        }
        
        if (search) {
            query += ' AND (title LIKE ? OR description LIKE ? OR file_name LIKE ? OR original_name LIKE ?)';
            countQuery += ' AND (title LIKE ? OR description LIKE ? OR file_name LIKE ? OR original_name LIKE ?)';
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        // 添加排序和分页
        query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), parseInt(calculatedOffset));
        
        const [files] = await db.query(query, queryParams);
        
        // 获取总数
        const countParams = queryParams.slice(0, queryParams.length - 2); // 移除limit和offset参数
        const [countResult] = await db.query(countQuery, countParams);
        
        // 格式化结果
        const formattedFiles = files.map(file => ({
            id: file.id,
            title: file.title,
            description: file.description,
            filename: file.file_name || file.original_name,
            size: file.file_size || file.size,
            uploadDate: file.upload_date || new Date(),
            path: file.file_path || file.path,
            downloadUrl: `/api/downloads/download/${file.id}`,
            mime_type: file.mime_type,
            download_count: file.download_count || 0,
            category: file.category
        }));
        
        res.json({
            success: true,
            files: formattedFiles,
            total: countResult[0].total,
            limit: parseInt(limit),
            offset: parseInt(calculatedOffset),
            pagination: {
                total: countResult[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('获取文件列表错误:', error);
        res.status(500).json({ success: false, message: '获取文件列表失败', error: error.message });
    }
});

/**
 * 获取单个文件信息
 * GET /api/downloads/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [files] = await db.query(
            'SELECT * FROM files WHERE id = ? AND status = 1',
            [id]
        );
        
        if (files.length === 0) {
            return res.status(404).json({ success: false, message: '文件不存在' });
        }
        
        res.json({ success: true, file: files[0] });
    } catch (error) {
        console.error('获取文件信息错误:', error);
        res.status(500).json({ success: false, message: '获取文件信息失败', error: error.message });
    }
});

/**
 * 下载文件
 * GET /api/downloads/download/:id
 */
router.get('/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [files] = await db.query(
            'SELECT * FROM files WHERE id = ? AND status = 1',
            [id]
        );
        
        if (files.length === 0) {
            return res.status(404).json({ success: false, message: '文件不存在' });
        }
        
        const file = files[0];
        const filePath = file.file_path || file.path;
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ success: false, message: '文件不存在于服务器' });
        }
        
        // 更新下载计数
        await db.query(
            'UPDATE files SET download_count = download_count + 1 WHERE id = ?',
            [id]
        );
        
        // 记录下载活动
        await db.query(
            'INSERT INTO activities (type, description) VALUES (?, ?)',
            ['文件下载', `用户下载了文件 ${file.file_name || file.original_name}`]
        );
        
        // 设置文件名
        const fileName = file.file_name || file.original_name;
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        
        // 发送文件
        res.download(fullPath, fileName);
    } catch (error) {
        console.error('下载文件错误:', error);
        res.status(500).json({ success: false, message: '下载文件失败', error: error.message });
    }
});

/**
 * 更新下载计数
 * POST /api/downloads/download/:id
 */
router.post('/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query(
            'UPDATE files SET download_count = download_count + 1 WHERE id = ?',
            [id]
        );
        
        res.json({ success: true, message: '下载计数已更新' });
    } catch (error) {
        console.error('更新下载计数错误:', error);
        res.status(500).json({ success: false, message: '更新下载计数失败', error: error.message });
    }
});

/**
 * 管理员上传公共下载文件
 */
router.post('/upload', authenticateToken, async (req, res) => {
    // 这个路由将由前端的文件上传功能处理
    // 管理员可以通过设置文件类别为'download'来将文件标记为公共下载文件
    res.status(501).json({ message: '请使用文件上传功能并将类别设置为"下载"' });
});

module.exports = router;