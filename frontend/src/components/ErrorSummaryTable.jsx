// components/ErrorSummaryTable.jsx
import React from 'react';

const ErrorSummaryTable = ({ errors = [], data = [] }) => {
    if (!errors.length) return null;

    // 根據 rowId 找出原始行號與對應的 IMO
    const errorRows = errors.map((error) => {
        const match = data.find((row) => row.rowId === error.rowId);
        return {
            rowId: error.rowId,
            message: error.message,
            imo: match?.IMO || '',
            vessel_name: match?.vessel_name || '',
            originalIndex: match?.rowId?.split('-')[1] || '?'
        };
        
    })
  .filter(row => row.imo && row.imo !== 'IMO')

return (
    <div className="mt-6">
        <h2 className="text-red-600 text-lg font-bold mb-2">❗ 再檢查資料彙整</h2>
        <table className="w-full border border-gray-300 text-sm">
            <thead>
                <tr className="bg-red-100 text-left">
                    <th className="p-2">Row</th>
                    <th className="p-2">IMO</th>
                    <th className="p-2">Vessel Name</th>
                    <th className="p-2">錯誤訊息</th>
                </tr>
            </thead>
            <tbody>
                {errorRows.map((row, idx) => (
                    <tr key={idx} className="bg-red-50">
                        <td className="p-2">{row.originalIndex}</td>
                        <td className="p-2">{row.imo}</td>
                        <td className="p-2">{row.vessel_name}</td>
                        <td className="p-2 text-red-700">{row.message}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
};

export default ErrorSummaryTable;
