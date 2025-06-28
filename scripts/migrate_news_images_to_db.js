// Node.js脚本：将uploads/news-images/下所有图片迁移到MySQL news_images表
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const mime = require('mime-types');

const UPLOAD_DIR = path.join(__dirname, '../uploads/news-images');

// 数据库连接配置
const db = mysql.createPool({
  host: 'localhost',
  user: 'root', // 修改为你的用户名
  password: 'islandture666capbrs', // 修改为你的密码
  database: 'school_db2',
  waitForConnections: true,
  connectionLimit: 10,
});

async function migrate() {
  const files = fs.readdirSync(UPLOAD_DIR).filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
  for (const file of files) {
    const filePath = path.join(UPLOAD_DIR, file);
    const fileData = fs.readFileSync(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    // news_id推断：如文件名格式为news-<timestamp>-<newsid>.jpg
    let newsId = null;
    const match = file.match(/news-\d+-(\d+)\./);
    if (match) newsId = parseInt(match[1], 10);
    // 插入数据库
    await db.query(
      'INSERT INTO news_images (news_id, image_name, file_data, mime_type) VALUES (?, ?, ?, ?)',
      [newsId, file, fileData, mimeType]
    );
    console.log(`迁移图片: ${file} (news_id: ${newsId || 'NULL'})`);
  }
  console.log('全部图片迁移完成！');
  process.exit(0);
}

migrate().catch(err => {
  console.error('迁移出错:', err);
  process.exit(1);
}); 