const path = require('path');
const fs = require('fs');
const axios = require('axios');

/**
 * 导入媒体文件到数据库的脚本
 * 使用方法: node scripts/import-media.js
 */
async function importMediaToDatabase() {
    try {
        console.log('开始导入媒体文件到数据库...');
        
        // 调用API导入媒体文件
        const response = await axios.post('http://localhost:3000/api/media/import');
        
        console.log('导入结果:', response.data);
        console.log(`总共处理了 ${response.data.summary.totalFiles} 个文件`);
        console.log(`成功导入 ${response.data.summary.importedImages} 张图片`);
        console.log(`成功导入 ${response.data.summary.importedOtherFiles} 个其他文件`);
        
        if (response.data.summary.errors > 0) {
            console.warn(`导入过程中有 ${response.data.summary.errors} 个错误`);
        }
        
        console.log(`导入过程耗时 ${response.data.summary.duration} 秒`);
        console.log('媒体文件导入完成！');
    } catch (error) {
        console.error('导入媒体文件失败:', error.response?.data || error.message);
    }
}

// 执行导入
importMediaToDatabase();