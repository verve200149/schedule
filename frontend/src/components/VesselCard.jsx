// src/components/VesselCard.jsx
import React from 'react';
import { FaShip, FaFlag, FaEnvelope } from 'react-icons/fa';
import './VesselCard.css';

export default function VesselCard({ vessel }) {
  const { vessel_name, imo, call_sign, email, flag } = vessel;

  // 這裡示範靜態狀態，你也可以根據 props 動態切換
  const statusText = 'Active';
  const statusClass = 'badge-approved';

  return (
    <div className="vessel-card" style={{ maxWidth: '480px', width: '100%' }}>
      <div
        className="vessel-card-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: 'linear-gradient(135deg, #0f297c, #5064a3)',
          color: '#fff',
          fontWeight: '600',
          fontSize: '1.1rem',
          borderRadius: '12px 12px 0 0',
        }}
      >
        <FaShip className="vessel-icon" style={{ fontSize: '1.3rem' }} />
        <span>{vessel_name}</span>
        <span className={`badge ${statusClass}`} style={{ fontSize: '0.75rem', padding: '0.2em 0.6em' }}>
          {statusText}
        </span>
      </div>

      <div className="vessel-card-body" style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#333' }}>
        <div className="vessel-info" style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <FaFlag className="info-icon" style={{ marginRight: '0.4rem', color: '#0f297c' }} />
          <span>{flag}</span>
        </div>
        <div className="vessel-info" style={{ marginBottom: '0.4rem' }}>
          <strong>IMO:</strong> {imo}
        </div>
        <div className="vessel-info" style={{ marginBottom: '0.4rem' }}>
          <strong>Call Sign:</strong> {call_sign}
        </div>
        <div className="vessel-info" style={{ display: 'flex', alignItems: 'center' }}>
          <FaEnvelope className="info-icon" style={{ marginRight: '0.4rem', color: '#0f297c' }} />
          <a href={`mailto:${email}`} style={{ color: '#0f297c', textDecoration: 'none' }}>
            {email}
          </a>
        </div>
      </div>
    </div>
  );
}