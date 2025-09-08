import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { FaSave } from 'react-icons/fa'; // 引用icon

const API_BASE = 'http://localhost:3001';

// 新增抖動效果的 CSS
const shakeStyle = `
@keyframes shake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-2px); }
  40% { transform: translateX(2px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
  100% { transform: translateX(0); }
}
.shake {
  animation: shake 0.5s;
  animation-iteration-count: infinite;
}
`;

function PlanDashboard() {
  // 狀態管理
  const [files, setFiles] = useState([]); // 檔案列表
  const [selectedFile, setSelectedFile] = useState(''); // 當前選取檔案
  const [fileContent, setFileContent] = useState(null); // 檔案內容
  const [editCell, setEditCell] = useState({ row: null, col: null }); // 編輯儲存格
  const [editValue, setEditValue] = useState(''); // 編輯值
  const [newRow, setNewRow] = useState({}); // 新增資料列
  const [newFileName, setNewFileName] = useState(''); // 新增檔案名稱
  const [newFileContent, setNewFileContent] = useState(''); // 新增檔案內容
  const [expandedShip, setExpandedShip] = useState(null); // 展開船名
  const [expandedDate, setExpandedDate] = useState(null); // 展開日期
  const [isDeleting, setIsDeleting] = useState(false); // 刪除狀態
  const [logs, setLogs] = useState([]); // 操作日誌
  const [activeTab, setActiveTab] = useState('adddel'); // log container 分頁
  //const [justReadFiles, setJustReadFiles] = useState([]); // 本次 session 剛讀取檔案
  const [justUpdatedFiles, setJustUpdatedFiles] = useState([]); // 本次 session 剛修改檔案
  const [showToolbar, setShowToolbar] = useState(false);// 在 PlanDashboard.js 的 return 表格區塊外加：
  const [isToolbarBounce, setIsToolbarBounce] = useState(false);
  const [readFiles, setReadFiles] = useState([]); // 已讀取檔案列表
  
  
  useEffect(() => {
    let timer;
    const handleMouseMove = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsToolbarBounce(true);
        setTimeout(() => setIsToolbarBounce(false), 2000); // 彈跳 1 秒
      }, 5000); // 10 秒沒滑動
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  // Excel 匯出
  const handleExportToExcel = () => {
    if (!fileContent || !fileContent.data || fileContent.data.length === 0) {
      alert('沒有可導出的數據');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(fileContent.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${selectedFile || 'table'}.xlsx`);
  };

  // 初始載入 logs
  useEffect(() => {
    fetchLogs();
  }, []);

  // 初始載入檔案列表
  useEffect(() => {
    axios.get(`${API_BASE}/results/list`)
      .then(res => setFiles(res.data))
      .catch(err => console.error('無法載入檔案列表：', err));
  }, []);

  // 載入選取檔案內容
  useEffect(() => {
    if (selectedFile) {
      axios.get(`${API_BASE}/results/${encodeURIComponent(selectedFile)}`)
        .then(res => setFileContent(res.data))
        .catch(err => {
          console.error(`無法載入檔案 ${selectedFile}：`, err);
          alert(`檔案 ${selectedFile} 無法載入，請檢查檔案是否存在或格式是否正確。`);
          setFileContent(null);
        });
    }
  }, [selectedFile]);

  // 檔案分組（船名/日期）
  const groupedFiles = files.reduce((acc, file) => {
    const [date, code, shipName] = file.replace('.json', '').split('_');
    if (!acc[shipName]) acc[shipName] = {};
    if (!acc[shipName][date]) acc[shipName][date] = [];
    acc[shipName][date].push(code);
    return acc;
  }, {});

  // 判斷船名是否有 "新" 標籤
  const hasNewBadge = (shipName) => {
    return Object.keys(groupedFiles[shipName] || {}).some(date =>
      groupedFiles[shipName][date].some(code => {
        const fileName = `${date}_${code}_${shipName}.json`;
        return logs.length > 0 && logs[0].file === fileName && !readFiles.includes(fileName);
      })
    );
  };

  // 取得表格欄位
  const columns = fileContent && fileContent.data && fileContent.data.length > 0
    ? Object.keys(fileContent.data[0])
    : [];

  // 儲存檔案（更新）
  const handleSaveFile = () => {
    if (!selectedFile || !fileContent) return;
    axios.put(`${API_BASE}/logs/results/${encodeURIComponent(selectedFile)}`, { content: fileContent })
      .then(() => {
        alert(` ${selectedFile} 已更新`);
        setJustUpdatedFiles(prev => [...prev, selectedFile]); // 本次 session 標記已修改
        fetchLogs(); // 即時更新 logs
      })
      .catch(err => console.error(`更新檔案 ${selectedFile} 時發生錯誤：`, err));
  };

  // 新增檔案
  const handleAddFile = () => {
    if (!newFileName || !newFileContent) {
      alert('檔案名稱或內容不可為空');
      return;
    }
    try {
      const parsedContent = JSON.parse(newFileContent);
      axios.post(`${API_BASE}/results`, { filename: newFileName, content: parsedContent })
        .then(() => {
          alert(`檔案 ${newFileName} 已成功新增！`);
          setFiles([...files, newFileName]);
          setNewFileName('');
          setNewFileContent('');
          fetchLogs();
        })
        .catch(err => console.error(`新增檔案 ${newFileName} 時發生錯誤：`, err));
    } catch (e) {
      alert('檔案內容必須是有效的 JSON 格式');
    }
  };

  // 刪除檔案
  const handleDeleteFile = (fileName) => {
    if (window.confirm(`確定要刪除檔案 ${fileName} 嗎？`)) {
      setIsDeleting(true);
      if (selectedFile === fileName) {
        setSelectedFile('');
        setFileContent(null);
      }
      axios.delete(`${API_BASE}/results/${encodeURIComponent(fileName)}`)
        .then(() => {
          alert(`檔案 ${fileName} 已成功刪除！`);
          axios.get(`${API_BASE}/results/list`)
            .then(res => setFiles(res.data))
            .catch(err => console.error('無法重新載入檔案列表：', err));
          fetchLogs();
        })
        .catch(err => {
          console.error(`刪除檔案 ${fileName} 時發生錯誤：`, err);
          alert(`刪除檔案 ${fileName} 失敗！\n錯誤訊息：${err.message}`);
        })
        .finally(() => {
          setIsDeleting(false);
        });
    }
  };

  // 編輯儲存格
  const handleCellClick = (rowIdx, col) => {
    setEditCell({ row: rowIdx, col });
    setEditValue(fileContent.data[rowIdx][col] || '');
  };

  // 儲存儲存格編輯
  const handleCellSave = () => {
    const updated = { ...fileContent };
    updated.data[editCell.row][editCell.col] = editValue;
    setFileContent(updated);
    setEditCell({ row: null, col: null });
    setEditValue('');
  };

  // 取消儲存格編輯
  const handleCellCancel = () => {
    setEditCell({ row: null, col: null });
    setEditValue('');
  };

  // 新增資料列
  const handleAddRow = () => {
    if (!fileContent) return;
    const updated = { ...fileContent, data: [...fileContent.data, newRow] };
    setFileContent(updated);
    setNewRow({});
  };

  // 移動資料列
  const handleMoveRow = (fromIdx, toIdx) => {
    if (!fileContent || toIdx < 0 || toIdx >= fileContent.data.length) return;
    const updatedData = [...fileContent.data];
    [updatedData[fromIdx], updatedData[toIdx]] = [updatedData[toIdx], updatedData[fromIdx]];
    setFileContent({ ...fileContent, data: updatedData });
  };

  // 刪除資料列
  const handleDeleteRow = (idx) => {
    if (!fileContent) return;
    const updatedData = fileContent.data.filter((_, i) => i !== idx);
    setFileContent({ ...fileContent, data: updatedData });
  };

  // 插入資料列
  const handleInsertRow = (idx) => {
    if (!fileContent) return;
    const emptyRow = {};
    columns.forEach(col => { emptyRow[col] = ''; });
    const updatedData = [...fileContent.data];
    updatedData.splice(idx + 1, 0, emptyRow);
    setFileContent({ ...fileContent, data: updatedData });
    setEditCell({ row: idx + 1, col: columns[0] });
    setEditValue('');
  };

  const handleSelectFile = (fileName) => {
    axios.get(`${API_BASE}/logs/results/${encodeURIComponent(fileName)}`)
      .then(res => {
        setSelectedFile(fileName);
        setFileContent(res.data);
        
        // 標記為已讀取
        if (!readFiles.includes(fileName)) {
          setReadFiles(prev => [...prev, fileName]);
        }
        
        fetchLogs();
      })
      .catch(err => {
        console.error(`讀取檔案 ${fileName} 時發生錯誤：`, err);
        setFileContent(null);
      });
  };
  
  // 取得 logs
  const fetchLogs = () => {
    axios.get(`${API_BASE}/logs`)
      .then(res => setLogs(res.data))
      .catch(err => console.error('讀取 logs 失敗', err));
  };

  // 日誌分頁（只顯示最新 log，若要顯示全部 log 可直接用 logs）
  const latestLogs = {};
  logs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach(log => {
      if (!latestLogs[log.file]) {
        latestLogs[log.file] = log;
      }
    });

  // 展開船名時自動展開最新日期
const handleExpandShip = (shipName) => {
  if (expandedShip === shipName) {
    setExpandedShip(null);
    setExpandedDate(null);
  } else {
    setExpandedShip(shipName);
    // 找到最新日期（字串最大）
    const dates = Object.keys(groupedFiles[shipName]);
    if (dates.length > 0) {
      const latestDate = dates.sort().reverse()[0];
      setExpandedDate(latestDate);
    } else {
      setExpandedDate(null);
    }
  }
};

// JavaScript
// 計算每個檔案的最新 log
const latestByFile = logs
  .slice()
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  .reduce((acc, log) => (acc[log.file] ? acc : { ...acc, [log.file]: log }), {});

  // --- UI ---
  return (
    <div className="container py-4">
      <style>{shakeStyle}</style>
      <h2 className="mb-4">船舶加油計劃管制後台</h2>
      {/* log container 分頁按鈕 */}
      <div className="log-tabs-bookmark mb-0">
        <button
          className={`bookmark-tab ${activeTab === 'adddel' ? 'active' : ''}`}
          onClick={() => setActiveTab('adddel')}
        >新增/刪除</button>
        <button
          className={`bookmark-tab ${activeTab === 'readupd' ? 'active' : ''}`}
          onClick={() => setActiveTab('readupd')}
        >讀取/修改</button>
      </div>

      {/* 第一排：log container + 新增檔案 */}
      <div className="row mb-3">
        <div className="col-md-7">
          <div className="log-container">
            <div className="log-list">
        {/* 根據分頁篩選 log 類型：adddel 顯示新增/刪除，readupd 顯示讀取/修改 */}
              {Object.values(latestLogs)
                .filter(log =>
                  (activeTab === 'adddel' && (log.type === 'addition' || log.type === 'delete')) ||
                  (activeTab === 'readupd' && (log.type === 'read' || log.type === 'update'))
                )
                .map((log, index) => (  // 每筆 log 顯示一行，左右排列
                  <div key={index} className="log-item">
                  <span style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()} ｜   
                    {log.type === 'delete' ? (
                      <span style={{ color: 'brown', cursor: 'not-allowed' }}>
                        {log.file}
                      </span>
                    ) : (
                      <span
                        style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => handleSelectFile(log.file)}
                        title="點擊展開檔案"
                      >
                        {log.file}
                      </span>
                    )}
                    ｜ <span style={{ color: (log.type === 'delete' || log.type === 'update') ? 'brown' : 'green' }}>
                      {log.type === 'addition' ? '新' :
                        log.type === 'delete' ? '關閉' :
                        log.type === 'read' ? '讀取' :
                        log.type === 'update' ? '修改' :
                        log.type}
                    </span>
                    {log.details}
                    {activeTab === 'readupd' && (
                      <button
                        className="btn btn-transparent btn-sm"
                        style={{ marginLeft: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        onClick={() => handleDeleteFile(log.file)}
                        title="刪除檔案"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </span>
                </div>
                ))}
            </div>
          </div>
        </div>
        {/* 新增檔案區塊 */}
        <div className="col-md-5">
          <div className="mb-3">
            <input
              type="text"
              placeholder="檔案名稱"
              className="form-control form-control-sm mb-1"
              style={{ maxWidth: '220px' }}
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
            <textarea
              placeholder="檔案內容(JSON 格式)"
              className="form-control form-control-sm mb-1"
              style={{ maxWidth: '220px', minHeight: '60px' }}
              rows="3"
              value={newFileContent}
              onChange={(e) => setNewFileContent(e.target.value)}
            ></textarea>
            <button className="btn btn-primary btn-sm" style={{ width: '100px' }} onClick={handleAddFile}>新增檔案</button>
          </div>
        </div>
      </div>

      {/* 第二排：檔案列表 + 檔案內容 */}
      <div className="row">
        <div className="col-md-2">
          <ul className="list-group">
            {Object.keys(groupedFiles).map(shipName => (
              <li key={shipName} className="list-group-item file-list-ship">
                <div
                  className="file-list-ship"
                  onClick={() => setExpandedShip(expandedShip === shipName ? null : shipName)}
                  style={{ cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
                >
                  {shipName}
                  {hasNewBadge(shipName) && (
                    <span className="badge bg-warning text-dark ms-2 shake">新</span>
                  )}
                </div>
                {expandedShip === shipName && (
                  <ul className="list-group">
                    {Object.keys(groupedFiles[shipName]).map(date => (
                      <li key={date} className="list-group-item">
                        <div
                          className="file-list-date"
                          onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                          style={{ cursor: 'pointer' }}
                        >
                          {date}
                        </div>
                        {expandedDate === date && (
                          <ul className="list-group">
                            {groupedFiles[shipName][date].map(code => {
                              const fileName = `${date}_${code}_${shipName}.json`;
                              const isNew = logs.length > 0 && logs[0].file === fileName && !readFiles.includes(fileName);
                              return (
                                <li
                                  key={code}
                                  className={`list-group-item file-list-item ${selectedFile === fileName ? 'active' : ''}`}
                                  onClick={() => handleSelectFile(fileName)}
                                  style={{ display: 'flex', alignItems: 'center' }}
                                >
                                  <span>{code}</span>
                                  {isNew && (
                                    <span className="badge bg-warning text-dark ms-1 shake">新</span>
                                  )}
                                  <button
                                    className="btn btn-transparent btn-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFile(fileName);
                                    }}
                                    disabled={isDeleting}
                                    title="刪除檔案"
                                  >
                                    <FaTrash />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* 檔案內容表格 */}
        <div className="col-md-10">
          {fileContent && fileContent.data && fileContent.data.length > 0 ? (
            <div className="table-container">
              <div
                style={{
                  position: 'fixed',
                  top: '50%',
                  right: showToolbar ? '18px' : '-40px',
                  transition: 'right 0.3s, background 0.3s',
                  zIndex: 1000,
                  background: showToolbar ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                }}
                onMouseEnter={() => setShowToolbar(true)}
                onMouseLeave={() => setShowToolbar(false)}
              >
                <button
                  className={`btn btn-primary mb-2${isToolbarBounce ? ' bounce' : ''}`}
                  onClick={handleSaveFile}
                  style={{ opacity: showToolbar ? 1 : 0.3, transition: 'opacity 0.3s' }}
                >
                  儲存檔案
                </button>
                <button
                  className={`btn btn-success${isToolbarBounce ? ' bounce' : ''}`}
                  onClick={handleExportToExcel}
                  style={{ opacity: showToolbar ? 1 : 0.3, transition: 'opacity 0.3s' }}
                >
                  導出 Excel
                </button>
              </div>

              <table className="table table-bordered table-sm table-auto-wrap">
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col}>{col}</th>
                    ))}
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {fileContent.data.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {columns.map(col => (
                        <td key={col}>
                          {editCell.row === rowIdx && editCell.col === col ? (
                            <>
                              <input
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                className="form-control form-control-sm"
                                autoFocus
                                onBlur={handleCellSave}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleCellSave();
                                  if (e.key === 'Escape') handleCellCancel();
                                }}
                              />
                              <button className="btn btn-success btn-sm ms-1" onClick={handleCellSave}>
                                <FaSave />
                              </button>
                            </>
                          ) : (
                            <span
                              style={{ cursor: 'pointer', minHeight: '1em', display: 'inline-block' }}
                              onDoubleClick={() => handleCellClick(rowIdx, col)}
                              title="雙擊編輯"
                            >
                              {row[col] === undefined || row[col] === '' ? <span style={{ color: '#ccc' }}>（fill）</span> : row[col]}
                            </span>
                          )}
                        </td>
                      ))}
                      <td>
                        <button
                          className="btn btn-outline-secondary btn-sm me-1"
                          disabled={rowIdx === 0}
                          onClick={() => handleMoveRow(rowIdx, rowIdx - 1)}
                        >↑</button>
                        <button
                          className="btn btn-outline-secondary btn-sm me-1"
                          disabled={rowIdx === fileContent.data.length - 1}
                          onClick={() => handleMoveRow(rowIdx, rowIdx + 1)}
                        >↓</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRow(rowIdx)}>刪除</button>
                        <button className="btn btn-success btn-sm" onClick={() => handleInsertRow(rowIdx)}>插入</button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    {columns.map(col => (
                      <td key={col}>
                        <input
                          value={newRow[col] || ''}
                          onChange={e => setNewRow({ ...newRow, [col]: e.target.value })}
                          className="form-control form-control-sm"
                        />
                      </td>
                    ))}
                    <td>
                      <button className="btn btn-success btn-sm" onClick={handleAddRow}>新增</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlanDashboard;