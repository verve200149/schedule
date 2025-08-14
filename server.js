const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// 1. 檢查 results 資料夾
const resultsDir = path.join(__dirname, 'backend', 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
  console.log(`[INFO] results 資料夾不存在，已自動創建: ${resultsDir}`);
} else {
  console.log(`[INFO] results 資料夾已存在: ${resultsDir}`);
}

// 日誌檔案的路徑
const logFilePath = path.join(__dirname, 'backend', 'logs', 'operations.log');

// 檢查 operations.log 是否存在，如果不存在則創建一個空文件
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, '', 'utf8'); // 創建一個空的 operations.log 文件
  console.log(`[INFO] operations.log 文件不存在，已自動創建: ${logFilePath}`);
} else {
  console.log(`[INFO] operations.log 文件已存在: ${logFilePath}`);
}

// 2. 載入路由
console.log('[INFO] 正在載入路由...');
const resultsRoute = require('./routes/results');    // /results 路由
const validateRoute = require('./routes/validate');  // /validate 路由
const vesselsRoute = require('./routes/vessels');    // /vessel-files, /vessels/:category 路由
const logsRouter = require('./routes/logs');         // /logs 路由
console.log('[INFO] 路由載入完成');

// 3. 中介軟體
console.log('[INFO] 設置中介軟體...');
app.use(cors());
app.use(express.json());
console.log('[INFO] 中介軟體設置完成');

// 4. 掛載路由
console.log('[INFO] 掛載路由...');
app.use('/results', resultsRoute);      // 結果查詢
console.log('[INFO] 已掛載路由: /results');
app.use('/validate', validateRoute);    // 驗證
console.log('[INFO] 已掛載路由: /validate');
app.use('/', vesselsRoute);             // 船舶分類與清單
console.log('[INFO] 已掛載路由: /');
app.use('/logs', logsRouter);           // 日誌
console.log('[INFO] 已掛載路由: /logs');

// 5. 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 後端已啟動：http://localhost:${PORT}`);
  console.log('[INFO] 伺服器啟動成功，正在監聽請求...');
});