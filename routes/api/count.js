const express = require('express');
const router = express.Router();
const db = require('../../config/db');

// 获取新闻数量
router.get('/news', async (req, res) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as count FROM news');
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('获取新闻数量失败:', error);
        res.status(500).json({ error: '获取新闻数量失败' });
    }
});

// 获取轮播图数量
router.get('/slides', async (req, res) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as count FROM slides');
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('获取轮播图数量失败:', error);
        res.status(500).json({ error: '获取轮播图数量失败' });
    }
});

// 获取教师数量
router.get('/teachers', async (req, res) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as count FROM teachers');
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('获取教师数量失败:', error);
        res.status(500).json({ error: '获取教师数量失败' });
    }
});

// 获取上传文件数量
router.get('/uploads', async (req, res) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as count FROM files');
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('获取文件数量失败:', error);
        res.status(500).json({ error: '获取文件数量失败' });
    }
});

module.exports = router;