/**
 * 认证中间件
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');

/**
 * 验证JWT令牌
 */
const authenticateToken = (req, res, next) => {
    // 检查会话中是否存在管理员信息
    if (!req.session || !req.session.admin) {
        return res.status(401).json({ message: '未登录或会话已过期' });
    }

    // 将管理员信息添加到请求对象
    req.user = req.session.admin;
    next();
};

/**
 * 验证管理员权限
 */
const requireAdmin = (req, res, next) => {
    // 检查会话中是否存在管理员信息
    if (!req.session || !req.session.admin) {
        return res.status(403).json({ message: '需要管理员权限' });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin
};