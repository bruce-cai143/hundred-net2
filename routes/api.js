const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 更新team.html页面
router.post('/update-team-html', authenticateToken, (req, res) => {
    try {
        const { html } = req.body;
        
        if (!html) {
            return res.status(400).json({ message: '页面内容不能为空' });
        }
        
        // 确定team.html文件的路径（相对于项目根目录）
        const teamHtmlPath = path.join(__dirname, '..', 'team.html');
        
        // 备份原文件
        const backupPath = path.join(__dirname, '..', 'backups');
        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupPath, `team.html.${timestamp}.bak`);
        
        if (fs.existsSync(teamHtmlPath)) {
            fs.copyFileSync(teamHtmlPath, backupFile);
        }
        
        // 写入新内容
        fs.writeFileSync(teamHtmlPath, html, 'utf8');
        
        res.json({ success: true, message: '青年委员会页面更新成功' });
    } catch (error) {
        console.error('更新团队页面失败:', error);
        res.status(500).json({ message: '更新团队页面失败: ' + error.message });
    }
});

module.exports = router; 