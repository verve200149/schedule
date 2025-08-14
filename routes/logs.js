//schedule_project/routes/logs.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const router = express.Router();

const logsDir = path.join(__dirname, '../backend/logs');
const logFilePath = path.join(logsDir, 'operations.log');
const resultsDir = path.join(__dirname, '../backend/results');

if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
if (!fs.existsSync(logFilePath)) fs.writeFileSync(logFilePath, '', 'utf8');
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

function writeLog(type, file, details) {
  const logEntry = `[${new Date().toISOString()}] [${type}] 文件: ${file || 'N/A'} - ${details}\n`;
  fs.appendFile(logFilePath, logEntry, 'utf8', (err) => {
    if (err) console.error('無法寫入日誌檔案：', err);
    else console.log('日誌已寫入：', logEntry.trim());
  });
}

const watcher = chokidar.watch(resultsDir, { persistent: true, ignoreInitial: true });
watcher
  .on('add', filePath => writeLog('addition', path.basename(filePath), ''))
  .on('unlink', filePath => writeLog('delete', path.basename(filePath), ''))
  .on('error', error => console.error('監控發生錯誤：', error));

// 讀取操作日誌
router.get('/', (_, res) => {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: '無法讀取操作日誌' });
    const logs = data
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const match = line.match(/^\[(.*?)\] \[(.*?)\] 文件: (.*?) - (.*)$/);
        return match ? {
          timestamp: match[1],
          type: match[2],
          file: match[3],
          details: match[4],
        } : null;
      })
      .filter(log => log !== null);
    res.json(logs);
  });
});

// 讀取單一檔案（並寫入讀取 log）
router.get('/results/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(resultsDir, filename);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: '找不到檔案' });

    // 檢查 log 是否已經有 [read] 紀錄
    fs.readFile(logFilePath, 'utf8', (logErr, logData) => {
      if (!logErr) {
        const alreadyRead = logData.split('\n').some(line =>
          line.includes(`[read] 文件: ${filename} `)
        );
        if (!alreadyRead) {
          writeLog('read', filename, '');
        }
      }
      res.status(200).json(JSON.parse(data));
    });
  });
});

// 列出所有檔案
router.get('/results', (req, res) => {
  fs.readdir(resultsDir, (err, files) => {
    if (err) return res.status(500).json({ error: '無法讀取 results 資料夾' });
    res.status(200).json({ files });
  });
});

// 新增檔案
router.post('/results', (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) return res.status(400).json({ error: '請提供文件名稱和內容' });
  const filePath = path.join(resultsDir, filename);
  fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8', err => {
    if (err) return res.status(500).json({ error: '無法寫入文件' });
    writeLog('addition', filename, '');
    res.status(201).json({ message: ` ${filename} 已成功新增` });
  });
});

// 修改檔案
router.put('/results/:filename', (req, res) => {
  const { filename } = req.params;
  const { content } = req.body;
  if (!filename || !content) return res.status(400).json({ error: '請提供文件名稱和內容' });
  const filePath = path.join(resultsDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: `文件 ${filename} 不存在` });

  fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8', err => {
    if (err) return res.status(500).json({ error: '無法修改文件' });

    // 只記錄第一次 update log
    fs.readFile(logFilePath, 'utf8', (logErr, logData) => {
      if (!logErr) {
        const alreadyUpdated = logData.split('\n').some(line =>
          line.includes(`[update] 文件: ${filename} `)
        );
        if (!alreadyUpdated) {
          writeLog('update', filename, '');
        }
      }
      res.status(200).json({ message: ` ${filename} 已修改` });
    });
  });
});

// 刪除檔案
router.delete('/results/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(resultsDir, filename);
  if (!filename) return res.status(400).json({ error: '請提供文件名稱' });
  fs.unlink(filePath, err => {
    if (err) return res.status(500).json({ error: '無法刪除文件' });
    writeLog('delete', filename, '');
    res.status(200).json({ message: ` ${filename} 已刪除` });
  });
});

module.exports = router;