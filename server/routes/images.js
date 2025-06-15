const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const db = require('../../config/database');

// 获取单个图片
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            'SELECT file_data, mime_type FROM images WHERE id = ?',
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).send('Image not found');
        }

        const image = rows[0];
        res.setHeader('Content-Type', image.mime_type);
        res.send(image.file_data);
    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).send('Server error');
    }
});

// 获取图片列表（不包含文件数据）
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            'SELECT id, name, original_path, mime_type, file_size, upload_date, category FROM images'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching images list:', error);
        res.status(500).send('Server error');
    }
});

// 初始化导入所有图片
async function importAllImages() {
    try {
        const assetsDir = path.join(__dirname, '../../assets');
        
        async function processDirectory(dir) {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    await processDirectory(fullPath);
                } else {
                    // 检查是否为图片文件
                    const ext = path.extname(entry.name).toLowerCase();
                    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
                        const fileData = await fs.readFile(fullPath);
                        const relativePath = path.relative(assetsDir, fullPath);
                        const mimeType = {
                            '.png': 'image/png',
                            '.jpg': 'image/jpeg',
                            '.jpeg': 'image/jpeg',
                            '.gif': 'image/gif',
                            '.webp': 'image/webp'
                        }[ext];
                        
                        // 检查图片是否已存在
                        const [existing] = await db.promise().query(
                            'SELECT id FROM images WHERE original_path = ?',
                            [relativePath]
                        );
                        
                        if (existing.length === 0) {
                            await db.promise().query(
                                'INSERT INTO images (name, original_path, file_data, mime_type, file_size) VALUES (?, ?, ?, ?, ?)',
                                [entry.name, relativePath, fileData, mimeType, fileData.length]
                            );
                            console.log(`Imported: ${relativePath}`);
                        }
                    }
                }
            }
        }
        
        await processDirectory(path.join(assetsDir, 'images'));
        console.log('Image import completed successfully');
    } catch (error) {
        console.error('Error importing images:', error);
    }
}

// 导出路由和导入函数
module.exports = {
    router,
    importAllImages
};