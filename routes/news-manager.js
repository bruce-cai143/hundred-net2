/**
 * 新闻管理路由
 * 支持新闻上传、图片上传、生成独立页面
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const db = require('../config/db');
const auth = require('../middleware/auth');
const ejs = require('ejs');

// 创建新闻图片上传目录
const newsImagesDir = path.join(__dirname, '../uploads/news-images');
if (!fs.existsSync(newsImagesDir)) {
    fs.mkdirSync(newsImagesDir, { recursive: true });
}

// 创建新闻页面目录
const newsPagesDir = path.join(__dirname, '../news-pages');
if (!fs.existsSync(newsPagesDir)) {
    fs.mkdirSync(newsPagesDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, newsImagesDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'news-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB限制
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

/**
 * 获取新闻列表 (管理员)
 * GET /api/news-manager
 */
router.get('/', auth.requireAdmin, async (req, res) => {
    try {
        // 分页参数
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // 获取新闻总数
        const [countResult] = await db.query('SELECT COUNT(*) as total FROM news');
        const total = countResult[0].total;
        
        // 获取分页新闻列表
        const [news] = await db.query(
            'SELECT * FROM news ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        
        // 获取每条新闻的图片
        for (let item of news) {
            const [images] = await db.query(
                'SELECT * FROM news_images WHERE news_id = ? ORDER BY display_order',
                [item.id]
            );
            item.images = images;
        }
        
        res.json({
            success: true,
            news,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('获取新闻列表失败:', error);
        res.status(500).json({ success: false, message: '获取新闻列表失败: ' + error.message });
    }
});

/**
 * 添加新闻 (包含图片上传)
 * POST /api/news-manager
 */
router.post('/', auth.requireAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const { title, content, author } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ success: false, message: '新闻标题和内容不能为空' });
        }
        
        // 生成页面路径 (使用标题的拼音或英文名称更好，这里简化处理)
        const pageName = `news-${Date.now()}.html`;
        const pagePath = `/news-pages/${pageName}`;
        
        // 插入新闻记录
        const [result] = await db.query(
            'INSERT INTO news (title, content, author, page_path) VALUES (?, ?, ?, ?)',
            [title, content, author || null, pagePath]
        );
        
        const newsId = result.insertId;
        
        // 处理上传的图片
        const uploadedImages = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const imagePath = `/uploads/news-images/${file.filename}`;
                const caption = req.body[`caption_${i}`] || '';
                
                // 插入图片记录
                const [imageResult] = await db.query(
                    'INSERT INTO news_images (news_id, image_path, caption, display_order) VALUES (?, ?, ?, ?)',
                    [newsId, imagePath, caption, i]
                );
                
                uploadedImages.push({
                    id: imageResult.insertId,
                    path: imagePath,
                    caption
                });
            }
        }
        
        // 生成新闻页面
        await generateNewsPage(newsId, title, content, author, uploadedImages);
        
        res.json({ 
            success: true, 
            message: '新闻添加成功', 
            newsId: newsId,
            pagePath: pagePath,
            images: uploadedImages
        });
    } catch (error) {
        console.error('添加新闻失败:', error);
        res.status(500).json({ success: false, message: '添加新闻失败: ' + error.message });
    }
});

/**
 * 更新新闻
 * PUT /api/news-manager/:id
 */
router.put('/:id', auth.requireAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const newsId = req.params.id;
        const { title, content, author } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ success: false, message: '新闻标题和内容不能为空' });
        }
        
        // 获取现有新闻信息
        const [existingNews] = await db.query('SELECT * FROM news WHERE id = ?', [newsId]);
        
        if (existingNews.length === 0) {
            return res.status(404).json({ success: false, message: '新闻不存在' });
        }
        
        // 更新新闻记录
        await db.query(
            'UPDATE news SET title = ?, content = ?, author = ? WHERE id = ?',
            [title, content, author || null, newsId]
        );
        
        // 获取现有图片
        const [existingImages] = await db.query('SELECT * FROM news_images WHERE news_id = ?', [newsId]);
        
        // 处理上传的新图片
        const uploadedImages = [];
        if (req.files && req.files.length > 0) {
            const startOrder = existingImages.length;
            
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const imagePath = `/uploads/news-images/${file.filename}`;
                const caption = req.body[`caption_${i}`] || '';
                
                // 插入图片记录
                const [imageResult] = await db.query(
                    'INSERT INTO news_images (news_id, image_path, caption, display_order) VALUES (?, ?, ?, ?)',
                    [newsId, imagePath, caption, startOrder + i]
                );
                
                uploadedImages.push({
                    id: imageResult.insertId,
                    path: imagePath,
                    caption
                });
            }
        }
        
        // 合并所有图片
        const allImages = [...existingImages, ...uploadedImages];
        
        // 重新生成新闻页面
        await generateNewsPage(newsId, title, content, author, allImages);
        
        res.json({ 
            success: true, 
            message: '新闻更新成功',
            images: uploadedImages
        });
    } catch (error) {
        console.error('更新新闻失败:', error);
        res.status(500).json({ success: false, message: '更新新闻失败: ' + error.message });
    }
});

/**
 * 删除新闻图片
 * DELETE /api/news-manager/image/:id
 */
router.delete('/image/:id', auth.requireAdmin, async (req, res) => {
    try {
        const imageId = req.params.id;
        
        // 获取图片信息
        const [images] = await db.query('SELECT * FROM news_images WHERE id = ?', [imageId]);
        
        if (images.length === 0) {
            return res.status(404).json({ success: false, message: '图片不存在' });
        }
        
        const image = images[0];
        const newsId = image.news_id;
        
        // 删除图片文件
        const imagePath = path.join(__dirname, '..', image.image_path);
        if (fs.existsSync(imagePath)) {
            await promisify(fs.unlink)(imagePath);
        }
        
        // 删除数据库记录
        await db.query('DELETE FROM news_images WHERE id = ?', [imageId]);
        
        // 获取新闻信息
        const [newsItems] = await db.query('SELECT * FROM news WHERE id = ?', [newsId]);
        
        if (newsItems.length > 0) {
            const news = newsItems[0];
            
            // 获取剩余图片
            const [remainingImages] = await db.query('SELECT * FROM news_images WHERE news_id = ? ORDER BY display_order', [newsId]);
            
            // 重新生成新闻页面
            await generateNewsPage(newsId, news.title, news.content, news.author, remainingImages);
        }
        
        res.json({ success: true, message: '图片删除成功' });
    } catch (error) {
        console.error('删除图片失败:', error);
        res.status(500).json({ success: false, message: '删除图片失败: ' + error.message });
    }
});

/**
 * 删除新闻
 * DELETE /api/news-manager/:id
 */
router.delete('/:id', auth.requireAdmin, async (req, res) => {
    try {
        const newsId = req.params.id;
        
        // 获取新闻信息
        const [news] = await db.query('SELECT * FROM news WHERE id = ?', [newsId]);
        
        if (news.length === 0) {
            return res.status(404).json({ success: false, message: '新闻不存在' });
        }
        
        // 获取相关图片
        const [images] = await db.query('SELECT * FROM news_images WHERE news_id = ?', [newsId]);
        
        // 删除图片文件
        for (const image of images) {
            const imagePath = path.join(__dirname, '..', image.image_path);
            if (fs.existsSync(imagePath)) {
                await promisify(fs.unlink)(imagePath);
            }
        }
        
        // 删除新闻页面文件
        const pageName = news[0].page_path.split('/').pop();
        const pagePath = path.join(__dirname, '..', 'news-pages', pageName);
        if (fs.existsSync(pagePath)) {
            await promisify(fs.unlink)(pagePath);
        }
        
        // 删除数据库记录 (由于外键约束，删除新闻会自动删除相关图片记录)
        await db.query('DELETE FROM news WHERE id = ?', [newsId]);
        
        res.json({ success: true, message: '新闻删除成功' });
    } catch (error) {
        console.error('删除新闻失败:', error);
        res.status(500).json({ success: false, message: '删除新闻失败: ' + error.message });
    }
});

/**
 * 生成新闻页面
 */
async function generateNewsPage(newsId, title, content, author, images) {
    try {
        // 获取新闻信息
        const [newsItems] = await db.query('SELECT * FROM news WHERE id = ?', [newsId]);
        if (newsItems.length === 0) return;
        
        const news = newsItems[0];
        const pageName = news.page_path.split('/').pop();
        
        // 读取模板
        const templatePath = path.join(__dirname, '../views/news-template.ejs');
        let template;
        
        if (fs.existsSync(templatePath)) {
            template = await promisify(fs.readFile)(templatePath, 'utf8');
        } else {
            // 如果模板不存在，使用默认模板
            template = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %> - 学校新闻</title>
    <link rel="stylesheet" href="/styles/main.css">
    <link rel="stylesheet" href="/styles/news.css">
    <style>
        .news-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .news-title {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .news-meta {
            color: #666;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .news-content {
            line-height: 1.6;
        }
        .news-images {
            margin: 20px 0;
        }
        .news-image {
            margin-bottom: 15px;
        }
        .news-image img {
            max-width: 100%;
            height: auto;
        }
        .news-image-caption {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>学校新闻</h1>
            <nav>
                <ul>
                    <li><a href="/">首页</a></li>
                    <li><a href="/news.html">新闻列表</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="news-container">
        <article>
            <h1 class="news-title"><%= title %></h1>
            <div class="news-meta">
                <% if (author) { %>作者: <%= author %> | <% } %>
                发布时间: <%= formatDate(created_at) %>
            </div>
            
            <% if (images && images.length > 0) { %>
            <div class="news-images">
                <% images.forEach(function(image) { %>
                <div class="news-image">
                    <img src="<%= image.image_path %>" alt="<%= image.caption || title %>">
                    <% if (image.caption) { %>
                    <div class="news-image-caption"><%= image.caption %></div>
                    <% } %>
                </div>
                <% }); %>
            </div>
            <% } %>
            
            <div class="news-content">
                <%- content %>
            </div>
        </article>
    </main>

    <footer>
        <div class="container">
            <p>&copy; <%= new Date().getFullYear() %> 学校. 保留所有权利.</p>
        </div>
    </footer>

    <script src="/scripts/main.js"></script>
</body>
</html>
            `;
            
            // 保存模板以便将来使用
            const viewsDir = path.join(__dirname, '../views');
            if (!fs.existsSync(viewsDir)) {
                fs.mkdirSync(viewsDir, { recursive: true });
            }
            await promisify(fs.writeFile)(templatePath, template, 'utf8');
        }
        
        // 渲染模板
        const html = ejs.render(template, {
            title,
            content,
            author,
            images,
            created_at: news.created_at,
            formatDate: function(date) {
                return new Date(date).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        });
        
        // 保存生成的HTML文件
        const outputPath = path.join(__dirname, '../news-pages', pageName);
        await promisify(fs.writeFile)(outputPath, html, 'utf8');
        
        return outputPath;
    } catch (error) {
        console.error('生成新闻页面失败:', error);
        throw error;
    }
}

module.exports = router;