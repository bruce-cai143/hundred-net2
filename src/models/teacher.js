/**
 * 青年委员会成员模型
 * 定义委员会成员的数据结构和验证规则
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeacherSchema = new Schema({
    // 姓名
    name: {
        type: String,
        required: [true, '姓名不能为空'],
        trim: true,
        maxlength: [50, '姓名不能超过50个字符']
    },
    
    // 职称/职务
    title: {
        type: String,
        required: [true, '职务不能为空'],
        trim: true,
        maxlength: [100, '职务不能超过100个字符']
    },
    
    // 专业/专长
    specialty: {
        type: String,
        required: [true, '专业/专长不能为空'],
        trim: true,
        maxlength: [200, '专业/专长不能超过200个字符']
    },
    
    // 联系方式
    contact: {
        type: String,
        trim: true,
        maxlength: [100, '联系方式不能超过100个字符']
    },
    
    // 简介
    introduction: {
        type: String,
        trim: true,
        maxlength: [1000, '简介不能超过1000个字符']
    },
    
    // 头像
    avatar: {
        type: String,
        default: ''
    },
    
    // 状态: 启用/禁用
    status: {
        type: Boolean,
        default: true
    },
    
    // 排序值
    order: {
        type: Number,
        default: 999
    }
}, {
    timestamps: true,
    versionKey: false
});

// 索引
TeacherSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model('Teacher', TeacherSchema); 