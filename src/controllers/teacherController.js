/**
 * 青年委员会成员控制器
 * 处理所有与委员会成员相关的业务逻辑
 */
const Teacher = require('../models/teacher');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 获取所有委员会成员
exports.getTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find({})
            .sort({ order: 1, createdAt: -1 })
            .select('-__v');
        
        // 处理头像URL
        const teachersWithAvatarUrl = teachers.map(teacher => {
            const teacherObj = teacher.toObject();
            if (teacherObj.avatar) {
                teacherObj.avatarUrl = `/uploads/teachers/${teacherObj.avatar}`;
            } else {
                teacherObj.avatarUrl = '/images/default-avatar.png';
            }
            return teacherObj;
        });
        
        res.status(200).json({
            success: true,
            count: teachersWithAvatarUrl.length,
            data: teachersWithAvatarUrl
        });
    } catch (error) {
        console.error('获取委员会成员列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，获取委员会成员列表失败'
        });
    }
};

// 获取单个委员会成员
exports.getTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id).select('-__v');
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: '未找到该委员会成员'
            });
        }
        
        const teacherObj = teacher.toObject();
        if (teacherObj.avatar) {
            teacherObj.avatarUrl = `/uploads/teachers/${teacherObj.avatar}`;
        } else {
            teacherObj.avatarUrl = '/images/default-avatar.png';
        }
        
        res.status(200).json({
            success: true,
            data: teacherObj
        });
    } catch (error) {
        console.error('获取委员会成员详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，获取委员会成员详情失败'
        });
    }
};

// 添加委员会成员
exports.addTeacher = async (req, res) => {
    try {
        const { name, title, specialty, contact, introduction, status } = req.body;
        
        // 处理文件上传
        let avatar = '';
        if (req.file) {
            // 生成唯一文件名
            const fileExt = path.extname(req.file.originalname);
            avatar = `${uuidv4()}${fileExt}`;
            
            // 确保目录存在
            const uploadDir = path.join(__dirname, '../../public/uploads/teachers');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            // 移动文件
            fs.renameSync(
                req.file.path, 
                path.join(uploadDir, avatar)
            );
        }
        
        // 创建新记录
        const teacher = await Teacher.create({
            name,
            title,
            specialty,
            contact: contact || '',
            introduction: introduction || '',
            avatar,
            status: status === 'true' || status === true,
            order: 999 // 默认排序值
        });
        
        res.status(201).json({
            success: true,
            message: '添加委员会成员成功',
            data: teacher
        });
    } catch (error) {
        console.error('添加委员会成员失败:', error);
        // 清理可能已上传的文件
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: '服务器错误，添加委员会成员失败'
        });
    }
};

// 更新委员会成员
exports.updateTeacher = async (req, res) => {
    try {
        const { name, title, specialty, contact, introduction, status } = req.body;
        
        // 查找现有记录
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: '未找到该委员会成员'
            });
        }
        
        // 处理文件上传
        let avatar = teacher.avatar;
        if (req.file) {
            // 生成唯一文件名
            const fileExt = path.extname(req.file.originalname);
            const newAvatar = `${uuidv4()}${fileExt}`;
            
            // 确保目录存在
            const uploadDir = path.join(__dirname, '../../public/uploads/teachers');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            // 移动文件
            fs.renameSync(
                req.file.path, 
                path.join(uploadDir, newAvatar)
            );
            
            // 删除旧文件
            if (avatar && fs.existsSync(path.join(uploadDir, avatar))) {
                fs.unlinkSync(path.join(uploadDir, avatar));
            }
            
            avatar = newAvatar;
        }
        
        // 更新记录
        const updatedTeacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            {
                name,
                title,
                specialty,
                contact: contact || '',
                introduction: introduction || '',
                avatar,
                status: status === 'true' || status === true
            },
            { new: true, runValidators: true }
        );
        
        res.status(200).json({
            success: true,
            message: '更新委员会成员成功',
            data: updatedTeacher
        });
    } catch (error) {
        console.error('更新委员会成员失败:', error);
        // 清理可能已上传的文件
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: '服务器错误，更新委员会成员失败'
        });
    }
};

// 删除委员会成员
exports.deleteTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: '未找到该委员会成员'
            });
        }
        
        // 删除关联的头像文件
        if (teacher.avatar) {
            const avatarPath = path.join(
                __dirname, 
                '../../public/uploads/teachers', 
                teacher.avatar
            );
            
            if (fs.existsSync(avatarPath)) {
                fs.unlinkSync(avatarPath);
            }
        }
        
        // 删除数据库记录
        await Teacher.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            message: '删除委员会成员成功'
        });
    } catch (error) {
        console.error('删除委员会成员失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，删除委员会成员失败'
        });
    }
};

// 更新委员会成员排序
exports.updateTeachersOrder = async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: '无效的排序数据'
            });
        }
        
        // 批量更新
        const updatePromises = items.map((item) => {
            return Teacher.findByIdAndUpdate(
                item.id,
                { order: item.order },
                { new: true }
            );
        });
        
        await Promise.all(updatePromises);
        
        res.status(200).json({
            success: true,
            message: '更新排序成功'
        });
    } catch (error) {
        console.error('更新委员会成员排序失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，更新排序失败'
        });
    }
}; 