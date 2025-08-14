// src/components/VesselSelector.jsx
import React, { useState, useEffect } from 'react';
import { vesselFiles } from '../utils/vesselFiles';

export default function VesselSelector({ onSelect }) {
  const [categories] = useState(vesselFiles);
  const [selectedCat, setSelectedCat] = useState('');
  const [vessels, setVessels] = useState([]);
  const [selectedVessel, setSelectedVessel] = useState(null);

  // 1. 當 category 改變時，fetch 對應 JSON
  useEffect(() => {
    if (!selectedCat) return;
    const file = categories.find(c => c.key === selectedCat);
    fetch(file.url)
      .then(res => res.json())
      .then(data => setVessels(data))
      .catch(console.error);
  }, [selectedCat, categories]);

  // 2. 當 vessel 選擇時，呼叫回傳 onSelect
  useEffect(() => {
    if (selectedVessel) {
      onSelect(selectedVessel);
    }
  }, [selectedVessel, onSelect]);

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <label>
        分類:
        <select
          value={selectedCat}
          onChange={e => {
            setSelectedCat(e.target.value);
            setSelectedVessel(null);
          }}
        >
          <option value="">請選擇</option>
          {categories.map(c => (
            <option key={c.key} value={c.key}>{c.key}</option>
          ))}
        </select>
      </label>

      {vessels.length > 0 && (
        <label>
          船名/IMO:
          <select
            value={selectedVessel ? selectedVessel['Vessel Name'] : ''}
            onChange={e => {
              const vessel = vessels.find(v => v['Vessel Name'] === e.target.value);
              setSelectedVessel(vessel);
            }}
          >
            <option value="">請選擇船舶</option>
            {vessels.map(v => (
              <option key={v['Vessel Name']} value={v['Vessel Name']}>
                {v['Vessel Name']} | {v.IMO}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}