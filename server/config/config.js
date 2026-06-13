// 配置环境变量
/*const PORT = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log('Server running on port: ${port}');
});*/
const port = process.env.PORT || 3000; 
app.listen(port, () => { 
    console.log(`Server running on port: ${port}`); 
});
/*const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

module.exports = {
    PORT,
    JWT_SECRET
};*/