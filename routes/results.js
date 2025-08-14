// routes/results.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '..', 'backend', 'results');

// 列出所有 JSON 檔案
router.get('/list', (req, res) => {
  fs.readdir(resultsDir, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    res.json(jsonFiles);
  });
});

// 更新指定 JSON 檔案
router.put('/:filename', (req, res) => {
  const filePath = path.join(resultsDir, decodeURIComponent(req.params.filename)); // 解碼檔案名稱
  console.log(`嘗試更新檔案：${filePath}`); // 調試用
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '檔案不存在' });
  }
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: '檔案內容缺失' });
  }
  fs.writeFile(filePath, JSON.stringify(content, null, 2), (err) => {
    if (err) return res.status(500).json({ error: '檔案更新失敗' });
    res.json({ message: '檔案更新成功' });
  });
});

// 新增 JSON 檔案
router.post('/', (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({ error: '檔案名稱或內容缺失' });
  }
  const filePath = path.join(resultsDir, filename);
  fs.writeFile(filePath, JSON.stringify(content, null, 2), (err) => {
    if (err) return res.status(500).json({ error: '檔案新增失敗' });
    res.status(201).json({ message: '檔案新增成功' });
  });
});

// 刪除指定 JSON 檔案
router.delete('/:filename', (req, res) => {
  const filePath = path.join(resultsDir, decodeURIComponent(req.params.filename)); // 解碼檔案名稱
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '檔案不存在' });
  }
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: '檔案刪除失敗' });
    res.json({ message: '檔案刪除成功' });
  });
});

// 讀取指定 JSON 檔案
router.get('/:filename', (req, res) => {
  const filePath = path.join(resultsDir, decodeURIComponent(req.params.filename)); // 解碼檔案名稱
  console.log(`嘗試讀取檔案：${filePath}`); // 調試用
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '檔案不存在' });
  }
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: '檔案讀取失敗' });
    res.json(JSON.parse(data));
  });
});

module.exports = router;