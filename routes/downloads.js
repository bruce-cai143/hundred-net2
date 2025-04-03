/**
 * 文件下载路由
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const db = require('../config/db');
const auth = require('../middleware/auth');

/**
 * 获取文件列表
 * GET /api/downloads
 */
router.get('/', async (req, res) => {
    try {
        const { category, search, limit = 12, offset = 0, sort = 'upload_date', order = 'DESC' } = req.query;
        
        let query = `SELECT id, title, description, file_name, file_path, file_size, mime_type, upload_date, download_count, category FROM files WHERE status = 1`;
        let countQuery = `SELECT COUNT(*) as total FROM files WHERE status = 1`;
        
        const queryParams = [];
        
        if (category && category !== 'all') {
            query += ' AND category = ?';
            countQuery += ' AND category = ?';
            queryParams.push(category);
        }
        
        if (search) {
            query += ' AND (title LIKE ? OR description LIKE ? OR file_name LIKE ?)';
            countQuery += ' AND (title LIKE ? OR description LIKE ? OR file_name LIKE ?)';
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }
        
        // 添加排序和分页
        query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const [files] = await db.query(query, queryParams);
        
        // 获取总数
        const countParams = queryParams.slice(0, queryParams.length - 2); // 移除limit和offset参数
        const [countResult] = await db.query(countQuery, countParams);
        
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
        const filePath = path.join(__dirname, '..', file.file_path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: '文件不存在于服务器' });
        }
        
        // 更新下载计数
        await db.query(
            'UPDATE files SET download_count = download_count + 1 WHERE id = ?',
            [id]
        );
        
        // 设置文件名
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.file_name)}"`);
        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        
        // 发送文件
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
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

module.exports = router;