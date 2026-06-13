/**
 * 初始化测试数据脚本
 */
const db = require('../config/db');

async function initTestData() {
    try {
        console.log('开始初始化测试数据...');
        
        // 插入测试新闻
        const testNews = [
            {
                title: '百人计划2024春季学期开学典礼',
                content: '3月1日，实外西区百人计划2024春季学期开学典礼隆重举行。校长肖明华为全体师生做了精彩的开学演讲，鼓励同学们在新学期里继续保持学习热情，勇攀高峰。',
                category: '校园活动',
                author: '学校办公室'
            },
            {
                title: '百人计划学生在全国数学竞赛中获佳绩',
                content: '在近日举行的全国中学生数学竞赛中，我校百人计划的学生表现出色，共有15名学生获得省级以上奖项，其中包括3名全国一等奖，5名全国二等奖。',
                category: '学生成就',
                author: '教务处'
            },
            {
                title: '百人计划教师团队赴北京参加教育研讨会',
                content: '2月15日至18日，百人计划教师团队赴北京参加了为期四天的全国中学教育创新研讨会。我校教师在会上分享了百人计划的教育理念和实践经验，获得了与会专家的高度评价。',
                category: '教师发展',
                author: '教研处'
            },
            {
                title: '百人计划开展科技创新实践活动',
                content: '为培养学生的创新精神和实践能力，百人计划组织开展了为期一周的科技创新实践活动。学生们在老师的指导下，完成了多个创新项目，展现了良好的科学素养。',
                category: '校园活动',
                author: '科技组'
            },
            {
                title: '百人计划学生参加国际交流活动',
                content: '我校百人计划的学生代表参加了与新加坡友好学校的国际交流活动。通过此次活动，学生们不仅提高了英语水平，还了解了不同文化背景下的教育理念。',
                category: '国际交流',
                author: '国际部'
            }
        ];
        
        for (const news of testNews) {
            await db.query(
                'INSERT INTO news (title, content, category, author) VALUES (?, ?, ?, ?)',
                [news.title, news.content, news.category, news.author]
            );
        }
        console.log('✅ 测试新闻数据插入完成');
        
        // 插入测试教师数据（青年委员会成员）
        const testTeachers = [
            {
                name: '张明华',
                title: '青年委员会主席',
                department: '数学组',
                introduction: '资深数学教师，具有丰富的教学经验和科研能力。'
            },
            {
                name: '李小红',
                title: '青年委员会副主席',
                department: '语文组',
                introduction: '优秀语文教师，擅长文学创作和古典文学研究。'
            },
            {
                name: '王建国',
                title: '青年委员会委员',
                department: '物理组',
                introduction: '物理学科带头人，在实验教学方面有独特见解。'
            },
            {
                name: '陈美丽',
                title: '青年委员会委员',
                department: '英语组',
                introduction: '英语教学专家，具有丰富的国际交流经验。'
            }
        ];
        
        for (const teacher of testTeachers) {
            await db.query(
                'INSERT INTO teachers (name, title, department, introduction) VALUES (?, ?, ?, ?)',
                [teacher.name, teacher.title, teacher.department, teacher.introduction]
            );
        }
        console.log('✅ 测试教师数据插入完成');
        
        // 插入测试活动记录
        const testActivities = [
            {
                type: '新闻发布',
                description: '发布了新闻：百人计划2024春季学期开学典礼'
            },
            {
                type: '文件上传',
                description: '上传了教学资料：数学竞赛试题集'
            },
            {
                type: '图片上传',
                description: '上传了校园活动照片：开学典礼现场'
            },
            {
                type: '教师管理',
                description: '添加了青年委员会成员：张明华'
            },
            {
                type: '系统维护',
                description: '更新了系统设置：优化了页面加载速度'
            }
        ];
        
        for (const activity of testActivities) {
            await db.query(
                'INSERT INTO activities (type, description) VALUES (?, ?)',
                [activity.type, activity.description]
            );
        }
        console.log('✅ 测试活动数据插入完成');
        
        // 插入测试文件数据
        const testFiles = [
            {
                filename: 'math-competition-2024.pdf',
                original_name: '数学竞赛试题集2024.pdf',
                mime_type: 'application/pdf',
                size: 2048576,
                path: '/uploads/documents/math-competition-2024.pdf',
                category: '教学资料'
            },
            {
                filename: 'admission-guide-2024.docx',
                original_name: '2024年招生简章.docx',
                mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: 1536000,
                path: '/uploads/documents/admission-guide-2024.docx',
                category: '招生简章'
            },
            {
                filename: 'school-notice-2024.pdf',
                original_name: '学校通知公告2024.pdf',
                mime_type: 'application/pdf',
                size: 512000,
                path: '/uploads/documents/school-notice-2024.pdf',
                category: '通知公告'
            }
        ];
        
        for (const file of testFiles) {
            await db.query(
                'INSERT INTO files (filename, original_name, mime_type, size, path, category) VALUES (?, ?, ?, ?, ?, ?)',
                [file.filename, file.original_name, file.mime_type, file.size, file.path, file.category]
            );
        }
        console.log('✅ 测试文件数据插入完成');
        
        console.log('🎉 所有测试数据初始化完成！');
        
    } catch (error) {
        console.error('初始化测试数据失败:', error);
    } finally {
        process.exit(0);
    }
}

// 运行初始化
initTestData(); 