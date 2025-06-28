/**
 * 新闻路由
 * 支持新闻的基本CRUD操作以及图片上传、生成独立页面
 */
const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const ejs = require('ejs');

const router = express.Router();

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

const DEFAULT_COVER = '/assets/images/news-default.jpg';
function extractFirstImage(content) {
    if (!content) return null;
    const match = content.match(/<img[^>]+src=["']([^"'>]+)["']/i);
    return match ? match[1] : null;
}

// 获取新闻列表 (公开)
router.get('/', async (req, res) => {
    try {
        // 检查news表是否存在
        const [tables] = await pool.query(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'school_db2' AND TABLE_NAME = 'news'"
        );
        
        if (tables.length === 0) {
            // 如果表不存在，创建表
            console.log('news表不存在，正在创建...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS news (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    content TEXT,
                    category VARCHAR(50) NOT NULL DEFAULT '校园新闻',
                    author VARCHAR(50),
                    image_url VARCHAR(255),
                    page_path VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('news表创建成功');
            
            // 添加一些示例新闻
            await pool.query(`
                INSERT INTO news (title, content, category) VALUES 
                ('学校举办科技创新大赛', '为了培养学生的创新精神和实践能力，我校于上周举办了科技创新大赛...', '校园新闻'),
                ('2023年秋季招生公告', '2023年秋季招生工作即将开始，欢迎广大学子报考我校...', '通知公告'),
                ('教师节表彰大会', '在第39个教师节来临之际，学校举行了隆重的表彰大会，表彰优秀教师...', '校园新闻')
            `);
        }
        
        // 分页参数
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const category = req.query.category; 
        
        // 构建查询条件
        let queryCondition = '';
        const queryParams = [];
        
        if (category && category !== 'all') {
            queryCondition = ' WHERE category = ?';
            queryParams.push(category);
        }
        
        // 获取新闻总数
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM news' + queryCondition, queryParams);
        const total = countResult[0].total;
        
        // 获取分页新闻列表
        const [news] = await pool.query(
            'SELECT * FROM news' + queryCondition + ' ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [...queryParams, limit, offset]
        );
        
        // 为每条新闻添加cover字段
        for (let item of news) {
            // 优先news_images表第一张图片
            const [images] = await pool.query('SELECT * FROM news_images WHERE news_id = ? ORDER BY display_order LIMIT 1', [item.id]);
            if (images && images.length > 0) {
                item.cover = images[0].image_url || DEFAULT_COVER;
            } else {
                // 其次content里的图片
                const contentImg = extractFirstImage(item.content);
                if (contentImg) {
                    item.cover = contentImg;
                } else if (item.image_url) {
                    item.cover = item.image_url;
                } else {
                    item.cover = DEFAULT_COVER;
                }
            }
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

// 获取单条新闻 (公开)
router.get('/:id', async (req, res) => {
    try {
        const newsId = req.params.id;
        
        const [news] = await pool.query(
            'SELECT * FROM news WHERE id = ?',
            [newsId]
        );
        
        if (news.length === 0) {
            return res.status(404).json({ success: false, message: '新闻不存在' });
        }
        
        // 获取新闻相关的图片
        const [images] = await pool.query(
            'SELECT * FROM news_images WHERE news_id = ? ORDER BY display_order',
            [newsId]
        );
        
        const newsItem = news[0];
        newsItem.images = images || [];
        
        // 封面逻辑
        if (images && images.length > 0) {
            newsItem.cover = images[0].image_url || DEFAULT_COVER;
        } else {
            const contentImg = extractFirstImage(newsItem.content);
            if (contentImg) {
                newsItem.cover = contentImg;
            } else if (newsItem.image_url) {
                newsItem.cover = newsItem.image_url;
            } else {
                newsItem.cover = DEFAULT_COVER;
            }
        }
        
        res.json({ success: true, news: newsItem });
    } catch (error) {
        console.error('获取新闻详情失败:', error);
        res.status(500).json({ success: false, message: '获取新闻详情失败: ' + error.message });
    }
});

// 获取新闻列表 (管理员)
router.get('/admin/list', authenticateToken, async (req, res) => {
    try {
        // 分页参数
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // 获取新闻总数
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM news');
        const total = countResult[0].total;
        
        // 获取分页新闻列表
        const [news] = await pool.query(
            'SELECT * FROM news ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        
        // 获取每条新闻的图片
        for (let item of news) {
            const [images] = await pool.query(
                'SELECT * FROM news_images WHERE news_id = ? ORDER BY id',
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

// 添加新闻 (不包括图片上传)
router.post('/', authenticateToken, async (req, res) => {
    try {
        console.log('正在添加新闻...',req.body);
        const { title, content, category, author, image_url } = req.body;
        
        if (!title || !category) {
            return res.status(400).json({ success: false, message: '新闻标题和分类不能为空' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO news (title, content, category, author, image_url) VALUES (?, ?, ?, ?, ?)',
            [title, content || null, category, author || null, image_url || null]
        );
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'news', `添加了新闻：${title}`]
        );
        
        res.json({ 
            success: true, 
            message: '新闻添加成功', 
            newsId: result.insertId 
        });
    } catch (error) {
        console.error('添加新闻失败:', error);
        res.status(500).json({ success: false, message: '添加新闻失败: ' + error.message });
    }
});

// 添加新闻 (包含图片上传)
router.post('/with-images', authenticateToken, upload.array('images', 5), async (req, res) => {
    try {
        const { title, content, author, category } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ success: false, message: '新闻标题和内容不能为空' });
        }
        
        // 插入新闻记录 - 移除page_path字段
        const [result] = await pool.query(
            'INSERT INTO news (title, content, author, category) VALUES (?, ?, ?, ?)',
            [title, content, author || null, category || '校园新闻']
        );
        
        const newsId = result.insertId;
        
        // 处理上传的图片
        const uploadedImages = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const imagePath = `/uploads/news-images/${file.filename}`;
                const caption = req.body[`caption_${i}`] || '';
                
                // 插入图片记录 - 修复字段名
                const [imageResult] = await pool.query(
                    'INSERT INTO news_images (news_id, image_url, caption, display_order) VALUES (?, ?, ?, ?)',
                    [newsId, imagePath, caption, i]
                );
                
                uploadedImages.push({
                    id: imageResult.insertId,
                    path: imagePath,
                    caption
                });
            }
        }
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'news', `添加了新闻：${title}`]
        );
        
        res.json({ 
            success: true, 
            message: '新闻添加成功', 
            newsId: newsId,
            images: uploadedImages
        });
    } catch (error) {
        console.error('添加新闻失败:', error);
        res.status(500).json({ success: false, message: '添加新闻失败: ' + error.message });
    }
});

// 更新新闻
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const newsId = req.params.id;
        const { title, content, category, author, image_url } = req.body;
        
        if (!title || !category) {
            return res.status(400).json({ success: false, message: '新闻标题和分类不能为空' });
        }
        
        const [result] = await pool.query(
            'UPDATE news SET title = ?, content = ?, category = ?, author = ?, image_url = ? WHERE id = ?',
            [title, content || null, category, author || null, image_url || null, newsId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '新闻不存在' });
        }
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'news', `更新了新闻：${title}`]
        );
        
        res.json({ success: true, message: '新闻更新成功' });
    } catch (error) {
        console.error('更新新闻失败:', error);
        res.status(500).json({ success: false, message: '更新新闻失败: ' + error.message });
    }
});

// 更新新闻 (包含图片上传)
router.put('/:id/with-images', authenticateToken, upload.array('images', 5), async (req, res) => {
    try {
        const newsId = req.params.id;
        const { title, content, author, category } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ success: false, message: '新闻标题和内容不能为空' });
        }
        
        // 获取现有新闻信息
        const [existingNews] = await pool.query('SELECT * FROM news WHERE id = ?', [newsId]);
        
        if (existingNews.length === 0) {
            return res.status(404).json({ success: false, message: '新闻不存在' });
        }
        
        // 更新新闻记录
        await pool.query(
            'UPDATE news SET title = ?, content = ?, author = ?, category = ? WHERE id = ?',
            [title, content, author || null, category || '校园新闻', newsId]
        );
        
        // 获取现有图片
        const [existingImages] = await pool.query('SELECT * FROM news_images WHERE news_id = ?', [newsId]);
        
        // 处理上传的新图片
        const uploadedImages = [];
        if (req.files && req.files.length > 0) {
            const startOrder = existingImages.length;
            
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const imagePath = `/uploads/news-images/${file.filename}`;
                const caption = req.body[`caption_${i}`] || '';
                
                // 插入图片记录
                const [imageResult] = await pool.query(
                    'INSERT INTO news_images (news_id, image_url, caption, display_order) VALUES (?, ?, ?, ?)',
                    [newsId, imagePath, caption, startOrder + i]
                );
                
                uploadedImages.push({
                    id: imageResult.insertId,
                    path: imagePath,
                    caption
                });
            }
        }
        
        // 处理要删除的图片
        const deleteImageIds = req.body.delete_images ? JSON.parse(req.body.delete_images) : [];
        if (deleteImageIds.length > 0) {
            // 获取图片信息，以便删除文件
            const [imagesToDelete] = await pool.query(
                'SELECT * FROM news_images WHERE id IN (?)',
                [deleteImageIds]
            );
            
            // 删除图片文件
            for (const image of imagesToDelete) {
                const imagePath = path.join(__dirname, '..', image.image_url);
                try {
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                } catch (err) {
                    console.error('删除图片文件失败:', err);
                }
            }
            
            // 从数据库中删除图片记录
            await pool.query(
                'DELETE FROM news_images WHERE id IN (?)',
                [deleteImageIds]
            );
        }
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'news', `更新了新闻：${title}`]
        );
        
        res.json({ 
            success: true, 
            message: '新闻更新成功',
            newImages: uploadedImages
        });
    } catch (error) {
        console.error('更新新闻失败:', error);
        res.status(500).json({ success: false, message: '更新新闻失败: ' + error.message });
    }
});

// 删除新闻
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const newsId = req.params.id;
        
        // 获取新闻标题用于活动记录
        const [news] = await pool.query('SELECT title FROM news WHERE id = ?', [newsId]);
        if (news.length === 0) {
            return res.status(404).json({ success: false, message: '新闻不存在' });
        }
        
        // 获取相关图片
        const [images] = await pool.query('SELECT * FROM news_images WHERE news_id = ?', [newsId]);
        
        // 删除图片文件
        for (const image of images) {
            const imagePath = path.join(__dirname, '..', image.image_url);
            try {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            } catch (err) {
                console.error('删除图片文件失败:', err);
            }
        }
        
        // 删除图片记录
        await pool.query('DELETE FROM news_images WHERE news_id = ?', [newsId]);
        
        // 删除新闻记录
        const [result] = await pool.query('DELETE FROM news WHERE id = ?', [newsId]);
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'news', `删除了新闻：${news[0].title}`]
        );
        
        res.json({ success: true, message: '新闻删除成功' });
    } catch (error) {
        console.error('删除新闻失败:', error);
        res.status(500).json({ success: false, message: '删除新闻失败: ' + error.message });
    }
});

// 上传新闻图片
router.post('/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '未提供图片' });
        }
        
        const imagePath = `/uploads/news-images/${req.file.filename}`;
        
        res.json({ 
            success: true, 
            image: {
                url: imagePath,
                filename: req.file.filename
            }
        });
    } catch (error) {
        console.error('上传图片失败:', error);
        res.status(500).json({ success: false, message: '上传图片失败: ' + error.message });
    }
});

// 生成新闻页面
async function generateNewsPage(newsId, title, content, author, images) {
    try {
        // 获取模板文件
        const templatePath = path.join(__dirname, '../views/news-template.ejs');
        const template = await fs.promises.readFile(templatePath, 'utf8');
        
        // 渲染模板
        const html = ejs.render(template, {
            title,
            content,
            author: author || '管理员',
            date: new Date().toLocaleDateString('zh-CN'),
            images: images || []
        });
        
        // 获取新闻记录以获取page_path
        const [news] = await pool.query('SELECT page_path FROM news WHERE id = ?', [newsId]);
        
        if (news.length === 0) {
            throw new Error('新闻不存在');
        }
        
        let pagePath = news[0].page_path;
        
        // 如果没有page_path，创建一个新的
        if (!pagePath) {
            pagePath = `/news-pages/news-${newsId}-${Date.now()}.html`;
            await pool.query('UPDATE news SET page_path = ? WHERE id = ?', [pagePath, newsId]);
        }
        
        // 保存文件
        const filePath = path.join(__dirname, '..', pagePath);
        await fs.promises.writeFile(filePath, html);
        
        console.log(`新闻页面已生成: ${filePath}`);
        return pagePath;
    } catch (error) {
        console.error('生成新闻页面失败:', error);
        throw error;
    }
}

module.exports = router;