import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import VesselCard from './components/VesselCard';
import ErrorSummaryTable from './components/ErrorSummaryTable';
import './App.css';
import { validateRows } from './utils/validateRows';
import { GiCargoShip } from 'react-icons/gi';

const API_BASE = 'http://localhost:3001';

function App() {
  // 分類、船舶、表單資料、Excel 解析與驗證結果
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [vessels, setVessels] = useState([]);
  const [formData, setFormData] = useState({ vessel_name: '', imo: '', email: '', flag: '' });
  const [excelRows, setExcelRows] = useState([]);
  const [uploadStatus, setUploadStatus] = useState([]);
  const [result, setResult] = useState(null);

  // 1. 載入分類
  useEffect(() => {
    axios.get(`${API_BASE}/vessel-files`)
      .then(res => {
        setCategories(res.data);
        if (res.data.length) setSelectedCat(res.data[0]);
      })
      .catch(console.error);
  }, []);

  // 2. 選分類後載入船舶
  useEffect(() => {
    if (!selectedCat) return setVessels([]);
    axios.get(`${API_BASE}/vessels/${selectedCat}`)
      .then(res => setVessels(res.data))
      .catch(console.error);
  }, [selectedCat]);

  // 選擇單筆船舶
  const handleVesselSelect = idx => {
    const v = vessels[idx];
    if (!v) return;
    setFormData({
      vessel_name: v['Vessel Name'],
      imo: v.IMO,
      call_sign: v['Call Sign'],
      email: v.Contact,
      flag: v.Flag
    });
    setResult(null);
  };

  // 上傳並解析 Excel
  const handleUpload = e => {
    if (!formData.vessel_name) {
      alert('請先選擇船舶清單');
      e.target.value = null;  // 清除檔案選擇
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return alert('請先選擇 Excel 檔案');
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, {
          header: [
            'state', 'estimate', 'location', 'vessel_name', 'MT/KL',
            'pre_approval_trace', 'remark', 'IMO', 'Call Sign'
          ],
          defval: ''
        });
        // 找到 "已聯絡" 標題行索引
        const idx = rows.findIndex(row => row.state && row.state.includes('CONTACKT'));
        const effectiveRows = idx === -1 ? [] : rows.slice(idx + 1);
        // **轉換日期欄位**
      effectiveRows.forEach(row => {
        if (row.estimate && !isNaN(row.estimate)) {
          row.estimate = excelDateToMMDD(row.estimate); // 使用日期轉換工具
        }
      });
        // 針對有效資料做驗證
        const { statusList, enhancedRows } = await validateRows(effectiveRows, formData);

        setExcelRows(enhancedRows);
        setUploadStatus(statusList);
        setResult(null);
      } catch (err) {
        console.error(err);
        alert('Excel 上傳失敗');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 清除 Excel 上傳狀態
  const handleClearUpload = () => {
    setExcelRows([]);
    setUploadStatus([]);
    setResult(null);
    document.querySelector('input[type="file"]').value = null;
  };

  // 送後端驗證
  const sendForValidation = async () => {
    if (!formData.imo) return alert('未填漁船imo');
    if (!excelRows.length) return alert('請先上傳 Excel 並本地驗證');
    try {
      const payload = { vessel_info: formData, data: excelRows };
      const { data } = await axios.post(`${API_BASE}/validate`, payload);

      // 把船舶小卡資料一起放入後端回傳結果
      const combinedResult = {
        ...data,
        vessel_info: formData,
      };

      setResult(combinedResult);
    } catch (err) {
      console.error(err);
      alert('後端驗證失敗：' + (err.response?.data?.error || err.message));
    }
  };

  // 工具：Excel 日期→MM/DD
  const excelDateToMMDD = v => {
    if (!v || isNaN(v)) return '';
    const d = new Date((v - 25569) * 86400 * 1000);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  // 工具：預報／批准狀態
  const getApprovalStatus = t => {
    const lower = (t || '').toLowerCase();
    if (/appd|approval/.test(lower)) return '✅ 已批准';
    if (/rept|report/.test(lower)) return '📤 已預報';
    return '⏳ 尚未預報';
  };

  return (
    <div className="container py-4 shadow-sm">
      <h2 className="mb-4" style={{ display: 'flex', alignItems: 'center' }}>
        <GiCargoShip style={{ fontSize: '1.5em', marginRight: '0.15em', marginBottom: '0.15em' }} />
        船舶預報資料上傳驗證器
      </h2>

      {/* 上半段：分類與船舶下拉、船舶資訊卡片（左右排列） */}
      <div className="row align-items-start">
        {/* 分類下拉 */}
        <div className="col-sm-6">
          {/* 分類 */}
          <div className="mb-6 row align-items-center">
            <label className="col-sm-1 col-form-label">洋區</label>
            <div className="col-sm-10">
              <select
                className="form-select"
                value={selectedCat}
                onChange={e => {
                  setSelectedCat(e.target.value);
                  setFormData({ vessel_name: '', imo: '', email: '', flag: '' });
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>


          {/* 船舶 */}
          {vessels.length > 0 && (
            <div className="mb-4 row align-items-center">
              <label className="col-sm-1 col-form-label ">船舶</label>
              <div className="col-sm-10">
                <select
                  className="form-select"
                  defaultValue=""
                  onChange={e => handleVesselSelect(e.target.value)}
                >
                  <option value="">請選擇</option>
                  {vessels.map((v, i) => (
                    <option key={i} value={i}>
                      {v['Vessel Name']} ｜ IMO: {v.IMO}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 右側：船舶資訊卡片 */}
        {formData.imo && (
          <div className="col-sm-6">
            <div className="vessel-card-wrapper">
              <VesselCard vessel={formData} />
            </div>
          </div>
        )}
      </div>



      {/* 上傳 Excel */}
      <div
        className="upload-section mb-2 p-2 shadow-sm rounded"
        style={{
          backgroundColor: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          borderRadius: '6px',
          borderTop: '2px solid #ccc',
          marginTop: '1rem',
          marginBottom: '1rem',
        }}
      >
        <ErrorSummaryTable
          errors={uploadStatus.filter(row => row.success === false)}
          data={excelRows}
        />

        <input
          className="form-control"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleUpload}
        />
        {excelRows.length > 0 && (
          <button
            className="btn btn-secondary mt-1"
            onClick={handleClearUpload}
          >
            🧹 清除
          </button>
        )}
      </div>

      {/* Excel 預覽 + 本地驗證 */}
      {
        excelRows.length > 0 && (
          <div className="mb-4">
            <p>
              📊 匯入 {excelRows.length} 筆 ｜ 已安排{' '}
              {excelRows.filter(r => r.state === '已安排').length} 筆
            </p>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>state</th><th>estimate</th><th>location</th>
                    <th>vessel_name</th><th>MT/KL</th><th>pre_app_trace</th>
                    <th>remark</th><th>IMO</th><th>Call Sign</th>
                    <th>本地驗證</th>
                  </tr>
                </thead>
                <tbody>
                  {excelRows.map((row, i) => {
                    if (row.state !== '已安排') return null;
                    const statusText = getApprovalStatus(row.pre_approval_trace);
                    const errInfo = uploadStatus[i];
                    const isError = errInfo?.success === false;
                    const rowClass = isError
                      ? 'table-danger'
                      : statusText.includes('尚未預報')
                        ? 'table-warning'
                        : statusText.includes('📤')
                          ? 'table-info'
                          : 'table-success';

                    return (
                      <tr key={i} className={rowClass}>
                        <td>{row.state}</td>
                        <td>{(row.estimate)}</td>
                        <td>{row.location}</td>
                        <td>{row.vessel_name}</td>
                        <td>{row['MT/KL']}</td>
                        <td>{row.pre_approval_trace}</td>
                        <td>{row.remark}</td>
                        <td>{row.IMO}</td>
                        <td>{row['Call Sign']}</td>
                        <td
                          title={uploadStatus[i]?.message}
                          className={uploadStatus[i]?.success === false ? 'text-danger fw-bold' : 'fw-bold'}
                        >
                          {uploadStatus[i]?.success === false
                            ? `❌ ${uploadStatus[i].message}`
                            : (
                              <>
                                {row.validation_status || getApprovalStatus(row.pre_approval_trace)}<br />
                                船名: {row['VN'] || row.vessel_name}<br />
                                Call Sign: {row['Call Sign'] || ''}<br />
                                Flag: {row.Flag || ''}
                              </>
                            )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              className="btn btn-primary"
              onClick={sendForValidation}
            >
              回傳計畫表
            </button>
          </div>
        )
      }

      {/* 後端回傳結果 */}
      {
        result && (
          <div>
            <h4>回傳結果</h4>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )
      }


    </div >
  );
}

export default App;