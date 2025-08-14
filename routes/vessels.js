// routes/vessels.js
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

// __dirname 是 routes 資料夾，往上跳一層到專案根，再進 backend/vessel
const vesselDir = path.join(__dirname, '..', 'backend', 'vessel');

// 列出所有分類
router.get('/vessel-files', (req, res) => {
  fs.readdir(vesselDir, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    const list = files
      .filter(f => f.endsWith('.js') || f.endsWith('.json'))
      .map(f => path.basename(f, path.extname(f)));
    res.json(list);
  });
});

// 取得指定分類的船舶資料
router.get('/vessels/:category', (req, res) => {
  try {
    const data = require(path.join(vesselDir, req.params.category));
    if (!Array.isArray(data)) throw new Error('資料格式錯誤：非陣列');
    res.json(data);
  } catch {
    res.status(404).json({ error: '找不到對應分類' });
  }
});

module.exports = router;