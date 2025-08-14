import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

function ExcelUploader() {
  const [rows, setRows] = useState([]);
  const [uploadStatus, setUploadStatus] = useState([]);

  const transformToBackendFormat = (row) => ({
  vessel_name: row.vessel_name || '',
  imo: row.IMO || '',
  state: row.state || ''
});

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!(file instanceof Blob)) return;

    const reader = new FileReader();
reader.onload = (evt) => {
  try {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const json = XLSX.utils.sheet_to_json(sheet, {
      header: [
        'state',
        'estimate',
        'location',
        'vessel_name',
        'MT/KL',
        'pre_approval_trace',
        'remark',
        'IMO',
        'Call Sign'
      ],
      defval: ''
    });

    setRows(json); // ⛳ 先設定資料

    console.log('📦 匯入資料筆數：', json.length);

    // ✅ 批次非同步驗證（不等待、穩定回應）
    const requests = json.map((row) => {
  const payload = transformToBackendFormat(row); // ✅ 對應欄位名稱
  return axios
    .post('http://localhost:3001/validate', payload, { timeout: 5000 })
    .then((res) => ({ success: true, message: res.data.message }))
    .catch((err) => ({
      success: false,
      message: err.response?.data?.error || 'Error'
    }));
});



    Promise.allSettled(requests).then((results) => {
      const statusList = results.map((r) =>
        r.status === 'fulfilled' ? r.value : r.reason
      );
      setUploadStatus(statusList); // ✅ 成功或錯誤都收錄，穩定儲存
      console.log('✅ 批次驗證完成，共回傳：', statusList.length);
    });
  } catch (err) {
    console.error('❌ Excel 解析失敗：', err.message);
  }
};

    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>📤 上傳 Excel：</h3>
      <input type="file" accept=".xlsx,.xls" onChange={handleUpload} />

      {rows.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h4>📋 Excel 資料預覽：</h4>
          <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {Object.keys(rows[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
                <th>驗證結果</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((value, j) => (
                    <td key={j}>{value}</td>
                  ))}
                  <td style={{ color: uploadStatus[i]?.success ? 'green' : 'red' }}>
                    {uploadStatus[i]?.message || '⏳ 等待中'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ExcelUploader;