// routes/validate.js
const express = require('express');
const router = express.Router();
//const validateScheduledRows = require('../validators/scheduledOnly');

//-----------new------------
const path = require('path');
const fs = require('fs').promises;  // 改用 promises 版本
//------(UTC+8)時間戳記------
const { getTimestampFilename, toTaiwanTime } = require('../backend/utils/timestamp');
// 載入 vessel 資料庫
const vesselDatabase = JSON.parse(
   require('fs').readFileSync(path.join(__dirname, '..', 'backend', 'validate', 'database.json'), 'utf-8')
);

const resultsDir = path.join(__dirname, '..', 'backend', 'results');


(async () => {
  try {
    await fs.mkdir(resultsDir, { recursive: true });
  } catch (err) {
    console.error('建立 results 目錄失敗', err);
  }
})();

router.post('/', async (req, res) => {
  try {
    const { vessel_info, data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ success: false, error: '資料格式錯誤' });
    }

    const errors = [];

    const enhancedRows = data.map((row, idx) => {
      const imo = String(row.IMO || '').trim();
      const vessel = vesselDatabase.find(v => String(v.IMO).trim() === imo);

      if (vessel) {
        return {
          ...row,
          'Call Sign': vessel['Call Sign'],
          Flag: vessel.Flag,
          VN: vessel['Vessel Name'],
          validation_status: '✅ 核准作業'
        };
      } else {
        errors.push({
          rowId: `row-${idx + 1}`,
          message: `❌ IMO ${imo} 不存在於資料庫`
        });
        return {
          ...row,
          validation_status: '❌ IMO不存在'
        };
      }
    });

    const saveData = {
      vessel_info,
      data: enhancedRows,
      errors,
      timestamp: toTaiwanTime(new Date().toISOString())
    };

    const filename = getTimestampFilename(vessel_info.vessel_name || 'UNKNOWN');
    const filepath = path.join(resultsDir, filename);

    // 寫檔等待完成，catch 錯誤送錯誤訊息
    await fs.writeFile(filepath, JSON.stringify(saveData, null, 2));

    console.log(`結果已寫入 ${filename}`);

    res.json({
      success: true,
      data: enhancedRows,
      errors,
      message: `結果已成功寫入檔案：${filename}`
    });

  } catch (err) {
    console.error('驗證路由錯誤:', err);
    res.status(500).json({
      success: false,
      error: '伺服器內部錯誤',
      details: err.message
    });
  }
});

module.exports = router;