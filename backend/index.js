import 'bootstrap/dist/css/bootstrap.min.css';

// backend/index.js
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const cors    = require('cors');

const app = express();
const PORT = 3001;

// 注意路徑：假設你的 vessel 資料都放在 ./vessel
const vesselDir = path.join(__dirname, 'vessel');

app.use(cors());
app.use(express.json());

// 1) 列出全部分類（不含副檔名）
app.get('/vessel-files', (req, res) => {
  fs.readdir(vesselDir, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    const list = files
      .filter(f => f.endsWith('.js') || f.endsWith('.json'))
      .map(f => path.basename(f, path.extname(f)));
    res.json(list);
  });
});

// 2) 取得某個分類的船舶資料陣列
app.get('/vessels/:category', (req, res) => {
  try {
    // require 動態載入 .js 或 .json
    const data = require(path.join(vesselDir, req.params.category));
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: '資料格式必須是陣列' });
    }
    res.json(data);
  } catch (e) {
    res.status(404).json({ error: '找不到對應分類' });
  }
});

// 3) 驗證 endpoint（待前端呼叫）  
app.post('/validate', (req, res) => {
  const { vessel_info, data } = req.body;
  // TODO: 依需求做真正驗證，這裡僅 echo 回去
  return res.json({ vessel_info, received: data });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});