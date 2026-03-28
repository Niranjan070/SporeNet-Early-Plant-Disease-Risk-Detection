import React from 'react';
import './FieldHistory.css';

export default function FieldHistory() {
  const history = [
    { id: '#8842-Alpha', date: 'Oct 12, 2023', crop: 'Wheat', risk: 'High', spores: 1422, status: 'Resolved' },
    { id: '#8841-Beta', date: 'Oct 10, 2023', crop: 'Rice', risk: 'Low', spores: 128, status: 'Monitored' },
    { id: '#8840-Gamma', date: 'Oct 08, 2023', crop: 'Corn', risk: 'Medium', spores: 442, status: 'Action Taken' },
    { id: '#8839-Delta', date: 'Sep 30, 2023', crop: 'Wheat', risk: 'Low', spores: 82, status: 'Clear' },
    { id: '#8838-Epsilon', date: 'Sep 25, 2023', crop: 'Rice', risk: 'High', spores: 2104, status: 'Resolved' },
  ];

  return (
    <div className="history-container">
      <div className="history-header">
        <h1 className="history-title">Field Scan History</h1>
        <p className="history-subtitle">View and manage previous spore detection records</p>
      </div>

      <div className="history-card glass-strong">
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>SCAN ID</th>
                <th>DATE</th>
                <th>CROP TYPE</th>
                <th>RISK LEVEL</th>
                <th>SPORE COUNT</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, i) => (
                <tr key={i}>
                  <td className="id-cell">{item.id}</td>
                  <td>{item.date}</td>
                  <td>{item.crop}</td>
                  <td>
                    <span className={`risk-badge-small ${item.risk.toLowerCase()}`}>
                      {item.risk}
                    </span>
                  </td>
                  <td>{item.spores}</td>
                  <td>
                    <span className="status-label">{item.status}</span>
                  </td>
                  <td>
                    <button className="btn-table">View Report</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
