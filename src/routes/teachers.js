/**
 * 青年委员会成员管理API路由
 * 提供委员会成员的添加、查询、更新和删除功能
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');
const TeacherModel = require('../models/teacher');

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
        const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
    fileFilter: function(req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件!'));
        }
    }
});

/**
 * @route GET /api/teachers
 * @desc 获取所有委员会成员
 * @access Public
 */
router.get('/', async (req, res) => {
    try {
        const teachers = await TeacherModel.find().sort({ order: 1, createdAt: -1 });
        
        // 处理头像URL路径
        const processedTeachers = teachers.map(teacher => {
            const teacherObj = teacher.toObject();
            if (teacherObj.avatar) {
                teacherObj.avatar = `/uploads/teachers/${teacherObj.avatar}`;
            }
            return teacherObj;
        });
        
        res.json({
            success: true,
            data: processedTeachers
        });
    } catch (error) {
        console.error('获取委员会成员列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取委员会成员列表失败'
        });
    }
});

/**
 * @route GET /api/teachers/:id
 * @desc 获取单个委员会成员
 * @access Public
 */
router.get('/:id', async (req, res) => {
    try {
        const teacher = await TeacherModel.findById(req.params.id);
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: '委员会成员不存在'
            });
        }
        
        const teacherObj = teacher.toObject();
        if (teacherObj.avatar) {
            teacherObj.avatar = `/uploads/teachers/${teacherObj.avatar}`;
        }
        
        res.json({
            success: true,
            data: teacherObj
        });
    } catch (error) {
        console.error('获取委员会成员详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取委员会成员详情失败'
        });
    }
});

/**
 * @route POST /api/teachers
 * @desc 添加委员会成员
 * @access Admin
 */
router.post('/', requireAdmin, upload.single('avatar'), async (req, res) => {
    try {
        const { name, title, specialty, contact, introduction } = req.body;
        const status = req.body.status === 'true' || req.body.status === '1';
        
        // 验证必填字段
        if (!name || !title || !specialty) {
            return res.status(400).json({
                success: false,
                message: '请提供完整的委员会成员信息'
            });
        }
        
        // 创建记录
        const newTeacher = new TeacherModel({
            name,
            title,
            specialty,
            contact: contact || '',
            introduction: introduction || '',
            status,
            avatar: req.file ? path.basename(req.file.path) : '',
            order: 999 // 默认排序值
        });
        
        await newTeacher.save();
        
        // 记录活动
        logActivity(req.session.adminId, '添加委员会成员', `添加了委员会成员: ${name}`);
        
        res.status(201).json({
            success: true,
            message: '委员会成员添加成功',
            data: newTeacher
        });
    } catch (error) {
        console.error('添加委员会成员失败:', error);
        res.status(500).json({
            success: false,
            message: '添加委员会成员失败'
        });
    }
});

/**
 * @route PUT /api/teachers/:id
 * @desc 更新委员会成员
 * @access Admin
 */
router.put('/:id', requireAdmin, upload.single('avatar'), async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { name, title, specialty, contact, introduction } = req.body;
        const status = req.body.status === 'true' || req.body.status === '1';
        
        // 查找委员记录
        const teacher = await TeacherModel.findById(teacherId);
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: '委员会成员不存在'
            });
        }
        
        // 验证必填字段
        if (!name || !title || !specialty) {
            return res.status(400).json({
                success: false,
                message: '请提供完整的委员会成员信息'
            });
        }
        
        // 准备更新数据
        const updateData = {
            name,
            title,
            specialty,
            contact: contact || '',
            introduction: introduction || '',
            status
        };
        
        // 如果上传了新头像
        if (req.file) {
            // 删除旧头像
            if (teacher.avatar) {
                const oldAvatarPath = path.join(__dirname, '../../public/uploads/teachers', teacher.avatar);
                if (fs.existsSync(oldAvatarPath)) {
                    fs.unlinkSync(oldAvatarPath);
                }
            }
            
            // 保存新头像
            updateData.avatar = path.basename(req.file.path);
        }
        
        // 更新记录
        const updatedTeacher = await TeacherModel.findByIdAndUpdate(
            teacherId,
            updateData,
            { new: true }
        );
        
        // 记录活动
        logActivity(req.session.adminId, '更新委员会成员', `更新了委员会成员: ${name}`);
        
        res.json({
            success: true,
            message: '委员会成员更新成功',
            data: updatedTeacher
        });
    } catch (error) {
        console.error('更新委员会成员失败:', error);
        res.status(500).json({
            success: false,
            message: '更新委员会成员失败'
        });
    }
});

/**
 * @route DELETE /api/teachers/:id
 * @desc 删除委员会成员
 * @access Admin
 */
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const teacherId = req.params.id;
        
        // 查找委员记录
        const teacher = await TeacherModel.findById(teacherId);
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: '委员会成员不存在'
            });
        }
        
        // 删除头像文件
        if (teacher.avatar) {
            const avatarPath = path.join(__dirname, '../../public/uploads/teachers', teacher.avatar);
            if (fs.existsSync(avatarPath)) {
                fs.unlinkSync(avatarPath);
            }
        }
        
        // 删除记录
        await TeacherModel.findByIdAndDelete(teacherId);
        
        // 记录活动
        logActivity(req.session.adminId, '删除委员会成员', `删除了委员会成员: ${teacher.name}`);
        
        res.json({
            success: true,
            message: '委员会成员删除成功'
        });
    } catch (error) {
        console.error('删除委员会成员失败:', error);
        res.status(500).json({
            success: false,
            message: '删除委员会成员失败'
        });
    }
});

/**
 * @route PUT /api/teachers/order
 * @desc 更新委员会成员排序
 * @access Admin
 */
router.put('/order', requireAdmin, async (req, res) => {
    try {
        const { orders } = req.body;
        
        if (!orders || !Array.isArray(orders)) {
            return res.status(400).json({
                success: false,
                message: '无效的排序数据'
            });
        }
        
        // 批量更新排序
        for (const item of orders) {
            await TeacherModel.findByIdAndUpdate(item.id, { order: item.order });
        }
        
        // 记录活动
        logActivity(req.session.adminId, '更新委员会成员排序', '更新了委员会成员的显示顺序');
        
        res.json({
            success: true,
            message: '委员会成员排序更新成功'
        });
    } catch (error) {
        console.error('更新委员会成员排序失败:', error);
        res.status(500).json({
            success: false,
            message: '更新委员会成员排序失败'
        });
    }
});

module.exports = router; 