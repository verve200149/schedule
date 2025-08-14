// validateRows.js
import axios from 'axios';

export const validateRows = async (rows, vesselInfo = {}) => {
  if (!Array.isArray(rows)) throw new Error('輸入資料格式錯誤');

  const rowsWithId = rows.map((row, index) => ({
    ...row,
    rowId: `row-${index + 1}`
  }));

  try {
    const response = await axios.post('http://localhost:3001/validate', {
      vessel_info: vesselInfo,
      data: rowsWithId
    });

    const errors = response.data.errors || [];
    const validatedData = response.data.data || [];

    const statusList = rowsWithId.map((row, idx) => {
      const err = errors.find(e => e.rowId === row.rowId);
      return {
        ...validatedData[idx],
        success: !err,
        message: err ? err.message : ''
      };
    });

    return {
      statusList,
      enhancedRows: validatedData
    };

  } catch (err) {
    console.error('❌ 驗證請求失敗：', err.message);

    const fallback = rowsWithId.map(row => ({
      ...row,
      success: false,
      message: '驗證 API 失敗'
    }));

    return {
      statusList: fallback,
      enhancedRows: fallback
    };
  }
};