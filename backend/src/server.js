require('dotenv').config();
const express = require('express');
const { testConnection } = require('./configs/dbConnection');
const configCORS = require('./configs/configCORS');
const initApiRoutes = require('./Routes/apiRoutes');

// Kết nối thử DB
testConnection();

// Khởi tạo ứng dụng
const app = express();

//config for parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cấu hình CORS
configCORS(app);

// Khởi tạo các routes
initApiRoutes(app);

app.use((req, res, next) => {
    res.status(404).send('Sorry cant find that!');
});
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log('App is running on port: ' + PORT + ' -> http://localhost:' + PORT);
});
