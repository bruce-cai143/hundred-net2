async function uploadFile(formData) {
    try {
        const response = await fetch('/api/uploads', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            alert('文件上传成功');
            loadDownloadList();
        } else {
            throw new Error('上传失败');
        }
    } catch (error) {
        console.error('上传文件失败:', error);
        alert('上传文件失败');
    }
}