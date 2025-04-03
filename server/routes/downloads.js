/**
 * 下载管理路由
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('../../config/db');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

/**
 * 获取下载文件列表
 */
router.get('/', async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        // 构建查询
        let query = `
            SELECT f.*
            FROM files f 
            WHERE f.category = 'download'
        `;
        
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM files 
            WHERE category = 'download'
        `;
        
        // 执行查询（使用 id 作为排序字段，因为它一定存在）
        const [files] = await pool.query(query + ' ORDER BY f.id DESC LIMIT ? OFFSET ?', [parseInt(limit), offset]);
        const [totalCount] = await pool.query(countQuery);
        
        // 格式化结果
        const formattedFiles = files.map(file => ({
            id: file.id,
            filename: file.original_name,
            size: file.size,
            uploadDate: new Date(), // 临时使用当前时间
            path: file.path,
            downloadUrl: `/api/downloads/file/${file.id}`,
            uploader: 'Unknown' // 由于我们暂时移除了 uploader_name，这里设置一个默认值
        }));
        
        res.json({
            files: formattedFiles,
            pagination: {
                total: totalCount[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount[0].total / limit)
            }
        });
    } catch (error) {
        console.error('获取下载文件列表失败:', error);
        res.status(500).json({ message: '获取下载文件列表失败: ' + error.message });
    }
});

/**
 * 下载指定文件
 */
router.get('/file/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        
        // 获取文件信息
        const [files] = await pool.query('SELECT * FROM files WHERE id = ?', [fileId]);
        
        if (files.length === 0) {
            return res.status(404).json({ message: '文件不存在' });
        }
        
        const file = files[0];
        
        // 检查文件是否存在
        if (!fs.existsSync(file.path)) {
            return res.status(404).json({ message: '文件不存在或已被删除' });
        }
        
        // 记录下载活动
        await pool.query(
            'INSERT INTO activities (type, description) VALUES (?, ?)',
            ['文件下载', `用户下载了文件 ${file.original_name}`]
        );
        
        // 更新下载次数（如果需要）
        // await pool.query('UPDATE files SET download_count = download_count + 1 WHERE id = ?', [fileId]);
        
        // 发送文件
        res.download(file.path, file.original_name);
    } catch (error) {
        console.error('文件下载失败:', error);
        res.status(500).json({ message: '文件下载失败: ' + error.message });
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