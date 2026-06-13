/**
 * 青年委员会成员（教师）相关路由
 * 负责处理与青年委员会成员相关的API请求
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/teachers');
        // 确保目录存在
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'teacher-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 限制5MB
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("只支持图片文件上传!"));
    }
});

// 获取所有委员会成员
router.get('/teachers', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const teachers = await db.collection('teachers').find({}).toArray();
        
        // 处理头像URL，确保是完整路径
        teachers.forEach(teacher => {
            if (teacher.avatar && !teacher.avatar.startsWith('http') && !teacher.avatar.startsWith('/')) {
                teacher.avatar = '/uploads/teachers/' + teacher.avatar;
            }
        });
        
        res.json(teachers);
    } catch (error) {
        console.error('获取委员会成员失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取单个委员会成员
router.get('/teachers/:id', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { ObjectId } = require('mongodb');
        const teacherId = new ObjectId(req.params.id);
        
        const teacher = await db.collection('teachers').findOne({ _id: teacherId });
        
        if (!teacher) {
            return res.status(404).json({ message: '未找到该成员' });
        }
        
        res.json(teacher);
    } catch (error) {
        console.error('获取委员会成员详情失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 添加委员会成员 (需要管理员权限)
router.post('/teachers', authenticateToken, requireAdmin, upload.single('avatar'), async (req, res) => {
    try {
        const { name, title, description } = req.body;
        
        if (!name || !title) {
            return res.status(400).json({ message: '姓名和职位为必填项' });
        }
        
        const db = req.app.locals.db;
        const newTeacher = {
            name,
            title,
            description: description || '',
            avatar: req.file ? path.basename(req.file.path) : '/img/default-avatar.jpg',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection('teachers').insertOne(newTeacher);
        newTeacher._id = result.insertedId;
        
        res.status(201).json(newTeacher);
    } catch (error) {
        console.error('添加委员会成员失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 更新委员会成员 (需要管理员权限)
router.put('/teachers/:id', authenticateToken, requireAdmin, upload.single('avatar'), async (req, res) => {
    try {
        const { name, title, description } = req.body;
        const { ObjectId } = require('mongodb');
        const teacherId = new ObjectId(req.params.id);
        
        if (!name || !title) {
            return res.status(400).json({ message: '姓名和职位为必填项' });
        }
        
        const db = req.app.locals.db;
        
        // 获取现有成员信息
        const existingTeacher = await db.collection('teachers').findOne({ _id: teacherId });
        
        if (!existingTeacher) {
            return res.status(404).json({ message: '未找到该成员' });
        }
        
        // 如果上传了新头像，删除旧头像
        if (req.file && existingTeacher.avatar && !existingTeacher.avatar.includes('default-avatar')) {
            try {
                const oldAvatarPath = path.join(__dirname, '../../public/uploads/teachers', existingTeacher.avatar);
                if (fs.existsSync(oldAvatarPath)) {
                    fs.unlinkSync(oldAvatarPath);
                }
            } catch (err) {
                console.error('删除旧头像失败:', err);
            }
        }
        
        const updateData = {
            name,
            title,
            description: description || '',
            updatedAt: new Date()
        };
        
        // 只有在上传了新头像时才更新头像字段
        if (req.file) {
            updateData.avatar = path.basename(req.file.path);
        }
        
        await db.collection('teachers').updateOne(
            { _id: teacherId },
            { $set: updateData }
        );
        
        // 获取更新后的数据
        const updatedTeacher = await db.collection('teachers').findOne({ _id: teacherId });
        
        res.json(updatedTeacher);
    } catch (error) {
        console.error('更新委员会成员失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 删除委员会成员 (需要管理员权限)
router.delete('/teachers/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ObjectId } = require('mongodb');
        const teacherId = new ObjectId(req.params.id);
        
        const db = req.app.locals.db;
        
        // 获取成员信息，以便删除头像文件
        const teacher = await db.collection('teachers').findOne({ _id: teacherId });
        
        if (!teacher) {
            return res.status(404).json({ message: '未找到该成员' });
        }
        
        // 删除头像文件
        if (teacher.avatar && !teacher.avatar.includes('default-avatar')) {
            try {
                const avatarPath = path.join(__dirname, '../../public/uploads/teachers', teacher.avatar);
                if (fs.existsSync(avatarPath)) {
                    fs.unlinkSync(avatarPath);
                }
            } catch (err) {
                console.error('删除头像文件失败:', err);
            }
        }
        
        // 从数据库中删除记录
        await db.collection('teachers').deleteOne({ _id: teacherId });
        
        res.json({ message: '成员已成功删除' });
    } catch (error) {
        console.error('删除委员会成员失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router; 