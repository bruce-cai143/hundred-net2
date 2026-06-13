const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取导航项列表
router.get('/', async (req, res) => {
    try {
        // 检查navigation_items表是否存在
        const [tables] = await pool.query(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'school_db2' AND TABLE_NAME = 'navigation_items'"
        );
        
        if (tables.length === 0) {
            // 如果表不存在，创建表
            console.log('navigation_items表不存在，正在创建...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS navigation_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,
                    url VARCHAR(255) NOT NULL,
                    sort_order INT DEFAULT 0,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('navigation_items表创建成功');
            
            // 添加默认导航项
            await pool.query(`
                INSERT INTO navigation_items (name, url, sort_order) VALUES 
                ('首页', '/', 1),
                ('新闻', '/news.html', 2),
                ('关于我们', '/about.html', 3),
                ('联系我们', '/contact.html', 4)
            `);
        }
        
        // 获取所有导航项
        const [items] = await pool.query('SELECT * FROM navigation_items ORDER BY sort_order ASC');
        res.json({ items });
    } catch (error) {
        console.error('获取导航项列表失败:', error);
        res.status(500).json({ message: '获取导航项列表失败: ' + error.message });
    }
});

// 添加导航项
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, url, sort_order, is_active } = req.body;
        
        if (!name || !url) {
            return res.status(400).json({ message: '导航项名称和链接不能为空' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO navigation_items (name, url, sort_order, is_active) VALUES (?, ?, ?, ?)',
            [name, url, sort_order || 0, is_active === undefined ? true : is_active]
        );
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'navigation', `添加了导航项：${name}`]
        );
        
        res.json({ 
            success: true, 
            message: '导航项添加成功',
            itemId: result.insertId 
        });
    } catch (error) {
        console.error('添加导航项失败:', error);
        res.status(500).json({ message: '添加导航项失败: ' + error.message });
    }
});

// 更新导航项
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const itemId = req.params.id;
        const { name, url, sort_order, is_active } = req.body;
        
        if (!name || !url) {
            return res.status(400).json({ message: '导航项名称和链接不能为空' });
        }
        
        const [result] = await pool.query(
            'UPDATE navigation_items SET name = ?, url = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [name, url, sort_order || 0, is_active === undefined ? true : is_active, itemId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '导航项不存在' });
        }
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'navigation', `更新了导航项：${name}`]
        );
        
        res.json({ success: true, message: '导航项更新成功' });
    } catch (error) {
        console.error('更新导航项失败:', error);
        res.status(500).json({ message: '更新导航项失败: ' + error.message });
    }
});

// 删除导航项
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const itemId = req.params.id;
        
        // 获取导航项名称用于活动记录
        const [item] = await pool.query('SELECT name FROM navigation_items WHERE id = ?', [itemId]);
        if (item.length === 0) {
            return res.status(404).json({ message: '导航项不存在' });
        }
        
        const [result] = await pool.query('DELETE FROM navigation_items WHERE id = ?', [itemId]);
        
        // 记录活动
        await pool.query(
            'INSERT INTO activities (user_id, type, description) VALUES (?, ?, ?)',
            [req.user.id, 'navigation', `删除了导航项：${item[0].name}`]
        );
        
        res.json({ success: true, message: '导航项删除成功' });
    } catch (error) {
        console.error('删除导航项失败:', error);
        res.status(500).json({ message: '删除导航项失败: ' + error.message });
    }
});

module.exports = router;