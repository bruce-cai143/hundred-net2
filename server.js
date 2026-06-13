const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { PORT } = require('./config/config');
const { testDatabaseConnection, initDatabase, checkAndUpdateTables } = require('./db/init');

// 立即初始化数据库
(async () => {
    try {
        await initDatabase();
        console.log('数据库初始化完成');
    } catch (error) {
        console.error('数据库初始化失败:', error);
        process.exit(1);
    }
})();

// 导入路由
const newsRoutes = require('./routes/news');
const slidesRoutes = require('./routes/slides');
const teachersRoutes = require('./routes/teachers');
const uploadRoutes = require('./routes/upload');
const activitiesRoutes = require('./routes/activities');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const navigationRoutes = require('./routes/navigation');
const downloadsRoutes = require('./routes/downloads');
const mediaRoutes = require('./routes/media');
const countRoutes = require('./routes/api/count');
const apiRoutes = require('./routes/api');

// 创建Express应用
const app = express();
exports.app = app;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置会话中间件
app.use(session({
    secret: 'your-secret-key', // 用于签名会话ID cookie
    resave: false, // 不强制保存会话
    saveUninitialized: false, // 不保存未初始化的会话
    cookie: {
        secure: process.env.NODE_ENV === 'production', // 在生产环境中使用 HTTPS
        httpOnly: true, // 防止客户端访问 cookie
        maxAge: null // 会话 cookie，关闭浏览器后过期
    }
}));

// 配置静态资源
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

// 添加根路径处理，确保能访问到根目录的index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 添加其他HTML页面的路由处理
app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/gallery.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'gallery.html'));
});

app.get('/team.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'team.html'));
});

app.get('/download.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'download.html'));
});

app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/news.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'news.html'));
});

app.get('/news-list.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'news-list.html'));
});

// 注册路由
app.use('/api/news', newsRoutes);
app.use('/api/slides', slidesRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', apiRoutes);

// 配置静态资源
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/activities', activitiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/downloads', downloadsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/count', countRoutes);

// 添加主 JavaScript 文件的路由
app.get('/js/main.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'scripts', 'main.js'));
});

// 启动服务器前初始化数据库
(async () => {
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
        await initDatabase();
        // 检查并更新表结构
        await checkAndUpdateTables();
        
        // 启动服务器
        let currentPort = PORT;
        const maxRetries = 10;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                await new Promise((resolve, reject) => {
                    const server = app.listen(currentPort, () => {
                        console.log(`服务器运行在 http://localhost:${currentPort}`);
                        resolve();
                    }).on('error', (err) => {
                        if (err.code === 'EADDRINUSE') {
                            console.log(`端口 ${currentPort} 已被占用，尝试使用端口 ${currentPort + 1}`);
                            currentPort++;
                            reject(err);
                        } else {
                            console.error('启动服务器失败:', err);
                            reject(err);
                        }
                    });
                });
                break; // 如果成功启动，跳出循环
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) {
                    console.error(`无法找到可用端口，已尝试端口 ${PORT} 到 ${currentPort}`);
                    process.exit(1);
                }
            }
        }
    } else {
        console.error('无法连接到数据库，服务器将退出');
        process.exit(1);
    }
})();